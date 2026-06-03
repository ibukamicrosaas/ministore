import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Users, Building2, ShoppingBag, TrendingUp, Clock, AlertCircle, Zap, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { APP_URL } from '@/constants'

export const metadata = { title: 'Analytics (démo) — TekkiShop Admin' }

// ─── Données fictives ────────────────────────────────────────────────────────

const MOCK = {
  totalShops:   238,
  activeShops:  197,

  plans: {
    trial:      33,
    decouverte: 64,
    business:   92,
    pro:         8,
  },

  // MRR = 64×2900 + 92×4900 + 8×9900
  mrr: 715_600,

  ordersThisMonth: 11,
  ordersPrevMonth:  8,   // → +38%

  totalRevenue:     5_710_150,
  commission:         171_305,   // 3% de 5 710 150, arrondi
  revenueThisMonth:   211_500,

  conversionRate:  69,   // 164 payants / 238 inscrits
  activationRate:  91,   // boutiques avec ≥1 produit
  activeIn30d:     47,   // boutiques avec commandes dans 30j

  trialExpired: [
    { id: '1', name: 'Maison Kaly',       slug: 'maison-kaly',        trial_ends_at: '2026-05-28', phone_whatsapp: '+221771234501' },
    { id: '2', name: 'Awa Couture',       slug: 'awa-couture',        trial_ends_at: '2026-05-25', phone_whatsapp: '+221771234502' },
    { id: '3', name: 'Délices du Sahel',  slug: 'delices-du-sahel',   trial_ends_at: '2026-05-21', phone_whatsapp: '+221771234503' },
    { id: '4', name: 'Tech Accessories',  slug: 'tech-accessories',   trial_ends_at: '2026-05-19', phone_whatsapp: '+221771234504' },
    { id: '5', name: 'Bijoux Marème',     slug: 'bijoux-mareme',      trial_ends_at: '2026-05-17', phone_whatsapp: null },
    { id: '6', name: 'FoodBox Dakar',     slug: 'foodbox-dakar',      trial_ends_at: '2026-05-14', phone_whatsapp: '+221771234506' },
    { id: '7', name: 'WaxMode CI',        slug: 'waxmode-ci',         trial_ends_at: '2026-05-10', phone_whatsapp: '+225071234507' },
  ],

  trialEndingSoon: [
    { id: '8',  name: 'Le Coin Bio',       trial_ends_at: '2026-06-05' },
    { id: '9',  name: 'Afro Sneakers',     trial_ends_at: '2026-06-06' },
    { id: '10', name: 'Studio Créatif',    trial_ends_at: '2026-06-07' },
    { id: '11', name: 'Niokolokoba Shop',  trial_ends_at: '2026-06-08' },
  ],

  pendingPayouts: [
    { id: 'p1', shopName: 'Le Bazar d\'Ibuka',  net_amount: 47_800, payout_method: 'wave',         payout_number: '+221 77 456 78 90' },
    { id: 'p2', shopName: 'Supreme Business',   net_amount: 83_500, payout_method: 'orange_money',  payout_number: '+221 76 234 56 78' },
    { id: 'p3', shopName: 'Dou Design',         net_amount: 12_300, payout_method: 'wave',          payout_number: '+225 07 123 45 67' },
  ],

  recentShops: [
    { id: 'r1',  name: 'Le Coin Frais',        slug: 'le-coin-frais',        plan: 'decouverte', created_at: '2026-05-31' },
    { id: 'r2',  name: 'Awa Couture Luxe',     slug: 'awa-couture-luxe',     plan: 'business',   created_at: '2026-05-29' },
    { id: 'r3',  name: 'TechZone SN',          slug: 'techzone-sn',          plan: 'pro',        created_at: '2026-05-27' },
    { id: 'r4',  name: 'Délices Maison',       slug: 'delices-maison',       plan: 'decouverte', created_at: '2026-05-25' },
    { id: 'r5',  name: 'Bijoux Fatou',         slug: 'bijoux-fatou',         plan: 'trial',      created_at: '2026-05-24' },
    { id: 'r6',  name: 'Mode Africaine CI',    slug: 'mode-africaine-ci',    plan: 'business',   created_at: '2026-05-22' },
    { id: 'r7',  name: 'Saveurs du Terroir',   slug: 'saveurs-du-terroir',   plan: 'decouverte', created_at: '2026-05-20' },
    { id: 'r8',  name: 'Artisan du Sahel',     slug: 'artisan-du-sahel',     plan: 'business',   created_at: '2026-05-18' },
  ],
}

