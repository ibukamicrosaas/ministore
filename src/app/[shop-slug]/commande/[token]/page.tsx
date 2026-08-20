import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { format, differenceInCalendarDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Package, Truck, CheckCircle2, Clock, XCircle, MapPin, MessageCircle, Store, CreditCard, Star, Download } from 'lucide-react'
import type { Shop, OrderItem } from '@/types'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import { OrderSummary } from '@/components/shop/OrderSummary'

export const revalidate = 30

type Props = {
  params: Promise<{ 'shop-slug': string; token: string }>
}

const STEPS = [
  { key: 'pending',   label: 'Reçue',         icon: Clock,        step: 1 },
  { key: 'confirmed', label: 'Confirmée',      icon: CheckCircle2, step: 2 },
  { key: 'preparing', label: 'Préparation',    icon: Package,      step: 3 },
  { key: 'ready',     label: 'Prête',          icon: Store,        step: 4 },
  { key: 'delivered', label: 'Livrée',         icon: Truck,        step: 5 },
]

const STATUS_STEP: Record<string, number> = {
  pending: 1, confirmed: 2, preparing: 3, ready: 4, delivered: 5, cancelled: 0,
}

function deliveryDateLabel(dateStr: string): string {
  const today    = new Date()
  const delivery = new Date(dateStr + 'T12:00:00')
  const diff     = differenceInCalendarDays(delivery, today)
  if (diff < 0)  return format(delivery, 'EEEE d MMMM', { locale: fr })
  if (diff === 0) return 'Prévu aujourd\'hui'
  if (diff === 1) return 'Prévu demain'
  return `Dans ${diff} jours — ${format(delivery, 'd MMMM', { locale: fr })}`
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params
  void token
  return { title: 'Suivi de commande · TekkiShop', robots: { index: false } }
}

