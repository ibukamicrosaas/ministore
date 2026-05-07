import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { PaymentMethodSelector } from './PaymentMethodSelector'
import type { Shop } from '@/types'

type Props = {
  params: Promise<{ 'shop-slug': string }>
  searchParams: Promise<{ order_id?: string; cancelled?: string }>
}

export const metadata = { title: 'Choisir un mode de paiement' }

export default async function PayPage({ params, searchParams }: Props) {
  const { 'shop-slug': slug } = await params
  const { order_id, cancelled } = await searchParams

  const supabase = createAdminClient()

  if (!order_id) notFound()

  if (cancelled === '1') {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="text-4xl mb-4">😕</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Paiement annulé</h1>
        <p className="text-sm text-gray-500 mb-6">
          Votre commande est en attente. Vous pouvez réessayer ou choisir de payer à la réception.
        </p>
        <a
          href={`/${slug}/commander`}
          className="rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white"
        >
          Retour à la boutique
        </a>
      </div>
    )
  }

  const { data: orderData } = await supabase
    .from('orders')
    .select('id, shop_id, total_price, deposit_amount, payment_type, status, clients(first_name, phone)')
    .eq('id', order_id)
    .single()

  if (!orderData || orderData.status !== 'pending') notFound()

  const order = orderData as unknown as {
    id: string
    shop_id: string
    total_price: number
    deposit_amount: number
    payment_type: string
    status: string
    clients: { first_name: string; phone: string } | null
  }

  const { data: shopData } = await supabase
    .from('shops')
    .select('name, slug, primary_color, logo_url')
    .eq('id', order.shop_id)
    .single()

  const shop = shopData as Pick<Shop, 'name' | 'slug' | 'primary_color' | 'logo_url'> | null
  if (!shop) notFound()

  const isDeposit = order.payment_type === 'online_deposit' && order.deposit_amount > 0
  const amount    = isDeposit ? order.deposit_amount : order.total_price
  const color     = shop.primary_color ?? '#0EA5E9'

  return (
    <div className="max-w-lg mx-auto min-h-screen px-4 pt-10 pb-10">
      {/* Bouton retour */}
      <div className="mb-6">
        <a
          href={`/${slug}/commander`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la boutique
        </a>
      </div>

      {/* En-tête */}
      <div className="text-center mb-8">
        {shop.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shop.logo_url}
            alt={shop.name}
            className="h-14 w-14 rounded-2xl object-cover shadow-md mx-auto mb-4"
          />
        ) : (
          <div
            className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white text-xl font-bold mb-4 shadow-md"
            style={{ backgroundColor: color }}
          >
            {shop.name[0]?.toUpperCase()}
          </div>
        )}
        <h1 className="text-xl font-bold text-gray-900">Choisir un mode de paiement</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isDeposit ? 'Acompte pour confirmer votre commande' : 'Paiement de votre commande'} chez{' '}
          <span className="font-semibold">{shop.name}</span>
        </p>
        <div
          className="inline-block mt-3 rounded-full px-4 py-1.5 text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {amount.toLocaleString('fr-FR')} FCFA
        </div>
      </div>

      <PaymentMethodSelector
        orderId={order.id}
        shopSlug={slug}
        customerFirstName={order.clients?.first_name ?? ''}
        customerPhone={order.clients?.phone ?? ''}
        amount={amount}
        primaryColor={color}
        isDeposit={isDeposit}
      />
    </div>
  )
}
