import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyBictorysSignature, type BictorysWebhookPayload } from '@/lib/payments/bictorys'
import {
  sendWhatsApp,
  buildOrderConfirmationMessage,
  buildNewOrderAlertMessage,
} from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'

const VALID_PLAN_KEYS = new Set(['decouverte', 'business', 'pro'])
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const rawBody      = await req.text()
  const headerSecret = req.headers.get('x-secret-key') ?? ''
  const envSecret    = process.env.BICTORYS_WEBHOOK_SECRET ?? ''

  // Fail closed : si le secret n'est pas configuré, refuser toutes les requêtes
  if (!envSecret) {
    console.error('[webhook] BICTORYS_WEBHOOK_SECRET non configuré — webhook rejeté')
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 })
  }
  if (!verifyBictorysSignature(headerSecret, envSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody) as BictorysWebhookPayload

  const merchantReference = payload.merchantReference
  if (!merchantReference) {
    return NextResponse.json({ error: 'merchantReference manquant' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // ── Paiement d'abonnement ─────────────────────────────────────────────
  // Format: "sub-{36-char-uuid}-{planKey}"
  if (merchantReference.startsWith('sub-')) {
    if (payload.status !== 'succeed') {
      return NextResponse.json({ ok: true })
    }
    // shopId = chars 4..39 (UUID = 36 chars), planKey = chars 41+
    const shopId  = merchantReference.slice(4, 40)
    const planKey = merchantReference.slice(41)

    // Validation stricte : UUID format + plan connu
    if (!UUID_REGEX.test(shopId)) {
      console.error('[webhook] shopId invalide:', shopId)
      return NextResponse.json({ error: 'merchantReference invalide' }, { status: 400 })
    }
    if (!VALID_PLAN_KEYS.has(planKey)) {
      console.error('[webhook] planKey non autorisé:', planKey)
      return NextResponse.json({ error: 'plan invalide' }, { status: 400 })
    }

    await supabase
      .from('shops')
      .update({ plan: planKey, is_active: true, updated_at: new Date().toISOString() })
      .eq('id', shopId)

    console.log(`[webhook] Plan ${planKey} activé pour shop ${shopId}`)
    return NextResponse.json({ ok: true })
  }

  // ── Paiement de commande ──────────────────────────────────────────────
  const orderId = merchantReference

  // Idempotence
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('status')
    .eq('provider_payment_id', payload.id)
    .single()

  if (existingPayment?.status === 'completed') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  if (payload.status !== 'succeed') {
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('provider_payment_id', payload.id)

    return NextResponse.json({ ok: true })
  }

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

  if (!orderData) return NextResponse.json({ ok: true })

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

  if (!o.clients || !o.shops) return NextResponse.json({ ok: true })

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
    channel:           'whatsapp',
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
      channel:           'whatsapp',
      message:           alertMsg,
      status:            shopNotif.success ? 'sent' : 'failed',
      error_message:     shopNotif.error ?? null,
    })
  }

  return NextResponse.json({ ok: true })
}
