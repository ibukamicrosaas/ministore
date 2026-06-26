import Stripe from 'stripe'
import { APP_URL } from '@/constants'
import type { ShopCurrency } from '@/lib/utils/country-groups'

export function createStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

// ─── Abonnements (EU/CA + Global) ────────────────────────────────────────────

export interface StripeSubscriptionPayload {
  shopId:        string
  planKey:       string
  currency:      ShopCurrency | 'EUR'
  billingCycle:  'monthly' | 'annual'
  customerEmail?: string
  metaType?:     'subscription_eu_ca' | 'subscription_global'
}

// Centimes par devise (EU/CA)
const EUCA_AMOUNTS: Record<string, { monthly: number; annual: number }> = {
  EUR: { monthly: 1490, annual: 14900 },
  CAD: { monthly: 1990, annual: 19900 },
}

// Centimes EUR pour tous les plans (Africa + global)
const PLAN_EUR_AMOUNTS: Record<string, { monthly: number; annual: number }> = {
  decouverte: { monthly:  490, annual:  4900 },
  business:   { monthly:  790, annual:  7900 },
  pro:        { monthly: 1490, annual: 14900 },
}

const PLAN_LABELS: Record<string, string> = {
  decouverte: 'TEKKIShop Découverte',
  business:   'TEKKIShop Business',
  pro:        'TEKKIShop Pro',
}

export async function createStripeSubscriptionSession(
  payload: StripeSubscriptionPayload,
): Promise<{ url: string; sessionId: string }> {
  const stripe   = createStripeClient()
  const interval = payload.billingCycle === 'annual' ? 'year' : 'month'
  const isEuCa   = payload.metaType !== 'subscription_global' && (payload.currency === 'EUR' || payload.currency === 'CAD')
  const metaType = payload.metaType ?? (isEuCa ? 'subscription_eu_ca' : 'subscription_global')

  let amount:   number
  let currency: string

  if (isEuCa) {
    // EU/CA: Pro uniquement, avec les prix EUR/CAD existants
    const amounts = EUCA_AMOUNTS[payload.currency]
    if (!amounts) throw new Error(`Devise non supportée pour EU/CA : ${payload.currency}`)
    amount   = payload.billingCycle === 'annual' ? amounts.annual : amounts.monthly
    currency = payload.currency.toLowerCase()
  } else {
    // Global (Africa + autres) : tous plans, EUR fixe
    const amounts = PLAN_EUR_AMOUNTS[payload.planKey]
    if (!amounts) throw new Error(`Plan inconnu : ${payload.planKey}`)
    amount   = payload.billingCycle === 'annual' ? amounts.annual : amounts.monthly
    currency = 'eur'
  }

  const productName = PLAN_LABELS[payload.planKey] ?? `TEKKIShop ${payload.planKey}`

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{
      price_data: {
        currency,
        unit_amount: amount,
        recurring: { interval },
        product_data: { name: productName },
      },
      quantity: 1,
    }],
    metadata: {
      type:          metaType,
      shop_id:       payload.shopId,
      plan_key:      payload.planKey,
      billing_cycle: payload.billingCycle,
    },
    customer_email: payload.customerEmail,
    success_url: `${APP_URL}/dashboard/upgrade?success=true&plan=${payload.planKey}`,
    cancel_url:  `${APP_URL}/dashboard/upgrade?error=cancelled`,
    allow_promotion_codes: true,
  })

  if (!session.url) throw new Error('Stripe session URL manquante')
  return { url: session.url, sessionId: session.id }
}

// ─── Stripe Connect (paiements marchands) ────────────────────────────────────

export async function createStripeConnectAccount(
  shopId: string,
  email: string,
  country: string,
): Promise<{ accountId: string }> {
  const stripe = createStripeClient()

  // Pays supportés par Stripe Connect Express (ISO 3166-1 alpha-2)
  const STRIPE_CONNECT_COUNTRIES = new Set([
    'FR','BE','LU','CH','CA','GB','DE','ES','IT','NL','PT','SE','NO','DK','FI',
    'AT','PL','IE','SG','AU','NZ','HK','JP','US','BR','MX','IN','AE',
    'SN','GH','NG','KE','ZA','EG','TZ','UG','RW', // Afrique supportée
  ])
  const stripeCountry = STRIPE_CONNECT_COUNTRIES.has(country) ? country : 'FR'

  const account = await stripe.accounts.create({
    type:    'express',
    country: stripeCountry,
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers:     { requested: true },
    },
    metadata: { shop_id: shopId },
  })

  return { accountId: account.id }
}

export async function createStripeConnectAccountLink(
  accountId: string,
  shopId: string,
): Promise<{ url: string }> {
  const stripe = createStripeClient()

  const link = await stripe.accountLinks.create({
    account:     accountId,
    type:        'account_onboarding',
    refresh_url: `${APP_URL}/api/stripe/connect/create-link?refresh=true&shop_id=${shopId}`,
    return_url:  `${APP_URL}/api/stripe/connect/callback?shop_id=${shopId}`,
  })

  return { url: link.url }
}

// ─── Paiement commande via Stripe Connect ────────────────────────────────────

export interface StripeOrderPaymentPayload {
  orderId:           string
  shopSlug:          string
  amount:            number       // centimes
  currency:          ShopCurrency
  merchantAccountId: string       // stripe_account_id du marchand
  clientToken:       string
  isDeposit:         boolean
}

export async function createStripeOrderPaymentSession(
  payload: StripeOrderPaymentPayload,
): Promise<{ url: string }> {
  const stripe = createStripeClient()

  const session = await stripe.checkout.sessions.create({
    mode:     'payment',
    currency: payload.currency.toLowerCase(),
    line_items: [{
      price_data: {
        currency:     payload.currency.toLowerCase(),
        unit_amount:  payload.amount,
        product_data: {
          name: payload.isDeposit ? 'Acompte commande' : 'Paiement commande',
        },
      },
      quantity: 1,
    }],
    metadata: {
      type:         'order_payment',
      order_id:     payload.orderId,
      client_token: payload.clientToken,
    },
    payment_intent_data: {
      transfer_data: { destination: payload.merchantAccountId },
    },
    success_url: `${APP_URL}/${payload.shopSlug}/commander/success?order_id=${payload.orderId}&token=${payload.clientToken}`,
    cancel_url:  `${APP_URL}/${payload.shopSlug}/commander/pay?order_id=${payload.orderId}&token=${payload.clientToken}&cancelled=1`,
  })

  if (!session.url) throw new Error('Stripe session URL manquante')
  return { url: session.url }
}

// ─── Vérification signature webhook ──────────────────────────────────────────

export async function constructStripeEvent(
  rawBody: string | Buffer,
  signature: string,
): Promise<Stripe.Event> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not defined')
  return createStripeClient().webhooks.constructEvent(rawBody, signature, secret)
}

// ─── Récupérer le statut d'un compte Connect ─────────────────────────────────

export async function getStripeConnectAccountStatus(
  accountId: string,
): Promise<{ enabled: boolean; detailsSubmitted: boolean }> {
  const stripe  = createStripeClient()
  const account = await stripe.accounts.retrieve(accountId)
  return {
    enabled:          account.charges_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
  }
}
