import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { ShoppingBag, MapPin, Home, CreditCard, Clock, Download } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/constants'
import type { Profile } from '@/types'

export const metadata = { title: 'Commandes — TekkiShop' }

const STATUS_TABS = [
  { key: 'all',       label: 'Toutes' },
  { key: 'pending',   label: 'En attente' },
  { key: 'confirmed', label: 'Confirmées' },
  { key: 'preparing', label: 'En préparation' },
  { key: 'ready',     label: 'Prêtes' },
  { key: 'delivered', label: 'Livrées' },
  { key: 'cancelled', label: 'Annulées' },
]

type OrderRow = {
  id: string
  status: string
  delivery_type: string
  delivery_date: string | null
  total_price: number
  payment_type: string
  deposit_paid: boolean
  created_at: string
  clients: { first_name: string; last_name: string | null; phone: string } | null
  order_items: { product_name: string; quantity: number }[]
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: filterStatus } = await searchParams

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'shop_id'> | null
  if (!profile?.shop_id) redirect('/onboarding')

  const { data: shopData } = await supabase
    .from('shops').select('plan').eq('id', profile.shop_id).single()
  const isPro = (shopData as { plan: string } | null)?.plan === 'pro'

  let query = supabase
    .from('orders')
    .select(`
      id, status, delivery_type, delivery_date, total_price,
      payment_type, deposit_paid, created_at,
      clients(first_name, last_name, phone),
      order_items(product_name, quantity)
    `)
    .eq('shop_id', profile.shop_id)
    .order('created_at', { ascending: false })

  if (filterStatus && filterStatus !== 'all') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = (query as any).eq('status', filterStatus)
  }

  const { data, error } = await query
  if (error) return <ErrorState message="Impossible de charger les commandes." />

  const orders = (data ?? []) as unknown as OrderRow[]

  // Compteurs par statut
  const { data: allOrders } = await supabase
    .from('orders')
    .select('status')
    .eq('shop_id', profile.shop_id)

  const counts = (allOrders ?? []).reduce<Record<string, number>>((acc, o) => {
    acc['all'] = (acc['all'] ?? 0) + 1
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Commandes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{counts['all'] ?? 0} commande{(counts['all'] ?? 0) > 1 ? 's' : ''} au total</p>
        </div>
        {isPro && (
          <a
            href={`/api/export/orders?from=${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)}&to=${new Date().toISOString().slice(0, 10)}`}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
            title="Exporter les commandes du mois en CSV"
          >
            <Download className="h-3.5 w-3.5" />
            Exporter CSV
          </a>
        )}
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_TABS.map(tab => {
          const count = tab.key === 'all' ? (counts['all'] ?? 0) : (counts[tab.key] ?? 0)
          const active = (filterStatus ?? 'all') === tab.key
          return (
            <Link
              key={tab.key}
              href={tab.key === 'all' ? '/dashboard/orders' : `/dashboard/orders?status=${tab.key}`}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {orders.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShoppingBag}
            title="Aucune commande"
            description={filterStatus && filterStatus !== 'all'
              ? `Aucune commande avec le statut "${ORDER_STATUS_LABELS[filterStatus]}".`
              : 'Tes commandes apparaîtront ici dès que tes clients passeront commande.'}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const clientName = order.clients
              ? [order.clients.first_name, order.clients.last_name].filter(Boolean).join(' ')
              : 'Client inconnu'
            const itemsSummary = order.order_items
              .map(i => `${i.product_name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`)
              .join(', ')

            return (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-[var(--color-primary)] hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{clientName}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{itemsSummary}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      {order.delivery_type === 'home_delivery' ? (
                        <span className="flex items-center gap-1"><Home className="h-3 w-3" />Livraison</span>
                      ) : (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Retrait</span>
                      )}
                      {order.delivery_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(order.delivery_date + 'T12:00:00'), 'EEE d MMM', { locale: fr })}
                        </span>
                      )}
                      {(order.payment_type === 'on_delivery' || order.payment_type === 'on_site') && (
                        <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />À la réception</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {order.total_price.toLocaleString('fr-FR')}
                      <span className="text-xs font-normal text-gray-500 ml-0.5">F</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {format(new Date(order.created_at), 'd MMM', { locale: fr })}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
