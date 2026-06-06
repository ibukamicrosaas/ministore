import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysCharge, type BictorysPaymentType } from '@/lib/payments/bictorys'
import { decryptApiKey } from '@/lib/crypto/encrypt'
import { APP_URL } from '@/constants'

interface RequestBody {
  orderId: string
  shopSlug: string
  customerFirstName: string
  customerLastName?: string
  customerPhone?: string
  paymentType?: BictorysPaymentType
}

export async function POST(req: NextRequest) {
  const platformApiKey = process.env.BICTORYS_SECRET_KEY

  const body = (await req.json()) as RequestBody
  const { orderId, shopSlug, customerFirstName, customerLastName, customerPhone, paymentType } = body

  if (!orderId || !shopSlug) {
    return NextResponse.json({ error: 'orderId et shopSlug requis' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('id, deposit_amount, total_price, shop_id, status, payment_type, client_token')
    .eq('id', orderId)
    .single()

  if (orderError || !orderData) {
    return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
  }

  const order = orderData as {
    id: string
    deposit_amount: number
    total_price: number
    shop_id: string
    status: string
    payment_type: string
    client_token: string
  }

  // Utiliser la clé Bictorys propre de la boutique (plan Pro) si disponible
  const { data: shopData } = await supabase
    .from('shops')
    .select('plan, bictorys_secret_key')
    .eq('id', order.shop_id)
    .single()

  const rawShopKey = shopData?.plan === 'pro' ? (shopData.bictorys_secret_key ?? null) : null
  const shopKey = rawShopKey ? decryptApiKey(rawShopKey) : null
  const apiKey = shopKey ?? platformApiKey

  if (!apiKey) {
    return NextResponse.json({ error: 'Bictorys non configuré (clé manquante)' }, { status: 500 })
  }

  if (order.status !== 'pending') {
    return NextResponse.json({ error: 'Commande déjà traitée' }, { status: 400 })
  }

  const isDeposit    = order.payment_type === 'online_deposit' && order.deposit_amount > 0
  const amountToCharge = isDeposit ? order.deposit_amount : order.total_price

  if (amountToCharge <= 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
  }

  const customerName = [customerFirstName, customerLastName].filter(Boolean).join(' ')

  try {
    const { checkoutUrl, transactionId } = await createBictorysCharge(
      apiKey,
      {
        amount: amountToCharge,
        currency: 'XOF',
        paymentReference: `tekkishop-${orderId.slice(0, 8)}`,
        merchantReference: orderId,
        successRedirectUrl: `${APP_URL}/${shopSlug}/commander/success?order_id=${orderId}&token=${order.client_token}`,
        errorRedirectUrl: `${APP_URL}/${shopSlug}/commander/pay?cancelled=1&order_id=${orderId}`,
        webhookUrl: `${APP_URL}/api/webhooks/bictorys`,
        orderDetails: [{ name: 'Commande TekkiShop', price: amountToCharge, quantity: 1, taxRate: 0 }],
        customerObject: {
          name: customerName || undefined,
          phone: customerPhone,
          locale: 'fr-FR',
        },
      },
      paymentType,
    )

    await supabase.from('payments').insert({
      order_id:           orderId,
      shop_id:            order.shop_id,
      amount:             amountToCharge,
      currency:           'XOF',
      payment_method:     'bictorys',
      payment_type:       isDeposit ? 'deposit' : 'full',
      provider_payment_id: transactionId || `bictorys-${orderId}`,
      status:             'pending',
    })

    return NextResponse.json({ checkoutUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Bictorys inconnue'
    console.error('[bictorys/create]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
