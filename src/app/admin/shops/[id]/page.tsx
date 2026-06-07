import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { SalonPlanEditor } from './SalonPlanEditor'
import type { SalonAdminData } from './SalonPlanEditor'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export const metadata = { title: 'Modifier la boutique — Admin TekkiShop' }

export default async function AdminShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('shops')
    .select('id, name, slug, plan, trial_ends_at, is_active, phone_whatsapp, city, created_at')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  // Récupérer l'historique des paiements
  const { data: transactions } = await supabase
    .from('subscription_transactions' as never)
    .select('id, plan_key, charge_id, status, created_at, activated_at, error_message')
    .eq('shop_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <SalonPlanEditor salon={data as unknown as SalonAdminData} />

      {/* Historique des paiements */}
      {transactions && transactions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Historique des paiements d'abonnement</h2>

          <div className="space-y-3">
            {transactions.map((txn) => (
              <div key={txn.id} className="flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  {txn.status === 'activated' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  )}
                  {txn.status === 'pending' && (
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  )}
                  {txn.status === 'failed' && (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {txn.plan_key === 'decouverte' ? 'Découverte' : txn.plan_key === 'business' ? 'Business' : 'Pro'}
                      </p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        txn.status === 'activated' ? 'bg-green-100 text-green-700' :
                        txn.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {txn.status === 'activated' ? '✓ Activé' :
                         txn.status === 'pending' ? '⏳ En attente' :
                         '✗ Erreur'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(txn.created_at), 'd MMM yyyy HH:mm', { locale: fr })}
                    </p>
                    {txn.activated_at && (
                      <p className="text-xs text-green-600 mt-1">
                        Activé le {format(new Date(txn.activated_at), 'd MMM yyyy HH:mm', { locale: fr })}
                      </p>
                    )}
                    {txn.error_message && (
                      <p className="text-xs text-red-600 mt-1">Erreur: {txn.error_message}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs font-mono text-gray-400">{txn.charge_id?.slice(0, 8)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
