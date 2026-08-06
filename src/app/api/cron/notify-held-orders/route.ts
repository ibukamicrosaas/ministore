import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/auth/verify-cron'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp, buildHeldOrderClientNoticeMessage } from '@/lib/notifications/whatsapp'
import { recordCronRun } from '@/lib/cron/health'
import { HELD_ORDER_NOTICE_HOURS } from '@/constants'

// Horaire, pas quotidien : le délai de 48h est une promesse faite au client
// final (§5 de la spec), pas une tâche de maintenance interne — en quotidien,
// un client pourrait attendre jusqu'à 71h avant d'être prévenu. Le projet est
// sur un plan Vercel qui autorise des fréquences arbitraires (12 crons
// quotidiens déjà en place), confirmé avant d'ajouter ce cron.
export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const threshold = new Date(Date.now() - HELD_ORDER_NOTICE_HOURS * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('orders')
    .select('id, shop_id, client_id, shops(name, phone_whatsapp), clients(phone)' as never)
    .eq('is_held', true)
    .is('held_notified_at', null)
    .is('released_at', null)
    .lt('created_at', threshold)

  if (error) {
    console.error('[cron/notify-held-orders]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  type HeldOrderRow = {
    id: string
    shop_id: string
    client_id: string | null
    shops: { name: string; phone_whatsapp: string | null } | null
    clients: { phone: string } | null
  }
  const orders = (data ?? []) as unknown as HeldOrderRow[]

  let notified = 0
  for (const order of orders) {
    const clientPhone = order.clients?.phone
    const shopName = order.shops?.name
    const merchantPhone = order.shops?.phone_whatsapp
    if (!clientPhone || !shopName || !merchantPhone) continue

    const msg = buildHeldOrderClientNoticeMessage({ shopName, merchantPhone })
    const { success } = await sendWhatsApp(clientPhone, msg)
    if (!success) continue

    await supabase
      .from('orders')
      .update({ held_notified_at: new Date().toISOString() })
      .eq('id', order.id)
    notified++
  }

  void recordCronRun('notify-held-orders', 'ok', { checked: orders.length, notified })
  return NextResponse.json({ checked: orders.length, notified })
}
