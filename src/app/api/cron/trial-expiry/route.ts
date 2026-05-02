import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp, buildTrialExpiredMessage } from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'

export async function GET(_req: NextRequest) {
  const supabase = createAdminClient()

  // Salons en trial actifs dont l'essai est expiré
  const { data, error } = await supabase
    .from('salons')
    .select('id, name, slug, phone_whatsapp')
    .eq('plan', 'trial')
    .eq('is_active', true)
    .lt('trial_ends_at', new Date().toISOString())

  if (error) {
    console.error('[cron/trial-expiry]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const salons = (data ?? []) as {
    id: string; name: string; slug: string; phone_whatsapp: string | null
  }[]

  if (salons.length === 0) {
    return NextResponse.json({ deactivated: 0, notified: 0 })
  }

  // Désactiver tous en une requête
  const ids = salons.map(s => s.id)
  const { error: updateError } = await supabase
    .from('salons')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .in('id', ids)

  if (updateError) {
    console.error('[cron/trial-expiry] update', updateError.message)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  let notified = 0
  const upgradeUrl = `${APP_URL}/dashboard/upgrade`

  for (const salon of salons) {
    if (!salon.phone_whatsapp) continue

    const msg = buildTrialExpiredMessage({ salonName: salon.name, upgradeUrl })
    const result = await sendWhatsApp(salon.phone_whatsapp, msg)

    await supabase.from('notification_logs').insert({
      salon_id: salon.id,
      booking_id: null,
      recipient_phone: salon.phone_whatsapp,
      notification_type: 'trial_expired',
      channel: 'whatsapp',
      message: msg,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error ?? null,
    })

    if (result.success) notified++
  }

  return NextResponse.json({ deactivated: salons.length, notified })
}
