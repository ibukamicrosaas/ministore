import { createAdminClient } from '@/lib/supabase/admin'
import { CM_PLAN_PRICES } from '@/lib/country-manager-config'

export const metadata = { title: 'Finances — Admin TEKKIShop' }
export const revalidate = 300

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
    case '7d':  return new Date(now.getTime() - 7  * 86400000).toISOString()
    case '30d': return new Date(now.getTime() - 30 * 86400000).toISOString()
    case '3m':  return new Date(now.getTime() - 91 * 86400000).toISOString()
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
  ] = await Promise.all([
    // Abonnements sur la période
    (admin
      .from('subscription_transactions' as never)
      .select('plan_key, activated_at')
      .eq('status' as never, 'activated')
      .gte('activated_at' as never, periodStart) as unknown as Promise<{
        data: { plan_key: string; activated_at: string }[] | null
      }>),

    // Abonnements all-time (pour le solde global)
    (admin
      .from('subscription_transactions' as never)
      .select('plan_key')
      .eq('status' as never, 'activated') as unknown as Promise<{
        data: { plan_key: string }[] | null
      }>),

    // Paiements marchands sur la période
    admin
      .from('payments')
      .select('amount, created_at')
      .eq('status', 'completed')
      .gte('created_at', periodStart),

    // Paiements marchands all-time
    admin
      .from('payments')
      .select('amount')
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
  ])

  // ── Abonnements ──
  const subRevPeriod = (subTxns ?? []).reduce((s, t) => s + (CM_PLAN_PRICES[t.plan_key] ?? 0), 0)
  const subRevAllTime = (subTxnsAll ?? []).reduce((s, t) => s + (CM_PLAN_PRICES[t.plan_key] ?? 0), 0)
  const subCount = (subTxns ?? []).length

  // ── Paiements marchands ──
  const COMMISSION_RATE = 3
  const orderGrossPeriod = (payments ?? []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)
  const orderCommPeriod  = Math.floor(orderGrossPeriod * COMMISSION_RATE / 100)
  const orderNetPeriod   = orderGrossPeriod - orderCommPeriod

  const orderGrossAll  = (paymentsAll ?? []).reduce((s, p) => s + p.amount, 0)
  const orderCommAll   = Math.floor(orderGrossAll * COMMISSION_RATE / 100)
  const orderNetAll    = orderGrossAll - orderCommAll

  // ── Reversements ──
  const totalPaidOutNet   = (payoutsCompleted ?? []).reduce((s, p) => s + p.net_amount, 0)
  const totalPaidOutGross = (payoutsCompleted ?? []).reduce((s, p) => s + p.gross_amount, 0)
  const totalPendingNet   = (payoutsPending ?? []).reduce((s, p) => s + p.net_amount, 0)

  // ── Soldes globaux (all-time) ──
  // Argent des abonnements : appartient à TEKKIShop
  const subBalance = subRevAllTime

  // Argent des marchands actuellement détenu par TEKKIShop
  // = total net dû − total déjà reversé − total en attente
  const merchantHeld = Math.max(0, orderNetAll - totalPaidOutNet - totalPendingNet)

  // Solde total TEKKIShop (abonnements + commission sur commandes)
  const tekkishopBalance = subBalance + orderCommAll - totalPaidOutGross + totalPaidOutNet

  const periods: Period[] = ['today', '7d', '30d', '3m', '6m', '1y']

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finances</h1>
        <p className="text-sm text-gray-500 mt-1">Séparation abonnements vs paiements marchands</p>
      </div>

      {/* ── Soldes globaux (all-time) ── */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Soldes globaux (toutes périodes)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Abonnements TEKKIShop</p>
            <p className="text-2xl font-black text-emerald-400">{fmt(subBalance)} F</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Appartient à TEKKIShop</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Argent marchands détenu</p>
            <p className="text-2xl font-black text-amber-400">{fmt(merchantHeld)} F</p>
            <p className="text-[10px] text-gray-500 mt-0.5">À reverser ({fmt(totalPendingNet)} F en attente)</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Commission sur commandes</p>
            <p className="text-2xl font-black text-sky-400">{fmt(orderCommAll)} F</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{COMMISSION_RATE}% sur {fmt(orderGrossAll)} F collectés</p>
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
            label={`Commission (${COMMISSION_RATE}%)`}
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

      {/* ── Reversements — all-time ── */}
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

      <p className="text-xs text-gray-400">
        Les montants sont calculés en temps réel depuis les transactions enregistrées dans TEKKIShop.
        Les transferts effectués directement depuis Bictorys sans passer par l&apos;espace admin ne sont pas comptabilisés.
      </p>
    </div>
  )
}
