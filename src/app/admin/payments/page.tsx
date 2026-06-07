import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react'

export const metadata = { title: 'Paiements Bictorys — Admin TekkiShop' }

export default async function AdminPaymentsPage() {
  const admin = createAdminClient()

  // Récupérer toutes les transactions d'abonnement avec les shops
  // Note: payer_phone column will be added after migration is applied to Supabase
  let transactions = null
  let txnError = null

  // Try to fetch with payer_phone column (for after migration)
  const { data, error } = await admin
    .from('subscription_transactions' as never)
    .select(`
      id,
      shop_id,
      plan_key,
      charge_id,
      merchant_reference,
      status,
      created_at,
      verified_at,
      activated_at,
      error_message,
      shops(id, name, slug, plan, is_active, phone_whatsapp, created_at)
    `)
    .order('created_at', { ascending: false }) as any

  transactions = data
  txnError = error

  if (txnError) {
    console.error('[admin/payments] Error:', txnError)
    return (
      <div className="p-8">
        <p className="text-red-600">Erreur: {txnError.message}</p>
      </div>
    )
  }

  const txns = (transactions ?? []) as Array<{
    id: string
    shop_id: string
    plan_key: string
    charge_id: string
    merchant_reference: string
    status: 'pending' | 'activated' | 'error'
    payer_phone: string | null
    created_at: string
    verified_at: string | null
    activated_at: string | null
    error_message: string | null
    shops: {
      id: string
      name: string
      slug: string
      plan: string
      is_active: boolean
      phone_whatsapp: string | null
      created_at: string
    } | null
  }>

  // Statistiques
  const stats = {
    total: txns.length,
    pending: txns.filter(t => t.status === 'pending').length,
    activated: txns.filter(t => t.status === 'activated').length,
    error: txns.filter(t => t.status === 'error').length,
    activationRate: txns.length > 0 ? Math.round((txns.filter(t => t.status === 'activated').length / txns.length) * 100) : 0,
  }

  // Trouver les boutiques avec paiement réussi mais plan non activé
  const notActivatedAfterPayment = txns.filter(t => {
    return t.status === 'activated' && t.shops && t.shops.plan === 'trial'
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Paiements Bictorys</h1>
              <p className="text-gray-500 mt-2">Suivi des paiements d'abonnement et activations de plans</p>
            </div>
            <TrendingUp className="h-12 w-12 text-sky-400 opacity-20" />
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total', value: stats.total, icon: '📊', color: 'from-gray-500 to-gray-600' },
              { label: 'En attente', value: stats.pending, icon: '⏳', color: 'from-amber-500 to-amber-600' },
              { label: 'Activées', value: stats.activated, icon: '✅', color: 'from-emerald-500 to-emerald-600' },
              { label: 'Erreurs', value: stats.error, icon: '❌', color: 'from-red-500 to-red-600' },
              { label: 'Taux activation', value: `${stats.activationRate}%`, icon: '📈', color: 'from-blue-500 to-blue-600' },
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

        {/* ⚠️ Alerte: Boutiques activées mais plan non changé */}
        {notActivatedAfterPayment.length > 0 && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="font-bold text-red-900 mb-2">⚠️ {notActivatedAfterPayment.length} Boutique(s) avec paiement réussi mais plan non activé</h2>
                <p className="text-sm text-red-700 mb-4">
                  Ces boutiques ont payé et leur transaction est marquée comme activée, mais le plan en base est toujours 'trial'.
                  Cela peut indiquer un problème d'activation automatique.
                </p>
                <div className="space-y-2">
                  {notActivatedAfterPayment.slice(0, 5).map(t => (
                    <div key={t.id} className="text-sm bg-red-100 rounded p-2">
                      <p className="font-medium text-red-900">{t.shops?.name}</p>
                      <p className="text-xs text-red-700">
                        Plan: {t.plan_key} | Transaction: {t.status} | Shop plan: {t.shops?.plan}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tableau des paiements */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Boutique</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Plan</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Charge ID</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Statut Transaction</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700">Plan Activé?</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700 hidden lg:table-cell">Créé</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700 hidden lg:table-cell">Activé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {txns.map((txn) => {
                  const isActivated = txn.status === 'activated'
                  const isShopActive = txn.shops?.plan !== 'trial' && txn.shops?.is_active
                  const mismatch = isActivated && !isShopActive // Paiement réussi mais plan non activé

                  return (
                    <tr key={txn.id} className={`hover:bg-gray-50 transition-colors ${mismatch ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{txn.shops?.name ?? '—'}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">{txn.payer_phone ?? txn.shops?.phone_whatsapp ?? '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          txn.plan_key === 'pro' ? 'bg-purple-100 text-purple-700' :
                          txn.plan_key === 'business' ? 'bg-blue-100 text-blue-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {txn.plan_key}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">{txn.charge_id.slice(0, 12)}...</td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          txn.status === 'activated' ? 'bg-emerald-100 text-emerald-700' :
                          txn.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {txn.status === 'activated' ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : txn.status === 'pending' ? (
                            <Clock className="h-3.5 w-3.5" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5" />
                          )}
                          {txn.status === 'activated' ? 'Réussi' : txn.status === 'pending' ? 'En attente' : 'Erreur'}
                        </div>
                        {txn.error_message && (
                          <p className="text-xs text-red-600 mt-1">{txn.error_message}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${
                            isShopActive ? 'bg-emerald-500' : 'bg-red-500'
                          }`} />
                          <span className={`text-xs font-semibold ${
                            isShopActive ? 'text-emerald-700' : 'text-red-700'
                          }`}>
                            {isShopActive ? 'Oui ✓' : 'Non ✗'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Plan: {txn.shops?.plan}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs hidden lg:table-cell">
                        {format(new Date(txn.created_at), 'd MMM HH:mm', { locale: fr })}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs hidden lg:table-cell">
                        {txn.activated_at ? format(new Date(txn.activated_at), 'd MMM HH:mm', { locale: fr }) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {txns.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">Aucune transaction trouvée</p>
            </div>
          )}

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            {txns.length} transaction{txns.length !== 1 ? 's' : ''} au total
          </div>
        </div>

        {/* Légende */}
        <div className="mt-8 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3">ℹ️ Comprendre les colonnes</h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div>
                <strong>Statut Transaction</strong>
                <p className="mt-1 ml-4 text-xs">État du paiement dans le système TekkiShop :</p>
                <ul className="ml-4 mt-1 space-y-1 text-xs">
                  <li>🟡 <strong>En attente</strong>: Paiement créé mais webhook non reçu de Bictorys</li>
                  <li>✅ <strong>Réussi</strong>: Webhook reçu et plan activé avec succès</li>
                  <li>❌ <strong>Erreur</strong>: Le webhook a détecté un problème (montant mismatch, plan non activé, etc.)</li>
                </ul>
              </div>
              <div>
                <strong>Plan Activé</strong>
                <p className="mt-1 ml-4 text-xs">La boutique a-t-elle un plan payant (Pro/Business/Découverte) et est-elle active?</p>
              </div>
              <div>
                <strong>Mismatch (Ligne rouge)</strong>
                <p className="mt-1 ml-4 text-xs">La transaction est marquée Réussi (Statut) MAIS le plan de la boutique n'a pas changé. Cela indique un problème d'activation automatique.</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="font-semibold text-amber-900 mb-3">⚠️ En attente vs Réussi</h3>
            <p className="text-sm text-amber-800">
              Une transaction peut être "En attente" même si la boutique a un plan payant activé. Cela signifie que le webhook Bictorys n'a pas encore confirmé le paiement dans TekkiShop.
              Vérifiez le paiement directement dans Bictorys avec le "Charge ID" pour confirmer que l'argent a bien été collecté.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
