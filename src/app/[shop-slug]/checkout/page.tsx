import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { CheckoutForm } from './CheckoutForm'

type Props = {
  params: Promise<{ 'shop-slug': string }>
  searchParams: Promise<{ order_id?: string }>
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { 'shop-slug': slug } = await params
  const { order_id: orderId } = await searchParams

  if (!orderId) {
    notFound()
  }

  const supabase = createAdminClient()

  // Récupérer la commande avec les infos du client
  const { data: orderData } = await supabase
    .from('orders')
    .select('id, total_price, deposit_amount, payment_type, status, client_token, clients(first_name, phone)')
    .eq('id', orderId)
    .single()

  if (!orderData || orderData.status !== 'pending') {
    notFound()
  }

  const order = orderData as any
  const clientName = order.clients?.first_name || ''
  const clientPhone = order.clients?.phone || ''

  return (
    <CheckoutForm
      shopSlug={slug}
      orderId={orderId}
      customerName={clientName}
      customerPhone={clientPhone}
    />
  )
}
