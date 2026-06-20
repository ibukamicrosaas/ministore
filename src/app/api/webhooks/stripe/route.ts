import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { constructStripeEvent } from '@/lib/payments/stripe'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role env vars manquants')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  const rawBody  = await req.text()
  const sig      = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = await constructStripeEvent(rawBody, sig)
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const meta    = session.metadata ?? {}

        if (meta.type === 'subscription_eu_ca') {
          const shopId  = meta.shop_id
          const planKey = meta.plan_key ?? 'pro'

          if (!shopId) break

          await supabase
            .from('shops')
            .update({
              plan:                 planKey,
              is_active:            true,
              stripe_customer_id:   session.customer as string | null,
              stripe_subscription_id: session.subscription as string | null,
            })
            .eq('id', shopId)
        }

        if (meta.type === 'order_payment') {
          const orderId = meta.order_id
          if (!orderId) break

          await supabase
            .from('orders')
            .update({ status: 'confirmed', payment_method: 'stripe_card' })
            .eq('id', orderId)
            .eq('status', 'pending')
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

        if (customerId) {
          await supabase
            .from('shops')
            .update({
              plan:                   'decouverte',
              is_active:              false,
              stripe_subscription_id: null,
            })
            .eq('stripe_customer_id', customerId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub        = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
        const isActive   = sub.status === 'active' || sub.status === 'trialing'

        if (customerId) {
          await supabase
            .from('shops')
            .update({ is_active: isActive })
            .eq('stripe_customer_id', customerId)
        }
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        const shopId  = account.metadata?.shop_id

        if (shopId) {
          await supabase
            .from('shops')
            .update({ stripe_connect_enabled: account.charges_enabled ?? false })
            .eq('id', shopId)
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne'
    console.error('[Webhook Stripe]', event.type, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
