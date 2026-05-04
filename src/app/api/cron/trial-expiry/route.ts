import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp, buildTrialExpiredMessage } from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'

export async function GET(_req: NextRequest) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('shops')
    .select('id, name, slug, phone_whatsapp')
    .eq('plan', 'trial')
    .eq('is_active', true)
    .lt('trial_ends_at', new Date().toISOString())

  if (error) {
    console.error('[cron/trial-expiry]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const shops = (data ?? []) as {
    id: string; name: string; slug: string; phone_whatsapp: string | null
  }[]

  if (shops.length === 0) {
    return NextResponse.json({ deactivated: 0, notified: 0 })
  }

  const ids = shops.map(s => s.id)
  const { error: updateError } = await supabase
    .from('shops')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .in('id', ids)

  if (updateError) {
    console.error('[cron/trial-expiry] update', updateError.message)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  let notified = 0
  const upgradeUrl = `${APP_URL}/dashboard/upgrade`

  for (const shop of shops) {
    if (!shop.phone_whatsapp) continue

    const msg = buildTrialExpiredMessage({ shopName: shop.name, upgradeUrl })
    const result = await sendWhatsApp(shop.phone_whatsapp, msg)
    if (result.success) notified++
  }

  return NextResponse.json({ deactivated: shops.length, notified })
}
