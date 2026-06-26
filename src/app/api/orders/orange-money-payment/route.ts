import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysCharge } from '@/lib/payments/bictorys'
import { decryptApiKey } from '@/lib/crypto/encrypt'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, { key: 'payment', maxRequests: 10, windowMs: 60 * 60 * 1000 })
  if (limited) return limited

  try {
    const { orderId, customerPhone } = await req.json() as {
      orderId: string
      customerPhone: string
    }

    if (!orderId || !customerPhone) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Récupérer la commande et ses infos — montant toujours depuis la BDD (jamais du body)
    const { data: orderData } = await supabase
      .from('orders')
      .select('id, shop_id, status, total_price, deposit_amount, payment_type, clients(first_name), shops(name, bictorys_api_key, country)')
      .eq('id', orderId)
      .single()

    if (!orderData) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    const order = orderData as any
    const shop = order.shops
    const client = order.clients

    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Cette commande n\'est plus en attente de paiement' }, { status: 409 })
    }

    if (!shop?.bictorys_api_key) {
      return NextResponse.json({ error: 'Configuration incomplète' }, { status: 400 })
    }

    const apiKey = decryptApiKey(shop.bictorys_api_key)
    const isDeposit = order.payment_type === 'online_deposit' && (order.deposit_amount ?? 0) > 0
    const expectedAmount: number = isDeposit ? order.deposit_amount : order.total_price

    // Créer une charge Bictorys pour Orange Money CI avec OTP
    try {
      const { checkoutUrl } = await createBictorysCharge(
        apiKey,
        {
          amount: expectedAmount, // toujours depuis la BDD
          currency: 'XOF',
          country: shop.country || 'CI',
          paymentReference: `orange-${orderId}`,
          successRedirectUrl: `${process.env.APP_URL}/orders/${orderId}/success`,
          errorRedirectUrl: `${process.env.APP_URL}/orders/${orderId}/error`,
          webhookUrl: `${process.env.APP_URL}/api/webhooks/bictorys`,
          merchantReference: orderId,
          customerObject: {
            name: client?.first_name,
            phone: customerPhone,
          },
        },
        'orange_money'
      )

      return NextResponse.json({ checkoutUrl, orderId })
    } catch (bictorysErr) {
      console.error('[orange-money] Erreur Bictorys:', bictorysErr)
      return NextResponse.json(
        { error: 'Erreur lors du traitement Orange Money' },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error('[orange-money] Erreur:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
