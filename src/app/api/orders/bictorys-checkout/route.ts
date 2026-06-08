import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysCharge } from '@/lib/payments/bictorys'
import { decryptApiKey } from '@/lib/crypto/encrypt'

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount } = await req.json() as {
      orderId: string
      amount: number
    }

    if (!orderId || !amount) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Récupérer la commande et ses infos
    const { data: orderData } = await supabase
      .from('orders')
      .select('id, shop_id, clients(first_name, phone), shops(name, bictorys_api_key, country)')
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

    try {
      const { checkoutUrl } = await createBictorysCharge(
        apiKey,
        {
          amount,
          currency: 'XOF',
          country: shop.country || 'SN',
          paymentReference: `bictorys-${orderId}`,
          successRedirectUrl: `${process.env.APP_URL}/orders/${orderId}/success`,
          errorRedirectUrl: `${process.env.APP_URL}/orders/${orderId}/error`,
          webhookUrl: `${process.env.APP_URL}/api/webhooks/bictorys`,
          merchantReference: orderId,
          customerObject: {
            name: client?.first_name,
            phone: client?.phone,
          },
        }
      )

      return NextResponse.json({ checkoutUrl })
    } catch (bictorysErr) {
      console.error('[bictorys-checkout] Erreur Bictorys:', bictorysErr)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la session de paiement' },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error('[bictorys-checkout] Erreur:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
