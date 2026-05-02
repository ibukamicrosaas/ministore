import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp, buildTrialReminderMessage } from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'
import { addDays, format, startOfDay, endOfDay } from 'date-fns'

export async function GET(_req: NextRequest) {
  const supabase = createAdminClient()

  // Salons en trial dont l'essai expire dans exactement 3 jours (fenêtre : J+3)
  const targetDay = addDays(new Date(), 3)
  const from = format(startOfDay(targetDay), "yyyy-MM-dd'T'HH:mm:ssxxx")
  const to   = format(endOfDay(targetDay),   "yyyy-MM-dd'T'HH:mm:ssxxx")

  const { data, error } = await supabase
    .from('salons')
    .select('id, name, slug, phone_whatsapp, trial_ends_at')
    .eq('plan', 'trial')
    .eq('is_active', true)
    .gte('trial_ends_at', from)
    .lte('trial_ends_at', to)

  if (error) {
    console.error('[cron/trial-reminder]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const salons = (data ?? []) as {
    id: string; name: string; slug: string
    phone_whatsapp: string | null; trial_ends_at: string
  }[]

  let sent = 0

  for (const salon of salons) {
    if (!salon.phone_whatsapp) continue

    const upgradeUrl = `${APP_URL}/dashboard/upgrade`
    const trialEnd = new Date(salon.trial_ends_at)
    const daysLeft = Math.max(1, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

    const msg = buildTrialReminderMessage({ salonName: salon.name, daysLeft, upgradeUrl })
    const result = await sendWhatsApp(salon.phone_whatsapp, msg)

    await supabase.from('notification_logs').insert({
      salon_id: salon.id,
      booking_id: null,
      recipient_phone: salon.phone_whatsapp,
      notification_type: 'trial_reminder',
      channel: 'whatsapp',
      message: msg,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error ?? null,
    })

    if (result.success) sent++
  }

  return NextResponse.json({ processed: salons.length, sent })
}
