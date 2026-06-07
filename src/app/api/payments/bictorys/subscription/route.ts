import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysCharge, type BictorysPaymentType } from '@/lib/payments/bictorys'
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

  const body = await req.json() as { planKey?: string; paymentType?: BictorysPaymentType | null }
  const { planKey, paymentType } = body

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
  const amount = PLAN_PRICES[planKey]
  const paymentReference = `ts-sub-${shopId.slice(0, 8)}`

  try {
    const { checkoutUrl, transactionId } = await createBictorysCharge(
      apiKey,
      {
        amount,
        currency: 'XOF',
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
      },
      paymentType ?? undefined,
    )

    // Enregistrer la tentative de paiement pour le webhook
    const { error: insertError } = await admin
      .from('subscription_transactions' as never)
      .insert({
        shop_id: shopId,
        plan_key: planKey,
        charge_id: transactionId || '',
        merchant_reference: paymentReference,
        status: 'pending',
      })

    if (insertError) {
      console.error('[subscription/create] Erreur insertion subscription_transactions:', insertError)
      // Ne pas bloquer le paiement si l'enregistrement échoue
    }

    console.log('[subscription/create] Charge créée avec succès:', {
      shopId,
      planKey,
      transactionId: transactionId?.slice(0, 8) + '...',
      paymentReference,
    })

    return NextResponse.json({ checkoutUrl, transactionId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Bictorys inconnue'
    console.error('[subscription/create]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
