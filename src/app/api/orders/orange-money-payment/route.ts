import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysCharge } from '@/lib/payments/bictorys'
import { decryptApiKey } from '@/lib/crypto/encrypt'

export async function POST(req: NextRequest) {
  try {
    const { orderId, customerPhone, amount } = await req.json() as {
      orderId: string
      customerPhone: string
      amount: number
    }

    if (!orderId || !customerPhone || !amount) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Récupérer la commande et ses infos
    const { data: orderData } = await supabase
      .from('orders')
      .select('id, shop_id, clients(first_name), shops(name, bictorys_api_key, country)')
      .eq('id', orderId)
      .single()

    if (!orderData) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    const shop = (orderData as any).shops
    const client = (orderData as any).clients

    if (!shop?.bictorys_api_key) {
      return NextResponse.json({ error: 'Configuration incomplète' }, { status: 400 })
    }

    const apiKey = decryptApiKey(shop.bictorys_api_key)

    // Créer une charge Bictorys pour Orange Money CI avec OTP
    try {
      const { checkoutUrl } = await createBictorysCharge(
        apiKey,
        {
          amount,
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
