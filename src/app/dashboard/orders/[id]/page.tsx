import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader } from '@/components/ui/Card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ChevronLeft, MapPin, Home, MessageCircle, CreditCard, CheckCircle2, Clock, Download,
} from 'lucide-react'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, TEKKISHOP_COMMISSION_RATE } from '@/constants'
import { advanceOrderStatus } from '@/lib/actions/orders'
import { CancelOrderButton } from './CancelOrderButton'
import { CopyReviewLinkButton } from './CopyReviewLinkButton'
import { SendToDeliveryButton } from './SendToDeliveryButton'
import { DigitalDeliveryCard } from './DigitalDeliveryCard'
import type { Profile, OrderItem } from '@/types'
import { APP_URL } from '@/constants'
import { loadOrderForMerchant } from '@/lib/orders/redact'

export const metadata = { title: 'Commande — TekkiShop' }

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']
const DIGITAL_STATUS_FLOW = ['pending', 'confirmed', 'completed']
const DIGITAL_STATUS_LABELS: Record<string, string> = {
  pending:   'En attente',
  confirmed: 'Paiement reçu',
  completed: 'Accès envoyé',
}

const NEXT_ACTION_LABEL: Record<string, string> = {
  pending:   'Confirmer la commande',
  confirmed: 'Marquer en préparation',
  preparing: 'Marquer prête',
  ready:     'Marquer livrée',
}