const ordersGrowth = Math.round(
  ((MOCK.ordersThisMonth - MOCK.ordersPrevMonth) / MOCK.ordersPrevMonth) * 100
)

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const now = new Date('2026-06-03')

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1>
          <p className="text-sm text-gray-500 mt-1 capitalize">
            {format(now, 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          ★ Données de démonstration
        </span>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPI icon={Building2}   label="Boutiques inscrites"  value={MOCK.totalShops}                                    sub={`${MOCK.activeShops} actives`}                                         color="text-blue-600"   bg="bg-blue-50" />
        <KPI icon={TrendingUp}  label="MRR"                  value={`${MOCK.mrr.toLocaleString('fr-FR')} F`}           sub="abonnements actifs"                                                    color="text-sky-600"    bg="bg-sky-50" />
        <KPI icon={ShoppingBag} label="Commandes ce mois"    value={MOCK.ordersThisMonth}                               sub={`+${ordersGrowth}% vs mois dernier`}                                  color="text-green-600"  bg="bg-green-50" />
        <KPI icon={Users}       label="Commission TekkiShop" value={`${MOCK.commission.toLocaleString('fr-FR')} F`}    sub="cumulé"                                                                color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Métriques SaaS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPI icon={Zap}         label="Taux de conversion"  value={`${MOCK.conversionRate}%`}                          sub="trial → payant"              color="text-green-600"  bg="bg-green-50" />
        <KPI icon={UserCheck}   label="Taux d'activation"   value={`${MOCK.activationRate}%`}                          sub="boutiques avec ≥1 produit"   color="text-blue-600"   bg="bg-blue-50" />
        <KPI icon={ShoppingBag} label="Boutiques actives"   value={MOCK.activeIn30d}                                   sub="avec commandes dans 30j"     color="text-indigo-600" bg="bg-indigo-50" />
        <KPI icon={TrendingUp}  label="Revenus (mois)"      value={`${MOCK.revenueThisMonth.toLocaleString('fr-FR')} F`} sub="paiements clients"        color="text-sky-600"    bg="bg-sky-50" />
      </div>

      {/* Plans + revenus */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Répartition des plans</p>
          <div className="space-y-3">
            {[
              { key: 'trial',      label: 'Essai gratuit', price: '0 F/mois',      count: MOCK.plans.trial },
              { key: 'decouverte', label: 'Découverte',    price: '2 900 F/mois',  count: MOCK.plans.decouverte },
              { key: 'business',   label: 'Business',      price: '4 900 F/mois',  count: MOCK.plans.business },
              { key: 'pro',        label: 'Pro',           price: '9 900 F/mois',  count: MOCK.plans.pro },
            ].map(({ key, label, price, count }) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 flex-1">
                  <div>
                    <span className="font-medium text-gray-900">{label}</span>
                    <span className="text-xs text-gray-400 ml-2">{price}</span>
                  </div>
                  {key !== 'trial' && (
                    <div className="flex-1 mx-3 h-1.5 rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-sky-400"
                        style={{ width: `${(count / MOCK.totalShops) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <span className="font-bold text-gray-900 shrink-0 w-8 text-right">{count}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-semibold">
              <span className="text-gray-700">MRR total</span>
              <span className="text-[var(--color-primary)]">{MOCK.mrr.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Revenus clients (cumul)</p>
          <p className="text-3xl font-bold text-gray-900">
            {MOCK.totalRevenue.toLocaleString('fr-FR')}{' '}
            <span className="text-base font-normal text-gray-400">FCFA</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Commission TekkiShop (3%) :{' '}
            <strong>{MOCK.commission.toLocaleString('fr-FR')} FCFA</strong>
          </p>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Ce mois-ci</p>
            <p className="text-lg font-bold text-gray-900">{MOCK.revenueThisMonth.toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>
      </div>

      {/* Essais expirés non convertis */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-sm font-semibold text-red-800">
            Essais expirés — à relancer ({MOCK.trialExpired.length})
          </p>
        </div>
        <div className="space-y-2">
          {MOCK.trialExpired.slice(0, 5).map(s => (
            <div key={s.id} className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-red-800">{s.name}</span>
                <p className="text-xs text-red-400">
                  Expiré le {format(new Date(s.trial_ends_at), 'd MMM', { locale: fr })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {s.phone_whatsapp && (
                  <a
                    href={`https://wa.me/${s.phone_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${s.name} ! Votre essai TekkiShop est terminé. Souhaitez-vous continuer ? ${APP_URL}/dashboard/upgrade`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-[#25D366] text-white rounded-lg px-2.5 py-1 font-medium"
                  >
                    Relancer
                  </a>
                )}
                <Link
                  href={`/admin/shops/${s.id}`}
                  className="text-xs bg-white border border-red-200 text-red-700 rounded-lg px-2.5 py-1 font-medium hover:bg-red-50"
                >
                  Activer
                </Link>
              </div>
            </div>
          ))}
          {MOCK.trialExpired.length > 5 && (
            <Link href="/admin/shops" className="text-xs text-red-500 hover:underline">
              Voir tous →
            </Link>
          )}
        </div>
      </div>

      {/* Essais expirant bientôt */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-amber-600" />
          <p className="text-sm font-semibold text-amber-800">
            Essais expirant dans 7 jours ({MOCK.trialEndingSoon.length})
          </p>
        </div>
        <div className="space-y-2">
          {MOCK.trialEndingSoon.map(s => (
            <div key={s.id} className="flex items-center justify-between">
              <span className="text-sm text-amber-800">{s.name}</span>
              <span className="text-xs text-amber-600 font-medium">
                {format(new Date(s.trial_ends_at), 'd MMM', { locale: fr })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reversements en attente */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-900">
            Reversements en attente ({MOCK.pendingPayouts.length})
          </p>
          <Link href="/admin/payouts" className="text-xs text-[var(--color-primary)] hover:underline">
            Gérer →
          </Link>
        </div>
        <div className="space-y-3">
          {MOCK.pendingPayouts.map(p => (
            <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{p.shopName}</p>
                <p className="text-xs text-gray-500">
                  {p.payout_method === 'wave' ? 'Wave' : 'Orange Money'} · {p.payout_number}
                </p>
              </div>
              <p className="text-base font-bold text-gray-900">
                {p.net_amount.toLocaleString('fr-FR')} F
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Dernières boutiques inscrites */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-900">Derniers inscrits</p>
          <Link href="/admin/shops" className="text-xs text-[var(--color-primary)] hover:underline">
            Voir tous →
          </Link>
        </div>
        <div className="space-y-2">
          {MOCK.recentShops.map(s => (
            <div
              key={s.id}
              className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-400">{s.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  s.plan === 'pro'        ? 'bg-purple-100 text-purple-700' :
                  s.plan === 'business'   ? 'bg-blue-100 text-blue-700' :
                  s.plan === 'decouverte' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {s.plan === 'trial'      ? 'Essai' :
                   s.plan === 'decouverte' ? 'Découverte' :
                   s.plan === 'business'   ? 'Business' :
                   s.plan === 'pro'        ? 'Pro' : s.plan}
                </span>
                <p className="text-xs text-gray-400">
                  {format(new Date(s.created_at), 'd MMM', { locale: fr })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KPI({
  icon: Icon, label, value, sub, color, bg,
}: {
  icon: React.ElementType; label: string; value: string | number
  sub?: string; color: string; bg: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg} mb-3`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
