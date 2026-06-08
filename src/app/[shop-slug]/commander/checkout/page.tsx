import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { WaveCheckout } from './WaveCheckout'
import { OrangeMoneyCheckout } from './OrangeMoneyCheckout'
import { BictorysCheckout } from './BictorysCheckout'
import { getCountryFromPhone } from '@/lib/payments/payment-methods'
import type { Shop } from '@/types'

type Props = {
  params: Promise<{ 'shop-slug': string }>
  searchParams: Promise<{ order_id?: string; method?: string }>
}

export const metadata = { title: 'Paiement' }

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { 'shop-slug': slug } = await params
  const { order_id, method } = await searchParams

  if (!order_id || !method) notFound()

  const supabase = createAdminClient()

  const { data: orderData } = await supabase
    .from('orders')
    .select('id, shop_id, total_price, deposit_amount, payment_type, status, clients(first_name, phone), shops(name, slug, primary_color, logo_url)')
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
    shops: Pick<Shop, 'name' | 'slug' | 'primary_color' | 'logo_url'> | null
  }

  const shop = order.shops
  if (!shop || shop.slug !== slug) notFound()

  const phone = order.clients?.phone ?? ''
  const country = getCountryFromPhone(phone)
  const isDeposit = order.payment_type === 'online_deposit' && order.deposit_amount > 0
  const amount = isDeposit ? order.deposit_amount : order.total_price
  const color = shop.primary_color ?? '#0EA5E9'

  const componentProps = {
    orderId: order.id,
    shopSlug: slug,
    customerName: order.clients?.first_name ?? '',
    customerPhone: phone,
    amount,
    shopName: shop.name,
    shopLogo: shop.logo_url,
    primaryColor: color,
    isDeposit,
  }

  // Routage selon la méthode de paiement et le pays
  // Wave Money : SN et CI ont des deep links directs
  if (method === 'wave' && country === 'SN') {
    return <WaveCheckout {...componentProps} country={country} />
  }

  if (method === 'wave' && country === 'CI') {
    return <WaveCheckout {...componentProps} country={country} />
  }

  // Orange Money : CI utilise OTP, SN utilise Bictorys
  if (method === 'orange_money' && country === 'CI') {
    return <OrangeMoneyCheckout {...componentProps} />
  }

  // Pour tout le reste, utiliser Bictorys (maxit, orange_money SN, bictorys fallback)
  // Plus tous les autres pays qui utilisent Bictorys par défaut
  return <BictorysCheckout {...componentProps} />
}
