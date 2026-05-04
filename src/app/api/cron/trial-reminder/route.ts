import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp, buildTrialReminderMessage } from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'
import { addDays, format, startOfDay, endOfDay } from 'date-fns'

export async function GET(_req: NextRequest) {
  const supabase = createAdminClient()

  const targetDay = addDays(new Date(), 3)
  const from = format(startOfDay(targetDay), "yyyy-MM-dd'T'HH:mm:ssxxx")
  const to   = format(endOfDay(targetDay),   "yyyy-MM-dd'T'HH:mm:ssxxx")

  const { data, error } = await supabase
    .from('shops')
    .select('id, name, slug, phone_whatsapp, trial_ends_at')
    .eq('plan', 'trial')
    .eq('is_active', true)
    .gte('trial_ends_at', from)
    .lte('trial_ends_at', to)

  if (error) {
    console.error('[cron/trial-reminder]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const shops = (data ?? []) as {
    id: string; name: string; slug: string
    phone_whatsapp: string | null; trial_ends_at: string
  }[]

  let sent = 0

  for (const shop of shops) {
    if (!shop.phone_whatsapp) continue

    const upgradeUrl = `${APP_URL}/dashboard/upgrade`
    const trialEnd   = new Date(shop.trial_ends_at)
    const daysLeft   = Math.max(1, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

    const msg    = buildTrialReminderMessage({ shopName: shop.name, daysLeft, upgradeUrl })
    const result = await sendWhatsApp(shop.phone_whatsapp, msg)

    if (result.success) sent++
  }

  return NextResponse.json({ processed: shops.length, sent })
}
