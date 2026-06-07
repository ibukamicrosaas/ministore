import { createAdminClient } from '@/lib/supabase/admin'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Building2, ShoppingBag, TrendingUp, Clock, AlertCircle, Zap, UserCheck, ArrowRight, Wallet } from 'lucide-react'
import Link from 'next/link'
import { APP_URL } from '@/constants'

export const metadata = { title: 'Admin — TekkiShop' }

const PLAN_PRICES: Record<string, number> = {
  decouverte: 2900,
  business:   4900,
  pro:        9900,
}

export default async function AdminOverviewPage() {
  const supabase = createAdminClient()
  const now = new Date()
  const monthStart     = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd       = format(endOfMonth(now), 'yyyy-MM-dd')
  const prevMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
  const prevMonthEnd   = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    shopsRes,
    ordersMonthRes,
    ordersPrevMonthRes,
    paymentsRes,
    trialEndingSoonRes,
    trialExpiredRes,
    pendingPayoutsRes,
    pendingSubscriptionsRes,
    recentShopsRes,
    activeShopsRes,
    shopsWithProductsRes,
  ] = await Promise.all([
    supabase.from('shops').select('id, plan, is_active'),
    supabase.from('orders').select('id', { count: 'exact' })
      .gte('created_at', monthStart).lte('created_at', monthEnd + 'T23:59:59'),
    supabase.from('orders').select('id', { count: 'exact' })
      .gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd + 'T23:59:59'),
    supabase.from('payments').select('amount, created_at').eq('status', 'completed'),
    supabase.from('shops').select('id, name, slug, trial_ends_at').eq('plan', 'trial').eq('is_active', true)
      .gte('trial_ends_at', now.toISOString())
      .lte('trial_ends_at', sevenDaysFromNow.toISOString()),
    supabase.from('shops').select('id, name, slug, trial_ends_at, phone_whatsapp').eq('plan', 'trial').eq('is_active', false),
    supabase.from('payouts').select('id, shop_id, net_amount, payout_method, payout_number, requested_at, shops(name)')
      .eq('status', 'pending').order('requested_at', { ascending: true }),
    supabase.from('subscription_transactions' as never)
      .select('id, shop_id, plan_key, created_at, shops(name)')
      .eq('status', 'pending')
      .limit(20) as unknown,
    supabase.from('shops').select('id, name, slug, plan, created_at, phone_whatsapp')
      .order('created_at', { ascending: false }).limit(8),
    supabase.from('orders').select('shop_id').gte('created_at', thirtyDaysAgo),
    supabase.from('products').select('shop_id').eq('is_active', true),
  ])

  const allShops = (shopsRes.data ?? []) as { id: string; plan: string; is_active: boolean }[]
  const totalShops   = allShops.length
  const activeShops  = allShops.filter(s => s.is_active).length
  const ordersThisMonth = ordersMonthRes.count ?? 0
  const ordersPrevMonth = ordersPrevMonthRes.count ?? 0
  const ordersGrowth = ordersPrevMonth > 0
    ? Math.round(((ordersThisMonth - ordersPrevMonth) / ordersPrevMonth) * 100)
    : null

  const payments = (paymentsRes.data ?? []) as { amount: number; created_at: string }[]
  const totalRevenue     = payments.reduce((s, p) => s + p.amount, 0)
  const revenueThisMonth = payments
    .filter(p => p.created_at >= monthStart && p.created_at <= monthEnd + 'T23:59:59')
    .reduce((s, p) => s + p.amount, 0)
  const tekkishopCommission = Math.floor(totalRevenue * 0.03)

  const mrr = allShops
    .filter(s => s.is_active && s.plan !== 'trial')
    .reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0)

  const planCounts = allShops.reduce<Record<string, number>>((acc, s) => {
    acc[s.plan] = (acc[s.plan] ?? 0) + 1
    return acc
  }, {})

  const convertedCount  = allShops.filter(s => s.plan !== 'trial').length
  const conversionRate  = totalShops > 0 ? Math.round((convertedCount / totalShops) * 100) : 0

  const activeShopIds   = new Set((activeShopsRes.data ?? []).map((o: { shop_id: string }) => o.shop_id))
  const activeShopsCount = activeShopIds.size

  const shopIdsWithProducts = new Set((shopsWithProductsRes.data ?? []).map((p: { shop_id: string }) => p.shop_id))
  const activationRate      = totalShops > 0 ? Math.round((shopIdsWithProducts.size / totalShops) * 100) : 0

  const pendingPayouts = (pendingPayoutsRes.data ?? []) as unknown as {
    id: string; shop_id: string; net_amount: number; payout_method: string
    payout_number: string; requested_at: string; shops: { name: string } | null
  }[]

  const pendingSubscriptions = (
    (pendingSubscriptionsRes as unknown as { data: Array<{ id: string; shop_id: string; plan_key: string; created_at: string; shops: { name: string } | null }> }).data ?? []
  )
  const pendingSubscriptionsTotal = pendingSubscriptions.reduce((sum, t) => {
    const prices: Record<string, number> = { decouverte: 2900, business: 4900, pro: 9900 }
    return sum + (prices[t.plan_key] || 0)
  }, 0)

  const pendingPayoutsTotal = pendingPayouts.reduce((sum, p) => sum + p.net_amount, 0)

  const recentShops = (recentShopsRes.data ?? []) as {
    id: string; name: string; slug: string; plan: string; created_at: string; phone_whatsapp: string | null
  }[]

  const trialExpired = (trialExpiredRes.data ?? []) as {
    id: string; name: string; slug: string; trial_ends_at: string | null; phone_whatsapp: string | null
  }[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Vue d&apos;ensemble</h1>
          <p className="text-gray-500 mt-2 capitalize">{format(now, 'EEEE d MMMM yyyy', { locale: fr })}</p>
        </div>

        {/* 🚨 Actions urgentes */}
        {(pendingSubscriptions.length > 0 || pendingPayouts.length > 0 || trialExpired.length > 0) && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-bold text-gray-900">Actions urgentes</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Paiements en attente */}
              {pendingSubscriptions.length > 0 && (
                <Link href="/admin/subscriptions?filter=pending"
                  className="group rounded-lg bg-white border border-red-200 p-4 hover:border-red-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                      <Zap className="h-3 w-3" />
                      {pendingSubscriptions.length}
                    </span>
                    <ArrowRight className="h-4 w-4 text-red-400 group-hover:text-red-600 transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Paiements en attente</p>
                  <p className="text-xs text-gray-500 mt-1">{pendingSubscriptionsTotal.toLocaleString('fr-FR')} FCFA</p>
                </Link>
              )}

              {/* Reversements en attente */}
              {pendingPayouts.length > 0 && (
                <Link href="/admin/payouts"
                  className="group rounded-lg bg-white border border-amber-200 p-4 hover:border-amber-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                      <TrendingUp className="h-3 w-3" />
                      {pendingPayouts.length}
                    </span>
                    <ArrowRight className="h-4 w-4 text-amber-400 group-hover:text-amber-600 transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Reversements en attente</p>
                  <p className="text-xs text-gray-500 mt-1">{pendingPayoutsTotal.toLocaleString('fr-FR')} FCFA</p>
                </Link>
              )}

              {/* Essais expirés */}
              {trialExpired.length > 0 && (
                <Link href="/admin/shops"
                  className="group rounded-lg bg-white border border-orange-200 p-4 hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                      <Clock className="h-3 w-3" />
                      {trialExpired.length}
                    </span>
                    <ArrowRight className="h-4 w-4 text-orange-400 group-hover:text-orange-600 transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Essais expirés</p>
                  <p className="text-xs text-gray-500 mt-1">À relancer ou activer</p>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* KPIs principaux */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
          <KPI icon={Building2}  label="Boutiques inscrites" value={totalShops}    sub={`${activeShops} actives`}             color="text-blue-600"   bg="bg-blue-50" />
          <KPI icon={TrendingUp} label="MRR"                 value={`${mrr.toLocaleString('fr-FR')} F`} sub="abonnements actifs" color="text-sky-600"  bg="bg-sky-50" />
          <KPI icon={ShoppingBag} label="Commandes ce mois"  value={ordersThisMonth} sub={ordersGrowth !== null ? `${ordersGrowth > 0 ? '+' : ''}${ordersGrowth}% vs mois dernier` : undefined} color="text-green-600" bg="bg-green-50" />
          <KPI icon={Wallet}      label="Commission TekkiShop" value={`${tekkishopCommission.toLocaleString('fr-FR')} F`} sub="cumulé" color="text-purple-600" bg="bg-purple-50" />
        </div>

        {/* Métriques SaaS */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
          <KPI icon={Zap}        label="Taux de conversion"  value={`${conversionRate}%`}   sub="trial → payant"                          color="text-green-600" bg="bg-green-50" />
          <KPI icon={UserCheck}  label="Taux d'activation"   value={`${activationRate}%`}   sub="boutiques avec ≥1 produit"               color="text-blue-600"  bg="bg-blue-50" />
          <KPI icon={ShoppingBag} label="Boutiques actives"  value={activeShopsCount}        sub="avec commandes dans 30j"                  color="text-indigo-600" bg="bg-indigo-50" />
          <KPI icon={TrendingUp} label="Revenus (mois)"      value={`${revenueThisMonth.toLocaleString('fr-FR')} F`} sub="paiements clients" color="text-sky-600" bg="bg-sky-50" />
        </div>

        {/* Plans + revenus */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wide">Répartition des plans</p>
            <div className="space-y-4">
              {[
                { key: 'trial',      label: 'Essai gratuit', price: '0 F/mois', color: 'bg-gray-100' },
                { key: 'decouverte', label: 'Découverte',    price: '2 900 F/mois', color: 'bg-emerald-100' },
                { key: 'business',   label: 'Business',      price: '4 900 F/mois', color: 'bg-blue-100' },
                { key: 'pro',        label: 'Pro',           price: '9 900 F/mois', color: 'bg-purple-100' },
              ].map(({ key, label, price, color }) => (
                <div key={key} className={`${color} rounded-lg p-3 flex items-center justify-between`}>
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">{label}</span>
                    <span className="text-xs text-gray-600 ml-2">{price}</span>
                  </div>
                  <span className="font-bold text-lg text-gray-900">{planCounts[key] ?? 0}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">MRR total</span>
                <span className="text-xl font-bold text-sky-600">{mrr.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wide">Revenus clients</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Cumulé</p>
                <p className="text-3xl font-bold text-gray-900">{totalRevenue.toLocaleString('fr-FR')} <span className="text-lg font-normal text-gray-400">FCFA</span></p>
              </div>
              <div className="bg-sky-50 rounded-lg p-3 border border-sky-100">
                <p className="text-xs text-gray-600 mb-1">Commission TekkiShop (3%)</p>
                <p className="text-lg font-bold text-sky-700">{tekkishopCommission.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500 mb-1">Ce mois-ci</p>
                <p className="text-xl font-bold text-gray-900">{revenueThisMonth.toLocaleString('fr-FR')} FCFA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Essais expirant bientôt */}
        {(trialEndingSoonRes.data ?? []).length > 0 && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-amber-600" />
              <p className="text-sm font-bold text-amber-900 uppercase tracking-wide">Essais expirant dans 7 jours ({trialEndingSoonRes.data!.length})</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(trialEndingSoonRes.data ?? []).map((s) => (
                <div key={s.id} className="bg-white rounded-lg p-3 border border-amber-100 flex items-center justify-between">
                  <Link href={`/admin/shops/${s.id}`} className="text-sm font-medium text-amber-900 hover:text-amber-700">{s.name}</Link>
                  <span className="text-xs text-amber-700 font-semibold">
                    {format(new Date(s.trial_ends_at!), 'd MMM', { locale: fr })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Essais expirés non convertis */}
        {trialExpired.length > 0 && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-bold text-red-900 uppercase tracking-wide">Essais expirés ({trialExpired.length})</p>
            </div>
            <div className="space-y-2">
              {trialExpired.slice(0, 5).map(s => (
                <div key={s.id} className="bg-white rounded-lg p-3 border border-red-100 flex items-center justify-between">
                  <Link href={`/admin/shops/${s.id}`} className="text-sm font-medium text-red-900 hover:text-red-700">{s.name}</Link>
                  <div className="flex items-center gap-2">
                    {s.phone_whatsapp && (
                      <a href={`https://wa.me/${s.phone_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ! Votre essai TekkiShop a expiré. Prêt à continuer ? ${APP_URL}/dashboard/upgrade`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs bg-[#25D366] text-white rounded px-2 py-1 font-medium hover:opacity-90"
                      >
                        Relancer
                      </a>
                    )}
                    <Link href={`/admin/shops/${s.id}`} className="text-xs bg-red-600 text-white rounded px-2 py-1 font-medium hover:bg-red-700">
                      Activer
                    </Link>
                  </div>
                </div>
              ))}
              {trialExpired.length > 5 && (
                <Link href="/admin/shops" className="text-xs text-red-600 font-medium hover:underline block mt-2">
                  Voir les {trialExpired.length - 5} autres →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Dernières boutiques inscrites */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Derniers inscrits</p>
            <Link href="/admin/shops" className="text-xs text-sky-600 font-medium hover:underline">Voir tous →</Link>
          </div>
          <div className="space-y-2">
            {recentShops.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <Link href={`/admin/shops/${s.id}`} className="text-sm font-medium text-gray-900 hover:text-sky-600">{s.name}</Link>
                  <p className="text-xs text-gray-400">{s.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                    s.plan === 'pro'        ? 'bg-purple-100 text-purple-700' :
                    s.plan === 'business'   ? 'bg-blue-100 text-blue-700' :
                    s.plan === 'decouverte' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{
                    s.plan === 'trial'      ? 'Essai' :
                    s.plan === 'decouverte' ? 'Découverte' :
                    s.plan === 'business'   ? 'Business' :
                    s.plan === 'pro'        ? 'Pro' :
                    s.plan
                  }</span>
                  <p className="text-xs text-gray-400">{format(new Date(s.created_at), 'd MMM', { locale: fr })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function KPI({ icon: Icon, label, value, sub, color, bg }: {
  icon: React.ElementType; label: string; value: string | number
  sub?: string; color: string; bg: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${bg} mb-3`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
