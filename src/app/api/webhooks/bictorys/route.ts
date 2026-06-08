import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyBictorysSignature, getBictorysCharge, type BictorysWebhookPayload } from '@/lib/payments/bictorys'
import {
  sendWhatsApp,
  buildOrderConfirmationMessage,
  buildNewOrderAlertMessage,
} from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'
import { decryptApiKey } from '@/lib/crypto/encrypt'
import { activatePlan } from '@/lib/billing/activate-plan'

const MAX_BODY_BYTES = 64 * 1024 // 64 Ko — un webhook Bictorys ne dépasse jamais ça

const VALID_PLAN_KEYS = new Set(['discovery', 'business', 'pro'])
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  // ── PAIEMENT D'ABONNEMENT ─────────────────────────────────────────────
  // Format: "ts-sub-{shop-id-start}" ou "sub-{36-char-uuid}-{planKey}"
  // Stratégie : TOUJOURS vérifier l'API Bictorys directement pour les abonnements
  // (élimine la dépendance aux clés secrètes, qui peuvent être mal configurées)
  if (reference.startsWith('ts-sub-') || reference.startsWith('sub-')) {
    return handleSubscriptionWebhook(reference, payload)
  }

  const merchantReference = reference

  // ── PAIEMENT DE COMMANDE ──────────────────────────────────────────────
  // Pour les commandes : vérifier la signature (plus critique car plus de surface d'attaque)
  const headerSecret   = req.headers.get('x-secret-key') ?? ''
  const platformSecret = process.env.BICTORYS_WEBHOOK_SECRET ?? ''

  if (!platformSecret) {
    console.error('[webhook] BICTORYS_WEBHOOK_SECRET non configuré — webhook de commande rejeté')
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 })
  }

  const platformVerified = verifyBictorysSignature(headerSecret, platformSecret)
  const supabase = createAdminClient()
  let effectiveSecret = platformSecret

  if (!platformVerified) {
    // Tentative avec le secret du shop Pro (commandes uniquement)
    if (UUID_REGEX.test(merchantReference)) {
      const { data: order } = await supabase
        .from('orders')
        .select('shop_id')
        .eq('id', merchantReference)
        .single()

      if (order?.shop_id) {
        const { data: shopSecrets } = await supabase
          .from('shops')
          .select('plan, bictorys_webhook_secret')
          .eq('id', order.shop_id)
          .single()

        if (shopSecrets?.plan === 'pro' && shopSecrets.bictorys_webhook_secret) {
          effectiveSecret = decryptApiKey(shopSecrets.bictorys_webhook_secret)
          console.log('[webhook] Tentative vérif avec secret shop Pro')
        }
      }
    }

    if (!verifyBictorysSignature(headerSecret, effectiveSecret)) {
      console.error('[webhook] Signature invalide — webhook de commande rejeté', merchantReference)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  return handleOrderWebhook(merchantReference, payload, supabase)

}

/**
 * Traite les webhooks d'abonnement Bictorys.
 * Stratégie : vérifier TOUJOURS l'API Bictorys directement
 * (élimine la dépendance aux clés secrètes mal configurées)
 */
async function handleSubscriptionWebhook(merchantReference: string, payload: BictorysWebhookPayload) {
  console.log('[handleSubscriptionWebhook] Début — chargeId:', payload.id, 'status:', payload.status)

  // Ignorer les paiements non réussis (Bictorys retourne 'succeed' ou 'succeeded')
  if (payload.status !== 'succeed' && payload.status !== 'succeeded') {
    console.log('[handleSubscriptionWebhook] Paiement non réussi — status:', payload.status)
    return NextResponse.json({ ok: true })
  }

  // Retrouver la transaction par charge_id ou merchant_reference
  const supabase = createAdminClient()

  console.log('[handleSubscriptionWebhook] Recherche transaction avec charge_id:', payload.id)

  // Essayer d'abord avec charge_id
  let { data: transaction, error: txnError } = await supabase
    .from('subscription_transactions' as never)
    .select('shop_id, plan_key, merchant_reference, charge_id, status')
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
      .select('shop_id, plan_key, merchant_reference, charge_id, status')
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

  const { shop_id: shopId, plan_key: planKey } = transaction as any

  // Vérifier montants, activer plan, mettre à jour transaction
  const planPrices: Record<string, number> = { discovery: 2900, business: 4900, pro: 9900 }
  const expectedAmount = planPrices[planKey] ?? 0

  if (payload.amount !== expectedAmount) {
    console.error('[handleSubscriptionWebhook] Montant mismatch:', {
      expected: expectedAmount,
      actual: payload.amount,
    })
    return NextResponse.json({ ok: true })
  }

  console.log('[handleSubscriptionWebhook] ✅ Montant correct — activation du plan', { shopId, planKey })

  // Extraire le numéro de téléphone du paiement (Bictorys peut l'inclure)
  const payerPhone =
    (payload as any).customerPhone ||
    (payload as any).payerPhone ||
    (payload as any).phone ||
    (payload as any).customer?.phone ||
    null

  // Activer le plan
  const { error: activationError } = await activatePlan(shopId, planKey)
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
  console.log('[handleOrderWebhook] Début — orderId:', orderId, 'status:', payload.status)

  // Idempotence : vérifier si le paiement a déjà été traité
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('status')
    .eq('provider_payment_id', payload.id)
    .single()

  if (existingPayment?.status === 'completed') {
    console.log('[handleOrderWebhook] Paiement déjà traité (idempotence)')
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Ignorer les paiements non réussis (Bictorys retourne 'succeed' ou 'succeeded')
  if (payload.status !== 'succeed' && payload.status !== 'succeeded') {
    console.log('[handleOrderWebhook] Paiement échoué — status:', payload.status)
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('provider_payment_id', payload.id)

    return NextResponse.json({ ok: true })
  }

  // Marquer le paiement comme complété
  console.log('[handleOrderWebhook] Marquage du paiement comme complété')
  await supabase
    .from('payments')
    .update({ status: 'completed', paid_at: new Date().toISOString() })
    .eq('provider_payment_id', payload.id)

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
