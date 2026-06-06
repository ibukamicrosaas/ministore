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

const VALID_PLAN_KEYS = new Set(['decouverte', 'business', 'pro'])
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

  const merchantReference = payload.merchantReference
  if (!merchantReference) {
    console.error('[webhook] merchantReference manquant dans payload:', payload)
    return NextResponse.json({ error: 'merchantReference manquant' }, { status: 400 })
  }

  console.log('[webhook] Webhook reçu — merchRef:', merchantReference, 'status:', payload.status, 'id:', payload.id)

  // ── PAIEMENT D'ABONNEMENT ─────────────────────────────────────────────
  // Format: "sub-{36-char-uuid}-{planKey}"
  // Stratégie : TOUJOURS vérifier l'API Bictorys directement pour les abonnements
  // (élimine la dépendance aux clés secrètes, qui peuvent être mal configurées)
  if (merchantReference.startsWith('sub-')) {
    return handleSubscriptionWebhook(merchantReference, payload)
  }

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
  console.log('[handleSubscriptionWebhook] Début — merchRef:', merchantReference)

  // Ignorer les paiements non réussis
  if (payload.status !== 'succeed') {
    console.log('[handleSubscriptionWebhook] Paiement non réussi — status:', payload.status)
    return NextResponse.json({ ok: true })
  }

  // Parser la référence : "sub-{shopId}-{planKey}"
  const shopId  = merchantReference.slice(4, 40)
  const planKey = merchantReference.slice(41)

  // Validation stricte
  if (!UUID_REGEX.test(shopId)) {
    console.error('[handleSubscriptionWebhook] shopId invalide:', shopId)
    return NextResponse.json({ error: 'merchantReference invalide' }, { status: 400 })
  }
  if (!VALID_PLAN_KEYS.has(planKey)) {
    console.error('[handleSubscriptionWebhook] planKey non autorisé:', planKey)
    return NextResponse.json({ error: 'plan invalide' }, { status: 400 })
  }

  // ✅ Stratégie clé : vérifier via l'API Bictorys directement
  // Cela élimine la dépendance aux webhooks secrets mal configurés
  const apiKey = process.env.BICTORYS_API_KEY
  if (!apiKey || !payload.id) {
    console.error('[handleSubscriptionWebhook] Clé API ou charge ID manquant')
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  try {
    const charge = await getBictorysCharge(apiKey, payload.id)
    console.log('[handleSubscriptionWebhook] Charge Bictorys:', { id: payload.id, status: charge.status, merchantRef: charge.merchantReference })

    // Vérifier le statut
    if (charge.status !== 'succeed') {
      console.log('[handleSubscriptionWebhook] Charge non finalisée — ignorée')
      return NextResponse.json({ ok: true })
    }

    // Vérifier la référence croisée
    const expectedRef = `sub-${shopId}-${planKey}`
    if (charge.merchantReference && charge.merchantReference !== expectedRef) {
      console.error('[handleSubscriptionWebhook] Mismatch merchantReference:', {
        expected: expectedRef,
        actual: charge.merchantReference,
      })
      return NextResponse.json({ error: 'Référence invalide' }, { status: 400 })
    }

    // ✅ Activer le plan
    console.log('[handleSubscriptionWebhook] Activation du plan:', { shopId, planKey })
    const { error: activationError } = await activatePlan(shopId, planKey)
    if (activationError) {
      console.error('[handleSubscriptionWebhook] activatePlan échoué:', activationError)
      // Note: enregistrement des erreurs dans subscription_transactions
      // sera implémenté après la migration Supabase
      return NextResponse.json({ error: activationError }, { status: 500 })
    }

    console.log('[handleSubscriptionWebhook] ✅ Plan activé avec succès:', { shopId, planKey })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[handleSubscriptionWebhook] Erreur lors de la vérification API:', err)
    return NextResponse.json({ error: 'Vérification API échouée' }, { status: 500 })
  }
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

  // Ignorer les paiements non réussis
  if (payload.status !== 'succeed') {
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
