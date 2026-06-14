import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { format, startOfMonth, startOfWeek, startOfDay, subMonths, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Profile } from '@/types'
import { RapportsClient } from './RapportsClient'

export const metadata = { title: 'Statistiques — TekkiShop' }

export default async function RapportsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'shop_id' | 'role'> | null
  if (!profile?.shop_id || profile.role !== 'owner') redirect('/dashboard')

  const shopId = profile.shop_id

  // Vérification plan
  const { data: shopData } = await supabase
    .from('shops').select('plan').eq('id', shopId).single()
  const plan    = (shopData as { plan: string } | null)?.plan ?? 'trial'
  const canView = plan === 'business' || plan === 'pro'

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
          <Lock className="h-8 w-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Rapports avancés</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
          Les rapports détaillés (évolution mensuelle, meilleurs jours, graphique 30 jours)
          sont disponibles à partir du plan Business.
        </p>
        <Link
          href="/dashboard/upgrade"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Passer au plan Business
        </Link>
      </div>
    )
  }

  const now         = new Date()
  const todayStart  = startOfDay(now).toISOString()
  const weekStart   = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
  const monthStart  = startOfMonth(now).toISOString()
  const prevStart   = startOfMonth(subMonths(now, 1)).toISOString()
  const prevEnd     = endOfMonth(subMonths(now, 1)).toISOString()
  const thirtyAgo   = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [monthRes, prevMonthRes, last30Res, clientRes, productRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, status, total_price, created_at')
      .eq('shop_id', shopId)
      .gte('created_at', monthStart),

    supabase
      .from('orders')
      .select('id, status, total_price, created_at')
      .eq('shop_id', shopId)
      .gte('created_at', prevStart)
      .lte('created_at', prevEnd),

    supabase
      .from('orders')
      .select('id, created_at, status')
      .eq('shop_id', shopId)
      .gte('created_at', thirtyAgo)
      .not('status', 'eq', 'cancelled'),

    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId),

    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .eq('is_active', true),
  ])

  const allMonthOrders  = (monthRes.data   ?? []) as { id: string; status: string; total_price: number; created_at: string }[]
  const prevMonthOrders = (prevMonthRes.data ?? []) as { id: string; status: string; total_price: number; created_at: string }[]
  const last30Orders    = (last30Res.data   ?? []) as { id: string; created_at: string; status: string }[]

  // CA mois en cours vs précédent
  const activeMonth  = allMonthOrders.filter(o => o.status !== 'cancelled')
  const activePrev   = prevMonthOrders.filter(o => o.status !== 'cancelled')
  const todayRevenue = activeMonth.filter(o => o.created_at >= todayStart).reduce((s, o) => s + o.total_price, 0)
  const weekRevenue  = activeMonth.filter(o => o.created_at >= weekStart).reduce((s, o) => s + o.total_price, 0)
  const monthRevenue = activeMonth.reduce((s, o) => s + o.total_price, 0)
  const prevRevenue  = activePrev.reduce((s, o) => s + o.total_price, 0)

  const revenueGrowth = prevRevenue > 0
    ? Math.round(((monthRevenue - prevRevenue) / prevRevenue) * 100)
    : monthRevenue > 0 ? 100 : 0

  // Stats commandes
  const orderStats = {
    total:     allMonthOrders.length,
    pending:   allMonthOrders.filter(o => o.status === 'pending').length,
    confirmed: allMonthOrders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status)).length,
    delivered: allMonthOrders.filter(o => o.status === 'delivered').length,
    cancelled: allMonthOrders.filter(o => o.status === 'cancelled').length,
  }
  const prevTotal        = prevMonthOrders.length
  const ordersGrowth     = prevTotal > 0
    ? Math.round(((orderStats.total - prevTotal) / prevTotal) * 100)
    : orderStats.total > 0 ? 100 : 0
  const completionRate   = orderStats.total > 0 ? Math.round((orderStats.delivered / orderStats.total) * 100) : 0
  const cancellationRate = orderStats.total > 0 ? Math.round((orderStats.cancelled / orderStats.total) * 100) : 0

  // Graphique 30 jours (commandes par jour)
  const dayMap: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    dayMap[d.toISOString().slice(0, 10)] = 0
  }
  for (const o of last30Orders) {
    const day = o.created_at.slice(0, 10)
    if (day in dayMap) dayMap[day]++
  }
  const chartData = Object.entries(dayMap).map(([date, count]) => ({ date, count }))

  // Meilleur jour de la semaine
  const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const dayOfWeekMap = new Array(7).fill(0)
  for (const o of last30Orders) {
    const dow = new Date(o.created_at).getDay()
    dayOfWeekMap[dow]++
  }
  const bestDayIdx  = dayOfWeekMap.indexOf(Math.max(...dayOfWeekMap))
  const bestDay     = last30Orders.length > 0 ? DAY_NAMES[bestDayIdx] : null
  const dayOfWeek   = dayOfWeekMap.map((count, i) => ({ label: DAY_NAMES[i], count }))

  // Top produits du mois
  const activeIds = activeMonth.map(o => o.id)
  let topProducts: { name: string; qty: number; revenue: number }[] = []
  if (activeIds.length > 0) {
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('product_name, quantity, line_total')
      .in('order_id', activeIds.slice(0, 200))

    const agg: Record<string, { qty: number; revenue: number }> = {}
    for (const item of itemsData ?? []) {
      const k = item.product_name as string
      if (!agg[k]) agg[k] = { qty: 0, revenue: 0 }
      agg[k].qty     += item.quantity as number
      agg[k].revenue += item.line_total as number
    }
    topProducts = Object.entries(agg)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }

  return (
    <RapportsClient
      monthLabel={format(now, 'MMMM yyyy', { locale: fr })}
      todayRevenue={todayRevenue}
      weekRevenue={weekRevenue}
      monthRevenue={monthRevenue}
      prevRevenue={prevRevenue}
      revenueGrowth={revenueGrowth}
      orderStats={orderStats}
      ordersGrowth={ordersGrowth}
      completionRate={completionRate}
      cancellationRate={cancellationRate}
      topProducts={topProducts}
      clientCount={clientRes.count ?? 0}
      productCount={productRes.count ?? 0}
      chartData={chartData}
      dayOfWeek={dayOfWeek}
      bestDay={bestDay}
    />
  )
}
