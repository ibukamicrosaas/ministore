import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, MessageCircle, ShoppingBag, Home, MapPin } from 'lucide-react'
import { PixelPurchase } from './PixelPurchase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Shop, OrderItem } from '@/types'

type Props = {
  params: Promise<{ 'shop-slug': string }>
  searchParams: Promise<{ order_id?: string; token?: string }>
}

export const metadata = { title: 'Commande confirmée ✓' }

export default async function SuccessPage({ params, searchParams }: Props) {
  const { 'shop-slug': slug } = await params
  const { order_id, token } = await searchParams

  if (!order_id || !token) notFound()

  const supabase = createAdminClient()

  const { data: orderData } = await supabase
    .from('orders')
    .select(`
      id, status, delivery_type, delivery_address, delivery_date,
      payment_type, deposit_amount, total_price, notes,
      clients(first_name, phone, whatsapp),
      order_items(product_name, variant_label, unit_price, quantity, line_total),
      shops(name, slug, primary_color, phone_whatsapp)
    `)
    .eq('id', order_id)
    .eq('client_token', token)
    .single()

  if (!orderData) notFound()

  const order = orderData as unknown as {
    id: string
    status: string
    delivery_type: 'home_delivery' | 'store_pickup'
    delivery_address: string | null
    delivery_date: string | null
    payment_type: string
    deposit_amount: number
    total_price: number
    notes: string | null
    clients: { first_name: string; phone: string; whatsapp: string | null } | null
    order_items: OrderItem[]
    shops: Pick<Shop, 'name' | 'slug' | 'primary_color' | 'phone_whatsapp'> | null
  }

  const shop  = order.shops
  const color = shop?.primary_color ?? '#0EA5E9'

  const isOnline   = order.payment_type === 'online_full' || order.payment_type === 'online_deposit'
  const isPaid     = order.status === 'confirmed'
  const clientWa   = order.clients?.whatsapp ?? order.clients?.phone
  const waShopLink = shop?.phone_whatsapp
    ? `https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}`
    : null

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-12 text-center">
      <PixelPurchase
        orderId={order.id}
        total={order.total_price}
        items={order.order_items.map(i => ({
          productName: i.product_name,
          unitPrice:   i.unit_price,
          quantity:    i.quantity,
        }))}
      />

      {/* Icône succès */}
      <div
        className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}20` }}
      >
        <CheckCircle2 className="h-10 w-10" style={{ color }} />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {isOnline && isPaid ? 'Paiement reçu ✓' : 'Commande confirmée !'}
      </h1>
      <p className="text-sm text-gray-500 mb-3">
        {isOnline && isPaid
          ? 'Votre paiement a été reçu. La boutique prépare votre commande.'
          : order.payment_type === 'on_delivery'
          ? 'Vous payerez à la livraison. La boutique a été notifiée.'
          : 'Vous payerez en boutique. La boutique a été notifiée.'}
      </p>
      <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 mb-6">
        <span className="text-xs text-gray-500">Référence</span>
        <span className="text-xs font-bold font-mono text-gray-800 tracking-widest">
          #{order.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* Récap */}
      <div className="rounded-2xl border border-gray-200 bg-white text-left divide-y divide-gray-100 mb-6">

        {/* Articles */}
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Articles commandés</p>
          <div className="space-y-2">
            {order.order_items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{item.product_name}</span>
                  {item.variant_label && (
                    <span className="text-gray-500 ml-1">({item.variant_label})</span>
                  )}
                  {item.quantity > 1 && <span className="text-gray-500 ml-1">×{item.quantity}</span>}
                </div>
                <span className="font-medium text-gray-900 shrink-0">
                  {item.line_total.toLocaleString('fr-FR')} F
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-base font-bold" style={{ color }}>{order.total_price.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>

        {/* Livraison */}
        <div className="p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Livraison</p>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            {order.delivery_type === 'home_delivery'
              ? <Home className="h-4 w-4 text-gray-400 shrink-0" />
              : <MapPin className="h-4 w-4 text-gray-400 shrink-0" />}
            <span>{order.delivery_type === 'home_delivery' ? 'À domicile' : 'Retrait en boutique'}</span>
          </div>
          {order.delivery_date && (
            <p className="text-sm text-gray-600 pl-6">
              {format(new Date(order.delivery_date + 'T12:00:00'), 'EEEE d MMMM yyyy', { locale: fr })}
            </p>
          )}
          {order.delivery_address && (
            <p className="text-xs text-gray-500 pl-6">{order.delivery_address}</p>
          )}
        </div>

        {/* Paiement */}
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Paiement</p>
          {isOnline && isPaid ? (
            <p className="text-sm text-green-600 font-medium">✓ Paiement reçu</p>
          ) : isOnline ? (
            <p className="text-sm text-amber-600">Paiement en attente de confirmation</p>
          ) : order.payment_type === 'on_delivery' ? (
            <p className="text-sm text-gray-700">À la livraison — {order.total_price.toLocaleString('fr-FR')} FCFA</p>
          ) : (
            <p className="text-sm text-gray-700">En boutique — {order.total_price.toLocaleString('fr-FR')} FCFA</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Lien de suivi */}
        <Link
          href={`/${slug}/commande/${token}`}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: color }}
        >
          <Home className="h-4 w-4" />
          Suivre ma commande
        </Link>

        {waShopLink && (
          <a
            href={waShopLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-semibold text-white hover:bg-[#20bb5a] transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Contacter la boutique
          </a>
        )}
        <Link
          href={`/${slug}`}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ShoppingBag className="h-4 w-4" />
          Continuer mes achats
        </Link>
      </div>

      {order.notes && (
        <p className="mt-6 text-xs text-gray-400">Note transmise : "{order.notes}"</p>
      )}
    </div>
  )
}
