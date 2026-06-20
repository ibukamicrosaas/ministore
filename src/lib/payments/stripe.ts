import Stripe from 'stripe'
import { APP_URL } from '@/constants'
import type { ShopCurrency } from '@/lib/utils/country-groups'

export function createStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

// ─── Abonnements EU/CA ────────────────────────────────────────────────────────

export interface StripeSubscriptionPayload {
  shopId:        string
  planKey:       string
  currency:      ShopCurrency
  billingCycle:  'monthly' | 'annual'
  customerEmail?: string
}

const PRO_AMOUNTS: Record<ShopCurrency, { monthly: number; annual: number }> = {
  XOF: { monthly: 990000, annual: 9900000 }, // centimes XOF (pas de décimales)
  EUR: { monthly:    1490, annual:   14900 }, // centimes EUR
  CAD: { monthly:    1990, annual:   19900 }, // centimes CAD
}

export async function createStripeSubscriptionSession(
  payload: StripeSubscriptionPayload,
): Promise<{ url: string; sessionId: string }> {
  const stripe   = createStripeClient()
  const amounts  = PRO_AMOUNTS[payload.currency]
  const amount   = payload.billingCycle === 'annual' ? amounts.annual : amounts.monthly
  const interval = payload.billingCycle === 'annual' ? 'year' : 'month'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{
      price_data: {
        currency: payload.currency.toLowerCase(),
        unit_amount: amount,
        recurring: { interval },
        product_data: { name: 'TEKKIShop Pro' },
      },
      quantity: 1,
    }],
    metadata: {
      type:          'subscription_eu_ca',
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

  // Mapper les codes pays vers les codes Stripe (ISO 3166-1 alpha-2)
  const stripeCountry = country === 'BE' ? 'BE'
    : country === 'LU' ? 'LU'
    : country === 'CH' ? 'CH'
    : country === 'CA' ? 'CA'
    : 'FR' // défaut Europe

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
