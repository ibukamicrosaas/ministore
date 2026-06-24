import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyBictorysSignature, getBictorysCharge, type BictorysWebhookPayload } from '@/lib/payments/bictorys'
import {
  sendWhatsApp,
  buildOrderConfirmationMessage,
  buildNewOrderAlertMessage,
} from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'
import { activatePlan } from '@/lib/billing/activate-plan'

const MAX_BODY_BYTES = 64 * 1024 // 64 Ko — un webhook Bictorys ne dépasse jamais ça

const VALID_PLAN_KEYS = new Set(['decouverte', 'business', 'pro'])

export async function POST(req: NextRequest) {
  // LOG ULTRA PRÉCOCE : vérifier que la route est atteinte
  console.log('[webhook/bictorys] 🔔 WEBHOOK REÇU - méthode:', req.method, 'URL:', req.nextUrl.pathname)
  console.log('[webhook/bictorys] Headers:', {
    contentType: req.headers.get('content-type'),
    contentLength: req.headers.get('content-length'),
    xSecretKey: req.headers.get('x-secret-key')?.slice(0, 16) + '...',
  })

  // Limiter la taille du body avant de lire quoi que ce soit
  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10)
  if (contentLength > MAX_BODY_BYTES) {
    console.warn('[webhook] Payload trop large:', contentLength)
    return NextResponse.json({ error: 'Payload trop large' }, { status: 413 })
  }

  const rawBody        = await req.text()
  if (rawBody.length > MAX_BODY_BYTES) {
    console.warn('[webhook] rawBody trop long:', rawBody.length)
    return NextResponse.json({ error: 'Payload trop large' }, { status: 413 })
  }

  let payload: BictorysWebhookPayload
  try {
    payload = JSON.parse(rawBody) as BictorysWebhookPayload
  } catch (err) {
    console.error('[webhook] Payload JSON invalide:', err)
    return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 })
  }

  // Chercher la référence : paymentReference (abonnements + commandes) ou merchantReference (commandes)
  const reference = payload.paymentReference ?? payload.merchantReference
  if (!reference) {
    console.error('[webhook] Aucune référence (paymentReference/merchantReference) dans payload:', payload)
    return NextResponse.json({ error: 'Référence manquante' }, { status: 400 })
  }

  console.log('[webhook] Webhook reçu — reference:', reference, 'status:', payload.status, 'id:', payload.id)

  // Vérification de signature unique — s'applique aux commandes ET aux abonnements
  const headerSecret   = req.headers.get('x-secret-key') ?? ''
  const platformSecret = process.env.BICTORYS_WEBHOOK_SECRET ?? ''

  if (!platformSecret) {
    console.error('[webhook] BICTORYS_WEBHOOK_SECRET non configuré')
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 })
  }

  if (!verifyBictorysSignature(headerSecret, platformSecret)) {
    console.error('[webhook] Signature invalide — webhook rejeté', reference)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // ── PAIEMENT D'ABONNEMENT ─────────────────────────────────────────────
  if (reference.startsWith('ts-sub-') || reference.startsWith('sub-')) {
    return handleSubscriptionWebhook(reference, payload)
  }

  // payload.paymentReference = 'tekkishop-{8chars}' (routage)
  // payload.merchantReference = vrai UUID de la commande
  const merchantReference = payload.merchantReference ?? reference

  // ── PAIEMENT DE COMMANDE ──────────────────────────────────────────────
  const supabase = createAdminClient()
  return handleOrderWebhook(merchantReference, payload, supabase)

}

/**
 * Traite les webhooks d'abonnement Bictorys.
 * Stratégie : vérifier TOUJOURS l'API Bictorys directement
 * (élimine la dépendance aux clés secrètes mal configurées)
 */
