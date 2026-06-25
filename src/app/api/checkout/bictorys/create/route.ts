import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysCharge, detectCountryFromPhone, normalizePhoneForBictorys, type BictorysPaymentType } from '@/lib/payments/bictorys'
import { decryptApiKey } from '@/lib/crypto/encrypt'
import { checkRateLimit } from '@/lib/rate-limit'
import { APP_URL } from '@/constants'

interface RequestBody {
  orderId: string
  shopSlug: string
  customerName: string
  customerPhone: string
  paymentType: BictorysPaymentType
  otp?: string
}

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, { key: 'payment', maxRequests: 10, windowMs: 60 * 60 * 1000 })
  if (limited) return limited

  const platformApiKey = process.env.BICTORYS_API_KEY

  if (!platformApiKey) {
    return NextResponse.json({ error: 'Bictorys non configuré' }, { status: 500 })
  }

  const body = (await req.json()) as RequestBody
  const { orderId, shopSlug, customerName, customerPhone, paymentType, otp } = body

  if (!orderId || !shopSlug || !customerName || !customerPhone || !paymentType) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const normalizedPhone = normalizePhoneForBictorys(customerPhone)
  const detectedCountry = detectCountryFromPhone(normalizedPhone)

  if (!detectedCountry) {
    return NextResponse.json({ error: 'Pays non détecté depuis le numéro' }, { status: 400 })
  }

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

  if (order.status !== 'pending') {
    return NextResponse.json({ error: 'Commande déjà traitée' }, { status: 400 })
  }

  const { data: shopData } = await supabase
    .from('shops')
    .select('plan, bictorys_secret_key')
    .eq('id', order.shop_id)
    .single()

  const rawShopKey = shopData?.plan === 'pro' ? (shopData.bictorys_secret_key ?? null) : null
  const shopKey = rawShopKey ? decryptApiKey(rawShopKey) : null
  const apiKey = shopKey ?? platformApiKey

  const isDeposit = order.payment_type === 'online_deposit' && order.deposit_amount > 0
  const amountToCharge = isDeposit ? order.deposit_amount : order.total_price

  if (amountToCharge <= 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
  }

  try {
    console.log(`[checkout/bictorys/create] 📋 Paiement: orderId=${orderId}, country=${detectedCountry}, amount=${amountToCharge}, paymentType=${paymentType}`)

    const { checkoutUrl, transactionId } = await createBictorysCharge(
      apiKey,
      {
        amount: amountToCharge,
        currency: 'XOF',
        country: detectedCountry,
        paymentReference: `tekkishop-${orderId.slice(0, 8)}`,
        merchantReference: orderId,
        successRedirectUrl: `${APP_URL}/${shopSlug}/commander/success?order_id=${orderId}&token=${order.client_token}`,
        errorRedirectUrl: `${APP_URL}/${shopSlug}/commander/pay?cancelled=1&order_id=${orderId}`,
        webhookUrl: `${APP_URL}/api/webhooks/bictorys`,
        orderDetails: [{ name: 'Commande TekkiShop', price: amountToCharge, quantity: 1, taxRate: 0 }],
        customerObject: {
          name: customerName,
          phone: normalizedPhone,
          locale: 'fr-FR',
          country: detectedCountry,
        },
      },
      paymentType,
    )

    await supabase.from('payments').insert({
      order_id: orderId,
      shop_id: order.shop_id,
      amount: amountToCharge,
      currency: 'XOF',
      payment_method: 'bictorys',
      payment_type: isDeposit ? 'deposit' : 'full',
      provider_payment_id: transactionId || `bictorys-${orderId}`,
      status: 'pending',
    })

    console.log(`[checkout/bictorys/create] ✅ Charge créée: transactionId=${transactionId}`)

    return NextResponse.json({ checkoutUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Bictorys inconnue'
    console.error(`[checkout/bictorys/create] ❌ Erreur: ${message}`, { country: detectedCountry, paymentType })
    return NextResponse.json({ error: 'Impossible d\'initier le paiement. Réessayez ou contactez le vendeur.' }, { status: 500 })
  }
}
