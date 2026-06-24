import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToShop } from '@/lib/push/send'
import { APP_URL } from '@/constants'

const CONFIRMABLE_STATUSES = new Set(['confirmed', 'preparing', 'ready'])

export async function POST(req: NextRequest) {
  const { delivery_token } = await req.json() as { delivery_token?: string }

  if (!delivery_token || typeof delivery_token !== 'string' || delivery_token.length < 10) {
    return NextResponse.json({ error: 'Token invalide.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: orderData } = await admin
    .from('orders')
    .select(`
      id, status, shop_id, total_price, payment_type,
      clients(first_name),
      order_items(product_name, quantity),
      shops(name, slug)
    `)
    .eq('delivery_token' as never, delivery_token)
    .single() as { data: {
      id: string
      status: string
      shop_id: string
      total_price: number
      payment_type: string
      clients: { first_name: string } | null
      order_items: { product_name: string; quantity: number }[]
      shops: { name: string; slug: string } | null
    } | null }

  if (!orderData) {
    return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
  }

  if (orderData.status === 'delivered') {
    return NextResponse.json({ ok: true, already: true })
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
  const clientName  = orderData.clients?.first_name ?? 'Client'
  const orderRef    = `#${orderData.id.slice(0, 8).toUpperCase()}`
  const slug        = orderData.shops?.slug ?? ''

  void sendPushToShop(orderData.shop_id, {
    title: `✅ Livraison confirmée — ${orderRef}`,
    body:  `${clientName} a reçu sa commande.`,
    url:   `${APP_URL}/dashboard/orders/${orderData.id}`,
  })

  console.log(`[delivery/confirm] Commande ${orderData.id} → delivered (shop: ${slug})`)
  return NextResponse.json({ ok: true })
}
