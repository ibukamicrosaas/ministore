import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/auth/verify-cron'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendReviewRequestEmail } from '@/lib/notifications/email'
import { APP_URL } from '@/constants'

export const runtime = 'nodejs'

const DELAY_DAYS = 3
const BATCH_SIZE = 50

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const cutoff   = new Date(Date.now() - DELAY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // Commandes livrées/complétées depuis au moins 3 jours, sans demande d'avis envoyée,
  // avec un e-mail client enregistré
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      client_token,
      shop_id,
      shops:shop_id(name, slug, primary_color, logo_url),
      clients:client_id(first_name, email),
      order_items(product_name)
    `)
    .in('status', ['delivered', 'completed'])
    .lte('delivered_at', cutoff)
    .is('review_request_sent_at', null)
    .not('client_id', 'is', null)
    .limit(BATCH_SIZE) as {
      data: Array<{
        id: string
        client_token: string
        shop_id: string
        shops: { name: string; slug: string; primary_color: string | null; logo_url: string | null } | null
        clients: { first_name: string; email: string | null } | null
        order_items: { product_name: string }[]
      }> | null
      error: Error | null
    }

  if (error) {
    console.error('[cron/review-requests]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const orders = (data ?? []).filter(o => o.clients?.email && o.shops?.slug)

  let sent = 0
  let failed = 0

  for (const order of orders) {
    const clientEmail = order.clients!.email!
    const shop        = order.shops!
    const reviewUrl   = `${APP_URL}/${shop.slug}/avis/${order.client_token}`
    const productNames = order.order_items.map(i => i.product_name).filter(Boolean)

    try {
      await sendReviewRequestEmail({
        toEmail:      clientEmail,
        clientName:   order.clients!.first_name,
        shopName:     shop.name,
        shopColor:    shop.primary_color ?? '#0EA5E9',
        shopLogoUrl:  shop.logo_url,
        productNames: productNames.length > 0 ? productNames : ['Votre commande'],
        reviewUrl,
      })

      await supabase
        .from('orders')
        .update({ review_request_sent_at: new Date().toISOString() })
        .eq('id', order.id)

      sent++
    } catch (err) {
      console.error('[cron/review-requests] failed for order', order.id, err)
      failed++
    }
  }

  console.log(`[cron/review-requests] sent=${sent} failed=${failed} total=${orders.length}`)
  return NextResponse.json({ ok: true, sent, failed, total: orders.length })
}
