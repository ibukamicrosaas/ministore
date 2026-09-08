import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendPushToShop } from '@/lib/push/send'
import { sendWhatsApp, buildDigitalDownloadMessage } from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'
import { isOrderBlocked, loadOrderForMerchant } from '@/lib/orders/redact'

const CONFIRMABLE_STATUSES = new Set(['confirmed', 'preparing', 'ready'])
// Un produit digital payé par l'un de ces deux modes n'est jamais passé par
// un webhook de paiement en ligne — aucun download_token n'a donc jamais pu
// être généré ailleurs pour lui.
const CASH_PAYMENT_TYPES = new Set(['on_site', 'on_delivery'])

export async function POST(req: NextRequest) {
  // HIGH-6 : rate limit — max 10 confirmations par IP / minute (évite le flooding)
  const limited = await checkRateLimit(req, { key: 'delivery-confirm', maxRequests: 10, windowMs: 60_000 })
  if (limited) return limited

  const { delivery_token } = await req.json() as { delivery_token?: string }

  if (!delivery_token || typeof delivery_token !== 'string' || delivery_token.length < 10) {
    return NextResponse.json({ error: 'Token invalide.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: orderData } = await admin
    .from('orders')
    .select(`
      id, status, shop_id, total_price, payment_type, is_held, released_at,
      clients(first_name, phone, whatsapp),
      order_items(product_name, quantity, product_id, products(product_type, digital_file_name)),
      shops(name, slug)
    `)
    .eq('delivery_token' as never, delivery_token)
    .single() as { data: {
      id: string
      status: string
      shop_id: string
      total_price: number
      payment_type: string
      is_held: boolean
      released_at: string | null
      clients: { first_name: string; phone: string | null; whatsapp: string | null } | null
      order_items: { product_name: string; quantity: number; product_id: string | null; products: { product_type: string | null; digital_file_name: string | null } | null }[]
      shops: { name: string; slug: string } | null
    } | null }

  if (!orderData) {
    return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
  }

  if (orderData.status === 'delivered') {
    return NextResponse.json({ ok: true, already: true })
  }

  // Une commande retenue ne peut pas être confirmée livrée — elle n'a jamais
  // dû quitter la boutique tant que celle-ci n'est pas activée.
  if (isOrderBlocked(orderData)) {
    return NextResponse.json(
      { error: 'Cette commande ne peut pas encore être confirmée comme livrée.' },
      { status: 409 }
    )
  }

  if (!CONFIRMABLE_STATUSES.has(orderData.status)) {
    return NextResponse.json(
      { error: 'Cette commande ne peut pas encore être confirmée comme livrée.' },
      { status: 409 }
    )
  }

  const { error } = await admin
    .from('orders')
    .update({ status: 'delivered', updated_at: new Date().toISOString() } as never)
    .eq('id', orderData.id)

  if (error) {
    console.error('[delivery/confirm]', error.message)
    return NextResponse.json({ error: 'Impossible de mettre à jour la commande.' }, { status: 500 })
  }

  // Notification push au marchand (fire-and-forget)
  const merchantClient = loadOrderForMerchant(orderData).merchantClient
  const clientName  = merchantClient.clientName || 'Client'
  const orderRef    = `#${orderData.id.slice(0, 8).toUpperCase()}`
  const slug        = orderData.shops?.slug ?? ''

  void sendPushToShop(orderData.shop_id, {
    title: `✅ Livraison confirmée — ${orderRef}`,
    body:  `${clientName} a reçu sa commande.`,
    url:   `${APP_URL}/dashboard/orders/${orderData.id}`,
  }, orderData.id, 'delivery_confirmed')

  // Filet de sécurité digital (REPRISE.md §87/§90) — un produit digital payé
  // en espèces ne passe par aucun webhook de paiement en ligne, donc n'a
  // jamais pu recevoir de download_tokens à la création. Généré ici, à la
  // confirmation de livraison (= remise/encaissement effectif), jamais à la
  // création : un panier mixte livrerait sinon le fichier digital avant que
  // l'article physique livré avec lui ne soit payé.
  if (CASH_PAYMENT_TYPES.has(orderData.payment_type)) {
    const digitalItems = orderData.order_items.filter(i => i.products?.product_type === 'digital')

    if (digitalItems.length > 0) {
      // Idempotence : une commande déjà traitée par un webhook (paiement en
      // ligne réglé entre-temps) a déjà ses tokens — ne jamais en regénérer.
      const { data: existingTokens } = await admin
        .from('download_tokens')
        .select('id')
        .eq('order_id', orderData.id)
        .limit(1)

      if (!existingTokens?.length) {
        const clientPhone = merchantClient.clientWhatsapp ?? merchantClient.clientPhone
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

        for (const item of digitalItems) {
          if (!item.product_id) continue
          const { data: tokenData } = await admin
            .from('download_tokens')
            .insert({
              order_id:   orderData.id,
              product_id: item.product_id,
              shop_id:    orderData.shop_id,
              expires_at: expiresAt,
              max_downloads: 5,
            })
            .select('token')
            .single()

          if (tokenData?.token && clientPhone) {
            const downloadUrl = `${APP_URL}/telechargement/${tokenData.token}`
            const msg = buildDigitalDownloadMessage({
              shopName:     orderData.shops?.name ?? '',
              clientName:   merchantClient.clientName,
              productName:  item.products?.digital_file_name ?? 'ton fichier',
              downloadUrl,
              expiresHours: 48,
            })
            await sendWhatsApp(clientPhone, msg)
          }
        }
      }
    }
  }

  console.log(`[delivery/confirm] Commande ${orderData.id} → delivered (shop: ${slug})`)
  return NextResponse.json({ ok: true })
}
