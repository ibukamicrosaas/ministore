'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Clock, AlertCircle, Zap } from 'lucide-react'

export default function AdminSubscriptionsPage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<any[]>([])
  const [shops, setShops] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'activated' | 'error'>('all')
  const [searchPhone, setSearchPhone] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Charger les transactions
      const { data: txnData } = await supabase
        .from('subscription_transactions' as never)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200) as any

      setTransactions(txnData ?? [])

      // Charger les boutiques pour mapper les shop_id
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
      console.error('Erreur chargement données:', err)
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

      // Recharger les données
      await loadData()
      alert('Plan activé avec succès!')
    } catch (err) {
      alert('Erreur: ' + (err instanceof Error ? err.message : 'Erreur inconnue'))
    } finally {
      setActivating(null)
    }
  }

  const filtered = transactions.filter((t: any) => {
    if (filter !== 'all' && t.status !== filter) return false
    if (searchPhone) {
      const shop = shops.get(t.shop_id)
      const phone = shop?.phone_whatsapp || ''
      return phone.includes(searchPhone.replace(/\D/g, ''))
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions d'abonnement</h1>
        <p className="text-sm text-gray-500 mt-1">{transactions.length} total · {transactions.filter((t: any) => t.status === 'pending').length} en attente · {transactions.filter((t: any) => t.status === 'activated').length} activées</p>
      </div>

      <div className="flex gap-3 flex-col sm:flex-row sm:items-end sm:justify-between">
        <input
          type="text"
          placeholder="Chercher par téléphone..."
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'activated', 'error'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Tous' : status === 'pending' ? 'En attente' : status === 'activated' ? 'Activées' : 'Erreurs'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Aucune transaction trouvée</div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Boutique</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Créé le</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Téléphone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((txn: any) => {
                const shop = shops.get(txn.shop_id)
                const prices: Record<string, string> = {
                  decouverte: '2 900 FCFA',
                  business: '4 900 FCFA',
                  pro: '9 900 FCFA',
                }

                return (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{shop?.name ?? 'Inconnue'}</p>
                      <p className="text-xs text-gray-400">{txn.charge_id.slice(0, 8)}...</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        txn.plan_key === 'pro' ? 'bg-purple-100 text-purple-700' :
                        txn.plan_key === 'business' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {txn.plan_key === 'decouverte' ? 'Découverte' : txn.plan_key === 'business' ? 'Business' : 'Pro'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{prices[txn.plan_key]}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {txn.status === 'activated' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {txn.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                        {txn.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                        <span className={`text-xs font-medium ${
                          txn.status === 'activated' ? 'text-green-600' :
                          txn.status === 'pending' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {txn.status === 'activated' ? 'Activée' : txn.status === 'pending' ? 'En attente' : 'Erreur'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                      {format(new Date(txn.created_at), 'd MMM yyyy HH:mm', { locale: fr })}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                      {shop?.phone_whatsapp ? (
                        <a href={`https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {shop.phone_whatsapp}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {txn.status === 'pending' && (
                        <button
                          onClick={() => activateManually(txn.id, txn.shop_id, txn.plan_key)}
                          disabled={activating === txn.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Zap className="h-3 w-3" />
                          {activating === txn.id ? 'Activation...' : 'Activer'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
