import Stripe from 'stripe'
import { APP_URL } from '@/constants'

export function createStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export interface StripeSessionPayload {
  bookingId: string
  salonSlug: string
  serviceId: string
  amount: number
  currency: string
  description: string
  customerEmail?: string
  customerName?: string
}

export async function createStripeCheckoutSession(
  payload: StripeSessionPayload,
): Promise<{ sessionId: string; checkoutUrl: string }> {
  const stripe = createStripeClient()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    currency: payload.currency.toLowerCase(),
    line_items: [
      {
        price_data: {
          currency: payload.currency.toLowerCase(),
          product_data: { name: payload.description },
          unit_amount: payload.amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      booking_id: payload.bookingId,
      salon_slug: payload.salonSlug,
    },
    customer_email: payload.customerEmail,
    success_url: `${APP_URL}/${payload.salonSlug}/book/success?booking_id=${payload.bookingId}`,
    cancel_url: `${APP_URL}/${payload.salonSlug}/book/${payload.serviceId}/pay?cancelled=1&booking_id=${payload.bookingId}`,
  })

  if (!session.url) throw new Error('Stripe session URL missing')

  return { sessionId: session.id, checkoutUrl: session.url }
}

export async function createStripeRefund(
  paymentIntentId: string,
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    const stripe = createStripeClient()
    const refund = await stripe.refunds.create({ payment_intent: paymentIntentId })
    return { success: true, refundId: refund.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function constructStripeEvent(
  rawBody: string | Buffer,
  signature: string,
): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not defined')
  const stripe = createStripeClient()
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
}