type OrderRow = {
  id: string
  status: string
  client_token: string
  delivery_token: string
  delivery_type: 'home_delivery' | 'store_pickup'
  delivery_address: string | null
  delivery_date: string | null
  delivery_zone_name: string | null
  payment_type: string
  payment_method: string | null
  deposit_amount: number
  deposit_paid: boolean
  total_price: number
  notes: string | null
  internal_notes: string | null
  created_at: string
  is_held: boolean
  released_at: string | null
  clients: {
    id: string; first_name: string; last_name: string | null
    phone: string; whatsapp: string | null
  } | null
  order_items: (OrderItem & {
    products: { name: string; product_type: string | null } | null
    customization_note?: string | null
  })[]
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, status, client_token, delivery_token, delivery_type, delivery_address,
      delivery_date, delivery_zone_name, payment_type, payment_method,
      deposit_amount, deposit_paid, total_price, notes, internal_notes, created_at, is_held, released_at,
      clients(id, first_name, last_name, phone, whatsapp),
      order_items(id, product_name, variant_label, unit_price, quantity, line_total, customization_note, products(name, product_type))
    `)
    .eq('id', id)
    .eq('shop_id', profile.shop_id)
    .single()

  if (error || !data) notFound()

  const { data: shopData } = await supabase
    .from('shops')
    .select('slug, currency')
    .eq('id', profile.shop_id)
    .single()
  const shopSlug    = (shopData as { slug?: string; currency?: string | null } | null)?.slug ?? ''
  const shopCurrency = (shopData as { slug?: string; currency?: string | null } | null)?.currency ?? 'XOF'

  const order = data as unknown as OrderRow

  // Toute donnée client/adresse/notes/jeton livreur affichée ou transmise à
  // un composant enfant (SendToDeliveryButton, CopyReviewLinkButton,
  // DigitalDeliveryCard) passe par ici — jamais order.clients /
  // order.delivery_address / order.notes / order.delivery_token
  // directement. Voir src/lib/orders/redact.ts.
  const merchantOrder  = loadOrderForMerchant(order)
  const blocked        = merchantOrder.blocked
  const merchantClient = merchantOrder.merchantClient
  const visibleAddress = merchantOrder.delivery_address
  const visibleZone    = merchantOrder.delivery_zone_name
  const visibleNotes   = merchantOrder.notes

  // Detect digital order — all items must be digital products
  const isDigitalOrder = order.order_items.length > 0 &&
    order.order_items.every(item => (item.products as any)?.product_type === 'digital')

  const statusFlow   = isDigitalOrder ? DIGITAL_STATUS_FLOW : STATUS_FLOW
  const statusLabels = isDigitalOrder ? DIGITAL_STATUS_LABELS : ORDER_STATUS_LABELS

  // Digital orders don't need manual advancement through physical fulfilment steps
  const canAdvance = !isDigitalOrder && NEXT_ACTION_LABEL[order.status] !== undefined
  const canCancel  = ['pending', 'confirmed', 'preparing'].includes(order.status)

  // Commande digitale retenue et payée : l'argent existe, il est bloqué côté
  // marchand jusqu'à l'activation — voir ADDITIF-argent-commandes-retenues.md.
  let heldFundsNet: number | null = null
  if (blocked && isDigitalOrder) {
    const { data: paymentData } = await supabase
      .from('payments')
      .select('amount')
      .eq('order_id', id)
      .eq('status', 'completed')
      .maybeSingle()
    if (paymentData) {
      heldFundsNet = paymentData.amount - Math.floor(paymentData.amount * (TEKKISHOP_COMMISSION_RATE / 100))
    }
  }

  // Tokens de téléchargement pour les commandes digitales
  const { data: downloadTokensData } = await supabase
    .from('download_tokens' as never)
    .select('id, token, expires_at, download_count, max_downloads, downloaded_at, products(name, digital_file_name)' as never)
    .eq('order_id', id)
  const downloadTokens = (downloadTokensData ?? []) as Array<{
    id: string; token: string; expires_at: string
    download_count: number; max_downloads: number; downloaded_at: string | null
    products: { name: string; digital_file_name: string | null } | null
  }>

  const clientWhatsapp = merchantClient.clientWhatsapp ?? merchantClient.clientPhone
  const waLink = clientWhatsapp
    ? `https://wa.me/${clientWhatsapp.replace(/\D/g, '')}`
    : null

  const METHOD_NAMES: Record<string, string> = {
    wave:         'Wave',
    orange_money: 'Orange Money',
    mtn_money:    'MTN Money',
    maxit:        'MaxIt',
    stripe_card:  'Carte bancaire',
    bictorys:     'Mobile Money',
  }
  const methodName = order.payment_method ? (METHOD_NAMES[order.payment_method] ?? order.payment_method) : null

  // For digital orders, 'confirmed' = payment received + access sent
  const isOnlinePaymentReceived =
    order.payment_type !== 'on_delivery' &&
    order.payment_type !== 'on_site' && (
      order.status === 'completed' ||
      (isDigitalOrder && order.status === 'confirmed') ||
      (order.deposit_paid && order.deposit_amount > 0)
    )

  const paymentLabel = order.payment_type === 'on_delivery'
    ? 'Paiement à la livraison'
    : order.payment_type === 'on_site'
    ? 'Paiement en boutique'
    : isOnlinePaymentReceived
    ? `Paiement reçu${methodName ? ` — ${methodName}` : ''}${order.deposit_paid && order.deposit_amount > 0 && order.payment_type !== 'online_full' ? ` (acompte ${order.deposit_amount.toLocaleString('fr-FR')} FCFA)` : ''}`
    : methodName
    ? `Paiement en ligne — ${methodName} (en attente)`
    : 'Paiement en ligne — en attente'

  return (
    <div className="max-w-xl space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/orders" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" />
          Commandes
        </Link>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {order.clients ? merchantClient.clientName : 'Commande'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(order.created_at), 'd MMMM yyyy à HH:mm', { locale: fr })}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {/* Progression statut */}
      <Card padding="md">
        <div className="flex items-center gap-1">
          {statusFlow.map((s, i) => {
            const idx  = statusFlow.indexOf(order.status)
            const done = i <= idx
            const last = i === statusFlow.length - 1
            return (
              <div key={s} className="flex flex-1 items-center gap-1">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  done ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {done && i < idx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                {!last && (
                  <div className={`flex-1 h-0.5 ${i < idx ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-1">
          {statusFlow.map(s => (
            <p key={s} className="text-[9px] text-gray-400 text-center flex-1">
              {statusLabels[s] ?? ORDER_STATUS_LABELS[s] ?? s}
            </p>
          ))}
        </div>
      </Card>

      {/* Commande retenue : toutes les actions sont désactivées tant que la
          boutique n'est pas activée — un marchand ne doit pas pouvoir la
          faire avancer (livraison, statut, annulation) en contournant le blocage. */}
      {blocked && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {heldFundsNet !== null
            ? <>💰 Payée. Fichier envoyé au client. Les {heldFundsNet.toLocaleString('fr-FR')} F sont bloqués jusqu&apos;à l&apos;activation de ta boutique.</>
            : <>Commande retenue — {merchantClient.clientName}. Active ta boutique pour la traiter.</>}
        </div>
      )}

      {/* Actions */}
      {!blocked && (canAdvance || canCancel) && (
        <div className="flex gap-2">
          {canAdvance && (
            <form action={async () => { 'use server'; await advanceOrderStatus(id) }} className="flex-1">
              <button
                type="submit"
                className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                {NEXT_ACTION_LABEL[order.status]}
              </button>
            </form>
          )}
          {canCancel && <CancelOrderButton orderId={id} />}
        </div>
      )}

      {/* Bouton livreur — uniquement pour les livraisons à domicile physiques en cours */}
      {!isDigitalOrder &&
        order.delivery_type === 'home_delivery' &&
        order.delivery_token &&
        shopSlug &&
        (blocked || ['confirmed', 'preparing', 'ready'].includes(order.status)) && (
        <SendToDeliveryButton
          blocked={blocked}
          shopSlug={shopSlug}
          deliveryToken={merchantOrder.delivery_token ?? ''}
          clientName={merchantClient.clientName}
          clientPhone={merchantClient.clientPhone ?? ''}
          deliveryAddress={visibleAddress}
          deliveryZone={visibleZone}
          items={order.order_items.map(i => ({
            product_name:  i.product_name,
            variant_label: i.variant_label,
            quantity:      i.quantity,
          }))}
          paymentType={order.payment_type}
          totalPrice={order.total_price}
          currency={shopCurrency}
          orderId={order.id}
        />
      )}

      {/* Articles */}
      <Card padding="none">
        <CardHeader title="Articles commandés" className="px-4 pt-4 pb-3 border-b border-gray-100" />
        <div className="divide-y divide-gray-100">
          {order.order_items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                {item.variant_label && (
                  <p className="text-xs text-gray-500">{item.variant_label}</p>
                )}
                {item.customization_note && (
                  <p className="text-xs text-indigo-600 font-medium">✏ {item.customization_note}</p>
                )}
                <p className="text-xs text-gray-400">
                  {item.unit_price.toLocaleString('fr-FR')} FCFA × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {item.line_total.toLocaleString('fr-FR')} F
              </p>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
            <p className="text-sm font-bold text-gray-900">Total</p>
            <p className="text-base font-bold text-gray-900">{order.total_price.toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>
      </Card>

      {/* Téléchargements digitaux — mis en avant pour les commandes numériques */}
      {isDigitalOrder && (
        <DigitalDeliveryCard
          blocked={blocked}
          tokens={downloadTokens}
          orderId={id}
          clientPhone={merchantClient.clientWhatsapp ?? merchantClient.clientPhone ?? ''}
          clientName={merchantClient.clientName || 'le client'}
          appUrl={APP_URL}
        />
      )}

      {/* Accès / Livraison & paiement */}
      <Card>
        <p className="text-sm font-semibold text-gray-900 mb-3">
          {isDigitalOrder ? 'Accès & paiement' : 'Livraison & paiement'}
        </p>
        <div className="space-y-2 text-sm text-gray-600">
          {isDigitalOrder ? (
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-gray-400 shrink-0" />
              <span>Téléchargement numérique</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {order.delivery_type === 'home_delivery' ? (
                  <Home className="h-4 w-4 text-gray-400 shrink-0" />
                ) : (
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                )}
                <span>{order.delivery_type === 'home_delivery' ? 'Livraison à domicile' : 'Retrait en boutique'}</span>
              </div>
              {order.delivery_date && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{format(new Date(order.delivery_date + 'T12:00:00'), 'EEEE d MMMM yyyy', { locale: fr })}</span>
                </div>
              )}
              {visibleAddress && (
                <p className="pl-6 text-xs text-gray-500">{visibleAddress}</p>
              )}
            </>
          )}
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{paymentLabel}</span>
          </div>
        </div>
        {visibleNotes && (
          <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2">
            <p className="text-xs font-medium text-gray-500 mb-0.5">Note du client</p>
            <p className="text-sm text-gray-700">{visibleNotes}</p>
          </div>
        )}
      </Card>

      {/* Client */}
      {order.clients && (
        <Card className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Client</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {merchantClient.clientName}
              </p>
              {merchantClient.clientPhone && (
                <p className="text-xs text-gray-500 mt-0.5">{merchantClient.clientPhone}</p>
              )}
            </div>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-semibold text-white hover:bg-[#20bb5a] transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Contacter
              </a>
            )}
          </div>
          {!blocked && shopSlug && order.client_token && ['confirmed', 'preparing', 'ready', 'delivered', 'completed'].includes(order.status) && (
            <CopyReviewLinkButton
              reviewUrl={`${APP_URL}/${shopSlug}/avis/${order.client_token}`}
              clientName={merchantClient.clientName}
              waNumber={merchantClient.clientWhatsapp ?? merchantClient.clientPhone ?? ''}
            />
          )}
        </Card>
      )}

      {/* Téléchargements digitaux — pour commandes mixtes */}
      {!isDigitalOrder && downloadTokens.length > 0 && (
        <DigitalDeliveryCard
          blocked={blocked}
          tokens={downloadTokens}
          orderId={id}
          clientPhone={merchantClient.clientWhatsapp ?? merchantClient.clientPhone ?? ''}
          clientName={merchantClient.clientName || 'le client'}
          appUrl={APP_URL}
        />
      )}
    </div>
  )
}
