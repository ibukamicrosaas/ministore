import { requireCountryManager, getCountryKPIs, getCountryShops } from '@/lib/actions/country-admin'
import { Building2, ShoppingCart, TrendingUp, Users, ArrowRight, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/country-groups'

export const revalidate = 300

const COUNTRY_CURRENCY: Record<string, string> = {
  TG: 'XOF', SN: 'XOF', CI: 'XOF', BJ: 'XOF', ML: 'XOF', BK: 'XOF',
}

const COUNTRY_LABEL: Record<string, string> = {
  TG: '🇹🇬 Togo', SN: '🇸🇳 Sénégal', CI: '🇨🇮 Côte d\'Ivoire',
  BJ: '🇧🇯 Bénin', ML: '🇲🇱 Mali', BK: '🇧🇫 Burkina Faso',
}

function KPICard({ label, value, sub, icon: Icon, color }: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-black text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export default async function CountryAdminDashboard() {
  const { country, name } = await requireCountryManager()
  const [kpis, shops] = await Promise.all([
    getCountryKPIs(country),
    getCountryShops(country),
  ])

  const currency = (COUNTRY_CURRENCY[country] ?? 'XOF') as Parameters<typeof formatPrice>[1]
  const countryLabel = COUNTRY_LABEL[country] ?? country
  const recentShops = shops.slice(0, 5)
  const activationRate = kpis.totalShops > 0
    ? Math.round((kpis.activeShops / kpis.totalShops) * 100)
    : 0

  return (
    <div className="max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">
          Bonjour, {name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Tableau de bord TEKKIShop {countryLabel}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Boutiques totales"
          value={kpis.totalShops}
          sub={`${kpis.trialShops} en essai`}
          icon={Building2}
          color="bg-sky-50 text-sky-500"
        />
        <KPICard
          label="Boutiques actives"
          value={kpis.activeShops}
          sub={`${activationRate}% d'activation`}
          icon={Users}
          color="bg-emerald-50 text-emerald-500"
        />
        <KPICard
          label="Commandes / 30j"
          value={kpis.ordersThisMonth}
          icon={ShoppingCart}
          color="bg-violet-50 text-violet-500"
        />
        <KPICard
          label="Revenu / 30j"
          value={formatPrice(kpis.revenueThisMonth, currency)}
          sub="commandes confirmées"
          icon={TrendingUp}
          color="bg-amber-50 text-amber-500"
        />
      </div>

      {/* Boutiques récentes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Dernières boutiques créées</h2>
          <Link
            href="/country-admin/boutiques"
            className="flex items-center gap-1 text-xs font-semibold text-sky-500 hover:text-sky-600 transition-colors"
          >
            Voir toutes <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentShops.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            Aucune boutique pour l'instant.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentShops.map(shop => (
              <div key={shop.id} className="flex items-center gap-3 px-5 py-3.5">
                {/* Avatar */}
                {shop.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shop.logo_url}
                    alt={shop.name}
                    className="h-9 w-9 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: shop.primary_color ?? '#0EA5E9' }}
                  >
                    {shop.name[0]?.toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{shop.name}</p>
                  <p className="text-xs text-gray-400">{shop.city ?? '—'}</p>
                </div>

                {/* Plan badge */}
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  shop.plan === 'pro'        ? 'bg-purple-100 text-purple-700' :
                  shop.plan === 'business'   ? 'bg-blue-100 text-blue-700' :
                  shop.plan === 'decouverte' ? 'bg-emerald-100 text-emerald-700' :
                                               'bg-gray-100 text-gray-600'
                }`}>
                  {shop.plan === 'decouverte' ? 'Découv.' : shop.plan ?? 'Essai'}
                </span>

                {/* WhatsApp CTA */}
                {shop.phone_whatsapp && (
                  <a
                    href={`https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center justify-center h-8 w-8 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                    title="Contacter sur WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
