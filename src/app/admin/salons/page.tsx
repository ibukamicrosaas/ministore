import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { Settings, ExternalLink, MessageCircle } from 'lucide-react'

export const metadata = { title: 'Boutiques — Admin TekkiShop' }

export default async function AdminSalonsPage() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('shops')
    .select('id, name, slug, plan, trial_ends_at, city, country, is_active, created_at, phone_whatsapp')
    .order('created_at', { ascending: false })

  const shops = (data ?? []) as {
    id: string; name: string; slug: string; plan: string
    trial_ends_at: string | null; city: string | null; country: string
    is_active: boolean; created_at: string; phone_whatsapp: string | null
  }[]

  const trialExpired = shops.filter(s => s.plan === 'trial' && s.trial_ends_at && new Date(s.trial_ends_at) < new Date())
  const trialActive  = shops.filter(s => s.plan === 'trial' && (!s.trial_ends_at || new Date(s.trial_ends_at) >= new Date()))
  const paid         = shops.filter(s => s.plan !== 'trial')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boutiques</h1>
          <p className="text-sm text-gray-500 mt-1">{shops.length} inscrits · {paid.length} payants · {trialActive.length} en essai · {trialExpired.length} expirés</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Boutique</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Essai expire</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Inscrit le</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shops.map(s => {
              const trialExpiredRow = s.plan === 'trial' && s.trial_ends_at && new Date(s.trial_ends_at) < new Date()
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.city ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.plan === 'pro'     ? 'bg-blue-100 text-blue-700' :
                      s.plan === 'starter' ? 'bg-green-100 text-green-700' :
                      s.plan === 'multi'   ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{s.plan}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {s.plan === 'trial' && s.trial_ends_at ? (
                      <span className={trialExpiredRow ? 'text-red-500 font-medium text-xs' : 'text-gray-500 text-xs'}>
                        {trialExpiredRow ? '⛔ ' : ''}{format(new Date(s.trial_ends_at), 'd MMM yyyy', { locale: fr })}
                      </span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {s.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                    {format(new Date(s.created_at), 'd MMM yyyy', { locale: fr })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/salons/${s.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                        title="Gérer le plan"
                      >
                        <Settings className="h-3 w-3" />
                        Gérer
                      </Link>
                      <Link href={`/${s.slug}`} target="_blank" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100" title="Voir le mini site">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      {s.phone_whatsapp && (
                        <a
                          href={`https://wa.me/${s.phone_whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-gray-100"
                          title="Contacter sur WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
