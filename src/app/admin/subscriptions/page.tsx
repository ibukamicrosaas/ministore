'use client'

import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Clock, AlertCircle, Zap, Search, TrendingUp } from 'lucide-react'

export default function AdminSubscriptionsPage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<any[]>([])
  const [shops, setShops] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'activated' | 'error'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: txnData } = await supabase
        .from('subscription_transactions' as never)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200) as any

      setTransactions(txnData ?? [])

      const shopIds = [...new Set((txnData ?? []).map((t: any) => t.shop_id))] as string[]
      if (shopIds.length > 0) {
        const { data: shopData } = await supabase
          .from('shops')
          .select('id, name, phone_whatsapp, is_active, plan, slug')
          .in('id', shopIds) as any

        const shopMap = new Map((shopData?.map((s: any) => [s.id, s]) ?? []) as [string, any][])
        setShops(shopMap)
      }
    } catch (err) {
      console.error('Erreur chargement:', err)
    } finally {
      setLoading(false)
    }
  }

  async function activateManually(txnId: string, shopId: string, planKey: string) {
    setActivating(txnId)
    try {
      const response = await fetch('/api/admin/activate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txnId, shopId, planKey }),
      })

      if (!response.ok) {
        const err = await response.json()
        alert('Erreur: ' + (err.error || 'Activation échouée'))
        return
      }

      await loadData()
      alert('✅ Plan activé avec succès!')
    } catch (err) {
      alert('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'))
    } finally {
      setActivating(null)
    }
  }

  const normalizePhone = (phone: string) => phone.replace(/\D/g, '')

  const filtered = useMemo(() => {
    return transactions.filter((t: any) => {
      // Pour le filtre 'pending', montrer aussi les paiements 'activated' récents (dernières 24h)
      // car ce sont ceux qui viennent d'être traités avec succès
      if (filter === 'pending') {
        const isPending = t.status === 'pending'
        const isRecentlyActivated = t.status === 'activated' &&
          new Date(t.verified_at || t.activated_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
        if (!isPending && !isRecentlyActivated) return false
      } else if (filter !== 'all' && t.status !== filter) {
        return false
      }

      if (searchQuery) {
        const shop = shops.get(t.shop_id)
        const shopPhone = normalizePhone(shop?.phone_whatsapp || '')
        const searchNormalized = normalizePhone(searchQuery)
        return (
          (shop?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          shopPhone.includes(searchNormalized) ||
          searchNormalized.includes(shopPhone)
        )
      }
      return true
    })
  }, [transactions, filter, searchQuery, shops])

  const stats = {
    total: transactions.length,
    pending: transactions.filter((t: any) => t.status === 'pending').length,
    activated: transactions.filter((t: any) => t.status === 'activated').length,
    revenue: transactions
      .filter((t: any) => t.status === 'activated')
      .reduce((sum: number, t: any) => {
        const prices: Record<string, number> = { discovery: 2900, business: 4900, pro: 9900 }
        return sum + (prices[t.plan_key] || 0)
      }, 0),
  }

  const prices: Record<string, { label: string; amount: number; color: string }> = {
    discovery: { label: 'Découverte', amount: 2900, color: 'emerald' },
    business: { label: 'Business', amount: 4900, color: 'blue' },
    pro: { label: 'Pro', amount: 9900, color: 'purple' },
  }

  const statusConfig = {
    activated: { icon: CheckCircle2, label: 'Activée', badge: 'bg-emerald-100 text-emerald-700' },
    pending: { icon: Clock, label: 'En attente', badge: 'bg-amber-100 text-amber-700' },
    error: { icon: AlertCircle, label: 'Erreur', badge: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Transactions d'abonnement</h1>
              <p className="text-gray-500 mt-2">Suivi des paiements et activations de plans</p>
            </div>
            <TrendingUp className="h-12 w-12 text-sky-400 opacity-20" />
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: stats.total, icon: '📊', color: 'from-gray-500 to-gray-600' },
              { label: 'En attente', value: stats.pending, icon: '⏳', color: 'from-amber-500 to-amber-600' },
              { label: 'Activées', value: stats.activated, icon: '✅', color: 'from-emerald-500 to-emerald-600' },
              { label: 'Revenus', value: `${(stats.revenue / 1000).toFixed(0)}k FCFA`, icon: '💰', color: 'from-blue-500 to-blue-600' },
            ].map((stat) => (
              <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-lg p-4 text-white shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <span className="text-3xl opacity-30">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recherche et filtres ── */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Chercher par nom ou téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status filters */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'activated', 'error'] as const).map((status) => {
              const count =
                status === 'all' ? stats.total :
                status === 'pending' ? stats.pending :
                status === 'activated' ? stats.activated :
                transactions.filter((t: any) => t.status === 'error').length
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    filter === status
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>
                    {status === 'all' ? '📋' : status === 'pending' ? '⏳' : status === 'activated' ? '✅' : '⚠️'}
                  </span>
                  {status === 'all' ? 'Tous' : statusConfig[status as keyof typeof statusConfig]?.label}
                  <span className="text-xs opacity-70">({count})</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Tableau ── */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Aucune transaction trouvée</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Boutique</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Plan</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700 hidden sm:table-cell">Montant</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Statut</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700 hidden md:table-cell">Créé</th>
                    <th className="text-right px-6 py-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((txn: any) => {
                    const shop = shops.get(txn.shop_id)
                    const priceInfo = prices[txn.plan_key]
                    const status = statusConfig[txn.status as keyof typeof statusConfig]
                    const StatusIcon = status.icon

                    return (
                      <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{shop?.name ?? 'Inconnue'}</p>
                          <p className="text-xs text-gray-500 mt-1 font-mono">{txn.charge_id.slice(0, 12)}...</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-${priceInfo.color}-100 text-${priceInfo.color}-700`}>
                            {priceInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <span className="font-mono font-semibold text-gray-900">{priceInfo.amount.toLocaleString('fr-FR')} F</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${status.badge}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs hidden md:table-cell">
                          {format(new Date(txn.created_at), 'd MMM HH:mm', { locale: fr })}
                        </td>
                        <td className="px-6 py-4">
                          {txn.status === 'pending' ? (
                            <button
                              onClick={() => activateManually(txn.id, txn.shop_id, txn.plan_key)}
                              disabled={activating === txn.id}
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
                            >
                              <Zap className="h-3.5 w-3.5" />
                              {activating === txn.id ? 'Activation...' : 'Activer'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
              {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
