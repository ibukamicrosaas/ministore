import { createAdminClient } from '@/lib/supabase/admin'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Users, Building2, ShoppingBag, TrendingUp, Clock, AlertCircle, Zap, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { APP_URL } from '@/constants'

export const metadata = { title: 'Admin — TekkiShop' }

const PLAN_PRICES: Record<string, number> = {
  starter: 5000,
  pro: 10000,
  multi: 20000,
}

export default async function AdminOverviewPage() {
  const supabase = createAdminClient()
  const now = new Date()
  const monthStart     = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd       = format(endOfMonth(now), 'yyyy-MM-dd')
  const prevMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
  const prevMonthEnd   = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
  const thirtyDaysAgo  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    shopsRes,
    usersRes,
    ordersMonthRes,
    ordersPrevMonthRes,
    paymentsRes,
    trialEndingSoonRes,
    trialExpiredRes,
    pendingPayoutsRes,
    recentShopsRes,
    activeShopsRes,
    shopsWithProductsRes,
  ] = await Promise.all([
    supabase.from('shops').select('id, plan, is_active'),
    supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'owner'),
    supabase.from('orders').select('id', { count: 'exact' })
      .gte('created_at', monthStart).lte('created_at', monthEnd + 'T23:59:59'),
    supabase.from('orders').select('id', { count: 'exact' })
      .gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd + 'T23:59:59'),
    supabase.from('payments').select('amount, created_at').eq('status', 'completed'),
    supabase.from('shops').select('id, name, slug, trial_ends_at').eq('plan', 'trial').eq('is_active', true)
      .gte('trial_ends_at', now.toISOString())
      .lte('trial_ends_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('shops').select('id, name, slug, trial_ends_at, phone_whatsapp').eq('plan', 'trial').eq('is_active', false),
    supabase.from('payouts').select('id, shop_id, net_amount, payout_method, payout_number, requested_at, shops(name)')
      .eq('status', 'pending').order('requested_at', { ascending: true }),
    supabase.from('shops').select('id, name, slug, plan, created_at, phone_whatsapp')
      .order('created_at', { ascending: false }).limit(8),
    supabase.from('orders').select('shop_id').gte('created_at', thirtyDaysAgo),
    supabase.from('products').select('shop_id').eq('is_active', true),
  ])

  const allShops = (shopsRes.data ?? []) as { id: string; plan: string; is_active: boolean }[]
  const totalShops   = allShops.length
  const activeShops  = allShops.filter(s => s.is_active).length
  const totalOwners  = usersRes.count ?? 0
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

  const recentShops = (recentShopsRes.data ?? []) as {
    id: string; name: string; slug: string; plan: string; created_at: string; phone_whatsapp: string | null
  }[]

  const trialExpired = (trialExpiredRes.data ?? []) as {
    id: string; name: string; slug: string; trial_ends_at: string | null; phone_whatsapp: string | null
  }[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1>
        <p className="text-sm text-gray-500 mt-1 capitalize">{format(now, 'EEEE d MMMM yyyy', { locale: fr })}</p>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPI icon={Building2}  label="Boutiques inscrites" value={totalShops}    sub={`${activeShops} actives`}             color="text-blue-600"   bg="bg-blue-50" />
        <KPI icon={TrendingUp} label="MRR"                 value={`${mrr.toLocaleString('fr-FR')} F`} sub="abonnements actifs" color="text-sky-600"  bg="bg-sky-50" />
        <KPI icon={ShoppingBag} label="Commandes ce mois"  value={ordersThisMonth} sub={ordersGrowth !== null ? `${ordersGrowth > 0 ? '+' : ''}${ordersGrowth}% vs mois dernier` : undefined} color="text-green-600" bg="bg-green-50" />
        <KPI icon={Users}      label="Commission TekkiShop" value={`${tekkishopCommission.toLocaleString('fr-FR')} F`} sub="cumulé" color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Métriques SaaS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPI icon={Zap}        label="Taux de conversion"  value={`${conversionRate}%`}   sub="trial → payant"                          color="text-green-600" bg="bg-green-50" />
        <KPI icon={UserCheck}  label="Taux d'activation"   value={`${activationRate}%`}   sub="boutiques avec ≥1 produit"               color="text-blue-600"  bg="bg-blue-50" />
        <KPI icon={ShoppingBag} label="Boutiques actives"  value={activeShopsCount}        sub="avec commandes dans 30j"                  color="text-indigo-600" bg="bg-indigo-50" />
        <KPI icon={TrendingUp} label="Revenus (mois)"      value={`${revenueThisMonth.toLocaleString('fr-FR')} F`} sub="paiements clients" color="text-sky-600" bg="bg-sky-50" />
      </div>

      {/* Plans + revenus */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Répartition des plans</p>
          <div className="space-y-3">
            {[
              { key: 'trial',   label: 'Essai gratuit', price: '0 F/mois' },
              { key: 'starter', label: 'Starter',       price: '5 000 F/mois' },
              { key: 'pro',     label: 'Pro',           price: '10 000 F/mois' },
              { key: 'multi',   label: 'Multi-boutique', price: '20 000 F/mois' },
            ].map(({ key, label, price }) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{label}</span>
                  <span className="text-xs text-gray-400 ml-2">{price}</span>
                </div>
                <span className="font-bold text-gray-900">{planCounts[key] ?? 0}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-semibold">
              <span className="text-gray-700">MRR total</span>
              <span className="text-[var(--color-primary)]">{mrr.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Revenus clients (cumul)</p>
          <p className="text-3xl font-bold text-gray-900">{totalRevenue.toLocaleString('fr-FR')} <span className="text-base font-normal text-gray-400">FCFA</span></p>
          <p className="text-xs text-gray-500 mt-1">Commission TekkiShop (3%) : <strong>{tekkishopCommission.toLocaleString('fr-FR')} FCFA</strong></p>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Ce mois-ci</p>
            <p className="text-lg font-bold text-gray-900">{revenueThisMonth.toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>
      </div>

      {/* Essais expirés non convertis */}
      {trialExpired.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm font-semibold text-red-800">Essais expirés — à relancer ({trialExpired.length})</p>
          </div>
          <div className="space-y-2">
            {trialExpired.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <Link href={`/admin/shops/${s.id}`} className="text-sm font-medium text-red-800 hover:underline">{s.name}</Link>
                  {s.trial_ends_at && (
                    <p className="text-xs text-red-400">Expiré le {format(new Date(s.trial_ends_at), 'd MMM', { locale: fr })}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {s.phone_whatsapp && (
                    <a
                      href={`https://wa.me/${s.phone_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${s.name} ! Votre essai TekkiShop est terminé. Souhaitez-vous continuer ? ${APP_URL}/dashboard/upgrade`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-[#25D366] text-white rounded-lg px-2.5 py-1 font-medium"
                    >
                      Relancer
                    </a>
                  )}
                  <Link href={`/admin/shops/${s.id}`} className="text-xs bg-white border border-red-200 text-red-700 rounded-lg px-2.5 py-1 font-medium hover:bg-red-50">
                    Activer
                  </Link>
                </div>
              </div>
            ))}
            {trialExpired.length > 5 && (
              <Link href="/admin/shops" className="text-xs text-red-500 hover:underline">Voir tous →</Link>
            )}
          </div>
        </div>
      )}

      {/* Essais expirant bientôt */}
      {(trialEndingSoonRes.data ?? []).length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">Essais expirant dans 7 jours ({trialEndingSoonRes.data!.length})</p>
          </div>
          <div className="space-y-2">
            {(trialEndingSoonRes.data ?? []).map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <Link href={`/admin/shops/${s.id}`} className="text-sm text-amber-800 hover:underline">{s.name}</Link>
                <span className="text-xs text-amber-600 font-medium">
                  {format(new Date(s.trial_ends_at!), 'd MMM', { locale: fr })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reversements en attente */}
      {pendingPayouts.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Reversements en attente ({pendingPayouts.length})</p>
            <Link href="/admin/payouts" className="text-xs text-[var(--color-primary)] hover:underline">Gérer →</Link>
          </div>
          <div className="space-y-3">
            {pendingPayouts.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.shops?.name ?? '—'}</p>
                  <p className="text-xs text-gray-500">{p.payout_method === 'wave' ? 'Wave' : 'Orange Money'} · {p.payout_number}</p>
                </div>
                <p className="text-base font-bold text-gray-900">{p.net_amount.toLocaleString('fr-FR')} F</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dernières boutiques inscrites */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-900">Derniers inscrits</p>
          <Link href="/admin/shops" className="text-xs text-[var(--color-primary)] hover:underline">Voir tous →</Link>
        </div>
        <div className="space-y-2">
          {recentShops.map(s => (
            <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <div>
                <Link href={`/admin/shops/${s.id}`} className="text-sm font-medium text-gray-900 hover:text-sky-600">{s.name}</Link>
                <p className="text-xs text-gray-400">{s.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  s.plan === 'pro'     ? 'bg-blue-100 text-blue-700' :
                  s.plan === 'starter' ? 'bg-green-100 text-green-700' :
                  s.plan === 'multi'   ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{s.plan}</span>
                <p className="text-xs text-gray-400">{format(new Date(s.created_at), 'd MMM', { locale: fr })}</p>
              </div>
            </div>
          ))}
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
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg} mb-3`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