async function handleSubscriptionWebhook(merchantReference: string, payload: BictorysWebhookPayload) {
  console.log('[handleSubscriptionWebhook] Début — chargeId:', payload.id, 'status:', payload.status)

  // Bictorys retourne 'succeed', 'succeeded' ou 'authorized' selon le moyen de paiement
  const isSuccess = payload.status === 'succeed' || payload.status === 'succeeded' || payload.status === 'authorized'
  if (!isSuccess) {
    console.log('[handleSubscriptionWebhook] Paiement non réussi — status:', payload.status)
    return NextResponse.json({ ok: true })
  }

  // Retrouver la transaction par charge_id ou merchant_reference
  const supabase = createAdminClient()

  console.log('[handleSubscriptionWebhook] Recherche transaction avec charge_id:', payload.id)

  // Essayer d'abord avec charge_id
  let { data: transaction, error: txnError } = await supabase
    .from('subscription_transactions' as never)
    .select('shop_id, plan_key, merchant_reference, charge_id, status, billing_cycle')
    .eq('charge_id', payload.id)
    .single() as any

  // Si .single() échoue, essayer sans .single() pour diagnostiquer
  if (txnError) {
    console.error('[handleSubscriptionWebhook] Erreur requête charge_id:', {
      chargeId: payload.id,
      error: txnError.message,
      code: (txnError as any).code,
    })

    // Chercher tous les enregistrements avec ce charge_id pour voir ce qu'il y a
    const { data: allMatching, error: diagError } = await supabase
      .from('subscription_transactions' as never)
      .select('*')
      .eq('charge_id', payload.id) as any

    console.log('[handleSubscriptionWebhook] Diagnostic - tous les matching par charge_id:', {
      count: allMatching?.length ?? 0,
      data: allMatching,
      error: diagError?.message,
    })
  }

  if (!transaction || txnError) {
    console.warn('[handleSubscriptionWebhook] ⚠️ Aucune transaction trouvée pour chargeId:', payload.id)

    // Fallback: chercher par paymentReference au lieu de charge_id
    console.log('[handleSubscriptionWebhook] Fallback - Recherche par paymentReference:', merchantReference)
    const { data: txnByRef, error: refError } = await supabase
      .from('subscription_transactions' as never)
      .select('shop_id, plan_key, merchant_reference, charge_id, status, billing_cycle')
      .eq('merchant_reference', merchantReference)
      .single() as any

    if (refError) {
      console.error('[handleSubscriptionWebhook] Erreur requête paymentReference:', {
        paymentReference: merchantReference,
        error: refError.message,
      })
    }

    // Diagnostic
    if (!txnByRef || refError) {
      const { data: allByRef } = await supabase
        .from('subscription_transactions' as never)
        .select('*')
        .eq('merchant_reference', merchantReference) as any

      console.log('[handleSubscriptionWebhook] Diagnostic - tous les matching par paymentReference:', {
        count: allByRef?.length ?? 0,
        data: allByRef,
      })

      console.error('[handleSubscriptionWebhook] ❌ Transaction introuvable par les deux méthodes')
      return NextResponse.json({ ok: true })
    }

    console.log('[handleSubscriptionWebhook] ✅ Transaction trouvée par paymentReference:', txnByRef)
    transaction = txnByRef
  } else {
    console.log('[handleSubscriptionWebhook] ✅ Transaction trouvée par charge_id:', transaction)
  }

  const { shop_id: shopId, plan_key: planKey, billing_cycle: billingCycle = 'monthly' } = transaction as any

  // Vérifier montants, activer plan, mettre à jour transaction
  const planMonthlyPrices: Record<string, number> = { decouverte: 2900, business: 4900, pro: 9900 }
  const planAnnualPrices: Record<string, number>  = { decouverte: 29000, business: 49000, pro: 99000 }
  const expectedAmount = billingCycle === 'annual'
    ? (planAnnualPrices[planKey] ?? 0)
    : (planMonthlyPrices[planKey] ?? 0)

  if (payload.amount !== expectedAmount) {
    console.error('[handleSubscriptionWebhook] Montant mismatch:', {
      expected: expectedAmount,
      actual: payload.amount,
      billingCycle,
    })
    return NextResponse.json({ ok: true })
  }

  const durationDays = billingCycle === 'annual' ? 365 : 31
  console.log('[handleSubscriptionWebhook] ✅ Montant correct — activation du plan', { shopId, planKey, billingCycle, durationDays })

  // Extraire le numéro de téléphone du paiement (Bictorys peut l'inclure)
  const payerPhone =
    (payload as any).customerPhone ||
    (payload as any).payerPhone ||
    (payload as any).phone ||
    (payload as any).customer?.phone ||
    null

  // Activer le plan
  const { error: activationError } = await activatePlan(shopId, planKey, durationDays)
  if (activationError) {
    console.error('[handleSubscriptionWebhook] Erreur activation:', activationError)
    await supabase
      .from('subscription_transactions' as never)
      .update({
        status: 'error',
        error_message: activationError,
        updated_at: new Date().toISOString(),
        payer_phone: payerPhone,
      } as never)
      .eq('charge_id', payload.id)
    return NextResponse.json({ ok: true })
  }

  // Marquer comme activé
  await supabase
    .from('subscription_transactions' as never)
    .update({
      status: 'activated',
      verified_at: new Date().toISOString(),
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payer_phone: payerPhone,
    } as never)
    .eq('charge_id', payload.id)

  console.log('[handleSubscriptionWebhook] ✅ Plan activé avec succès')
  return NextResponse.json({ ok: true })
}