export default async function OrderTrackingPage({ params }: Props) {
  const { 'shop-slug': slug, token } = await params

  if (!token || token.length < 10) notFound()

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orderData } = await (supabase.from('orders') as any)
    .select(`
      id, status, delivery_type, delivery_address, delivery_date, delivery_zone_name, delivery_price,
      payment_type, deposit_amount, total_price, notes, created_at,
      promo_code, promo_discount_pct, discount_amount,
      clients(first_name, phone),
      order_items(product_name, variant_label, unit_price, quantity, line_total, customization_note),
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
    delivery_price: number | null
    payment_type: string
    deposit_amount: number
    total_price: number
    notes: string | null
    created_at: string
    promo_code: string | null
    promo_discount_pct: number | null
    discount_amount: number | null
    clients: { first_name: string; phone: string } | null
    order_items: (OrderItem & { customization_note?: string | null })[]
    shops: (Pick<Shop, 'name' | 'slug' | 'primary_color' | 'phone_whatsapp' | 'logo_url'> & { currency?: string | null }) | null
  }

  const shop = order.shops
  if (!shop || shop.slug !== slug) notFound()

  // Relevé (§6 de la spec) — mêmes règles que success/page.tsx : pas de ligne
  // "remise sur quantité", donnée non persistée (voir REPRISE.md).
  const summaryItemsSubtotal = order.order_items.reduce((sum, it) => sum + it.line_total, 0)
  const summaryIsOnline = order.payment_type === 'online_full' || order.payment_type === 'online_deposit'
  const summaryAmountNow = summaryIsOnline
    ? (order.payment_type === 'online_deposit' ? order.deposit_amount : order.total_price)
    : 0
  const summaryAmountLater = summaryIsOnline
    ? (order.payment_type === 'online_deposit' ? order.total_price - order.deposit_amount : 0)
    : order.total_price

  const color       = 'var(--brand)'
  const currency    = (shop.currency ?? 'XOF') as ShopCurrency
  const isCancelled = order.status === 'cancelled'
  const isDelivered = order.status === 'delivered'
  const isCompleted = order.status === 'completed'
  const currentStep = STATUS_STEP[order.status] ?? 1

  // Détection digitale + tokens de téléchargement
  const { data: rawTokens } = await (supabase as any)
    .from('download_tokens')
    .select('token, expires_at, download_count, max_downloads, products(name, digital_file_name, digital_file_size)')
    .eq('order_id', order.id)

  type DownloadToken = {
    token: string
    expires_at: string
    download_count: number
    max_downloads: number
    products: { name: string; digital_file_name: string | null; digital_file_size: number | null } | null
  }
  const downloadTokens = (rawTokens ?? []) as DownloadToken[]

  const { data: rawOrderItems } = await (supabase as any)
    .from('order_items')
    .select('product_id, products(product_type)')
    .eq('order_id', order.id)

  const orderItemsWithType = (rawOrderItems ?? []) as Array<{
    product_id: string
    products: { product_type: string | null } | null
  }>

  // hasDigitalItem (au moins un article digital) sert à décider si un bloc
  // téléchargement doit exister — utile aussi sur un panier mixte.
  // isDigitalOrder (tous les articles sont digitaux) sert à décider si les infos
  // de livraison ont un sens à afficher — corrige un bug pré-existant, découvert
  // en marge du lot D (REPRISE.md §33) : avant, une seule variable "au moins un"
  // pilotait aussi ce second usage, masquant la vraie adresse/mode de livraison
  // d'un panier mixte (physique + digital) qui en avait pourtant besoin.
  const hasDigitalItem  = downloadTokens.length > 0 || isCompleted || orderItemsWithType.some(item => item.products?.product_type === 'digital')
  const hasPhysicalItem = orderItemsWithType.some(item => item.products?.product_type !== 'digital')
  const isDigitalOrder  = hasDigitalItem && !hasPhysicalItem

  const waLink = shop.phone_whatsapp
    ? `https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour, je voudrais des informations sur ma commande #${order.id.slice(0, 8).toUpperCase()}`)}`
    : null

  // Bannière héro — couleur + message selon statut
  const heroBg = isCancelled ? '#EF4444' : (isDelivered || isCompleted) ? '#16A34A' : color
  const heroMsg = isCancelled
    ? 'Commande annulée'
    : isCompleted && isDigitalOrder
    ? 'Achat confirmé'
    : isDelivered
    ? 'Commande livrée !'
    : isDigitalOrder && (order.status === 'confirmed')
    ? 'Paiement reçu'
    : `En cours · ${STEPS.find(s => s.step === currentStep)?.label ?? 'Reçue'}`

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
            <p className="text-xs text-gray-500">Suivi de commande</p>
          </div>
        </div>

        {/* Bannière héro */}
        <div
          className="rounded-2xl p-4 text-white"
          style={{ backgroundColor: heroBg }}
        >
          {order.clients?.first_name && (
            <p className="text-xs font-medium text-white/80 mb-0.5">
              Bonjour {order.clients.first_name}
            </p>
          )}
          <p className="text-lg font-bold leading-tight">{heroMsg}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-white/80">
            <span className="font-mono font-bold text-white">#{order.id.slice(0, 8).toUpperCase()}</span>
            <span>·</span>
            <span>{format(new Date(order.created_at), 'd MMM yyyy', { locale: fr })}</span>
          </div>
          {!isCancelled && !isDelivered && order.delivery_date && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              <Clock className="h-3 w-3" />
              {deliveryDateLabel(order.delivery_date)}
            </div>
          )}
        </div>

        {/* Étapes de progression — masquées pour les commandes digitales */}
        {!isDigitalOrder && (
          isCancelled ? (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Commande annulée</p>
                  {waLink && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Contacte la boutique pour plus d'informations.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-5 right-5 top-5 h-0.5 bg-gray-100 -z-0" />
                {STEPS.map((s) => {
                  const done   = s.step < currentStep
                  const active = s.step === currentStep
                  const Icon   = s.icon
                  return (
                    <div key={s.key} className="flex flex-col items-center gap-1.5 z-10">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                          active
                            ? 'border-[var(--brand)] bg-white shadow-md shadow-[color:var(--brand)]/20'
                            : done
                            ? 'border-transparent bg-[var(--brand)]'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        ) : (
                          <Icon
                            className={`h-4 w-4 ${active ? 'text-[var(--brand)]' : 'text-gray-300'}`}
                          />
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-semibold text-center leading-tight ${
                          active ? 'text-gray-900' : done ? 'text-gray-500' : 'text-gray-300'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        )}

        {/* Section téléchargements — au moins un article digital, même sur un panier mixte */}
        {hasDigitalItem && (
          <div>
            {downloadTokens.length > 0 ? (
              <div className="space-y-3">
                {downloadTokens.map((dt) => {
                  const prod = dt.products
                  const remaining = dt.max_downloads - dt.download_count
                  const expiresAt = new Date(dt.expires_at)
                  const fileSizeStr = prod?.digital_file_size
                    ? prod.digital_file_size > 1024 * 1024
                      ? `${(prod.digital_file_size / (1024 * 1024)).toFixed(1)} MB`
                      : `${Math.round(prod.digital_file_size / 1024)} KB`
                    : null
                  return (
                    <div key={dt.token} className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-violet-500 mb-2">
                        Téléchargement numérique
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mb-0.5">
                        {prod?.digital_file_name ?? prod?.name ?? 'Fichier'}
                        {fileSizeStr && <span className="text-gray-400 font-normal ml-1">({fileSizeStr})</span>}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expire le {expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        </span>
                        <span>{remaining} téléchargement{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}</span>
                      </div>
                      <a
                        href={`/api/download/${dt.token}`}
                        download
                        className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: color }}
                      >
                        <Download className="h-4 w-4" />
                        Télécharger
                      </a>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">Lien de téléchargement en cours de génération</p>
                <p className="text-xs text-amber-700">
                  Ton lien sera disponible ici dès confirmation du paiement. Tu le recevras aussi par SMS/WhatsApp.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Livraison — masquée pour commandes digitales */}
        {!isDigitalOrder && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-2.5">
          <div className="flex items-center gap-2">
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
              <span className="font-semibold text-gray-900" style={{ color }}>
                {deliveryDateLabel(order.delivery_date)}
              </span>
            </div>
          )}
          {order.delivery_zone_name && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Zone</span>
              <span className="font-medium text-gray-900">{order.delivery_zone_name}</span>
            </div>
          )}
          {order.delivery_address && (
            <div className="flex items-start justify-between text-sm gap-4">
              <span className="text-gray-500 shrink-0">Adresse</span>
              <span className="font-medium text-gray-900 text-right">{order.delivery_address}</span>
            </div>
          )}
        </div>
        )}

        {/* Articles commandés */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Articles commandés</p>
          </div>
          <div className="space-y-3 divide-y divide-gray-50">
            {order.order_items.map((item, i) => (
              <div key={i} className="pt-3 first:pt-0">
                <div className="flex items-start justify-between text-sm">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    {item.variant_label && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.variant_label}</p>
                    )}
                    {item.quantity > 1 && (
                      <p className="text-xs text-gray-400">× {item.quantity}</p>
                    )}
                    {item.customization_note && (
                      <p className="text-xs italic text-gray-500 mt-1 bg-gray-50 rounded-lg px-2 py-1">
                        {item.customization_note}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 shrink-0">
                    {formatPrice(item.line_total, currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-base font-bold" style={{ color }}>
              {formatPrice(order.total_price, currency)}
            </span>
          </div>
        </div>

        {/* Relevé — §6 de la spec */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Ce que tu as payé</p>
          </div>
          <OrderSummary
            currency={currency}
            itemCount={order.order_items.length}
            itemsSubtotal={summaryItemsSubtotal}
            promoCode={order.promo_code}
            promoDiscountPct={order.promo_discount_pct}
            promoAmount={order.discount_amount}
            deliveryAmount={order.delivery_price}
            deliveryZoneName={order.delivery_zone_name}
            total={order.total_price}
            amountNow={summaryAmountNow}
            amountLater={summaryAmountLater}
            laterContext={isDigitalOrder ? null : order.delivery_type}
          />
        </div>

        {/* Note client */}
        {order.notes && (
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">Ta note</p>
            <p className="text-sm text-amber-900">"{order.notes}"</p>
          </div>
        )}

        {/* Laisser un avis — commandes confirmées ou livrées */}
        {['confirmed', 'preparing', 'ready', 'delivered'].includes(order.status) && (
          <a
            href={`/${slug}/avis/${token}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 py-3.5 text-sm font-semibold transition-colors"
            style={{ borderColor: color, color }}
          >
            <Star className="h-4 w-4" />
            Laisser un avis
          </a>
        )}

        {/* Contact boutique */}
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#20bb5a] transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Contacter {shop.name}
          </a>
        )}

      </div>
    </div>
  )
}
