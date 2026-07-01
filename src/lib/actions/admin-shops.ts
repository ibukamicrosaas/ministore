'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { activatePlan } from '@/lib/billing/activate-plan'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_PLANS = new Set(['decouverte', 'business', 'pro'])

async function requireAdmin(): Promise<string> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    throw new Error('Unauthorized')
  }
  return user.id
}

/**
 * Retourne toutes les boutiques (actives ET inactives) en bypassant le RLS.
 * Inclut un flag `is_annual` basé sur la dernière transaction annuelle activée.
 * Requiert une session admin valide.
 */
export async function getAllShopsForAdmin() {
  await requireAdmin()

  const admin = createAdminClient()

  // Pagination par batch de 1000 pour contourner le max_rows PostgREST de Supabase.
  // .limit(N) > max_rows est ignoré côté serveur — seule la pagination .range() est fiable.
  const PAGE_SIZE = 1000
  const allShopsRaw: Record<string, unknown>[] = []
  let page = 0
  while (true) {
    const { data, error } = await admin
      .from('shops')
      .select('id, name, slug, plan, trial_ends_at, subscription_ends_at, city, country, is_active, created_at, phone_whatsapp')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    if (error || !data || data.length === 0) break
    allShopsRaw.push(...(data as Record<string, unknown>[]))
    if (data.length < PAGE_SIZE) break
    page++
  }

  const annualResult = await (admin
    .from('subscription_transactions' as never)
    .select('shop_id')
    .eq('status', 'activated')
    .eq('billing_cycle', 'annual')) as unknown as Promise<{
      data: Array<{ shop_id: string }> | null
      error: unknown
    }>

  const annualIds = new Set(
    (((await annualResult) as { data: Array<{ shop_id: string }> | null }).data ?? []).map(
      (t) => t.shop_id
    )
  )

  // CA en ligne (paiements Bictorys confirmés) par boutique
  const { data: revenueRows } = await admin
    .from('orders')
    .select('shop_id, total_price')
    .in('payment_type', ['online_full', 'online_deposit'])
    .not('status', 'in', '("pending","cancelled")')

  const revenueMap: Record<string, number> = {}
  for (const o of (revenueRows ?? []) as { shop_id: string; total_price: number }[]) {
    revenueMap[o.shop_id] = (revenueMap[o.shop_id] ?? 0) + (o.total_price ?? 0)
  }

  return allShopsRaw.map((s) => ({
    ...s,
    is_annual:      annualIds.has(s.id as string),
    online_revenue: revenueMap[s.id as string] ?? 0,
  }))
}

/**
 * Réinitialise le PIN (mot de passe Supabase Auth) d'un utilisateur via son shop_id.
 * Requiert une session admin valide.
 */
export async function resetUserPin(
  shopId: string,
  newPin: string,
): Promise<{ error?: string }> {
  await requireAdmin()

  if (!UUID_RE.test(shopId))      return { error: 'ID boutique invalide.' }
  if (!/^\d{6}$/.test(newPin))    return { error: 'Le PIN doit contenir exactement 6 chiffres.' }

  const admin = createAdminClient()

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('shop_id', shopId)
    .single()

  if (profileError || !profile) return { error: 'Aucun utilisateur trouvé pour cette boutique.' }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    profile.id,
    { password: newPin },
  )

  if (updateError) {
    console.error('[resetUserPin]', updateError.message)
    return { error: 'Impossible de réinitialiser le PIN. Réessaie.' }
  }

  return {}
}

/**
 * Active manuellement un plan d'abonnement (depuis l'espace admin).
 * Sécurisé côté serveur — jamais de secret exposé au navigateur.
 */
export async function activateSubscriptionManually(
  txnId: string,
  shopId: string,
  planKey: string,
): Promise<{ error?: string }> {
  const adminId = await requireAdmin()

  // Validation stricte des entrées
  if (!UUID_RE.test(txnId) || !UUID_RE.test(shopId) || !VALID_PLANS.has(planKey)) {
    return { error: 'Paramètres invalides' }
  }

  const supabase = createAdminClient()

  // Vérifier que la transaction existe et appartient à ce shop
  const { data: txn, error: txnError } = await supabase
    .from('subscription_transactions' as never)
    .select('id, status, shop_id, billing_cycle')
    .eq('id', txnId)
    .eq('shop_id', shopId)
    .single() as any

  if (txnError || !txn) return { error: 'Transaction non trouvée' }
  if (txn.status === 'activated') return { error: 'Transaction déjà activée' }

  const durationDays = (txn.billing_cycle as string) === 'annual' ? 365 : 31

  const { error: activationError } = await activatePlan(shopId, planKey, durationDays)
  if (activationError) return { error: activationError }

  await supabase
    .from('subscription_transactions' as never)
    .update({
      status: 'activated',
      verified_at: new Date().toISOString(),
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', txnId)

  console.log('[admin] ✅ Activation manuelle par', adminId, { txnId, shopId, planKey, durationDays })
  return {}
}
