import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysCharge, detectCountryFromPhone } from '@/lib/payments/bictorys'
import { decryptApiKey } from '@/lib/crypto/encrypt'

const PAYMENT_TYPE_MAP: Record<string, 'wave_money' | 'orange_money' | 'maxit'> = {
  wave: 'wave_money',
  orange_money: 'orange_money',
  maxit: 'maxit',
  bictorys: undefined as any, // Pas de pré-sélection pour fallback
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount, method } = await req.json() as {
      orderId: string
      amount: number
      method?: string
    }

    if (!orderId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Données manquantes ou invalides' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: orderData } = await supabase
      .from('orders')
      .select(`
        id, 
        client_token,
        shop_id, 
        clients(first_name, phone), 
        shops(
          name, 
          bictorys_api_key,
          country
        )
      `)
      .eq('id', orderId)
      .single()

    if (!orderData) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    const shop = (orderData as any).shops
    const client = (orderData as any).clients
    const clientToken = (orderData as any).client_token

    if (!shop) {
      return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 })
    }

    if (!shop.bictorys_api_key) {
      console.error(`[bictorys-checkout] Clé API manquante pour la boutique ${shop.name}`)
      return NextResponse.json(
        { error: 'Configuration Bictorys manquante. Contactez le vendeur.' },
        { status: 400 }
      )
    }

    const apiKey = decryptApiKey(shop.bictorys_api_key)
    const customerPhone = client?.phone ?? ''
    const detectedCountry = detectCountryFromPhone(customerPhone)
    const countryCode = shop.country || detectedCountry || 'SN'
    const paymentType = PAYMENT_TYPE_MAP[method ?? 'bictorys']

    const baseUrl = process.env.APP_URL || 'https://ministore.tekkistudio.com'

    try {
      const { checkoutUrl, transactionId } = await createBictorysCharge(
        apiKey,
        {
          amount,
          currency: 'XOF',
          country: countryCode,
          paymentReference: `order-${orderId}`,
          merchantReference: orderId,
          successRedirectUrl: `${baseUrl}/commander/success?order_id=${orderId}&token=${clientToken}`,
          errorRedirectUrl: `${baseUrl}/commander/pay?order_id=${orderId}&token=${clientToken}&cancelled=1`,
          webhookUrl: `${baseUrl}/api/webhooks/bictorys`,
          orderDetails: [
            {
              name: `Commande ${orderId}`,
              price: amount,
              quantity: 1,
              taxRate: 0,
            },
          ],
          customerObject: {
            name: client?.first_name || 'Client',
            phone: customerPhone,
            locale: 'fr-FR',
          },
        },
        paymentType // Passer le type de paiement pour pré-sélection
      )

      console.log('[bictorys-checkout] ✅ Session créée:', { orderId, method, paymentType, transactionId, checkoutUrl: checkoutUrl?.slice(0, 50) + '...' })

      return NextResponse.json({
        checkoutUrl,
        transactionId,
      })
    } catch (bictorysErr) {
      console.error('[bictorys-checkout] ❌ Erreur Bictorys:', bictorysErr)
      const errorMsg = bictorysErr instanceof Error ? bictorysErr.message : 'Erreur inconnue'
      return NextResponse.json(
        { error: `Erreur Bictorys: ${errorMsg}` },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error('[bictorys-checkout] ❌ Erreur:', err)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
