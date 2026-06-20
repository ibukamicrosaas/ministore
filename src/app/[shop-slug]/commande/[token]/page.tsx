import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Package, Truck, CheckCircle2, Clock, XCircle, MapPin, Phone, MessageCircle } from 'lucide-react'
import type { Shop, OrderItem } from '@/types'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'

export const revalidate = 30

type Props = {
  params: Promise<{ 'shop-slug': string; token: string }>
}

const STATUS_STEPS: Record<string, { label: string; step: number }> = {
  pending:   { label: 'Reçue',         step: 1 },
  confirmed: { label: 'Confirmée',     step: 2 },
  preparing: { label: 'En préparation',step: 3 },
  ready:     { label: 'Prête',         step: 4 },
  delivered: { label: 'Livrée',        step: 5 },
  cancelled: { label: 'Annulée',       step: 0 },
}

const ALL_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

export async function generateMetadata({ params }: Props) {
  const { token } = await params
  return { title: `Suivi de commande · TekkiShop`, robots: { index: false } }
}

export default async function OrderTrackingPage({ params }: Props) {
  const { 'shop-slug': slug, token } = await params

  if (!token || token.length < 10) notFound()

  const supabase = createAdminClient()

  const { data: orderData } = await supabase
    .from('orders')
    .select(`
      id, status, delivery_type, delivery_address, delivery_date, delivery_zone_name,
      payment_type, total_price, notes, created_at,
      clients(first_name, phone),
      order_items(product_name, variant_label, unit_price, quantity, line_total),
      shops(name, slug, primary_color, phone_whatsapp, logo_url, currency)
    `)
    .eq('client_token', token)
    .single()

  if (!orderData) notFound()

  const order = orderData as unknown as {
    id: string
    status: string
    delivery_type: 'home_delivery' | 'store_pickup'
    delivery_address: string | null
    delivery_date: string | null
    delivery_zone_name: string | null
    payment_type: string
    total_price: number
    notes: string | null
    created_at: string
    clients: { first_name: string; phone: string } | null
    order_items: OrderItem[]
    shops: (Pick<Shop, 'name' | 'slug' | 'primary_color' | 'phone_whatsapp' | 'logo_url'> & { currency?: string | null }) | null
  }

  const shop  = order.shops
  if (!shop || shop.slug !== slug) notFound()

  const color    = shop.primary_color ?? '#0EA5E9'
  const currency = (shop.currency ?? 'XOF') as ShopCurrency
  const isCancelled = order.status === 'cancelled'
  const statusInfo  = STATUS_STEPS[order.status] ?? STATUS_STEPS.pending
  const currentStep = statusInfo.step
  const waLink = shop.phone_whatsapp
    ? `https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je souhaite des informations sur ma commande #${order.id.slice(0, 8).toUpperCase()}`)}`
    : null

  return (
    <div className="min-h-screen bg-gray-50" style={{ '--color-primary': color } as React.CSSProperties}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* En-tête boutique */}
        <div className="flex items-center gap-3">
          {shop.logo_url ? (
            <img src={shop.logo_url} alt={shop.name} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold text-base"
              style={{ backgroundColor: color }}
            >
              {shop.name[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{shop.name}</p>
            <p className="text-xs text-gray-500">Suivi de commande</p>
          </div>
        </div>

        {/* Référence et statut */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <p className="text-xs text-gray-500">Référence</p>
              <p className="text-sm font-bold text-gray-900 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Passée le</p>
              <p className="text-sm font-medium text-gray-700">
                {format(new Date(order.created_at), 'd MMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>

          {isCancelled ? (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3">
              <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm font-semibold text-red-700">Commande annulée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Barre de progression */}
              <div className="flex items-center gap-1">
                {ALL_STEPS.map((s, i) => {
                  const step = STATUS_STEPS[s].step
                  const done = step <= currentStep
                  const active = step === currentStep
                  return (
                    <div key={s} className="flex items-center gap-1 flex-1">
                      <div
                        className={`h-2 flex-1 rounded-full transition-colors ${
                          done ? 'bg-[var(--color-primary)]' : 'bg-gray-100'
                        }`}
                      />
                      {i === ALL_STEPS.length - 1 && (
                        <div
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            done ? 'bg-[var(--color-primary)]' : 'bg-gray-100'
                          }`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Étiquettes */}
              <div className="flex justify-between">
                {ALL_STEPS.map((s) => {
                  const step = STATUS_STEPS[s].step
                  const done = step <= currentStep
                  const active = step === currentStep
                  return (
                    <span
                      key={s}
                      className={`text-[10px] font-medium ${
                        active ? 'text-[var(--color-primary)]' : done ? 'text-gray-500' : 'text-gray-300'
                      }`}
                    >
                      {STATUS_STEPS[s].label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Livraison */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            {order.delivery_type === 'home_delivery' ? (
              <Truck className="h-4 w-4 text-gray-400" />
            ) : (
              <MapPin className="h-4 w-4 text-gray-400" />
            )}
            <p className="text-sm font-semibold text-gray-900">
              {order.delivery_type === 'home_delivery' ? 'Livraison à domicile' : 'Retrait en boutique'}
            </p>
          </div>
          {order.delivery_date && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Date prévue</span>
              <span className="font-medium text-gray-900">
                {format(new Date(order.delivery_date), 'EEEE d MMMM', { locale: fr })}
              </span>
            </div>
          )}
          {order.delivery_address && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Adresse</span>
              <span className="font-medium text-gray-900 text-right max-w-[60%]">{order.delivery_address}</span>
            </div>
          )}
        </div>

        {/* Articles */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Articles commandés</p>
          </div>
          <div className="space-y-2 divide-y divide-gray-50">
            {order.order_items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm pt-2 first:pt-0">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.product_name}</p>
                  {item.variant_label && <p className="text-xs text-gray-400">{item.variant_label}</p>}
                  {item.quantity > 1 && <p className="text-xs text-gray-400">× {item.quantity}</p>}
                </div>
                <p className="font-semibold text-gray-900 shrink-0 ml-3">
                  {formatPrice(item.line_total, currency)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-base font-bold text-gray-900">{formatPrice(order.total_price, currency)}</span>
          </div>
        </div>

        {/* Contact boutique */}
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20bb5a] transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Contacter {shop.name}
          </a>
        )}
      </div>
    </div>
  )
}
