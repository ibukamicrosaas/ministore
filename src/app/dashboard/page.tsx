import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShopLinkCard } from '@/components/dashboard/ShopLinkCard'
import { SetupChecklist } from '@/components/dashboard/SetupChecklist'
import { EmptyState } from '@/components/ui/EmptyState'
import { ShoppingBag, TrendingUp, Package, ArrowRight, Bell, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { APP_URL, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/constants'
import type { Profile, Shop } from '@/types'

export default async function DashboardPage() {
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
    .select('slug, name, payout_wave_number, payout_om_number, plan')
    .eq('id', profile.shop_id)
    .single()

  const shop = shopData as (Pick<Shop, 'slug' | 'name' | 'payout_wave_number' | 'payout_om_number' | 'plan'>) | null

  const { count: productCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', profile.shop_id)

  const today     = new Date()
  const todayStr  = format(today, 'yyyy-MM-dd')
  const weekStart = format(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7)),
    'yyyy-MM-dd'
  )

  const [weekRevenueRes, pendingOrdersRes, productsCountRes, todayDeliveriesRes] = await Promise.all([
    supabase
      .from('orders')
      .select('total_price')
      .eq('shop_id', profile.shop_id)
      .gte('created_at', weekStart)
      .not('status', 'in', '("cancelled")'),

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

  const weekRevenue      = (weekRevenueRes.data ?? []).reduce((s, o) => s + o.total_price, 0)
  const pendingCount     = pendingOrdersRes.count ?? 0
  const productsCount    = productsCountRes.count ?? 0
  const todayDeliveries  = todayDeliveriesRes.count ?? 0

  // Commandes actives (pas livrées, pas annulées)
  const { data: recentData } = await supabase
    .from('orders')
    .select('id, status, total_price, created_at, clients(first_name, last_name), order_items(product_name, quantity)')
    .eq('shop_id', profile.shop_id)
    .not('status', 'eq', 'delivered')
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(5)

  const recentOrders = (recentData ?? []) as unknown as {
    id: string; status: string; total_price: number; created_at: string
    clients: { first_name: string; last_name: string | null } | null
    order_items: { product_name: string; quantity: number }[]
  }[]

  const hoursSince = (dateStr: string) => {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 36e5)
  }

  // Salutation adaptée au moment de la journée (heure UTC ≈ heure Afrique de l'Ouest)
  const hour = today.getUTCHours()
  const greeting = hour >= 5 && hour < 18 ? 'Bonjour' : 'Bonsoir'
  const displayName = profile?.first_name || shop?.name || ''

  return (
    <div className="space-y-5 pb-4">

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
        {/* CA semaine — hero metric */}
        <div className="col-span-2 rounded-2xl bg-[var(--color-primary)] p-4 text-white">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-white/70">CA cette semaine</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {weekRevenue.toLocaleString('fr-FR')}
                <span className="text-lg font-semibold ml-1 opacity-80">F</span>
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

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

      {/* Lien boutique */}
      {shop && <ShopLinkCard shopSlug={shop.slug} appUrl={APP_URL} />}

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
              const name    = order.clients
                ? [order.clients.first_name, order.clients.last_name].filter(Boolean).join(' ')
                : 'Client'
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
