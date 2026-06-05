import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/auth/verify-cron'
import { createAdminClient } from '@/lib/supabase/admin'
// Rappels SMS clients désactivés pour limiter la consommation Twilio.
// Le cron tourne toujours (pour ne pas casser vercel.json) mais n'envoie plus de SMS.
import { format, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
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

  // SMS désactivés — on marque seulement reminder_sent_at pour ne pas retraiter
  // les mêmes commandes si les SMS sont réactivés plus tard.
  const ids = orders.map(o => o.id)
  if (ids.length > 0) {
    await supabase
      .from('orders')
      .update({ reminder_sent_at: new Date().toISOString() })
      .in('id', ids)
  }

  return NextResponse.json({ processed: orders.length, sent: 0, note: 'SMS desactives' })
}
