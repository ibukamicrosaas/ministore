import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp, buildOrderReminderMessage } from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'
import { format, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'

export async function GET(_req: NextRequest) {
  const supabase = createAdminClient()

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  // Commandes confirmées avec livraison demain et sans rappel envoyé
  const { data: ordersData, error } = await supabase
    .from('orders')
    .select(`
      id,
      shop_id,
      delivery_date,
      delivery_type,
      client_token,
      clients(first_name, whatsapp, phone),
      shops(name, slug, phone_whatsapp)
    `)
    .eq('delivery_date', tomorrow)
    .in('status', ['confirmed', 'preparing'])
    .is('reminder_sent_at', null)

  if (error) {
    console.error('[cron/reminders]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const orders = (ordersData ?? []) as unknown as Array<{
    id: string
    shop_id: string
    delivery_date: string
    delivery_type: string
    client_token: string
    clients: { first_name: string; whatsapp: string | null; phone: string } | null
    shops: { name: string; slug: string; phone_whatsapp: string | null } | null
  }>

  let sent = 0

  for (const order of orders) {
    if (!order.clients || !order.shops) continue

    const clientPhone   = order.clients.whatsapp ?? order.clients.phone
    const dateFormatted = format(new Date(order.delivery_date + 'T12:00:00'), 'EEEE d MMMM', { locale: fr })
    const orderUrl      = `${APP_URL}/${order.shops.slug}/commande/${order.id}?token=${order.client_token}`

    const msg = buildOrderReminderMessage({
      shopName:     order.shops.name,
      clientName:   order.clients.first_name,
      deliveryDate: dateFormatted,
      deliveryType: order.delivery_type as 'home_delivery' | 'store_pickup',
      orderUrl,
    })

    const result = await sendWhatsApp(clientPhone, msg)

    if (result.success) {
      await supabase
        .from('orders')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', order.id)

      await supabase.from('notification_logs').insert({
        shop_id:           order.shop_id,
        order_id:          order.id,
        recipient_phone:   clientPhone,
        notification_type: 'order_reminder',
        channel:           'whatsapp',
        message:           msg,
        status:            'sent',
        error_message:     null,
      })

      sent++
    }
  }

  return NextResponse.json({ processed: orders.length, sent })
}
