import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createBictorysCharge } from '@/lib/payments/bictorys'
import { APP_URL } from '@/constants'
import type { Shop } from '@/types'

type Props = {
  params: Promise<{ 'shop-slug': string }>
  searchParams: Promise<{ order_id?: string; cancelled?: string }>
}

export const metadata = { title: 'Paiement en cours...' }

export default async function PayPage({ params, searchParams }: Props) {
  const { 'shop-slug': slug } = await params
  const { order_id, cancelled } = await searchParams

  const supabase = createAdminClient()

  if (!order_id) notFound()

  // Annulation depuis Bictorys
  if (cancelled === '1') {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="text-4xl mb-4">😕</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Paiement annulé</h1>
        <p className="text-sm text-gray-500 mb-6">Votre commande est en attente. Vous pouvez réessayer ou choisir de payer à la réception.</p>
        <a
          href={`/${slug}/commander`}
          className="rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white"
        >
          Retour à la boutique
        </a>
      </div>
    )
  }

  // Charger la commande
  const { data: orderData } = await supabase
    .from('orders')
    .select('id, shop_id, total_price, deposit_amount, payment_type, status, clients(first_name, phone)')
    .eq('id', order_id)
    .single()

  if (!orderData || orderData.status !== 'pending') notFound()

  const order = orderData as unknown as {
    id: string; shop_id: string; total_price: number; deposit_amount: number
    payment_type: string; status: string
    clients: { first_name: string; phone: string } | null
  }

  // Charger la boutique
  const { data: shopData } = await supabase
    .from('shops')
    .select('name, slug')
    .eq('id', order.shop_id)
    .single()

  const shop = shopData as Pick<Shop, 'name' | 'slug'> | null
  if (!shop) notFound()

  const apiKey = process.env.BICTORYS_SECRET_KEY
  if (!apiKey) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-sm text-red-500">Service de paiement non configuré. Veuillez contacter la boutique.</p>
      </div>
    )
  }

  const amountToCharge = order.payment_type === 'online_deposit' && order.deposit_amount > 0
    ? order.deposit_amount
    : order.total_price

  try {
    const { checkoutUrl, transactionId } = await createBictorysCharge(apiKey, {
      amount:             amountToCharge,
      currency:           'XOF',
      paymentReference:   `tekkishop-${order.id.slice(0, 8)}`,
      merchantReference:  order.id,
      successRedirectUrl: `${APP_URL}/${slug}/commander/success?order_id=${order.id}`,
      errorRedirectUrl:   `${APP_URL}/${slug}/commander/pay?order_id=${order.id}&cancelled=1`,
      orderDetails: [{
        name:     `Commande ${shop.name}`,
        price:    amountToCharge,
        quantity: 1,
        taxRate:  0,
      }],
      customerObject: {
        name:  order.clients?.first_name,
        phone: order.clients?.phone,
        locale: 'fr-FR',
      },
    })

    // Enregistrer le paiement
    await supabase.from('payments').insert({
      order_id:           order.id,
      shop_id:            order.shop_id,
      amount:             amountToCharge,
      currency:           'XOF',
      payment_method:     'bictorys',
      payment_type:       order.payment_type === 'online_deposit' ? 'deposit' : 'full',
      provider_payment_id: transactionId || `bictorys-${order.id}`,
      status:             'pending',
    })

    redirect(checkoutUrl)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[pay/page]', msg)
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Erreur de paiement</h1>
        <p className="text-sm text-gray-500 mb-6">Impossible d'initialiser le paiement. Réessayez ou choisissez le paiement à la réception.</p>
        <a href={`/${slug}/commander`} className="rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white">
          Retour à la boutique
        </a>
      </div>
    )
  }
}
