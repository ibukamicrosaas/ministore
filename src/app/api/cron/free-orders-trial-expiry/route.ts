import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/auth/verify-cron'
import { createAdminClient } from '@/lib/supabase/admin'
import { setShopStatus } from '@/lib/billing/shop-status'
import { sendWhatsApp, buildFreeOrdersTrialExpiredMessage } from '@/lib/notifications/whatsapp'
import { sendPushToShop } from '@/lib/push/send'
import { recordCronRun } from '@/lib/cron/health'
import { APP_URL } from '@/constants'

// Équivalent, pour le modèle free_orders, du cron trial-expiry legacy — même
// heure (9h UTC) pour la même raison : heures d'éveil au Sénégal/Côte d'Ivoire
// (UTC+0/+1), notification WhatsApp vue le jour même.
export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('shops')
    .select('id, name, phone_whatsapp')
    .eq('trial_model', 'free_orders')
    .eq('status', 'trial')
    .lt('trial_ends_at', new Date().toISOString())

  if (error) {
    console.error('[cron/free-orders-trial-expiry]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const shops = data ?? []
  let expired = 0
  let notified = 0
  let pushAttempted = 0

  for (const shop of shops) {
    const result = await setShopStatus(shop.id, 'expired')
    if (result.error) {
      console.error('[cron/free-orders-trial-expiry] setShopStatus', shop.id, result.error)
      continue
    }
    expired++

    await supabase.from('shop_events').insert({
      shop_id: shop.id,
      event_name: 'trial_expired',
      metadata: { motif: 'date' },
    })

    // Push en plus du SMS existant, pas à sa place — même raisonnement que
    // trial-reminder (REPRISE.md §130) ; indépendant de phone_whatsapp.
    await sendPushToShop(shop.id, {
      title: 'Ton essai gratuit est terminé',
      body:  'Active ta boutique pour continuer à recevoir des commandes.',
      url:   '/dashboard/upgrade',
    }, null, 'trial_reminder')
    pushAttempted++

    if (shop.phone_whatsapp) {
      const msg = buildFreeOrdersTrialExpiredMessage({
        shopName: shop.name,
        upgradeUrl: `${APP_URL}/dashboard/upgrade`,
      })
      const { success } = await sendWhatsApp(shop.phone_whatsapp, msg)
      if (success) notified++
    }
  }

  void recordCronRun('free-orders-trial-expiry', 'ok', { expired, notified, pushAttempted })
  return NextResponse.json({ expired, notified, pushAttempted })
}
