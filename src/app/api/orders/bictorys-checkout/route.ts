import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysCharge, detectCountryFromPhone } from '@/lib/payments/bictorys'
import { decryptApiKey } from '@/lib/crypto/encrypt'

const PAYMENT_TYPE_MAP: Record<string, 'wave_money' | 'orange_money' | 'maxit'> = {
  wave: 'wave_money',
  orange_money: 'orange_money',
  maxit: 'maxit',
  bictorys: undefined as any,
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount, method, clientToken } = await req.json() as {
      orderId:     string
      amount:      number
      method?:     string
      clientToken: string
    }

    if (!orderId || !amount || amount <= 0 || !clientToken) {
      return NextResponse.json({ error: 'Données manquantes ou invalides' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: orderData } = await supabase
      .from('orders')
      .select(`
        id,
        client_token,
        status,
        total_price,
        deposit_amount,
        payment_type,
        shop_id,
        clients(first_name, phone),
        shops(name, bictorys_api_key, country)
      `)
      .eq('id', orderId)
      .single()

    if (!orderData) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    const order      = orderData as any
    const shop       = order.shops
    const client     = order.clients

    // HIGH-1 : valider l'appartenance via client_token
    if (order.client_token !== clientToken) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // MED-4 : la commande doit être en attente (pas déjà payée ou annulée)
    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Cette commande n\'est plus en attente de paiement' }, { status: 409 })
    }

    // CRIT-1 : calculer le montant attendu depuis la BDD — ne jamais utiliser le montant client
    const isDeposit     = order.payment_type === 'online_deposit' && (order.deposit_amount ?? 0) > 0
    const expectedAmount: number = isDeposit ? order.deposit_amount : order.total_price

    if (Math.round(amount) !== Math.round(expectedAmount)) {
      console.error(`[bictorys-checkout] SÉCURITÉ: Montant client (${amount}) ≠ montant DB (${expectedAmount}) — orderId: ${orderId}`)
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }

    if (!shop) {
      return NextResponse.json({ error: 'Boutique non trouvée' }, { status: 404 })
    }

    if (!shop.bictorys_api_key) {
      console.error(`[bictorys-checkout] Clé API manquante pour la boutique ${shop.name}`)
      return NextResponse.json(
        { error: 'Configuration de paiement manquante. Contactez le vendeur.' },
        { status: 400 }
      )
    }

    const apiKey         = decryptApiKey(shop.bictorys_api_key)
    const customerPhone  = client?.phone ?? ''
    const detectedCountry = detectCountryFromPhone(customerPhone)
    const countryCode    = shop.country || detectedCountry || 'SN'
    const paymentType    = PAYMENT_TYPE_MAP[method ?? 'bictorys']

    const baseUrl = process.env.APP_URL || `https://${req.headers.get('host')}`

    try {
      const { checkoutUrl, transactionId } = await createBictorysCharge(
        apiKey,
        {
          amount: expectedAmount, // toujours depuis la BDD
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
              price: expectedAmount,
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
        paymentType
      )

      // Créer/mettre à jour le record payments pour validation du montant dans le webhook
      void supabase.from('payments').upsert(
        {
          order_id:            orderId,
          shop_id:             order.shop_id,
          amount:              expectedAmount,
          currency:            'XOF',
          payment_method:      'bictorys',
          payment_type:        isDeposit ? 'deposit' : 'full',
          provider_payment_id: transactionId || `bictorys-${orderId}`,
          status:              'pending',
        },
        { onConflict: 'order_id' }
      )

      console.log('[bictorys-checkout] ✅ Session créée:', { orderId, method, paymentType, transactionId, checkoutUrl: checkoutUrl?.slice(0, 50) + '...' })

      return NextResponse.json({ checkoutUrl, transactionId })
    } catch (bictorysErr) {
      console.error('[bictorys-checkout] ❌ Erreur Bictorys:', bictorysErr)
      // LOW-2 : message générique au client, détail en log seulement
      return NextResponse.json(
        { error: 'Impossible d\'initier le paiement. Réessayez ou contactez le vendeur.' },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error('[bictorys-checkout] ❌ Erreur:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
