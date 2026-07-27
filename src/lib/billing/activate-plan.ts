import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { APP_URL, PLAN_LABELS } from '@/constants'
import { sendWhatsApp, buildPlanActivatedMessage } from '@/lib/notifications/whatsapp'

const VALID_PLAN_KEYS = new Set(['decouverte', 'business', 'pro'])
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Active ou renouvelle un plan payant pour une boutique.
 * - Si la boutique a déjà un abonnement actif, l'échéance est prolongée à partir
 *   de la date de fin existante (pas de now()) pour ne pas pénaliser les renouvellements anticipés.
 * - Revalide tous les chemins concernés.
 * Utilisé par le webhook Bictorys, verifySubscriptionPayment et l'admin.
 */
export async function activatePlan(
  shopId: string,
  planKey: string,
  durationDays = 31,
): Promise<{ error?: string }> {
  // Validation des entrées pour éviter les injections / mauvaises données
  if (!UUID_RE.test(shopId)) return { error: 'shopId invalide' }
  if (!VALID_PLAN_KEYS.has(planKey)) return { error: 'planKey invalide' }
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 400) {
    return { error: 'durationDays invalide' }
  }

  const supabase = createAdminClient()

  // Récupérer la date de fin actuelle pour ne pas pénaliser les renouvellements anticipés
  const { data: currentShop } = await supabase
    .from('shops')
    .select('subscription_ends_at')
    .eq('id', shopId)
    .single()

  // 1er paiement mensuel → 1 mois offert (62 jours au lieu de 31)
  // Critère : aucune transaction déjà activée pour cette boutique
  let effectiveDurationDays = durationDays
  if (durationDays === 31 && planKey === 'business') {
    const { count: prevActivated } = await (supabase
      .from('subscription_transactions' as never)
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .eq('status', 'activated') as unknown as Promise<{ count: number | null }>)
    if ((prevActivated ?? 0) === 0) effectiveDurationDays = 62
  }

  const now = Date.now()
  const currentEnd = currentShop?.subscription_ends_at
    ? new Date(currentShop.subscription_ends_at).getTime()
    : 0
  // Si l'abonnement est encore actif, on prolonge depuis la fin actuelle (pas depuis maintenant)
  const baseTs = currentEnd > now ? currentEnd : now
  const subscriptionEndsAt = new Date(baseTs + effectiveDurationDays * 24 * 60 * 60 * 1000).toISOString()

  const { error, data } = await supabase
    .from('shops')
    .update({
      plan:                 planKey,
      is_active:            true,
      subscription_ends_at: subscriptionEndsAt,
      updated_at:           new Date().toISOString(),
    })
    .eq('id', shopId)
    .select('slug, name, phone_whatsapp')
    .single()

  if (error) {
    console.error('[activatePlan]', error.message)
    Sentry.captureException(error, { extra: { shopId, planKey, durationDays } })
    return { error: 'Erreur lors de l\'activation du plan.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/upgrade')
  revalidatePath('/dashboard/settings')
  if (data?.slug) revalidatePath(`/${data.slug}`)

  // Notifier le marchand par WhatsApp — permet de confirmer l'activation même si
  // le navigateur est resté sur la page de succès de Bictorys
  if (data?.phone_whatsapp) {
    const planLabel = PLAN_LABELS[planKey] ?? planKey
    const msg = buildPlanActivatedMessage({
      shopName:     data.name,
      planLabel,
      dashboardUrl: `${APP_URL}/dashboard`,
    })
    sendWhatsApp(data.phone_whatsapp, msg).catch(err =>
      console.error('[activatePlan] WhatsApp notification failed:', err)
    )
  }

  return {}
}
