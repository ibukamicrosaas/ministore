import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader } from '@/components/ui/Card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ChevronLeft, MapPin, Home, MessageCircle, CreditCard, CheckCircle2, Clock,
} from 'lucide-react'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/constants'
import { advanceOrderStatus, cancelOrder } from '@/lib/actions/orders'
import type { Profile, OrderItem } from '@/types'

export const metadata = { title: 'Commande — TekkiShop' }

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

const NEXT_ACTION_LABEL: Record<string, string> = {
  pending:   'Confirmer la commande',
  confirmed: 'Marquer en préparation',
  preparing: 'Marquer prête',
  ready:     'Marquer livrée',
}

type OrderRow = {
  id: string
  status: string
  delivery_type: 'home_delivery' | 'store_pickup'
  delivery_address: string | null
  delivery_date: string | null
  payment_type: string
  payment_method: string | null
  deposit_amount: number
  deposit_paid: boolean
  total_price: number
  notes: string | null
  internal_notes: string | null
  created_at: string
  clients: {
    id: string; first_name: string; last_name: string | null
    phone: string; whatsapp: string | null
  } | null
  order_items: (OrderItem & { products: { name: string } | null })[]
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
      id, status, delivery_type, delivery_address, delivery_date,
      payment_type, payment_method, deposit_amount, deposit_paid,
      total_price, notes, internal_notes, created_at,
      clients(id, first_name, last_name, phone, whatsapp),
      order_items(id, product_name, variant_label, unit_price, quantity, line_total, products(name))
    `)
    .eq('id', id)
    .eq('shop_id', profile.shop_id)
    .single()

  if (error || !data) notFound()

  const order = data as unknown as OrderRow
  const canAdvance = NEXT_ACTION_LABEL[order.status] !== undefined
  const canCancel  = ['pending', 'confirmed', 'preparing'].includes(order.status)

  const clientWhatsapp = order.clients?.whatsapp ?? order.clients?.phone
  const waLink = clientWhatsapp
    ? `https://wa.me/${clientWhatsapp.replace(/\D/g, '')}`
    : null

  const paymentLabel = order.payment_type === 'on_delivery' ? 'Paiement à la livraison'
    : order.payment_type === 'on_site' ? 'Paiement en boutique'
    : order.deposit_paid ? `Acompte payé — ${order.deposit_amount.toLocaleString('fr-FR')} FCFA`
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
            {order.clients
              ? [order.clients.first_name, order.clients.last_name].filter(Boolean).join(' ')
              : 'Commande'}
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
          {STATUS_FLOW.map((s, i) => {
            const idx  = STATUS_FLOW.indexOf(order.status)
            const done = i <= idx
            const last = i === STATUS_FLOW.length - 1
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
          {STATUS_FLOW.map(s => (
            <p key={s} className="text-[9px] text-gray-400 text-center flex-1">{ORDER_STATUS_LABELS[s]}</p>
          ))}
        </div>
      </Card>

      {/* Actions */}
      {(canAdvance || canCancel) && (
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
          {canCancel && (
            <form action={async () => { 'use server'; await cancelOrder(id) }}>
              <button
                type="submit"
                className="rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                Annuler
              </button>
            </form>
          )}
        </div>
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

      {/* Livraison & paiement */}
      <Card>
        <p className="text-sm font-semibold text-gray-900 mb-3">Livraison & paiement</p>
        <div className="space-y-2 text-sm text-gray-600">
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
          {order.delivery_address && (
            <p className="pl-6 text-xs text-gray-500">{order.delivery_address}</p>
          )}
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{paymentLabel}</span>
          </div>
        </div>
        {order.notes && (
          <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2">
            <p className="text-xs font-medium text-gray-500 mb-0.5">Note du client</p>
            <p className="text-sm text-gray-700">{order.notes}</p>
          </div>
        )}
      </Card>

      {/* Client */}
      {order.clients && (
        <Card>
          <p className="text-sm font-semibold text-gray-900 mb-3">Client</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {[order.clients.first_name, order.clients.last_name].filter(Boolean).join(' ')}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{order.clients.phone}</p>
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
        </Card>
      )}
    </div>
  )
}
