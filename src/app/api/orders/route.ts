import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendWhatsApp,
  buildOrderConfirmationMessage,
  buildNewOrderAlertMessage,
} from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'

interface OrderItemInput {
  product_id: string
  product_name: string
  variant_label: string | null
  unit_price: number
  quantity: number
}

interface CreateOrderBody {
  shopId: string
  items: OrderItemInput[]
  delivery_date: string | null
  delivery_type: 'home_delivery' | 'store_pickup'
  delivery_address: string | null
  client_first_name: string
  client_phone: string
  client_whatsapp: string
  notes: string | null
  payment_type: 'online_full' | 'online_deposit' | 'on_delivery' | 'on_site'
}

export async function POST(req: NextRequest) {
  const body = await req.json() as CreateOrderBody

  const { shopId, items, delivery_date, delivery_type, delivery_address,
    client_first_name, client_phone, client_whatsapp, notes, payment_type } = body

  // Validation minimale
  if (!shopId || !items?.length || !client_first_name || !client_phone) {
    return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Vérifier que la boutique existe et est active
  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, phone_whatsapp, slug, deposit_percentage')
    .eq('id', shopId)
    .eq('is_active', true)
    .single()

  if (!shop) {
    return NextResponse.json({ error: 'Boutique introuvable.' }, { status: 404 })
  }

  // Calculer les totaux
  const total_price = items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0)

  // Calculer l'acompte si paiement en ligne
  let deposit_amount = 0
  if (payment_type === 'online_deposit') {
    // Récupérer les acomptes produit
    const productIds = items.map(i => i.product_id).filter(Boolean)
    const { data: products } = await supabase
      .from('products')
      .select('id, deposit_percentage')
      .in('id', productIds)
      .eq('shop_id', shopId)

    const productMap = new Map((products ?? []).map(p => [p.id, p.deposit_percentage]))

    deposit_amount = items.reduce((sum, it) => {
      const pct = productMap.get(it.product_id) ?? shop.deposit_percentage ?? 0
      return sum + Math.floor(it.unit_price * it.quantity * pct / 100)
    }, 0)
  } else if (payment_type === 'online_full') {
    deposit_amount = total_price
  }

  // Upsert client
  const { data: clientId } = await supabase.rpc('upsert_client_from_order', {
    p_shop_id:    shopId,
    p_first_name: client_first_name,
    p_last_name:  '',
    p_phone:      client_phone,
    p_whatsapp:   client_whatsapp,
    p_email:      '',
  })

  // Créer la commande
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      shop_id:          shopId,
      client_id:        clientId ?? null,
      status:           'pending',
      delivery_type,
      delivery_address: delivery_address ?? null,
      delivery_date:    delivery_date ?? null,
      payment_type,
      deposit_amount,
      deposit_paid:     false,
      total_price,
      notes:            notes ?? null,
    })
    .select('id, client_token')
    .single()

  if (orderError || !order) {
    console.error('[api/orders]', orderError?.message)
    return NextResponse.json({ error: 'Impossible de créer la commande.' }, { status: 500 })
  }

  // Créer les lignes
  const { error: itemsError } = await supabase.from('order_items').insert(
    items.map(it => ({
      order_id:     order.id,
      product_id:   it.product_id || null,
      product_name: it.product_name,
      variant_label: it.variant_label,
      unit_price:   it.unit_price,
      quantity:     it.quantity,
      line_total:   it.unit_price * it.quantity,
    }))
  )

  if (itemsError) {
    console.error('[api/orders items]', itemsError.message)
  }

  // Si paiement en ligne → renvoyer vers la page de paiement
  if (payment_type === 'online_full' || payment_type === 'online_deposit') {
    return NextResponse.json({ orderId: order.id, redirect: 'pay' })
  }

  // Paiement à la réception → envoyer les notifications WhatsApp
  const orderUrl     = `${APP_URL}/${shop.slug}/commander/success?order_id=${order.id}&token=${order.client_token}`
  const itemsSummary = items
    .map(i => `• ${i.product_name}${i.variant_label ? ` (${i.variant_label})` : ''}${i.quantity > 1 ? ` ×${i.quantity}` : ''} — ${(i.unit_price * i.quantity).toLocaleString('fr-FR')} FCFA`)
    .join('\n')

  const confirmMsg = buildOrderConfirmationMessage({
    shopName:     shop.name,
    clientName:   client_first_name,
    items:        itemsSummary,
    totalPrice:   total_price,
    deliveryType: delivery_type,
    deliveryDate: delivery_date ?? undefined,
    paymentType:  payment_type,
    orderUrl,
  })

  const clientNotif = await sendWhatsApp(client_whatsapp, confirmMsg)
  await supabase.from('notification_logs').insert({
    shop_id:           shopId,
    order_id:          order.id,
    recipient_phone:   client_whatsapp,
    notification_type: 'order_confirmation',
    channel:           'whatsapp',
    message:           confirmMsg,
    status:            clientNotif.success ? 'sent' : 'failed',
    error_message:     clientNotif.error ?? null,
  })

  if (shop.phone_whatsapp) {
    const alertMsg = buildNewOrderAlertMessage({
      clientName:   client_first_name,
      clientPhone:  client_phone,
      items:        itemsSummary,
      totalPrice:   total_price,
      deliveryType: delivery_type,
      deliveryDate: delivery_date ?? undefined,
      paymentType:  payment_type,
    })

    const shopNotif = await sendWhatsApp(shop.phone_whatsapp, alertMsg)
    await supabase.from('notification_logs').insert({
      shop_id:           shopId,
      order_id:          order.id,
      recipient_phone:   shop.phone_whatsapp,
      notification_type: 'new_order_shop',
      channel:           'whatsapp',
      message:           alertMsg,
      status:            shopNotif.success ? 'sent' : 'failed',
      error_message:     shopNotif.error ?? null,
    })
  }

  return NextResponse.json({ orderId: order.id, redirect: 'success' })
}
