import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { ShoppingBag, TrendingUp, Users, Package, XCircle, CheckCircle2, Clock } from 'lucide-react'
import { format, startOfMonth, startOfWeek, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Profile } from '@/types'
import { RapportsClient } from './RapportsClient'

export const metadata = { title: 'Rapports — TekkiShop' }

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
  const now    = new Date()

  const todayStart  = startOfDay(now).toISOString()
  const weekStart   = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
  const monthStart  = startOfMonth(now).toISOString()

  // Toutes les commandes du mois (non annulées pour le CA, toutes pour les stats)
  const [monthOrdersRes, clientCountRes, productCountRes, topProductsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, status, total_price, created_at')
      .eq('shop_id', shopId)
      .gte('created_at', monthStart),

    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId),

    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .eq('is_active', true),

    supabase
      .from('order_items')
      .select('product_name, quantity, line_total')
      .gte('created_at', monthStart)
      // join sur orders pour filtrer par shop et exclure annulées
      // PostgREST ne supporte pas les joins filtrants côté client directement —
      // on filtrera côté serveur après
  ])

  const allMonthOrders = (monthOrdersRes.data ?? []) as {
    id: string; status: string; total_price: number; created_at: string
  }[]

  // CA (exclure annulées)
  const activeOrders  = allMonthOrders.filter(o => o.status !== 'cancelled')
  const todayRevenue  = activeOrders
    .filter(o => o.created_at >= todayStart)
    .reduce((s, o) => s + o.total_price, 0)
  const weekRevenue   = activeOrders
    .filter(o => o.created_at >= weekStart)
    .reduce((s, o) => s + o.total_price, 0)
  const monthRevenue  = activeOrders.reduce((s, o) => s + o.total_price, 0)

  // Stats commandes du mois
  const orderStats = {
    total:     allMonthOrders.length,
    pending:   allMonthOrders.filter(o => o.status === 'pending').length,
    confirmed: allMonthOrders.filter(o => ['confirmed','preparing','ready'].includes(o.status)).length,
    delivered: allMonthOrders.filter(o => o.status === 'delivered').length,
    cancelled: allMonthOrders.filter(o => o.status === 'cancelled').length,
  }

  const completionRate = orderStats.total > 0
    ? Math.round((orderStats.delivered / orderStats.total) * 100)
    : 0
  const cancellationRate = orderStats.total > 0
    ? Math.round((orderStats.cancelled / orderStats.total) * 100)
    : 0

  // Top produits du mois — on récupère depuis order_items en filtrant les order_ids actifs du mois
  const activeOrderIds = activeOrders.map(o => o.id)
  let topProducts: { name: string; qty: number; revenue: number }[] = []

  if (activeOrderIds.length > 0) {
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('product_name, quantity, line_total')
      .in('order_id', activeOrderIds.slice(0, 200)) // PostgREST limite les IN

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

  const clientCount  = clientCountRes.count ?? 0
  const productCount = productCountRes.count ?? 0
  const monthLabel   = format(now, 'MMMM yyyy', { locale: fr })

  return (
    <RapportsClient
      monthLabel={monthLabel}
      todayRevenue={todayRevenue}
      weekRevenue={weekRevenue}
      monthRevenue={monthRevenue}
      orderStats={orderStats}
      completionRate={completionRate}
      cancellationRate={cancellationRate}
      topProducts={topProducts}
      clientCount={clientCount}
      productCount={productCount}
    />
  )
}
