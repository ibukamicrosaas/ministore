import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SubscriptionCheckoutForm } from './SubscriptionCheckoutForm'

interface Plan {
  key: string
  name: string
  price: string
  priceInt: number
}

const PLANS: Record<string, Plan> = {
  decouverte: { key: 'decouverte', name: 'Découverte', price: '2 900', priceInt: 2900 },
  business: { key: 'business', name: 'Business', price: '4 900', priceInt: 4900 },
  pro: { key: 'pro', name: 'Pro', price: '9 900', priceInt: 9900 },
}

type Props = {
  searchParams: Promise<{ plan?: string }>
}

export default async function SubscriptionCheckoutPage({ searchParams }: Props) {
  const { plan: planKey } = await searchParams

  // Backward compatibility: map 'decouverte' to 'decouverte'
  const normalizedKey = planKey === 'decouverte' ? 'decouverte' : planKey
  const plan = normalizedKey && PLANS[normalizedKey] ? PLANS[normalizedKey] : null

  if (!plan) {
    notFound()
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id) {
    notFound()
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('name, primary_color')
    .eq('id', profile.shop_id)
    .single()

  if (!shop) {
    notFound()
  }

  return (
    <SubscriptionCheckoutForm
      plan={plan}
      shopName={shop.name}
      primaryColor={shop.primary_color ?? '#0EA5E9'}
    />
  )
}
