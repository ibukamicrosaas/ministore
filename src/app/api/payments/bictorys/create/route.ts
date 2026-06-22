import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysCharge, detectCountryFromPhone, normalizePhoneForBictorys, type BictorysPaymentType } from '@/lib/payments/bictorys'
import { decryptApiKey } from '@/lib/crypto/encrypt'
import { checkRateLimit } from '@/lib/rate-limit'
import { APP_URL } from '@/constants'

interface RequestBody {
  orderId: string
  shopSlug: string
  customerFirstName: string
  customerLastName?: string
  customerPhone?: string
  paymentType?: BictorysPaymentType
  otp?: string
}

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, { key: 'payment', maxRequests: 10, windowMs: 60 * 60 * 1000 })
  if (limited) return limited

  const platformApiKey = process.env.BICTORYS_API_KEY

  const body = (await req.json()) as RequestBody
  const { orderId, shopSlug, customerFirstName, customerLastName, customerPhone, paymentType, otp } = body

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
    .select('plan, bictorys_secret_key, country')
    .eq('id', order.shop_id)
    .single()

  if (!shopData?.country) {
    return NextResponse.json({ error: 'Pays de la boutique manquant' }, { status: 400 })
  }

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
  const normalizedPhone = customerPhone ? normalizePhoneForBictorys(customerPhone) : ''

  // Détecter le pays depuis le téléphone du client (source de vérité)
  // Si le client n'a pas de téléphone, fallback sur shop.country
  let paymentCountry = shopData.country
  if (normalizedPhone) {
    const detectedCountry = detectCountryFromPhone(normalizedPhone)
    if (detectedCountry) {
      paymentCountry = detectedCountry
    }
  }

  try {
    const { checkoutUrl, transactionId, message } = await createBictorysCharge(
      apiKey,
      {
        amount: amountToCharge,
        currency: 'XOF',
        country: paymentCountry,
        paymentReference: `tekkishop-${orderId.slice(0, 8)}`,
        merchantReference: orderId,
        otp: otp || undefined,
        successRedirectUrl: `${APP_URL}/${shopSlug}/commander/success?order_id=${orderId}&token=${order.client_token}`,
        errorRedirectUrl: `${APP_URL}/${shopSlug}/commander/pay?cancelled=1&order_id=${orderId}`,
        webhookUrl: `${APP_URL}/api/webhooks/bictorys`,
        orderDetails: [{ name: 'Commande TekkiShop', price: amountToCharge, quantity: 1, taxRate: 0 }],
        customerObject: {
          name: customerName || undefined,
          phone: normalizedPhone || undefined,
          locale: 'fr-FR',
          country: paymentCountry,
        },
      },
      paymentType,
    )

    const { error: insertError } = await supabase.from('payments').insert({
      order_id:           orderId,
      shop_id:            order.shop_id,
      amount:             amountToCharge,
      currency:           'XOF',
      payment_method:     'bictorys',
      payment_type:       isDeposit ? 'deposit' : 'full',
      provider_payment_id: transactionId || `bictorys-${orderId}`,
      status:             'pending',
    })
    if (insertError) {
      // Le webhook créera le record à la volée si besoin — on ne bloque pas le paiement
      console.error('[bictorys/create] ⚠️ Erreur insert payments:', insertError.message, insertError.code)
    }

    if (checkoutUrl) {
      return NextResponse.json({ checkoutUrl, transactionId })
    }
    return NextResponse.json({ message, transactionId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Bictorys inconnue'
    console.error('[bictorys/create] ❌ Erreur Direct API:', message, '| country:', paymentCountry, '| paymentType:', paymentType)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
