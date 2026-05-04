import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatCard } from '@/components/dashboard/StatCard'
import { ShopLinkCard } from '@/components/dashboard/ShopLinkCard'
import { SetupChecklist } from '@/components/dashboard/SetupChecklist'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ShoppingBag, TrendingUp, Clock, Package } from 'lucide-react'
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
    .select('shop_id, onboarding_completed')
    .eq('id', user.id)
    .single()

  const profile = profileData as (Pick<Profile, 'shop_id' | 'onboarding_completed'>) | null
  if (!profile?.shop_id) redirect('/onboarding')

  const { data: shopData } = await supabase
    .from('shops')
    .select('slug, name, payout_wave_number, payout_om_number, plan')
    .eq('id', profile.shop_id)
    .single()

  const shop = shopData as (Pick<Shop, 'slug' | 'name' | 'payout_wave_number' | 'payout_om_number' | 'plan'>) | null

  // Vérifier si le vendeur a des produits (pour la checklist)
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

  const [todayOrdersRes, weekRevenueRes, pendingOrdersRes, productsCountRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, status, total_price, clients(first_name, last_name), order_items(product_name, quantity)')
      .eq('shop_id', profile.shop_id)
      .eq('delivery_date', todayStr)
      .not('status', 'in', '("cancelled")')
      .order('created_at', { ascending: false }),

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
  ])

  const todayOrders   = (todayOrdersRes.data ?? []) as unknown as {
    id: string; status: string; total_price: number
    clients: { first_name: string; last_name: string | null } | null
    order_items: { product_name: string; quantity: number }[]
  }[]

  const weekRevenue   = (weekRevenueRes.data ?? []).reduce((s, o) => s + o.total_price, 0)
  const pendingCount  = pendingOrdersRes.count ?? 0
  const productsCount = productsCountRes.count ?? 0

  // Toutes les commandes récentes (pas juste aujourd'hui)
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">
          {format(today, 'EEEE d MMMM', { locale: fr })}
        </p>
      </div>

      {/* Checklist démarrage (vendeurs sans commandes) */}
      {shop && (productCount ?? 0) < 3 && (
        <SetupChecklist
          shopSlug={shop.slug}
          shopName={shop.name}
          hasProduct={(productCount ?? 0) > 0}
          hasPayoutNumbers={!!(shop.payout_wave_number || shop.payout_om_number)}
          isActivePlan={shop.plan !== 'trial'}
        />
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={ShoppingBag}
          title="En attente"
          value={pendingCount}
          subtitle="commandes"
        />
        <StatCard
          icon={TrendingUp}
          title="CA semaine"
          value={`${weekRevenue.toLocaleString('fr-FR')} F`}
        />
        <StatCard
          icon={Clock}
          title="Livraisons aujourd'hui"
          value={todayOrders.length}
        />
        <StatCard
          icon={Package}
          title="Produits actifs"
          value={productsCount}
        />
      </div>

      {/* Lien boutique */}
      {shop && <ShopLinkCard shopSlug={shop.slug} appUrl={APP_URL} />}

      {/* Commandes actives */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">Commandes en cours</p>
          <Link href="/dashboard/orders" className="text-xs text-[var(--color-primary)] hover:opacity-75 font-medium">
            Voir toutes →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <Card>
            <EmptyState
              icon={ShoppingBag}
              title="Aucune commande en cours"
              description="Tes prochaines commandes apparaîtront ici."
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {recentOrders.map(order => {
              const name = order.clients
                ? [order.clients.first_name, order.clients.last_name].filter(Boolean).join(' ')
                : 'Client'
              const items = order.order_items
                .map(i => `${i.product_name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`)
                .join(', ')

              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-[var(--color-primary)] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{items}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0">
                    {order.total_price.toLocaleString('fr-FR')} F
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
