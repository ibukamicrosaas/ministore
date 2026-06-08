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

  return <CheckoutForm shopSlug={slug} orderId={orderId} />
}
