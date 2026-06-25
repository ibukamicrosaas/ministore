import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { constructStripeEvent } from '@/lib/payments/stripe'
import type Stripe from 'stripe'
import { sendWhatsApp, buildDigitalDownloadMessage } from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'

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

          const { data: updatedOrder } = await supabase
            .from('orders')
            .update({ status: 'confirmed', payment_method: 'stripe_card' })
            .eq('id', orderId)
            .eq('status', 'pending')
            .select('id, shop_id, clients(first_name, whatsapp, phone), shops:shop_id(name)')
            .single()

          if (updatedOrder) {
            const ord = updatedOrder as unknown as {
              id: string; shop_id: string
              clients: { first_name: string; whatsapp: string | null; phone: string } | null
              shops: { name: string } | null
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: items } = await (supabase as any)
              .from('order_items')
              .select('product_id, products(product_type, digital_file_name)')
              .eq('order_id', ord.id)

            const digitalItems = ((items ?? []) as Array<{
              product_id: string
              products: { product_type: string | null; digital_file_name: string | null } | null
            }>).filter(i => i.products?.product_type === 'digital')

            if (digitalItems.length > 0 && ord.clients) {
              await (supabase as ReturnType<typeof createServiceClient>).from('orders').update({ status: 'completed' }).eq('id', ord.id)
              const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
              const clientPhone = ord.clients.whatsapp ?? ord.clients.phone

              for (const item of digitalItems) {
                const { data: tokenData } = await supabase
                  .from('download_tokens')
                  .insert({
                    order_id: ord.id, product_id: item.product_id,
                    shop_id: ord.shop_id, expires_at: expiresAt, max_downloads: 5,
                  })
                  .select('token').single()

                if (tokenData?.token) {
                  const downloadUrl = `${APP_URL}/telechargement/${tokenData.token}`
                  const msg = buildDigitalDownloadMessage({
                    shopName: ord.shops?.name ?? '',
                    clientName: ord.clients.first_name,
                    productName: item.products?.digital_file_name ?? 'ton fichier',
                    downloadUrl, expiresHours: 48,
                  })
                  await sendWhatsApp(clientPhone, msg)
                }
              }
            }
          }
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
