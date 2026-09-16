import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/auth/verify-cron'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp, buildTrialReminderMessage } from '@/lib/notifications/whatsapp'
import { sendPushToShop } from '@/lib/push/send'
import { APP_URL } from '@/constants'
import { addDays, format, startOfDay, endOfDay } from 'date-fns'

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createAdminClient()

  // ?shop_id=xxx — restreint le traitement à une boutique précise pour un
  // test sans effet de bord (REPRISE.md §131).
  const shopId = req.nextUrl.searchParams.get('shop_id')

  const targetDay = addDays(new Date(), 3)
  const from = format(startOfDay(targetDay), "yyyy-MM-dd'T'HH:mm:ssxxx")
  const to   = format(endOfDay(targetDay),   "yyyy-MM-dd'T'HH:mm:ssxxx")

  let query = supabase
    .from('shops')
    .select('id, name, slug, phone_whatsapp, trial_ends_at')
    .eq('plan', 'trial')
    .eq('is_active', true)
    .eq('trial_model', 'legacy') // free_orders : pas de rappel à J-3 équivalent pour l'instant, hors spec
    .gte('trial_ends_at', from)
    .lte('trial_ends_at', to)
  if (shopId) query = query.eq('id', shopId)

  const { data, error } = await query

  if (error) {
    console.error('[cron/trial-reminder]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const shops = (data ?? []) as {
    id: string; name: string; slug: string
    phone_whatsapp: string | null; trial_ends_at: string
  }[]

  let sent = 0
  let pushAttempted = 0

  for (const shop of shops) {
    const upgradeUrl = `${APP_URL}/dashboard/upgrade`
    const trialEnd   = new Date(shop.trial_ends_at)
    const daysLeft   = Math.max(1, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

    // Push en plus du SMS existant, pas à sa place — le SMS reste tel quel
    // tant que sa fiabilité n'est pas corrigée séparément (REPRISE.md §130).
    // Indépendant de phone_whatsapp : le push ne nécessite pas de numéro.
    // sendPushToShop ne retourne rien (void) — le succès/échec réel par
    // abonnement est dans notification_logs, pas dans ce compteur, qui ne
    // compte donc que les tentatives, pas les envois confirmés.
    await sendPushToShop(shop.id, {
      title: 'Ton essai gratuit se termine bientôt',
      body:  `Plus que ${daysLeft} jour${daysLeft > 1 ? 's' : ''} — active ta boutique pour continuer à recevoir des commandes.`,
      url:   '/dashboard/upgrade',
    }, null, 'trial_reminder')
    pushAttempted++

    if (!shop.phone_whatsapp) continue

    const msg    = buildTrialReminderMessage({ shopName: shop.name, daysLeft, upgradeUrl })
    const result = await sendWhatsApp(shop.phone_whatsapp, msg)

    if (result.success) sent++
  }

  return NextResponse.json({ processed: shops.length, sent, pushAttempted })
}
