import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/auth/verify-cron'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendWhatsApp,
  buildSubscriptionExpiredMessage,
} from '@/lib/notifications/whatsapp'
import { APP_URL, PLAN_LABELS } from '@/constants'
import { revalidatePath } from 'next/cache'

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Boutiques dont l'abonnement est expiré et qui sont encore actives
  const { data: expired, error } = await supabase
    .from('shops')
    .select('id, name, slug, plan, phone_whatsapp')
    .neq('plan', 'trial')
    .eq('is_active', true)
    .not('subscription_ends_at', 'is', null)
    .lt('subscription_ends_at', new Date().toISOString())

  if (error) {
    console.error('[cron/subscription-expiry]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const shops = expired ?? []
  if (shops.length === 0) return NextResponse.json({ deactivated: 0, notified: 0 })

  // Désactiver toutes les boutiques expirées en une seule requête
  const ids = shops.map(s => s.id)
  const { error: updateError } = await supabase
    .from('shops')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .in('id', ids)

  if (updateError) {
    console.error('[cron/subscription-expiry] update:', updateError.message)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Invalider les caches des mini-sites désactivés
  for (const shop of shops) {
    if (shop.slug) revalidatePath(`/${shop.slug}`)
  }
  revalidatePath('/dashboard')

  // Notifications WhatsApp
  let notified = 0
  for (const shop of shops) {
    if (!shop.phone_whatsapp) continue

    const planLabel = PLAN_LABELS[shop.plan as string] ?? shop.plan as string
    const msg       = buildSubscriptionExpiredMessage({
      shopName:  shop.name,
      planLabel,
      renewUrl:  `${APP_URL}/dashboard/upgrade`,
    })

    const { success } = await sendWhatsApp(shop.phone_whatsapp, msg)
    if (success) notified++

    console.log(`[cron/subscription-expiry] ${shop.name} (${shop.id}) désactivé`)
  }

  return NextResponse.json({ deactivated: shops.length, notified })
}
