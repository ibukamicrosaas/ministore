'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { subDays, startOfDay, format } from 'date-fns'

const PLAN_PRICES: Record<string, number> = {
  discovery: 2900,
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

  const { data: activeStartMonth } = await supabase
    .from('shops')
    .select('id')
    .eq('is_active', true)
    .lt('created_at', monthStart.toISOString())

  const { data: churned } = await supabase
    .from('shops')
    .select('id')
    .eq('is_active', false)
    .gte('updated_at', monthStart.toISOString())

  const startCount = activeStartMonth?.length ?? 1
  const churnCount = churned?.length ?? 0

  return {
    churnRate: Math.round((churnCount / startCount) * 100),
    churned: churnCount,
    activeStartMonth: startCount,
  }
}

export async function getMRRBreakdown() {
  const supabase = createAdminClient()
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30).toISOString()

  const { data: allActiveShops } = await supabase
    .from('shops')
    .select('id, plan')
    .eq('is_active', true)

  const activeShops = allActiveShops?.filter(s => s.plan !== 'trial') ?? []

  const totalMRR = activeShops.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0)

  const { data: newPayments } = (await supabase
    .from('subscription_transactions' as never)
    .select('plan_key, activated_at')
    .eq('status', 'activated')
    .gte('activated_at', thirtyDaysAgo)) as unknown as { data: Array<{ plan_key: string; activated_at: string }> | null }

  const newMRR = newPayments?.reduce((sum, p) => sum + (PLAN_PRICES[p.plan_key] ?? 0), 0) ?? 0

  const planCounts = activeShops.reduce((acc, s) => {
    acc[s.plan] = (acc[s.plan] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalMRR,
    newMRR,
    churnedMRR: 0,
    netMRR: newMRR,
    byPlan: {
      discovery: (planCounts['discovery'] ?? 0) * PLAN_PRICES.discovery,
      business: (planCounts['business'] ?? 0) * PLAN_PRICES.business,
      pro: (planCounts['pro'] ?? 0) * PLAN_PRICES.pro,
    },
  }
}

export async function getPlanDistribution() {
  const supabase = createAdminClient()

  const { data: shops } = await supabase
    .from('shops')
    .select('plan')

  const dist = { trial: 0, discovery: 0, business: 0, pro: 0 }
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
