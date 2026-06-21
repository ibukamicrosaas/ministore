'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { subDays, startOfDay, format } from 'date-fns'

const PLAN_PRICES: Record<string, number> = {
  decouverte: 2900,
  business: 4900,
  pro: 9900,
}

export async function getCountryConversionStats() {
  const supabase = createAdminClient()

  const { data: shops } = await supabase
    .from('shops')
    .select('country, plan')

  const stats = shops?.reduce((acc, shop) => {
    const country = shop.country
    if (!acc[country]) {
      acc[country] = { total: 0, paid: 0 }
    }
    acc[country].total++
    if (shop.plan !== 'trial') acc[country].paid++
    return acc
  }, {} as Record<string, { total: number; paid: number }>) ?? {}

  return Object.entries(stats)
    .map(([country, data]) => ({
      country,
      total: data.total,
      paid: data.paid,
      rate: data.total > 0 ? Math.round((data.paid / data.total) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate)
}

export async function getActivationRates() {
  const supabase = createAdminClient()

  const { data: shops } = await supabase
    .from('shops')
    .select('country, plan')

  const stats = shops?.reduce((acc, shop) => {
    const country = shop.country
    if (!acc[country]) acc[country] = { trial: 0, paid: 0, total: 0 }
    acc[country].total++
    if (shop.plan === 'trial') acc[country].trial++
    else acc[country].paid++
    return acc
  }, {} as Record<string, { trial: number; paid: number; total: number }>) ?? {}

  return Object.entries(stats)
    .map(([country, data]) => ({
      country,
      activationRate: data.total > 0 ? Math.round((data.paid / data.total) * 100) : 0,
      paid: data.paid,
      total: data.total,
    }))
    .sort((a, b) => b.activationRate - a.activationRate)
}

export async function getChurnRate() {
  const supabase = createAdminClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Abonnements payants expirés ce mois sans renouvellement (vrais churns)
  // Ne compte PAS les trials : plan doit avoir été != 'trial' (subscription_ends_at est null pour les trials)
  const { data: churnedShops } = await supabase
    .from('shops')
    .select('id')
    .eq('is_active', false)
    .not('subscription_ends_at', 'is', null)
    .gte('subscription_ends_at', monthStart.toISOString())
    .lt('subscription_ends_at', now.toISOString())

  // Base = abonnés payants actifs actuellement + ceux qui ont churné ce mois
  const { data: activePaying } = await supabase
    .from('shops')
    .select('id')
    .neq('plan', 'trial')
    .eq('is_active', true)

  const churnCount = churnedShops?.length ?? 0
  const activeCount = activePaying?.length ?? 0
  const baseCount = activeCount + churnCount

  return {
    churnRate: baseCount > 0 ? Math.round((churnCount / baseCount) * 100) : 0,
    churned: churnCount,
    activeStartMonth: baseCount,
  }
}

const PLAN_PRICES_ANNUAL: Record<string, number> = {
  decouverte: 29000,
  business:   49000,
  pro:        99000,
}

export async function getMRRBreakdown() {
  const supabase = createAdminClient()
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)

  const [activeShopsResult, annualSubsResult, newPaymentsResult, churnedShopsResult] = await Promise.all([
    supabase.from('shops').select('id, plan').eq('is_active', true).neq('plan', 'trial'),
    (supabase
      .from('subscription_transactions' as never)
      .select('shop_id')
      .eq('status', 'activated')
      .eq('billing_cycle', 'annual')) as unknown as Promise<{ data: Array<{ shop_id: string }> | null }>,
    (supabase
      .from('subscription_transactions' as never)
      .select('plan_key, billing_cycle, activated_at')
      .eq('status', 'activated')
      .gte('activated_at', thirtyDaysAgo.toISOString())) as unknown as Promise<{
        data: Array<{ plan_key: string; billing_cycle: string; activated_at: string }> | null
      }>,
    supabase
      .from('shops')
      .select('plan')
      .neq('plan', 'trial')
      .eq('is_active', false)
      .not('subscription_ends_at', 'is', null)
      .gte('subscription_ends_at', thirtyDaysAgo.toISOString())
      .lt('subscription_ends_at', now.toISOString()),
  ])

  const activeShops = activeShopsResult.data ?? []
  const annualShopIds = new Set(
    ((annualSubsResult as { data: Array<{ shop_id: string }> | null }).data ?? []).map(t => t.shop_id)
  )

  // MRR total : annuels normalisés en mensuel, mensuels au prix mensuel
  const totalMRR = activeShops.reduce((sum, s) => {
    if (annualShopIds.has(s.id)) return sum + Math.round((PLAN_PRICES_ANNUAL[s.plan] ?? 0) / 12)
    return sum + (PLAN_PRICES[s.plan] ?? 0)
  }, 0)

  // New MRR (30j) — prend en compte le cycle de facturation
  const newPayments = (newPaymentsResult as { data: Array<{ plan_key: string; billing_cycle: string }> | null }).data ?? []
  const newMRR = newPayments.reduce((sum, p) => {
    if (p.billing_cycle === 'annual') return sum + Math.round((PLAN_PRICES_ANNUAL[p.plan_key] ?? 0) / 12)
    return sum + (PLAN_PRICES[p.plan_key] ?? 0)
  }, 0)

  // Churned MRR (30j) — abonnements payants expirés ce mois sans renouvellement
  const churnedShops = churnedShopsResult.data ?? []
  const churnedMRR = churnedShops.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0)

  // MRR par plan
  const planMRR = { decouverte: 0, business: 0, pro: 0 }
  for (const s of activeShops) {
    const plan = s.plan as keyof typeof planMRR
    if (!(plan in planMRR)) continue
    if (annualShopIds.has(s.id)) {
      planMRR[plan] += Math.round((PLAN_PRICES_ANNUAL[plan] ?? 0) / 12)
    } else {
      planMRR[plan] += PLAN_PRICES[plan] ?? 0
    }
  }

  return {
    totalMRR,
    newMRR,
    churnedMRR,
    netMRR: newMRR - churnedMRR,
    byPlan: planMRR,
  }
}

export async function getPlanDistribution() {
  const supabase = createAdminClient()

  const { data: shops } = await supabase
    .from('shops')
    .select('plan')

  const dist = { trial: 0, decouverte: 0, business: 0, pro: 0 }
  shops?.forEach(s => {
    if (s.plan in dist) dist[s.plan as keyof typeof dist]++
  })

  return dist
}

export async function getCustomerSegments() {
  const supabase = createAdminClient()

  const { data: shops } = await supabase
    .from('shops')
    .select('country, plan, is_active')

  const segments = shops?.reduce((acc, shop) => {
    const key = `${shop.country}|${shop.plan}|${shop.is_active}`
    if (!acc[key]) {
      acc[key] = {
        country: shop.country,
        plan: shop.plan,
        isActive: shop.is_active,
        count: 0,
      }
    }
    acc[key].count++
    return acc
  }, {} as Record<string, any>) ?? {}

  return Object.values(segments).sort((a, b) => b.count - a.count)
}

export async function getTrendsData() {
  const supabase = createAdminClient()
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)

  const { data: dailyTransactions } = (await supabase
    .from('subscription_transactions' as never)
    .select('activated_at, plan_key')
    .eq('status', 'activated')
    .gte('activated_at', thirtyDaysAgo.toISOString())) as unknown as { data: Array<{ activated_at: string; plan_key: string }> | null }

  const mrr_trend: Record<string, number> = {}
  const activation_trend: Record<string, number> = {}

  dailyTransactions?.forEach(t => {
    const day = t.activated_at?.split('T')[0]
    if (day) {
      mrr_trend[day] = (mrr_trend[day] ?? 0) + (PLAN_PRICES[t.plan_key] ?? 0)
      activation_trend[day] = (activation_trend[day] ?? 0) + 1
    }
  })

  const result = []
  for (let i = 30; i >= 0; i--) {
    const date = format(subDays(now, i), 'yyyy-MM-dd')
    result.push({
      date,
      mrr: mrr_trend[date] ?? 0,
      activations: activation_trend[date] ?? 0,
      churns: 0,
    })
  }

  return result
}
