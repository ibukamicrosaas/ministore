import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Trophy,
  ExternalLink,
  Settings,
} from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Paiements — Admin TEKKIShop' }

type OrderPayment = {
  id: string
  order_id: string | null
  amount: number
  currency: string
  payment_method: string
  payment_type: string
  status: string
  created_at: string
  paid_at: string | null
  shops: { id: string; name: string; slug: string } | null
  orders: { id: string; clients: { first_name: string; phone: string } | null } | null
}

type SubTxn = {
  id: string
  shop_id: string
  plan_key: string
  charge_id: string
  status: string
  created_at: string
  activated_at: string | null
  error_message: string | null
  shops: {
    id: string
    name: string
    slug: string
    plan: string
    is_active: boolean
    phone_whatsapp: string | null
  } | null
}

const PLAN_PRICES: Record<string, number> = { decouverte: 2900, business: 4900, pro: 9900 }
const PLAN_LABELS: Record<string, string> = { decouverte: 'Découverte', business: 'Business', pro: 'Pro' }
const PLAN_COLORS: Record<string, string> = {
  decouverte: 'bg-emerald-100 text-emerald-700',
  business:   'bg-blue-100 text-blue-700',
  pro:        'bg-purple-100 text-purple-700',
}

type ShopRank = {
  shopId:   string
  shopName: string
  shopSlug: string
  total:    number
  count:    number
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'commandes' } = await searchParams
  const activeTab = ['abonnements', 'performances'].includes(tab) ? tab : 'commandes'
  const admin = createAdminClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [orderPaymentsRes, subTxnsRes, rankingRes] = await Promise.all([
    admin
      .from('payments')
      .select('id, order_id, amount, currency, payment_method, payment_type, status, created_at, paid_at, shops(id, name, slug), orders(id, clients(first_name, phone))')
      .order('created_at', { ascending: false })
      .limit(300) as any,

    (admin
      .from('subscription_transactions' as never)
      .select('id, shop_id, plan_key, charge_id, status, created_at, activated_at, error_message, shops(id, name, slug, plan, is_active, phone_whatsapp)')
      .order('created_at', { ascending: false })
      .limit(300)) as unknown as Promise<{ data: SubTxn[] | null; error: unknown }>,

    // Tous les paiements complétés (sans limite) pour le classement boutiques
    admin
      .from('payments')
      .select('amount, shops(id, name, slug)')
      .eq('status', 'completed') as any,
  ])

  const orderPayments = ((orderPaymentsRes.data ?? []) as OrderPayment[])
  const subTxns = ((subTxnsRes as unknown as { data: SubTxn[] | null }).data ?? [])

  // Classement boutiques par CA en ligne
  const rankingRaw = ((rankingRes.data ?? []) as { amount: number; shops: { id: string; name: string; slug: string } | null }[])
  const rankMap: Record<string, ShopRank> = {}
  for (const p of rankingRaw) {
    if (!p.shops) continue
    const sid = p.shops.id
    if (!rankMap[sid]) {
      rankMap[sid] = { shopId: sid, shopName: p.shops.name, shopSlug: p.shops.slug, total: 0, count: 0 }
    }
    rankMap[sid].total += p.amount ?? 0
    rankMap[sid].count += 1
  }
  const shopRanking: ShopRank[] = Object.values(rankMap).sort((a, b) => b.total - a.total)

  // Stats commandes
  const completedOrders = orderPayments.filter(p => p.status === 'completed')
  const pendingOrders   = orderPayments.filter(p => p.status === 'pending')
  const totalOrderRevenue = completedOrders.reduce((s, p) => s + p.amount, 0)
  const monthOrderRevenue = completedOrders
    .filter(p => p.created_at >= monthStart)
    .reduce((s, p) => s + p.amount, 0)

  // Stats abonnements
  const activatedSubs = subTxns.filter(t => t.status === 'activated')
  const pendingSubs   = subTxns.filter(t => t.status === 'pending')
  const errorSubs     = subTxns.filter(t => t.status === 'error')
  const totalSubRevenue = activatedSubs.reduce((s, t) => s + (PLAN_PRICES[t.plan_key] ?? 0), 0)
  const monthSubRevenue = activatedSubs
    .filter(t => t.created_at >= monthStart)
    .reduce((s, t) => s + (PLAN_PRICES[t.plan_key] ?? 0), 0)

  const notActivatedAfterPayment = subTxns.filter(
    t => t.status === 'activated' && t.shops && t.shops.plan === 'trial'
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Paiements</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Commandes clients et abonnements TEKKIShop</p>
        </div>
        <TrendingUp className="h-10 w-10 text-sky-400 opacity-20" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Revenus clients',
            value: `${totalOrderRevenue.toLocaleString('fr-FR')} F`,
            sub: `${monthOrderRevenue.toLocaleString('fr-FR')} F ce mois`,
            gradient: 'from-emerald-500 to-emerald-600',
          },
          {
            label: 'Commandes payées',
            value: completedOrders.length,
            sub: `${pendingOrders.length} en attente · ${orderPayments.length} total`,
            gradient: 'from-sky-500 to-sky-600',
          },
          {
            label: 'Revenus TEKKIShop',
            value: `${totalSubRevenue.toLocaleString('fr-FR')} F`,
            sub: `${monthSubRevenue.toLocaleString('fr-FR')} F ce mois`,
            gradient: 'from-violet-500 to-violet-600',
          },
          {
            label: 'Abonnements activés',
            value: activatedSubs.length,
            sub: `${pendingSubs.length} en attente${errorSubs.length > 0 ? ` · ${errorSubs.length} erreur(s)` : ''}`,
            gradient: pendingSubs.length > 0 ? 'from-amber-500 to-amber-600' : 'from-gray-500 to-gray-600',
          },
        ].map(stat => (
          <div
            key={stat.label}
            className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-4 text-white shadow-sm`}
          >
            <p className="text-xs font-medium opacity-90">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
            <p className="text-xs opacity-75 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Alerte mismatch */}
      {notActivatedAfterPayment.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 text-sm">
              {notActivatedAfterPayment.length} boutique(s) avec paiement réussi mais plan non activé
            </p>
            <div className="mt-2 space-y-1">
              {notActivatedAfterPayment.slice(0, 3).map(t => (
                <Link
                  key={t.id}
                  href={`/admin/shops/${t.shop_id}`}
                  className="block text-xs text-red-700 hover:underline"
                >
                  {t.shops?.name} — plan: {t.plan_key} · shop actuel: {t.shops?.plan}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Onglets ── */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <Link
          href="/admin/payments?tab=commandes"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'commandes'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          Paiements clients
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
            activeTab === 'commandes' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
          }`}>
            {completedOrders.length}
          </span>
        </Link>
        <Link
          href="/admin/payments?tab=abonnements"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'abonnements'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Abonnements
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
            activeTab === 'abonnements' ? 'bg-violet-100 text-violet-700' : 'bg-gray-200 text-gray-500'
          }`}>
            {activatedSubs.length}
          </span>
          {(pendingSubs.length > 0 || errorSubs.length > 0) && (
            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
          )}
        </Link>
        <Link
          href="/admin/payments?tab=performances"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'performances'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Trophy className="h-4 w-4" />
          Performances
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
            activeTab === 'performances' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'
          }`}>
            {shopRanking.length}
          </span>
        </Link>
      </div>

      {/* ── Section 1 : Paiements clients ── */}
      {activeTab === 'commandes' && <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <ShoppingBag className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Paiements clients</h2>
            <p className="text-xs text-gray-500">
              {orderPayments.length} paiements initiés · {completedOrders.length} confirmés
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Boutique', 'Client', 'Montant', 'Méthode', 'Statut', 'Date'].map((h, i) => (
                  <th
                    key={h}
                    className={`text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide${i === 5 ? ' hidden lg:table-cell' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orderPayments.slice(0, 100).map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5">
                    {p.shops ? (
                      <Link href={`/admin/shops/${p.shops.id}`} className="font-medium text-gray-900 hover:text-sky-600 transition-colors">
                        {p.shops.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-gray-800">{p.orders?.clients?.first_name ?? '—'}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{p.orders?.clients?.phone ?? ''}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="font-semibold text-gray-900">{p.amount.toLocaleString('fr-FR')} F</p>
                    {p.payment_type === 'deposit' && (
                      <p className="text-xs text-gray-400">Acompte</p>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                      {p.payment_method}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <PaymentStatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-3.5 text-xs text-gray-500 hidden lg:table-cell">
                    {format(new Date(p.created_at), 'd MMM HH:mm', { locale: fr })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orderPayments.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Aucun paiement client enregistré
          </div>
        )}

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          {orderPayments.length} paiements · 100 derniers affichés
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-5">
        <p className="font-semibold text-blue-900 text-sm mb-1">Statuts des paiements</p>
        <ul className="space-y-0.5 text-xs text-blue-700">
          <li>✅ Payé — webhook Bictorys reçu et confirmé</li>
          <li>⏳ En attente — paiement initié, webhook attendu</li>
          <li>❌ Échoué — erreur ou annulation côté client</li>
        </ul>
      </div>
      </>}

      {/* ── Section 3 : Performances boutiques ── */}
      {activeTab === 'performances' && (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Trophy className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Classement par CA en ligne</h2>
                  <p className="text-xs text-gray-500">
                    {shopRanking.length} boutique{shopRanking.length !== 1 ? 's' : ''} avec au moins un paiement confirmé · tous temps
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400">CA total cumulé</p>
                <p className="text-lg font-bold text-gray-900">
                  {shopRanking.reduce((s, r) => s + r.total, 0).toLocaleString('fr-FR')} F
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">#</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Boutique</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CA total</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Commandes payées</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Panier moyen</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shopRanking.map((shop, i) => {
                    const avg = shop.count > 0 ? Math.round(shop.total / shop.count) : 0
                    const isTop3 = i < 3
                    const medals = ['🥇', '🥈', '🥉']
                    return (
                      <tr key={shop.shopId} className={`hover:bg-gray-50 transition-colors ${isTop3 ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-6 py-3.5">
                          <span className={`text-base ${isTop3 ? '' : 'text-gray-400 font-mono text-sm'}`}>
                            {isTop3 ? medals[i] : `${i + 1}`}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-gray-900">{shop.shopName}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{shop.shopSlug}</p>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <p className={`font-bold ${isTop3 ? 'text-amber-700 text-base' : 'text-gray-900'}`}>
                            {shop.total.toLocaleString('fr-FR')} F
                          </p>
                        </td>
                        <td className="px-6 py-3.5 text-right hidden md:table-cell">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            {shop.count} commande{shop.count !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right hidden lg:table-cell">
                          <span className="text-sm text-gray-600 font-medium">
                            {avg.toLocaleString('fr-FR')} F
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/shops/${shop.shopId}`}
                              title="Gérer la boutique"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            >
                              <Settings className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/${shop.shopSlug}`}
                              target="_blank"
                              title="Voir la boutique"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {shopRanking.length === 0 && (
              <div className="px-6 py-16 text-center">
                <Trophy className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Aucun paiement en ligne confirmé pour le moment</p>
              </div>
            )}

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              Basé sur les paiements Bictorys/Stripe avec statut "complété" · toutes périodes confondues
            </div>
          </div>
        </div>
      )}

      {/* ── Section 2 : Abonnements TEKKIShop ── */}
      {activeTab === 'abonnements' && <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
            <CreditCard className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Abonnements TEKKIShop</h2>
            <p className="text-xs text-gray-500">
              {subTxns.length} transactions · {activatedSubs.length} activées
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Boutique', 'Plan', 'Montant', 'Statut transaction', 'Plan activé?', 'Date'].map((h, i) => (
                  <th
                    key={h}
                    className={`text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide${i === 5 ? ' hidden lg:table-cell' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subTxns.slice(0, 100).map(txn => {
                const isShopActive = txn.shops?.plan !== 'trial' && txn.shops?.is_active
                const mismatch = txn.status === 'activated' && !isShopActive

                return (
                  <tr
                    key={txn.id}
                    className={`hover:bg-gray-50 transition-colors${mismatch ? ' bg-red-50' : ''}`}
                  >
                    <td className="px-6 py-3.5">
                      {txn.shops ? (
                        <Link href={`/admin/shops/${txn.shop_id}`} className="font-medium text-gray-900 hover:text-sky-600 transition-colors">
                          {txn.shops.name}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{txn.shops?.phone_whatsapp ?? ''}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${PLAN_COLORS[txn.plan_key] ?? 'bg-gray-100 text-gray-600'}`}>
                        {PLAN_LABELS[txn.plan_key] ?? txn.plan_key}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-gray-900">
                        {(PLAN_PRICES[txn.plan_key] ?? 0).toLocaleString('fr-FR')} F
                      </p>
                    </td>
                    <td className="px-6 py-3.5">
                      <SubStatusBadge status={txn.status} />
                      {txn.error_message && (
                        <p className="text-xs text-red-600 mt-1 max-w-xs truncate">{txn.error_message}</p>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2.5 w-2.5 rounded-full ${isShopActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        <span className={`text-xs font-medium ${isShopActive ? 'text-emerald-700' : 'text-red-600'}`}>
                          {isShopActive ? 'Oui' : 'Non'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Plan: {txn.shops?.plan ?? '—'}</p>
                    </td>
                    <td className="px-6 py-3.5 hidden lg:table-cell">
                      <p className="text-xs text-gray-500">{format(new Date(txn.created_at), 'd MMM HH:mm', { locale: fr })}</p>
                      {txn.activated_at && (
                        <p className="text-xs text-emerald-600 mt-0.5">
                          Activé {format(new Date(txn.activated_at), 'd MMM HH:mm', { locale: fr })}
                        </p>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {subTxns.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Aucune transaction d'abonnement
          </div>
        )}

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          {subTxns.length} transactions · 100 dernières affichées
        </div>
      </div>

      {/* Légende abonnements */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-5">
        <p className="font-semibold text-blue-900 text-sm mb-1">Statuts des abonnements</p>
        <ul className="space-y-0.5 text-xs text-blue-700">
          <li>✅ Réussi — plan activé par le webhook Bictorys</li>
          <li>⏳ En attente — paiement initié, webhook non reçu</li>
          <li>🔴 Ligne rouge — paiement réussi mais plan non changé (anomalie)</li>
        </ul>
      </div>
      </>}
    </div>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Payé
      </div>
    )
  }
  if (status === 'pending') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
        <Clock className="h-3 w-3" />
        En attente
      </div>
    )
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700">
      <AlertCircle className="h-3 w-3" />
      Échoué
    </div>
  )
}

function SubStatusBadge({ status }: { status: string }) {
  if (status === 'activated') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Réussi
      </div>
    )
  }
  if (status === 'pending') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
        <Clock className="h-3 w-3" />
        En attente
      </div>
    )
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700">
      <AlertCircle className="h-3 w-3" />
      Erreur
    </div>
  )
}
