'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Montant par plan_key en FCFA — source de vérité pour le calcul du solde CM
export const CM_PLAN_PRICES: Record<string, number> = {
  decouverte: 2900,
  business:   4900,
  pro:        9900,
}

// Montant minimum pour une demande de retrait
export const CM_PAYOUT_MIN = 5000

// ── Auth helper ──────────────────────────────────────────────────────────────
// Vérifie que l'utilisateur courant est bien country manager.
// Retourne { userId, country, name } ou redirige vers /dashboard.
export async function requireCountryManager() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: cm } = await (admin
    .from('country_managers' as never)
    .select('country, name')
    .eq('user_id' as never, user.id)
    .single() as unknown as Promise<{ data: { country: string; name: string } | null }>)

  if (!cm) redirect('/dashboard')

  return { userId: user.id, country: cm.country, name: cm.name }
}

// ── KPIs ─────────────────────────────────────────────────────────────────────
export async function getCountryKPIs(country: string) {
  const admin = createAdminClient()

  const [
    { count: totalShops },
    { count: activeShops },
    { count: trialShops },
    { data: recentOrders },
  ] = await Promise.all([
    admin.from('shops').select('id', { count: 'exact', head: true }).eq('country', country),
    admin.from('shops').select('id', { count: 'exact', head: true }).eq('country', country).eq('is_active', true),
    admin.from('shops').select('id', { count: 'exact', head: true }).eq('country', country).eq('plan', 'trial'),
    admin
      .from('orders')
      .select('id, total_price, created_at')
      .in('shop_id',
        admin.from('shops').select('id').eq('country', country) as unknown as string[]
      )
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .in('status', ['confirmed', 'preparing', 'ready', 'delivered', 'completed']),
  ])

  const ordersThisMonth = recentOrders?.length ?? 0
  const revenueThisMonth = recentOrders?.reduce((s, o) => s + (o.total_price ?? 0), 0) ?? 0

  return {
    totalShops:      totalShops      ?? 0,
    activeShops:     activeShops     ?? 0,
    trialShops:      trialShops      ?? 0,
    ordersThisMonth,
    revenueThisMonth,
  }
}

// ── Shops list ────────────────────────────────────────────────────────────────
export async function getCountryShops(country: string) {
  const admin = createAdminClient()

  const { data } = await admin
    .from('shops')
    .select('id, name, slug, logo_url, plan, is_active, phone_whatsapp, city, created_at, primary_color')
    .eq('country', country)
    .order('created_at', { ascending: false })

  return data ?? []
}

// ── Revenus abonnements ───────────────────────────────────────────────────────

type CMInfo = { userId: string; country: string; name: string; id: string; licenseStartAt: string }

export async function requireCountryManagerFull(): Promise<CMInfo> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: cm } = await (admin
    .from('country_managers' as never)
    .select('id, country, name, license_start_at')
    .eq('user_id' as never, user.id)
    .single() as unknown as Promise<{
      data: { id: string; country: string; name: string; license_start_at: string } | null
    }>)

  if (!cm) redirect('/dashboard')

  return {
    userId:         user.id,
    id:             cm.id,
    country:        cm.country,
    name:           cm.name,
    licenseStartAt: cm.license_start_at,
  }
}

export async function getCMSubscriptionBalance(
  cmId: string,
  country: string,
  licenseStartAt: string,
): Promise<{ totalEarned: number; totalWithdrawn: number; available: number; pendingRequest: boolean }> {
  const admin = createAdminClient()

  // Récupère tous les abonnements activés dans le pays depuis la date de licence
  const { data: txns } = await (admin
    .from('subscription_transactions' as never)
    .select('plan_key, activated_at, shop_id')
    .eq('status' as never, 'activated')
    .gte('activated_at' as never, licenseStartAt) as unknown as Promise<{
      data: { plan_key: string; activated_at: string; shop_id: string }[] | null
    }>)

  // Filtre côté JS sur le pays (pas de join direct possible sans RPC)
  const shopIds = txns?.map(t => t.shop_id) ?? []
  let countryShopIds = new Set<string>()

  if (shopIds.length > 0) {
    const { data: shops } = await admin
      .from('shops')
      .select('id')
      .eq('country', country)
      .in('id', shopIds)
    countryShopIds = new Set((shops ?? []).map((s: { id: string }) => s.id))
  }

  const totalEarned = (txns ?? [])
    .filter(t => countryShopIds.has(t.shop_id))
    .reduce((sum, t) => sum + (CM_PLAN_PRICES[t.plan_key] ?? 0), 0)

  // Total déjà retiré (payouts avec status 'paid')
  const { data: payouts } = await (admin
    .from('country_manager_payouts' as never)
    .select('amount, status')
    .eq('country_manager_id' as never, cmId) as unknown as Promise<{
      data: { amount: number; status: string }[] | null
    }>)

  const totalWithdrawn = (payouts ?? [])
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)

  const pendingRequest = (payouts ?? []).some(p => p.status === 'pending')

  return {
    totalEarned,
    totalWithdrawn,
    available: Math.max(0, totalEarned - totalWithdrawn),
    pendingRequest,
  }
}

export async function getCMPayoutHistory(cmId: string) {
  const admin = createAdminClient()
  const { data } = await (admin
    .from('country_manager_payouts' as never)
    .select('id, amount, provider, mobile_money_number, status, requested_at, paid_at, admin_reference, notes')
    .eq('country_manager_id' as never, cmId)
    .order('requested_at' as never, { ascending: false }) as unknown as Promise<{
      data: {
        id: string
        amount: number
        provider: string
        mobile_money_number: string
        status: string
        requested_at: string
        paid_at: string | null
        admin_reference: string | null
        notes: string | null
      }[] | null
    }>)
  return data ?? []
}

// ── Product counts per shop ───────────────────────────────────────────────────
export async function getShopProductCounts(shopIds: string[]) {
  if (shopIds.length === 0) return {}
  const admin = createAdminClient()

  const { data } = await admin
    .from('products')
    .select('shop_id')
    .in('shop_id', shopIds)
    .eq('is_active', true)

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.shop_id] = (counts[row.shop_id] ?? 0) + 1
  }
  return counts
}
