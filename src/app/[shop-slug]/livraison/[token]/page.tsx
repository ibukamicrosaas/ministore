import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Phone, MapPin, Package, CreditCard, Clock } from 'lucide-react'
import type { Shop, OrderItem } from '@/types'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import { DeliveryConfirmButton } from './DeliveryConfirmButton'
import { loadOrderForMerchant } from '@/lib/orders/redact'

export const revalidate = 30

type Props = {
  params: Promise<{ 'shop-slug': string; token: string }>
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params
  void token
  return { title: 'Livraison · TekkiShop', robots: { index: false } }
}

const ALREADY_DELIVERED_STATUSES = new Set(['delivered'])
const CONFIRMABLE_STATUSES       = new Set(['confirmed', 'preparing', 'ready'])

export default async function DeliveryPage({ params }: Props) {
  const { 'shop-slug': slug, token } = await params

  if (!token || token.length < 10) notFound()

  const admin = createAdminClient()

  const { data: orderData } = await admin
    .from('orders')
    .select(`
      id, status, delivery_type, delivery_address, delivery_date, delivery_zone_name,
      payment_type, total_price, created_at, delivery_token, is_held, released_at,
      clients(first_name, last_name, phone),
      order_items(product_name, variant_label, quantity, line_total),
      shops(name, slug, primary_color, logo_url, currency)
    `)
    .eq('delivery_token' as never, token)
    .single()

  if (!orderData) notFound()

  const rawOrder = orderData as unknown as {
    id: string
    status: string
    delivery_type: 'home_delivery' | 'store_pickup'
    delivery_address: string | null
    delivery_date: string | null
    delivery_zone_name: string | null
    payment_type: string
    total_price: number
    created_at: string
    delivery_token: string
    is_held: boolean
    released_at: string | null
    clients: { first_name: string; last_name: string | null; phone: string } | null
    order_items: Pick<OrderItem, 'product_name' | 'variant_label' | 'quantity' | 'line_total'>[]
    shops: (Pick<Shop, 'name' | 'slug' | 'primary_color' | 'logo_url'> & { currency?: string | null }) | null
  }

  const shop = rawOrder.shops
  // Vérifier que le token appartient bien à cette boutique
  if (!shop || shop.slug !== slug) notFound()

  const color    = shop.primary_color ?? '#0EA5E9'
  const currency = (shop.currency ?? 'XOF') as ShopCurrency

  // Fiche de livraison = outil marchand/livreur, jamais envoyée au client —
  // mêmes garanties que le dashboard sur une commande retenue. Voir
  // src/lib/orders/redact.ts.
  const order = loadOrderForMerchant(rawOrder)

  if (order.blocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-2">
          <p className="text-4xl">🔒</p>
          <p className="text-base font-semibold text-gray-900">Fiche pas encore disponible</p>
          <p className="text-sm text-gray-500">
            Cette commande sera visible dès que la boutique aura activé son plan.
          </p>
        </div>
      </div>
    )
  }

  const isDelivered  = ALREADY_DELIVERED_STATUSES.has(order.status)
  const canConfirm   = CONFIRMABLE_STATUSES.has(order.status)
  const isCashOnDelivery = order.payment_type === 'on_delivery'

  const clientName = order.merchantClient.clientName

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* En-tête boutique */}
        <div className="flex items-center gap-3">
          {shop.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logo_url} alt={shop.name} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-bold text-base"
              style={{ backgroundColor: color }}
            >
              {shop.name[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{shop.name}</p>
            <p className="text-xs text-gray-500">Fiche de livraison</p>
          </div>
        </div>

        {/* Bannière héro */}
        <div
          className="rounded-2xl p-4 text-white"
          style={{ backgroundColor: isDelivered ? '#16A34A' : color }}
        >
          <p className="text-xs font-medium text-white/80 mb-0.5">
            {isDelivered ? '✅ Livraison effectuée' : '🛵 À livrer'}
          </p>
          <p className="text-lg font-bold leading-tight">
            {clientName || 'Client'}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-white/80">
            <span className="font-mono font-bold text-white">#{order.id.slice(0, 8).toUpperCase()}</span>
            <span>·</span>
            <span>{format(new Date(order.created_at), 'd MMM yyyy', { locale: fr })}</span>
          </div>
        </div>

        {/* Destination */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Destination</p>
          </div>

          {order.delivery_address && (
            <div className="flex items-start justify-between text-sm gap-4">
              <span className="text-gray-500 shrink-0">Adresse</span>
              <span className="font-semibold text-gray-900 text-right">{order.delivery_address}</span>
            </div>
          )}
          {order.delivery_zone_name && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Zone</span>
              <span className="font-medium text-gray-900">{order.delivery_zone_name}</span>
            </div>
          )}
          {order.delivery_date && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Date</span>
              <span className="font-medium text-gray-900">
                {format(new Date(order.delivery_date + 'T12:00:00'), 'EEEE d MMMM', { locale: fr })}
              </span>
            </div>
          )}
        </div>

        {/* Contact client */}
        {order.merchantClient.clientPhone && (
          <a
            href={`tel:${order.merchantClient.clientPhone}`}
            className="flex items-center justify-between rounded-2xl bg-white border border-gray-100 shadow-sm p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: color }}
              >
                {clientName?.[0]?.toUpperCase() ?? 'C'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{clientName}</p>
                <p className="text-xs text-gray-500">{order.merchantClient.clientPhone}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-1.5">
              <Phone className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-xs font-semibold text-gray-700">Appeler</span>
            </div>
          </a>
        )}

        {/* Articles */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Articles à livrer</p>
          </div>
          <div className="space-y-2.5 divide-y divide-gray-50">
            {order.order_items.map((item, i) => (
              <div key={i} className="pt-2.5 first:pt-0 flex items-start justify-between text-sm">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="font-medium text-gray-900">{item.product_name}</p>
                  {item.variant_label && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.variant_label}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">
                  ×{item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Montant à percevoir (uniquement si paiement à la livraison) */}
        {isCashOnDelivery && (
          <div
            className="flex items-center justify-between rounded-2xl border-2 p-4"
            style={{ borderColor: color, backgroundColor: `${color}0D` }}
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" style={{ color }} />
              <p className="text-sm font-semibold" style={{ color }}>Montant à percevoir</p>
            </div>
            <p className="text-lg font-bold" style={{ color }}>
              {formatPrice(order.total_price, currency)}
            </p>
          </div>
        )}

        {/* Bouton confirmation ou état livré */}
        {isDelivered ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-green-50 border border-green-200 py-4 text-sm font-semibold text-green-700">
            <span>✅</span> Livraison déjà confirmée
          </div>
        ) : canConfirm ? (
          <DeliveryConfirmButton
            deliveryToken={order.delivery_token ?? ''}
            primaryColor={color}
          />
        ) : (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 text-center">
            Cette commande n'est pas encore prête pour la livraison.
          </div>
        )}

      </div>
    </div>
  )
}
