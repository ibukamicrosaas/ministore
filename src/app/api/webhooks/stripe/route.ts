import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { constructStripeEvent } from '@/lib/payments/stripe'
import type Stripe from 'stripe'
import { sendWhatsApp, buildDigitalDownloadMessage } from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'
import { setShopStatus } from '@/lib/billing/shop-status'
import * as Sentry from '@sentry/nextjs'

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

        if (meta.type === 'subscription_eu_ca' || meta.type === 'subscription_global') {
          const shopId  = meta.shop_id
          const planKey = meta.plan_key ?? 'pro'

          if (!shopId) break

          await supabase
            .from('shops')
            .update({
              plan:                   planKey,
              is_active:              true,
              stripe_customer_id:     session.customer as string | null,
              stripe_subscription_id: session.subscription as string | null,
            })
            .eq('id', shopId)

          // Boutique free_orders payée via Stripe (diaspora EU/CA) : même
          // traitement qu'un paiement Bictorys — status='active', libère les
          // commandes retenues. setShopStatus no-op silencieusement pour une
          // boutique trial_model='legacy'.
          //
          // Idempotent en cas de rejeu : activate_free_orders_shop ne libère
          // que les commandes avec released_at IS NULL (donc 0 la 2e fois),
          // et l'UPDATE shops status='active' est un no-op sur une valeur
          // déjà identique. Fail loud ici est donc sûr — un rejeu Stripe ne
          // peut pas relâcher deux fois les commandes ni double-facturer.
          const activation = await setShopStatus(shopId, 'active')
          if (activation.error) {
            console.error('[Webhook Stripe] setShopStatus', shopId, activation.error)
            Sentry.captureException(new Error('Échec activation boutique free_orders (Stripe)'), {
              extra: { shopId, error: activation.error },
            })
            return NextResponse.json({ error: 'Échec activation boutique' }, { status: 500 })
          }
        }

        if (meta.type === 'order_payment') {
          const orderId = meta.order_id
          if (!orderId) break

          // Idempotent : ne matche que si status='pending' encore. Un rejeu
          // Stripe après succès ne retrouve plus la ligne (déjà 'confirmed'/
          // 'completed') et ne renvoie donc pas une deuxième fois le fichier.
          const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({ status: 'confirmed', payment_method: 'stripe_card' })
            .eq('id', orderId)
            .eq('status', 'pending')
            .select('id, shop_id, clients(first_name, whatsapp, phone), shops:shop_id(name)')
            .single()

          if (updateError) {
            // PGRST116 = aucune ligne trouvée (déjà traité ou commande
            // introuvable) — pas une erreur, ce webhook est idempotent.
            if (updateError.code !== 'PGRST116') {
              console.error('[Webhook Stripe] échec confirmation commande', orderId, updateError.message)
              Sentry.captureException(new Error('Échec confirmation commande Stripe'), {
                extra: { orderId, dbError: updateError.message, dbCode: updateError.code },
              })
              return NextResponse.json({ error: 'Échec mise à jour commande' }, { status: 500 })
            }
          }

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
              const completedAt = new Date().toISOString()
              const { error: completeError } = await (supabase as ReturnType<typeof createServiceClient>)
                .from('orders')
                .update({ status: 'completed', delivered_at: completedAt })
                .eq('id', ord.id)

              if (completeError) {
                console.error('[Webhook Stripe] échec passage completed', ord.id, completeError.message)
                Sentry.captureException(new Error('Échec passage à completed — commande digitale Stripe'), {
                  extra: { orderId: ord.id, dbError: completeError.message },
                })
                return NextResponse.json({ error: 'Échec mise à jour commande' }, { status: 500 })
              }

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
          const { data: shop, error: shopLookupError } = await supabase
            .from('shops')
            .select('id, trial_model')
            .eq('stripe_customer_id', customerId)
            .single()

          if (shopLookupError) {
            // Ne pas laisser tomber silencieusement dans la branche 'legacy'
            // ci-dessous : une boutique free_orders introuvable ici recevrait
            // un is_active=false direct au lieu du statut 'expired' attendu.
            console.error('[Webhook Stripe] lecture boutique introuvable', customerId, shopLookupError.message)
            Sentry.captureException(new Error('customer.subscription.deleted : boutique introuvable pour ce customerId'), {
              extra: { customerId, dbError: shopLookupError.message },
            })
            return NextResponse.json({ error: 'Boutique introuvable' }, { status: 500 })
          }

          if (shop?.trial_model === 'free_orders') {
            // Résiliation (§12 de la spec) : 'expired', pas is_active=false direct —
            // la boutique reste publique, ses commandes sont de nouveau retenues,
            // celles déjà libérées le restent. plan repassé à 'decouverte' quand
            // même : ce n'est plus un plan payant actif.
            await supabase.from('shops').update({ plan: 'decouverte', stripe_subscription_id: null }).eq('id', shop.id)
            // Idempotent : simple UPDATE status='expired', pas d'effet de bord
            // multi-table (contrairement à la transition 'active') — un rejeu
            // Stripe ne peut rien casser ici.
            const result = await setShopStatus(shop.id, 'expired')
            if (result.error) {
              console.error('[Webhook Stripe] setShopStatus', shop.id, result.error)
              Sentry.captureException(new Error('Échec expiration boutique free_orders (Stripe)'), {
                extra: { shopId: shop.id, error: result.error },
              })
              return NextResponse.json({ error: 'Échec mise à jour boutique' }, { status: 500 })
            }
          } else {
            await supabase
              .from('shops')
              .update({
                plan:                   'decouverte',
                is_active:              false,
                stripe_subscription_id: null,
              })
              .eq('stripe_customer_id', customerId)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub        = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
        const isActive   = sub.status === 'active' || sub.status === 'trialing'

        if (customerId) {
          const { data: shop, error: shopLookupError } = await supabase
            .from('shops')
            .select('id, trial_model')
            .eq('stripe_customer_id', customerId)
            .single()

          if (shopLookupError) {
            console.error('[Webhook Stripe] lecture boutique introuvable', customerId, shopLookupError.message)
            Sentry.captureException(new Error('customer.subscription.updated : boutique introuvable pour ce customerId'), {
              extra: { customerId, dbError: shopLookupError.message },
            })
            return NextResponse.json({ error: 'Boutique introuvable' }, { status: 500 })
          }

          if (shop?.trial_model === 'free_orders') {
            // Même logique que la résiliation : jamais is_active=false direct pour
            // ce modèle. isActive=false ici (impayé/en pause) → 'expired', jamais
            // un hard-hide — voir migration 078, is_active=false est réservé à un
            // masquage volontaire (admin), pas à un aléa de paiement Stripe.
            // Idempotent dans les deux sens : voir le commentaire sur
            // checkout.session.completed pour 'active', et sur
            // customer.subscription.deleted pour 'expired'.
            const result = await setShopStatus(shop.id, isActive ? 'active' : 'expired')
            if (result.error) {
              console.error('[Webhook Stripe] setShopStatus', shop.id, result.error)
              Sentry.captureException(new Error('Échec mise à jour statut boutique free_orders (Stripe)'), {
                extra: { shopId: shop.id, targetStatus: isActive ? 'active' : 'expired', error: result.error },
              })
              return NextResponse.json({ error: 'Échec mise à jour boutique' }, { status: 500 })
            }
          } else {
            await supabase
              .from('shops')
              .update({ is_active: isActive })
              .eq('stripe_customer_id', customerId)
          }
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
