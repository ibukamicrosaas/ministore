import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SubscriptionCheckoutForm } from './SubscriptionCheckoutForm'
import { StripeSubscriptionCheckoutForm } from './StripeSubscriptionCheckoutForm'
import { isEuCaCountry, getCurrencyForCountry, PLAN_EUR_PRICES } from '@/lib/utils/country-groups'

interface Plan {
  key:         string
  name:        string
  price:       string
  priceInt:    number
  annualPrice: number
}

const PLANS: Record<string, Plan> = {
  decouverte: { key: 'decouverte', name: 'Découverte', price: '2 900', priceInt: 2900, annualPrice: 29000 },
  business:   { key: 'business',   name: 'Business',   price: '4 900', priceInt: 4900, annualPrice: 49000 },
  pro:        { key: 'pro',        name: 'Pro',         price: '9 900', priceInt: 9900, annualPrice: 99000 },
}

const PLAN_NAMES: Record<string, string> = {
  decouverte: 'Découverte',
  business:   'Business',
  pro:        'Pro',
}

// Prix Stripe pour EU/CA (en centimes)
const EU_CA_PRO_PRICES = {
  EUR: { monthly: 1490, annual: 14900 },
  CAD: { monthly: 1990, annual: 19900 },
}

type Props = {
  searchParams: Promise<{ plan?: string; billing?: string; method?: string }>
}

export default async function SubscriptionCheckoutPage({ searchParams }: Props) {
  const { plan: planKey, billing, method } = await searchParams
  const billingCycle = billing === 'annual' ? 'annual' : 'monthly'

  const plan = planKey && PLANS[planKey] ? PLANS[planKey] : null
  if (!plan) notFound()

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id) notFound()

  const { data: shop } = await supabase
    .from('shops')
    .select('name, primary_color, country, email')
    .eq('id', profile.shop_id)
    .single()

  if (!shop) notFound()

  const shopCountry  = (shop as typeof shop & { country?: string; email?: string }).country ?? null
  const shopEmail    = (shop as typeof shop & { country?: string; email?: string }).email ?? undefined
  const shopEuCa     = isEuCaCountry(shopCountry)
  const currency     = getCurrencyForCountry(shopCountry)

  // EU/CA : uniquement Pro via Stripe
  if (shopEuCa && plan.key !== 'pro') notFound()

  // Paiement par carte (Stripe) — EU/CA natif ou Africa avec method=stripe
  if (shopEuCa || method === 'stripe') {
    let amountCents: number
    let displayCurrency: 'EUR' | 'CAD'

    if (shopEuCa) {
      const prices = EU_CA_PRO_PRICES[currency as 'EUR' | 'CAD'] ?? EU_CA_PRO_PRICES.EUR
      amountCents     = billingCycle === 'annual' ? prices.annual : prices.monthly
      displayCurrency = currency as 'EUR' | 'CAD'
    } else {
      // Africa : prix EUR fixes
      const eurPrices = PLAN_EUR_PRICES[plan.key]
      if (!eurPrices) notFound()
      amountCents     = billingCycle === 'annual' ? eurPrices.annual : eurPrices.monthly
      displayCurrency = 'EUR'
    }

    return (
      <StripeSubscriptionCheckoutForm
        planKey={plan.key}
        planName={PLAN_NAMES[plan.key] ?? plan.key}
        amountCents={amountCents}
        currency={displayCurrency}
        billingCycle={billingCycle}
        shopName={shop.name}
        primaryColor={shop.primary_color ?? '#0EA5E9'}
        customerEmail={shopEmail}
      />
    )
  }

  return (
    <SubscriptionCheckoutForm
      plan={plan}
      shopName={shop.name}
      primaryColor={shop.primary_color ?? '#0EA5E9'}
      billingCycle={billingCycle}
    />
  )
}