/**
 * Traite les webhooks de commande Bictorys.
 */
async function handleOrderWebhook(
  merchantReference: string,
  payload: BictorysWebhookPayload,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const orderId = merchantReference
  console.log('[handleOrderWebhook] Début — orderId:', orderId, 'status:', payload.status, 'chargeId:', payload.id)

  // ── Idempotence ──────────────────────────────────────────────────────────────
  // Chercher d'abord par provider_payment_id (cas normal).
  // Fallback par order_id : quand Bictorys ne retourne pas de chargeId lors de la
  // création du paiement, on stocke un placeholder 'bictorys-{orderId}' qui ne
  // matche pas le payload.id du webhook → on retrouve le record via order_id.
  const { data: existingByCharge } = await supabase
    .from('payments')
    .select('id, status')
    .eq('provider_payment_id', payload.id)
    .maybeSingle()

  if (existingByCharge?.status === 'completed') {
    console.log('[handleOrderWebhook] Déjà traité (idempotence chargeId)')
    return NextResponse.json({ ok: true, skipped: true })
  }

  const { data: existingByOrder } = await supabase
    .from('payments')
    .select('id, status, shop_id, amount, currency, payment_method, payment_type')
    .eq('order_id', orderId)
    .maybeSingle()

  if (existingByOrder?.status === 'completed') {
    console.log('[handleOrderWebhook] Déjà traité (idempotence orderId)')
    return NextResponse.json({ ok: true, skipped: true })
  }

  // ── Paiement échoué ──────────────────────────────────────────────────────────
  // Bictorys retourne 'succeed', 'succeeded' ou 'authorized' selon le moyen de paiement (Orange Money)
  if (payload.status !== 'succeed' && payload.status !== 'succeeded' && payload.status !== 'authorized') {
    console.log('[handleOrderWebhook] Paiement échoué — status:', payload.status)
    const failTarget = existingByCharge ?? existingByOrder
    if (failTarget) {
      await supabase.from('payments').update({ status: 'failed' }).eq('id', failTarget.id)
    }
    return NextResponse.json({ ok: true })
  }

  // ── Marquer le paiement comme complété ──────────────────────────────────────
  const now = new Date().toISOString()

  if (existingByCharge) {
    // Cas normal : provider_payment_id correct
    console.log('[handleOrderWebhook] Mise à jour paiement par chargeId')
    await supabase
      .from('payments')
      .update({ status: 'completed', paid_at: now })
      .eq('id', existingByCharge.id)

  } else if (existingByOrder) {
    // Cas fallback : provider_payment_id était un placeholder ('bictorys-{orderId}')
    // On corrige l'ID et on marque complété en une seule opération
    console.log('[handleOrderWebhook] ⚠️ Fallback order_id — correction provider_payment_id et marquage complété')
    await supabase
      .from('payments')
      .update({ status: 'completed', paid_at: now, provider_payment_id: payload.id })
      .eq('id', existingByOrder.id)

  } else {
    // Aucun record de paiement (ne devrait pas arriver, mais defensive coding)
    console.warn('[handleOrderWebhook] ⚠️ Aucun record payments trouvé — création à la volée')
    const { data: orderForPayment } = await supabase
      .from('orders')
      .select('shop_id, total_price, deposit_amount, payment_type')
      .eq('id', orderId)
      .single()

    if (orderForPayment) {
      const o = orderForPayment as { shop_id: string; total_price: number; deposit_amount: number; payment_type: string }
      const isDeposit = o.payment_type === 'online_deposit' && (o.deposit_amount ?? 0) > 0
      await supabase.from('payments').insert({
        order_id:            orderId,
        shop_id:             o.shop_id,
        amount:              isDeposit ? o.deposit_amount : o.total_price,
        currency:            'XOF',
        payment_method:      'bictorys',
        payment_type:        isDeposit ? 'deposit' : 'full',
        provider_payment_id: payload.id,
        status:              'completed',
        paid_at:             now,
      })
    }
  }

  // Confirmer la commande
  const { data: orderData } = await supabase
    .from('orders')
    .update({
      status:       'confirmed',
      deposit_paid: true,
      updated_at:   new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select(`
      id, shop_id, total_price, deposit_amount, payment_type, delivery_type, delivery_date, client_token,
      clients(first_name, last_name, whatsapp, phone),
      order_items(product_name, quantity, line_total),
      shops(name, phone_whatsapp, slug)
    `)
    .single()

  if (!orderData) {
    console.log('[handleOrderWebhook] Commande non trouvée ou déjà traitée')
    return NextResponse.json({ ok: true })
  }

  const o = orderData as unknown as {
    id: string
    shop_id: string
    total_price: number
    deposit_amount: number
    payment_type: string
    delivery_type: 'home_delivery' | 'store_pickup'
    delivery_date: string | null
    client_token: string
    clients: { first_name: string; last_name: string | null; whatsapp: string | null; phone: string } | null
    order_items: { product_name: string; quantity: number; line_total: number }[]
    shops: { name: string; phone_whatsapp: string | null; slug: string } | null
  }

  if (!o.clients || !o.shops) {
    console.log('[handleOrderWebhook] Données client ou shop manquantes')
    return NextResponse.json({ ok: true })
  }

  console.log('[handleOrderWebhook] Envoi des notifications — orderId:', o.id)

  const clientWhatsapp = o.clients.whatsapp ?? o.clients.phone
  const clientName     = [o.clients.first_name, o.clients.last_name].filter(Boolean).join(' ')
  const orderUrl       = `${APP_URL}/${o.shops.slug}/commande/${o.id}?token=${o.client_token}`

  const itemsSummary = o.order_items
    .map(i => `• ${i.product_name}${i.quantity > 1 ? ` ×${i.quantity}` : ''} — ${i.line_total.toLocaleString('fr-FR')} FCFA`)
    .join('\n')

  // Message confirmation → client
  const confirmMsg = buildOrderConfirmationMessage({
    shopName:     o.shops.name,
    clientName:   o.clients.first_name,
    items:        itemsSummary,
    totalPrice:   o.total_price,
    deliveryType: o.delivery_type,
    deliveryDate: o.delivery_date ?? undefined,
    paymentType:  o.payment_type,
    orderUrl,
  })

  const clientNotif = await sendWhatsApp(clientWhatsapp, confirmMsg)
  await supabase.from('notification_logs').insert({
    shop_id:           o.shop_id,
    order_id:          o.id,
    recipient_phone:   clientWhatsapp,
    notification_type: 'order_confirmation',
    channel:           'sms',
    message:           confirmMsg,
    status:            clientNotif.success ? 'sent' : 'failed',
    error_message:     clientNotif.error ?? null,
  })

  // Alerte → vendeur
  if (o.shops.phone_whatsapp) {
    const alertMsg = buildNewOrderAlertMessage({
      clientName,
      clientPhone:  o.clients.phone,
      items:        itemsSummary,
      totalPrice:   o.total_price,
      deliveryType: o.delivery_type,
      deliveryDate: o.delivery_date ?? undefined,
      paymentType:  o.payment_type,
    })

    const shopNotif = await sendWhatsApp(o.shops.phone_whatsapp, alertMsg)
    await supabase.from('notification_logs').insert({
      shop_id:           o.shop_id,
      order_id:          o.id,
      recipient_phone:   o.shops.phone_whatsapp,
      notification_type: 'new_order_shop',
      channel:           'sms',
      message:           alertMsg,
      status:            shopNotif.success ? 'sent' : 'failed',
      error_message:     shopNotif.error ?? null,
    })
  }

  console.log('[handleOrderWebhook] ✅ Commande confirmée — notifications envoyées')
  return NextResponse.json({ ok: true })
}
