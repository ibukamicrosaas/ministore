import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/auth/verify-cron'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendWhatsApp,
  buildSubscriptionReminderMessage,
} from '@/lib/notifications/whatsapp'
import { APP_URL, PLAN_LABELS } from '@/constants'

const REMINDER_WINDOWS = [
  { days: 7, type: 'sub_reminder_7d' },
  { days: 3, type: 'sub_reminder_3d' },
  { days: 1, type: 'sub_reminder_1d' },
] as const

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now      = Date.now()
  let totalSent  = 0

  for (const window of REMINDER_WINDOWS) {
    // Fenêtre de 24h autour du jour cible pour absorber les décalages de cron
    const windowStart = new Date(now + (window.days - 1) * 24 * 60 * 60 * 1000).toISOString()
    const windowEnd   = new Date(now + (window.days + 1) * 24 * 60 * 60 * 1000).toISOString()

    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, plan, phone_whatsapp, subscription_ends_at')
      .neq('plan', 'trial')
      .eq('is_active', true)
      .not('subscription_ends_at', 'is', null)
      .gte('subscription_ends_at', windowStart)
      .lte('subscription_ends_at', windowEnd)

    if (error) {
      console.error(`[cron/subscription-reminder] ${window.type}:`, error.message)
      continue
    }

    for (const shop of shops ?? []) {
      if (!shop.phone_whatsapp || !shop.subscription_ends_at) continue

      // Déduplication : vérifier si on a déjà envoyé ce rappel récemment
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('identifier', `${window.type}:${shop.id}`)
        .eq('attempt_type', 'subscription_reminder')
        .gte('attempted_at', oneDayAgo)

      if ((count ?? 0) > 0) continue // déjà envoyé aujourd'hui

      const daysLeft  = Math.max(1, Math.ceil(
        (new Date(shop.subscription_ends_at).getTime() - now) / (1000 * 60 * 60 * 24)
      ))
      const planLabel = PLAN_LABELS[shop.plan] ?? shop.plan
      const msg       = buildSubscriptionReminderMessage({
        shopName:  shop.name,
        planLabel,
        daysLeft,
        renewUrl:  `${APP_URL}/dashboard/upgrade`,
      })

      const { success } = await sendWhatsApp(shop.phone_whatsapp, msg)

      // Enregistrer l'envoi pour déduplication
      await supabase.from('login_attempts').insert({
        identifier:   `${window.type}:${shop.id}`,
        attempt_type: 'subscription_reminder',
        success,
      })

      if (success) totalSent++
    }
  }

  return NextResponse.json({ sent: totalSent })
}
