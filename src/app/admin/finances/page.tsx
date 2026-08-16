import { createAdminClient } from '@/lib/supabase/admin'
import { CM_PLAN_PRICES } from '@/lib/country-manager-config'
import { getCommissionRate } from '@/lib/billing/commission'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AdminWithdrawSection } from './AdminWithdrawSection'

export const metadata = { title: 'Finances — Admin TEKKIShop' }
export const revalidate = 0

type Period = 'today' | '7d' | '30d' | '3m' | '6m' | '1y'

const PERIOD_LABELS: Record<Period, string> = {
  today: "Aujourd'hui",
  '7d':  '7 jours',
  '30d': '30 jours',
  '3m':  '3 mois',
  '6m':  '6 mois',
  '1y':  '12 mois',
}

function getPeriodStart(period: Period): string {
  const now = new Date()
  switch (period) {
    case 'today': {
      const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString()
    }
    case '7d':  return new Date(now.getTime() - 7   * 86400000).toISOString()
    case '30d': return new Date(now.getTime() - 30  * 86400000).toISOString()
    case '3m':  return new Date(now.getTime() - 91  * 86400000).toISOString()
    case '6m':  return new Date(now.getTime() - 182 * 86400000).toISOString()
    case '1y':  return new Date(now.getTime() - 365 * 86400000).toISOString()
  }
}

function fmt(n: number) { return n.toLocaleString('fr-FR') }

