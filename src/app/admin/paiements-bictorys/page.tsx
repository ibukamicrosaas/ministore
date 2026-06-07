import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { PaymentSearchClient } from './PaymentSearchClient'

export const metadata = { title: 'Paiements Bictorys — Admin TekkiShop' }

export default async function PaymentsBictorysPage({
  searchParams,
}: {
  searchParams: { phone?: string }
}) {
  const supabase = createAdminClient()

  type Transaction = {
    id: string
    shop_id: string
    plan_key: string
    charge_id: string
    status: string
    created_at: string
    activated_at: string | null
    verified_at: string | null
    error_message: string | null
    shop?: { id: string; name: string; phone_whatsapp: string | null }
  }

  let transactions: Transaction[] = []

  // Si on a un phone, chercher les paiements associés à ce phone
  if (searchParams.phone) {
    const phone = searchParams.phone.replace(/\D/g, '').slice(-9) // Garder les 9 derniers chiffres pour flexibilité

    // Chercher les boutiques avec ce phone
    const { data: shops } = await supabase
      .from('shops')
      .select('id, name, phone_whatsapp')
      .filter('phone_whatsapp', 'ilike', `%${phone}%`)

    const shopIds = shops?.map(s => s.id) ?? []

    // Si on a des boutiques, chercher les transactions associées
    if (shopIds.length > 0) {
      const { data: txns } = await supabase
        .from('subscription_transactions' as never)
        .select('id, shop_id, plan_key, charge_id, status, created_at, activated_at, verified_at, error_message')
        .in('shop_id', shopIds)
        .order('created_at', { ascending: false })

      // Enrichir avec les infos boutique
      transactions = (txns ?? []).map(txn => ({
        ...txn,
        shop: shops?.find(s => s.id === txn.shop_id),
      })) as Transaction[]
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paiements Bictorys</h1>
        <p className="text-sm text-gray-500 mt-1">Retrouver les paiements et activer manuellement les plans</p>
      </div>

      <PaymentSearchClient />

      {searchParams.phone && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-700">
            Résultats pour: <strong>{searchParams.phone}</strong>
            {transactions.length > 0 && ` — ${transactions.length} transaction(s) trouvée(s)`}
          </p>
        </div>
      )}

      {transactions.length === 0 && searchParams.phone ? (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-sm text-yellow-800">Aucune transaction trouvée pour ce numéro.</p>
        </div>
      ) : transactions.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Boutique</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Charge ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map(txn => (
                <tr key={txn.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{txn.shop?.name || 'Boutique inconnue'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                      {txn.plan_key === 'decouverte' ? 'Découverte' : txn.plan_key === 'business' ? 'Business' : 'Pro'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-mono bg-gray-50 px-2 py-1 rounded">{txn.charge_id?.slice(0, 12)}...</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {txn.status === 'activated' && (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-medium text-green-700">Activé</span>
                        </>
                      )}
                      {txn.status === 'pending' && (
                        <>
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span className="text-xs font-medium text-yellow-700">En attente</span>
                        </>
                      )}
                      {txn.status === 'failed' && (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-xs font-medium text-red-700">Erreur</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                    {format(new Date(txn.created_at), 'd MMM yyyy HH:mm', { locale: fr })}
                  </td>
                  <td className="px-4 py-3">
                    {txn.shop ? (
                      <Link
                        href={`/admin/shops/${txn.shop.id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                      >
                        Gérer boutique
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
