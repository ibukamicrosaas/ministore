import { createAdminClient } from '@/lib/supabase/admin'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MarkPayoutDoneButton } from './MarkPayoutDoneButton'
import { CMPayoutRow } from './CMPayoutRow'
import { AdminManualPayoutSection } from './AdminManualPayoutSection'
import { PAYOUT_METHODS_BY_COUNTRY } from '@/lib/utils/country-groups'

export const metadata = { title: 'Reversements — Admin TekkiShop' }

const BICTORYS_METHODS = new Set(['wave', 'orange_money'])

const ALL_METHOD_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(PAYOUT_METHODS_BY_COUNTRY)
    .flat()
    .map(m => [m.key, m.label])
)

function methodLabel(key: string): string {
  return ALL_METHOD_LABELS[key] ?? key.toUpperCase()
}

export default async function AdminPayoutsPage() {
  const supabase = createAdminClient()

  // Reversements marchands
  const { data } = await supabase
    .from('payouts')
    .select('*, shops(name, slug)')
    .order('requested_at', { ascending: true })

  // Reversements Country Managers (en attente uniquement)
  const { data: cmPayoutsData } = await (supabase
    .from('country_manager_payouts' as never)
    .select('id, country_manager_id, country, amount, provider, mobile_money_number, status, requested_at')
    .eq('status' as never, 'pending')
    .order('requested_at' as never, { ascending: true }) as unknown as Promise<{
      data: {
        id: string
        country_manager_id: string
        country: string
        amount: number
        provider: string
        mobile_money_number: string
        status: string
        requested_at: string
      }[] | null
    }>)

  // Récupérer les noms des CMs
  const cmIds = [...new Set((cmPayoutsData ?? []).map(p => p.country_manager_id))]
  const cmNames: Record<string, string> = {}
  if (cmIds.length > 0) {
    const { data: cms } = await (supabase
      .from('country_managers' as never)
      .select('id, name')
      .in('id' as never, cmIds) as unknown as Promise<{ data: { id: string; name: string }[] | null }>)
    for (const cm of cms ?? []) cmNames[cm.id] = cm.name
  }

  const cmPayouts = (cmPayoutsData ?? []).map(p => ({
    ...p,
    cmName: cmNames[p.country_manager_id] ?? 'Country Manager',
  }))

  const payouts = (data ?? []) as unknown as {
    id: string
    gross_amount: number
    commission_amount: number
    net_amount: number
    payout_method: string
    payout_number: string
    status: string
    notes: string | null
    requested_at: string
    completed_at: string | null
    shops: { name: string; slug: string } | null
  }[]

  const pending = payouts.filter(p => p.status === 'pending')
  const done    = payouts.filter(p => p.status === 'completed')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reversements</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pending.length + cmPayouts.length} en attente · {done.length} effectués
        </p>
      </div>

      {/* ── Reversement manuel pour un marchand ── */}
      <AdminManualPayoutSection />

      {/* ── Reversements Country Managers ── */}
      {cmPayouts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Country Managers — À traiter</h2>
          {cmPayouts.map(p => (
            <CMPayoutRow
              key={p.id}
              payoutId={p.id}
              cmName={p.cmName}
              country={p.country}
              amount={p.amount}
              provider={p.provider}
              mobileNumber={p.mobile_money_number}
              requestedAt={p.requested_at}
            />
          ))}
        </div>
      )}

      {/* En attente marchands */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">À traiter</h2>
          {pending.map(p => {
            const isManual = !BICTORYS_METHODS.has(p.payout_method)
            return (
              <div
                key={p.id}
                className={`rounded-xl border p-4 flex items-start gap-4 ${
                  isManual
                    ? 'border-orange-200 bg-orange-50'
                    : 'border-amber-200 bg-amber-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{p.shops?.name ?? '—'}</p>
                    {isManual && (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 uppercase tracking-wide">
                        Manuel
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {methodLabel(p.payout_method)} · <span className="font-mono">{p.payout_number}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Demandé le {format(new Date(p.requested_at), 'd MMM yyyy à HH:mm', { locale: fr })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Brut : {p.gross_amount.toLocaleString('fr-FR')} · Commission : {p.commission_amount.toLocaleString('fr-FR')}
                  </p>
                  {p.notes && (
                    <p className="mt-1.5 text-[11px] text-orange-700 font-medium">{p.notes}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-gray-900">{p.net_amount.toLocaleString('fr-FR')}</p>
                  <MarkPayoutDoneButton payoutId={p.id} isManual={isManual} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pending.length === 0 && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 py-10 text-center">
          <p className="text-sm text-gray-400">Aucun reversement en attente.</p>
        </div>
      )}

      {/* Historique */}
      {done.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Historique</h2>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Boutique</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Méthode</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Montant net</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {done.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.shops?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {methodLabel(p.payout_method)} · {p.payout_number}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {p.net_amount.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                      {p.completed_at ? format(new Date(p.completed_at), 'd MMM yyyy', { locale: fr }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