function StatCard({ label, value, sub, color = 'text-gray-900' }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

const METHOD_LABELS: Record<string, string> = {
  wave: 'Wave', orange_money: 'Orange Money', mtn: 'MTN', moov: 'Moov',
  tmoney: 'T-Money', flooz: 'Flooz', mobicash: 'Mobicash', maxit: 'Maxit',
  airtel: 'Airtel', mvola: 'MVola',
}

export default async function AdminFinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: periodParam } = await searchParams
  const period: Period = (Object.keys(PERIOD_LABELS).includes(periodParam ?? '') ? periodParam : '30d') as Period
  const periodStart = getPeriodStart(period)

  const admin = createAdminClient()

  const [
    { data: subTxns },
    { data: subTxnsAll },
    { data: payments },
    { data: paymentsAll },
    { data: payoutsCompleted },
    { data: payoutsPending },
    adminWithdrawalsResult,
  ] = await Promise.all([
    // Abonnements sur la période
    (admin
      .from('subscription_transactions' as never)
      .select('plan_key, activated_at')
      .eq('status' as never, 'activated')
      .gte('activated_at' as never, periodStart) as unknown as Promise<{
        data: { plan_key: string; activated_at: string }[] | null
      }>),

    // Abonnements all-time
    (admin
      .from('subscription_transactions' as never)
      .select('plan_key')
      .eq('status' as never, 'activated') as unknown as Promise<{
        data: { plan_key: string }[] | null
      }>),

    // Paiements marchands sur la période — jointure shops pour calculer la
    // commission réelle par pays/clés propres, pas un taux plat global
    // (voir lib/billing/commission.ts).
    admin
      .from('payments')
      .select('amount, created_at, shops!inner(country, bictorys_secret_key)')
      .eq('status', 'completed')
      .gte('created_at', periodStart),

    // Paiements marchands all-time
    admin
      .from('payments')
      .select('amount, shops!inner(country, bictorys_secret_key)')
      .eq('status', 'completed'),

    // Reversements effectués all-time
    admin
      .from('payouts')
      .select('net_amount, gross_amount, completed_at')
      .eq('status', 'completed'),

    // Reversements en attente all-time
    admin
      .from('payouts')
      .select('net_amount')
      .in('status', ['pending', 'processing']),

    // Retraits admin all-time
    admin
      .from('admin_withdrawals')
      .select('id, amount, method, phone_number, status, bictorys_transfer_id, notes, withdrawn_at')
      .order('withdrawn_at', { ascending: false }),
  ])

  const adminWithdrawals = (adminWithdrawalsResult.data ?? []) as {
    id: string
    amount: number
    method: string
    phone_number: string
    status: 'processing' | 'completed' | 'failed'
    bictorys_transfer_id: string | null
    notes: string | null
    withdrawn_at: string
  }[]

  // ── Abonnements ──
  const subRevPeriod  = (subTxns ?? []).reduce((s, t) => s + (CM_PLAN_PRICES[t.plan_key] ?? 0), 0)
  const subRevAllTime = (subTxnsAll ?? []).reduce((s, t) => s + (CM_PLAN_PRICES[t.plan_key] ?? 0), 0)
  const subCount      = (subTxns ?? []).length

  // Total retraits admin déjà effectués
  const totalAdminWithdrawn  = adminWithdrawals
    .filter(w => w.status === 'completed')
    .reduce((s, w) => s + w.amount, 0)
  const subAvailable = Math.max(0, subRevAllTime - totalAdminWithdrawn)

  // ── Paiements marchands ──
  // Commission calculée ligne par ligne (pays + clés Bictorys propres de
  // chaque boutique), jamais un taux plat appliqué à la somme globale —
  // voir lib/billing/commission.ts.
  type PaymentShopRow = {
    amount: number
    shops: { country: string | null; bictorys_secret_key: string | null }
      | { country: string | null; bictorys_secret_key: string | null }[]
      | null
  }
  const shopOfPayment = (p: PaymentShopRow) => Array.isArray(p.shops) ? p.shops[0] : p.shops
  function sumGrossAndCommission(rows: PaymentShopRow[] | null) {
    let gross = 0, commission = 0
    for (const p of rows ?? []) {
      const s = shopOfPayment(p)
      gross += p.amount
      commission += Math.floor(p.amount * (getCommissionRate(s?.country, !!s?.bictorys_secret_key) / 100))
    }
    return { gross, commission }
  }

  const { gross: orderGrossPeriod, commission: orderCommPeriod } = sumGrossAndCommission(payments as unknown as PaymentShopRow[] | null)
  const orderNetPeriod = orderGrossPeriod - orderCommPeriod

  const { gross: orderGrossAll, commission: orderCommAll } = sumGrossAndCommission(paymentsAll as unknown as PaymentShopRow[] | null)
  const orderNetAll = orderGrossAll - orderCommAll
  // Taux moyen affiché — indicatif seulement, la vraie commission varie par
  // boutique (pays + clés propres), voir sumGrossAndCommission ci-dessus.
  const blendedCommissionRate = orderGrossAll > 0 ? Math.round((orderCommAll / orderGrossAll) * 1000) / 10 : 0

  // ── Reversements marchands ──
  const totalPaidOutNet   = (payoutsCompleted ?? []).reduce((s, p) => s + p.net_amount, 0)
  const totalPaidOutGross = (payoutsCompleted ?? []).reduce((s, p) => s + p.gross_amount, 0)
  const totalPendingNet   = (payoutsPending ?? []).reduce((s, p) => s + p.net_amount, 0)

  // ── Soldes globaux ──
  const merchantHeld     = Math.max(0, orderNetAll - totalPaidOutNet - totalPendingNet)
  const tekkishopBalance = subAvailable + orderCommAll - totalPaidOutGross + totalPaidOutNet

  const periods: Period[] = ['today', '7d', '30d', '3m', '6m', '1y']

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finances</h1>
        <p className="text-sm text-gray-500 mt-1">Abonnements · Paiements marchands · Retraits</p>
      </div>

      {/* ── Retrait revenus abonnements ── */}
      <AdminWithdrawSection availableBalance={subAvailable} />

      {/* ── Soldes globaux (all-time) ── */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Soldes globaux (toutes périodes)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Revenus abonnements disponibles</p>
            <p className="text-2xl font-black text-emerald-400">{fmt(subAvailable)} F</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {fmt(subRevAllTime)} F générés · {fmt(totalAdminWithdrawn)} F retirés
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Argent marchands détenu</p>
            <p className="text-2xl font-black text-amber-400">{fmt(merchantHeld)} F</p>
            <p className="text-[10px] text-gray-500 mt-0.5">À reverser ({fmt(totalPendingNet)} F en attente)</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Commission sur commandes</p>
            <p className="text-2xl font-black text-sky-400">{fmt(orderCommAll)} F</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{blendedCommissionRate}% en moyenne sur {fmt(orderGrossAll)} F collectés</p>
          </div>
        </div>
      </div>

      {/* ── Sélecteur de période ── */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Analyse par période</p>
        <div className="flex flex-wrap gap-2">
          {periods.map(p => (
            <a
              key={p}
              href={`/admin/finances?period=${p}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                period === p
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {PERIOD_LABELS[p]}
            </a>
          ))}
        </div>
      </div>

      {/* ── Abonnements — période ── */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
          Abonnements · {PERIOD_LABELS[period]}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard
            label="Revenus abonnements"
            value={`${fmt(subRevPeriod)} F`}
            sub={`${subCount} renouvellement${subCount > 1 ? 's' : ''}`}
            color="text-emerald-600"
          />
          <StatCard
            label="Découverte (2 900 F)"
            value={String((subTxns ?? []).filter(t => t.plan_key === 'decouverte').length)}
            sub={`${fmt((subTxns ?? []).filter(t => t.plan_key === 'decouverte').length * 2900)} F`}
          />
          <StatCard
            label="Business (4 900 F)"
            value={String((subTxns ?? []).filter(t => t.plan_key === 'business').length)}
            sub={`${fmt((subTxns ?? []).filter(t => t.plan_key === 'business').length * 4900)} F`}
          />
          <StatCard
            label="Pro (9 900 F)"
            value={String((subTxns ?? []).filter(t => t.plan_key === 'pro').length)}
            sub={`${fmt((subTxns ?? []).filter(t => t.plan_key === 'pro').length * 9900)} F`}
          />
        </div>
      </div>

      {/* ── Paiements marchands — période ── */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
          Paiements boutiques marchands · {PERIOD_LABELS[period]}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total collecté"
            value={`${fmt(orderGrossPeriod)} F`}
            sub="paiements clients"
            color="text-sky-600"
          />
          <StatCard
            label={`Commission (${blendedCommissionRate}% moy.)`}
            value={`${fmt(orderCommPeriod)} F`}
            sub="revient à TEKKIShop"
            color="text-emerald-600"
          />
          <StatCard
            label="Net marchands"
            value={`${fmt(orderNetPeriod)} F`}
            sub="à reverser"
            color="text-amber-600"
          />
          <StatCard
            label="Transactions"
            value={String(payments?.length ?? 0)}
            sub="paiements confirmés"
          />
        </div>
      </div>

      {/* ── Reversements marchands — all-time ── */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
          Reversements marchands (toutes périodes)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total reversé (net)"
            value={`${fmt(totalPaidOutNet)} F`}
            sub="payouts completed"
          />
          <StatCard
            label="En attente"
            value={`${fmt(totalPendingNet)} F`}
            sub="pending / processing"
            color="text-amber-600"
          />
          <StatCard
            label="Solde dû aux marchands"
            value={`${fmt(merchantHeld)} F`}
            sub="encore détenu par TEKKIShop"
            color={merchantHeld > 0 ? 'text-red-600' : 'text-gray-900'}
          />
        </div>
      </div>

      {/* ── Historique retraits admin ── */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
          Mes retraits de revenus abonnements
        </h2>
        {adminWithdrawals.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 py-8 text-center">
            <p className="text-sm text-gray-400">Aucun retrait enregistré.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Méthode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Numéro</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Montant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adminWithdrawals.map(w => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {format(new Date(w.withdrawn_at), 'd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {METHOD_LABELS[w.method] ?? w.method}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden md:table-cell">
                      {w.phone_number}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {fmt(w.amount)} F
                    </td>
                    <td className="px-4 py-3">
                      {w.status === 'completed' ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                          Effectué
                        </span>
                      ) : w.status === 'failed' ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 uppercase">
                          Échoué
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase">
                          En cours
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Les montants sont calculés en temps réel depuis les transactions enregistrées dans TEKKIShop.
        Les transferts effectués directement depuis Bictorys sans passer par l&apos;espace admin ne sont pas comptabilisés.
      </p>
    </div>
  )
}
