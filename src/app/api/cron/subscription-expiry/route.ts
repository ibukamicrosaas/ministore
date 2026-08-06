import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/auth/verify-cron'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendWhatsApp,
  buildSubscriptionExpiredMessage,
} from '@/lib/notifications/whatsapp'
import { recordCronRun } from '@/lib/cron/health'
import { APP_URL, PLAN_LABELS } from '@/constants'
import { revalidatePath } from 'next/cache'
import { setShopStatus } from '@/lib/billing/shop-status'

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Boutiques free_orders payantes dont l'abonnement est résilié : repassent en
  // 'expired' (§3/§12 de la spec — reste publique, commandes de nouveau retenues,
  // celles déjà libérées le restent) via setShopStatus, jamais is_active=false
  // directement (qui les rendrait invisibles, contraire au modèle).
  const { data: freeOrdersExpired } = await supabase
    .from('shops')
    .select('id')
    .eq('trial_model', 'free_orders')
    .eq('status', 'active')
    .not('subscription_ends_at', 'is', null)
    .lt('subscription_ends_at', new Date().toISOString())

  let freeOrdersResiliated = 0
  for (const shop of freeOrdersExpired ?? []) {
    const result = await setShopStatus(shop.id, 'expired')
    if (!result.error) freeOrdersResiliated++
  }

  // Boutiques legacy dont l'abonnement est expiré et qui sont encore actives
  const { data: expired, error } = await supabase
    .from('shops')
    .select('id, name, slug, plan, phone_whatsapp')
    .neq('plan', 'trial')
    .eq('is_active', true)
    .eq('trial_model', 'legacy')
    .not('subscription_ends_at', 'is', null)
    .lt('subscription_ends_at', new Date().toISOString())

  if (error) {
    console.error('[cron/subscription-expiry]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const shops = expired ?? []
  if (shops.length === 0) {
    void recordCronRun('subscription-expiry', 'ok', { deactivated: 0, notified: 0, freeOrdersResiliated })
    return NextResponse.json({ deactivated: 0, notified: 0, freeOrdersResiliated })
  }

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

  void recordCronRun('subscription-expiry', 'ok', { deactivated: shops.length, notified, freeOrdersResiliated })
  return NextResponse.json({ deactivated: shops.length, notified, freeOrdersResiliated })
}
