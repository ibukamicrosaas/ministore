import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShopLinkCard } from '@/components/dashboard/ShopLinkCard'
import { SetupChecklist } from '@/components/dashboard/SetupChecklist'
import { FirstSalesNudge } from '@/components/dashboard/FirstSalesNudge'
import { RevenueCard } from '@/components/dashboard/RevenueCard'
import { getDateRange } from '@/app/api/dashboard/revenue/route'
import { EmptyState } from '@/components/ui/EmptyState'
import { ShoppingBag, TrendingUp, Package, ArrowRight, Bell, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { APP_URL, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/constants'
import type { Profile, Shop } from '@/types'
import { redactClient } from '@/lib/orders/redact'
import { getFreeOrdersSummary } from '@/lib/orders/free-orders-summary'
import { displayedQuotaProgress } from '@/lib/billing/quota'
import { getPlansForCountry } from '@/lib/billing/plans'
import { QuotaCounter } from '@/components/dashboard/QuotaCounter'
import { SecondOrderAlert } from '@/components/dashboard/SecondOrderAlert'
import { TrialEndScreen } from '@/components/dashboard/TrialEndScreen'
import { SPECIALTY_TO_LABEL } from '@/app/start/data'
import { logShopEvent } from '@/lib/billing/events'

interface Props {
  searchParams: Promise<{ welcome?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const { welcome } = await searchParams
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('shop_id, onboarding_completed, first_name')
    .eq('id', user.id)
    .single()

  const profile = profileData as (Pick<Profile, 'shop_id' | 'onboarding_completed' | 'first_name'>) | null
  if (!profile?.shop_id) redirect('/onboarding')

  const { data: shopData } = await supabase
    .from('shops')
    .select(`
      id, slug, name, payout_wave_number, payout_om_number, plan, currency, country,
      status, trial_model, trial_ends_at, trial_started_at, trial_extended_at,
      free_orders_used, free_orders_quota, specialty, specialty_other
    `)
    .eq('id', profile.shop_id)
    .single()

  const shop = shopData as (Pick<Shop,
    'id' | 'slug' | 'name' | 'payout_wave_number' | 'payout_om_number' | 'plan' | 'currency' | 'country' |
    'status' | 'trial_model' | 'trial_ends_at' | 'trial_started_at' | 'trial_extended_at' |
    'free_orders_used' | 'free_orders_quota' | 'specialty' | 'specialty_other'
  >) | null

  const { count: productCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', profile.shop_id)

  const today    = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const { from: todayFrom } = getDateRange('today')

  const [todayRevenueRes, pendingOrdersRes, productsCountRes, todayDeliveriesRes] = await Promise.all([
    // CA du jour — paiements réellement collectés
    supabase
      .from('orders')
      .select('total_price, status, payment_type')
      .eq('shop_id', profile.shop_id)
      .not('status', 'in', '("pending","cancelled")')
      .gte('created_at', todayFrom!),

    supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('shop_id', profile.shop_id)
      .eq('status', 'pending'),

    supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('shop_id', profile.shop_id)
      .eq('is_active', true),

    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', profile.shop_id)
      .eq('delivery_date', todayStr)
      .not('status', 'in', '("cancelled","delivered")'),
  ])

  const ONLINE_TYPES = ['online_full', 'online_deposit']
  const PROGRESSING  = ['confirmed', 'preparing', 'ready', 'delivered']
  const todayPaid = (todayRevenueRes.data ?? []).filter((o: { status: string; payment_type: string | null }) =>
    o.status === 'completed' ||
    o.status === 'delivered' ||
    (ONLINE_TYPES.includes(o.payment_type ?? '') && PROGRESSING.includes(o.status ?? ''))
  )
  const todayRevenue    = todayPaid.reduce((s: number, o: { total_price: number }) => s + (o.total_price ?? 0), 0)
  const todayRevenueCount = todayPaid.length
  const pendingCount    = pendingOrdersRes.count ?? 0
  const productsCount   = productsCountRes.count ?? 0
  const todayDeliveries = todayDeliveriesRes.count ?? 0

  // Commandes actives (pas livrées, pas annulées)
  const { data: recentData } = await supabase
    .from('orders')
    .select('id, status, total_price, created_at, is_held, released_at, clients(first_name, last_name), order_items(product_name, quantity)')
    .eq('shop_id', profile.shop_id)
    .not('status', 'eq', 'delivered')
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(5)

  const recentOrders = (recentData ?? []) as unknown as {
    id: string; status: string; total_price: number; created_at: string
    is_held: boolean; released_at: string | null
    clients: { first_name: string; last_name: string | null } | null
    order_items: { product_name: string; quantity: number }[]
  }[]

  // ── Modèle free_orders — quota, alertes et fin d'essai (SPEC-dashboard-fins-essai) ──
  const isFreeOrders = shop?.trial_model === 'free_orders'
  const quota = shop ? displayedQuotaProgress(shop.free_orders_used, shop.free_orders_quota) : null
  const daysLeft = shop?.trial_ends_at
    ? Math.ceil((new Date(shop.trial_ends_at).getTime() - Date.now()) / 86_400_000)
    : null

  const quotaVisible = isFreeOrders && shop?.status === 'trial'
  const showSecondOrderAlert = isFreeOrders && shop?.status === 'trial' &&
    shop!.free_orders_used === shop!.free_orders_quota - 1

  if (quotaVisible && shop) logShopEvent(shop.id, 'quota_counter_shown', {})

  let trialEndScreen: React.ReactNode = null
  if (isFreeOrders && shop?.status === 'expired') {
    const isCasA = shop.free_orders_used >= shop.free_orders_quota
    if (isCasA) {
      const summary = await getFreeOrdersSummary(supabase, shop.id)
      const { plans, isEuCa } = getPlansForCountry(shop.country)
      trialEndScreen = (
        <TrialEndScreen
          shopId={shop.id}
          caseType="A"
          collectedTotal={summary.collectedTotal}
          heldCount={summary.heldCount}
          currency={shop.currency ?? 'XOF'}
          plans={plans}
          currentPlan={shop.plan}
          isEuCa={isEuCa}
          subscriptionEndsAt={null}
        />
      )
    } else {
      let visitsQuery = supabase.from('shop_visits').select('views').eq('shop_id', shop.id)
      if (shop.trial_started_at) visitsQuery = visitsQuery.gte('day', shop.trial_started_at.slice(0, 10))
      const { data: visitsData } = await visitsQuery
      const visitCount = (visitsData ?? []).reduce((sum: number, v: { views: number }) => sum + v.views, 0)
      const category = shop.specialty === 'other'
        ? (shop.specialty_other ?? 'des produits')
        : (SPECIALTY_TO_LABEL[shop.specialty ?? ''] ?? 'des produits')
      trialEndScreen = (
        <TrialEndScreen
          shopId={shop.id}
          caseType="B"
          visitCount={visitCount}
          category={category}
          country={shop.country ?? null}
          shopSlug={shop.slug}
          shopName={shop.name}
          trialExtendedAt={shop.trial_extended_at}
        />
      )
    }
  }

  const hoursSince = (dateStr: string) => {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 36e5)
  }

  // Salutation adaptée au moment de la journée (heure UTC ≈ heure Afrique de l'Ouest)
  const hour = today.getUTCHours()
  const greeting = hour >= 5 && hour < 18 ? 'Bonjour' : 'Bonsoir'
  const displayName = profile?.first_name || shop?.name || ''

  return (
    <div className="space-y-5 pb-4">

      {trialEndScreen}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-400 capitalize mb-0.5">
            {format(today, 'EEEE d MMMM', { locale: fr })}
          </p>
          <h1 className="text-xl font-bold text-gray-900">
            {greeting}{displayName ? `, ${displayName}` : ''}
          </h1>
        </div>
        {todayDeliveries > 0 && (
          <Link
            href="/dashboard/orders?status=ready"
            className="flex items-center gap-1.5 rounded-xl bg-sky-50 border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-700 shrink-0"
          >
            <Clock className="h-3.5 w-3.5" />
            {todayDeliveries} livraison{todayDeliveries > 1 ? 's' : ''} auj.
          </Link>
        )}
      </div>

      {/* Banner de bienvenue — uniquement après /start, si aucun produit encore */}
      {welcome === 'start' && (productCount ?? 0) === 0 && shop && (
        <div className="rounded-2xl overflow-hidden border border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <div className="px-5 py-4">
            <p className="text-sm font-bold text-blue-900 mb-1">🎉 Ta boutique {shop.name} est créée !</p>
            <p className="text-sm text-blue-700 mb-4">
              Ajoute ton premier produit pour ouvrir ta boutique à tes clients et réaliser ta première vente.
            </p>
            <Link
              href="/dashboard/products/new"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white"
            >
              <Package className="h-4 w-4" />
              Ajouter mon premier produit →
            </Link>
            <div className="flex justify-center gap-5 mt-3 text-xs text-blue-600">
              <Link href="/dashboard/settings" className="underline">Ajouter un logo</Link>
              <Link href="/dashboard/settings" className="underline">Renseigner ma ville</Link>
            </div>
          </div>
        </div>
      )}

      {/* Checklist démarrage */}
      {shop && (
        <SetupChecklist
          shopSlug={shop.slug}
          shopName={shop.name}
          hasProduct={(productCount ?? 0) > 0}
          hasPayoutNumbers={!!(shop.payout_wave_number || shop.payout_om_number)}
          isActivePlan={shop.plan !== 'trial'}
        />
      )}

      {/* Nudge premières ventes — plan actif uniquement */}
      {shop && shop.plan !== 'trial' && (
        <FirstSalesNudge shopSlug={shop.slug} shopName={shop.name} />
      )}


      {/* Alerte commandes à traiter */}
      {pendingCount > 0 && (
        <Link
          href="/dashboard/orders?status=pending"
          className="flex items-center gap-3 rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3.5 hover:bg-orange-100 transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 shrink-0">
            <Bell className="h-4 w-4 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-800">
              {pendingCount} commande{pendingCount > 1 ? 's' : ''} à confirmer
            </p>
            <p className="text-xs text-orange-600 mt-0.5">Touche pour les traiter</p>
          </div>
          <ArrowRight className="h-4 w-4 text-orange-400 shrink-0" />
        </Link>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        {/* CA — hero metric avec sélecteur de période */}
        <RevenueCard initialRevenue={todayRevenue} initialCount={todayRevenueCount} />

        {/* Produits actifs */}
        <Link
          href="/dashboard/products"
          className="flex items-start justify-between gap-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 transition-colors"
        >
          <div>
            <p className="text-xs font-medium text-gray-500">Produits</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{productsCount}</p>
            <p className="mt-0.5 text-xs text-gray-400">actifs</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 shrink-0">
            <Package className="h-5 w-5 text-gray-400" />
          </div>
        </Link>

        {/* Commandes en attente */}
        <Link
          href="/dashboard/orders?status=pending"
          className={`flex items-start justify-between gap-2 rounded-2xl border p-4 shadow-sm transition-colors ${
            pendingCount > 0
              ? 'border-orange-200 bg-orange-50 hover:bg-orange-100'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div>
            <p className={`text-xs font-medium ${pendingCount > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
              En attente
            </p>
            <p className={`mt-1 text-2xl font-bold ${pendingCount > 0 ? 'text-orange-700' : 'text-gray-900'}`}>
              {pendingCount}
            </p>
            <p className={`mt-0.5 text-xs ${pendingCount > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
              commande{pendingCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
            pendingCount > 0 ? 'bg-orange-100' : 'bg-gray-50'
          }`}>
            <ShoppingBag className={`h-5 w-5 ${pendingCount > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
          </div>
        </Link>
      </div>

      {/* Commandes offertes — modèle free_orders, pendant l'essai uniquement */}
      {quotaVisible && quota && (
        <QuotaCounter used={quota.used} quota={quota.quota} daysLeft={daysLeft} />
      )}
      {showSecondOrderAlert && <SecondOrderAlert />}

      {/* Lien boutique */}
      {shop && <ShopLinkCard shopSlug={shop.slug} appUrl={APP_URL} shopName={shop.name} />}

      {/* Commandes actives */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">Commandes en cours</p>
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:opacity-75 font-medium"
          >
            Voir toutes <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white">
            <EmptyState
              icon={ShoppingBag}
              title="Aucune commande en cours"
              description="Tes prochaines commandes apparaîtront ici."
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
            {recentOrders.map(order => {
              const name    = order.clients ? redactClient(order.clients, order).clientName : 'Client'
              const ref     = `#${order.id.slice(0, 6).toUpperCase()}`
              const items   = order.order_items
                .map(i => `${i.product_name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`)
                .join(', ')
              const hours   = hoursSince(order.created_at)
              const isUrgent = order.status === 'pending' && hours >= 1

              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors active:bg-gray-100"
                >
                  {/* Status dot */}
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                    order.status === 'pending'   ? 'bg-yellow-400' :
                    order.status === 'confirmed' ? 'bg-blue-400' :
                    order.status === 'preparing' ? 'bg-purple-400' :
                    order.status === 'ready'     ? 'bg-sky-400' : 'bg-gray-300'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                      <span className="text-[10px] font-mono text-gray-400 shrink-0">{ref}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{items}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {order.total_price.toLocaleString('fr-FR')} F
                    </p>
                    {isUrgent ? (
                      <p className="text-[10px] text-orange-500 font-medium">{hours}h en attente</p>
                    ) : (
                      <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
