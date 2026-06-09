import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysCharge, detectCountryFromPhone, normalizePhoneForBictorys, type BictorysPaymentType } from '@/lib/payments/bictorys'
import { APP_URL } from '@/constants'

const PLAN_PRICES: Record<string, number> = {
  decouverte: 2900,
  business:   4900,
  pro:        9900,
}

const PLAN_LABELS: Record<string, string> = {
  decouverte: 'Découverte',
  business:   'Business',
  pro:        'Pro',
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.BICTORYS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Bictorys non configuré (clé manquante)' }, { status: 500 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json() as {
    planKey?: string
    paymentType?: BictorysPaymentType | null
    customerPhone?: string
    customerName?: string
    otp?: string
  }
  const { planKey, paymentType, customerPhone, customerName, otp } = body

  if (!planKey || !PLAN_PRICES[planKey]) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
  }
  // paymentType null/undefined = page Bictorys générique (tous opérateurs)

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id) {
    return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
  }

  const shopId = profile.shop_id as string

  // Récupérer le pays de la boutique (requis par Bictorys)
  const { data: shop } = await admin
    .from('shops')
    .select('country, phone_whatsapp')
    .eq('id', shopId)
    .single()

  if (!shop?.country) {
    return NextResponse.json({ error: 'Pays de la boutique manquant' }, { status: 400 })
  }

  // Détecter le pays depuis customerPhone (nouveau flow checkout) ou shop.phone_whatsapp (ancien flow)
  let paymentCountry = shop.country
  let normalizedPhone: string | undefined

  if (customerPhone) {
    const normalized = normalizePhoneForBictorys(customerPhone)
    const detectedCountry = detectCountryFromPhone(normalized)
    if (detectedCountry) {
      paymentCountry = detectedCountry
      normalizedPhone = normalized
    }
  } else if (shop.phone_whatsapp) {
    const detectedCountry = detectCountryFromPhone(shop.phone_whatsapp)
    if (detectedCountry) {
      paymentCountry = detectedCountry
    }
  }

  const amount = PLAN_PRICES[planKey]
  const paymentReference = `ts-sub-${shopId.slice(0, 8)}`

  let chargeResult
  try {
    chargeResult = await createBictorysCharge(
      apiKey,
      {
        amount,
        currency: 'XOF',
        country: paymentCountry,
        paymentReference,
        successRedirectUrl: `${APP_URL}/dashboard/upgrade?success=1&plan=${planKey}`,
        errorRedirectUrl:   `${APP_URL}/dashboard/upgrade?error=1`,
        webhookUrl: `${APP_URL}/api/webhooks/bictorys`,
        orderDetails: [{
          name:     `Abonnement TekkiShop — Plan ${PLAN_LABELS[planKey]}`,
          price:    amount,
          quantity: 1,
          taxRate:  0,
        }],
        customerObject: {
          name: customerName || undefined,
          phone: normalizedPhone || undefined,
          locale: 'fr-FR',
          country: paymentCountry,
        },
        ...(otp && { otp }),
      },
      paymentType ?? undefined,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Bictorys inconnue'
    console.error('[subscription/create] Direct API échoué:', message, '| country:', paymentCountry, '| paymentType:', paymentType)

    // FALLBACK pour Wave CI: si Direct API échoue et que c'est Wave en CI, rediriger vers page Bictorys générique
    if (paymentCountry === 'CI' && paymentType === 'wave_money') {
      console.log('[subscription/create] Fallback: Wave CI en Direct API a échoué, tentative avec page générique')
      try {
        chargeResult = await createBictorysCharge(
          apiKey,
          {
            amount,
            currency: 'XOF',
            country: paymentCountry,
            paymentReference,
            successRedirectUrl: `${APP_URL}/dashboard/upgrade?success=1&plan=${planKey}`,
            errorRedirectUrl:   `${APP_URL}/dashboard/upgrade?error=1`,
            webhookUrl: `${APP_URL}/api/webhooks/bictorys`,
            orderDetails: [{
              name:     `Abonnement TekkiShop — Plan ${PLAN_LABELS[planKey]}`,
              price:    amount,
              quantity: 1,
              taxRate:  0,
            }],
            customerObject: {
              name: customerName || undefined,
              phone: normalizedPhone || undefined,
              locale: 'fr-FR',
              country: paymentCountry,
            },
            ...(otp && { otp }),
          },
          undefined, // Pas de payment_type = page générique
        )
        console.log('[subscription/create] ✅ Fallback réussi — page générique')
      } catch (fallbackErr) {
        const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : 'Fallback échoué'
        console.error('[subscription/create] Fallback aussi échoué:', fallbackMsg)
        return NextResponse.json({ error: `Erreur paiement (${fallbackMsg})` }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  const { checkoutUrl, transactionId, message } = chargeResult

  // Enregistrer la tentative de paiement pour le webhook
  if (!transactionId || transactionId.trim() === '') {
    console.error('[subscription/create] ❌ transactionId vide ou invalide!', {
      transactionId,
      chargeResult,
    })
    console.error('[subscription/create] Response Bictorys n\'a pas retourné de charge ID valide')
    return NextResponse.json({
      error: 'Erreur: Bictorys n\'a pas fourni d\'ID de transaction. Veuillez réessayer.'
    }, { status: 500 })
  }

  console.log('[subscription/create] ✅ Transaction ID valide:', transactionId)

  console.log('[subscription/create] 📝 Insertion dans subscription_transactions:', {
    shop_id: shopId,
    plan_key: planKey,
    charge_id: transactionId,
    merchant_reference: paymentReference,
  })

  const { error: insertError, data: txnData } = await admin
    .from('subscription_transactions' as never)
    .insert({
      shop_id: shopId,
      plan_key: planKey,
      charge_id: transactionId,
      merchant_reference: paymentReference,
      status: 'pending',
    } as never)
    .select()
    .single() as any

  if (insertError) {
    console.error('[subscription/create] ❌ Erreur insertion subscription_transactions:', insertError)
    console.error('[subscription/create] Détails insertion:', {
      shop_id: shopId,
      plan_key: planKey,
      charge_id: transactionId,
      merchant_reference: paymentReference,
      insertError: insertError.message,
    })
    return NextResponse.json({ error: `Erreur lors de l\'enregistrement: ${insertError.message}` }, { status: 500 })
  }

  console.log('[subscription/create] ✅ Transaction enregistrée:', txnData?.id)

  console.log('[subscription/create] ✅ Charge créée avec succès:', {
    txnId: txnData?.id,
    shopId,
    planKey,
    chargeId: transactionId,
    paymentReference,
  })

  return NextResponse.json({ checkoutUrl, transactionId, message })
}
