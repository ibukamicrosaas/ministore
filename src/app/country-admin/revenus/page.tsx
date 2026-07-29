import { requireCountryManagerFull, getCMSubscriptionBalance, getCMPayoutHistory } from '@/lib/actions/country-admin'
import { RevenusClient } from './RevenusClient'

export const revalidate = 0

const COUNTRY_LABEL: Record<string, string> = {
  TG: '🇹🇬 Togo', SN: '🇸🇳 Sénégal', CI: '🇨🇮 Côte d\'Ivoire',
  BJ: '🇧🇯 Bénin', ML: '🇲🇱 Mali',    BK: '🇧🇫 Burkina Faso',
}

export default async function CMRevenusPage() {
  const cm = await requireCountryManagerFull()

  const [balance, payouts] = await Promise.all([
    getCMSubscriptionBalance(cm.id, cm.country, cm.licenseStartAt),
    getCMPayoutHistory(cm.id),
  ])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Mes revenus</h1>
        <p className="text-sm text-gray-500 mt-1">
          Abonnements TEKKIShop {COUNTRY_LABEL[cm.country] ?? cm.country} — depuis le{' '}
          {new Date(cm.licenseStartAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <RevenusClient
        totalEarned={balance.totalEarned}
        totalWithdrawn={balance.totalWithdrawn}
        available={balance.available}
        pendingRequest={balance.pendingRequest}
        payouts={payouts}
        country={cm.country}
      />
    </div>
  )
}
