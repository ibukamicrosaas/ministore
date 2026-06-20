import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createStripeSubscriptionSession } from '@/lib/payments/stripe'
import { isEuCaCountry, getCurrencyForCountry } from '@/lib/utils/country-groups'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('country, email')
    .eq('id', profile.shop_id)
    .single()

  if (!shop) {
    return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
  }

  const shopCountry = (shop as typeof shop & { country?: string }).country ?? null
  if (!isEuCaCountry(shopCountry)) {
    return NextResponse.json({ error: 'Paiement Stripe non disponible pour ce pays' }, { status: 400 })
  }

  const currency = getCurrencyForCountry(shopCountry)
  if (currency === 'XOF') {
    return NextResponse.json({ error: 'Devise non supportée' }, { status: 400 })
  }

  let body: { planKey?: string; billingCycle?: string }
  try {
    body = await req.json() as { planKey?: string; billingCycle?: string }
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const planKey      = body.planKey === 'pro' ? 'pro' : null
  const billingCycle = body.billingCycle === 'annual' ? 'annual' : 'monthly'

  if (!planKey) {
    return NextResponse.json({ error: 'Plan invalide pour ce marché' }, { status: 400 })
  }

  const shopEmail = (shop as typeof shop & { email?: string }).email ?? undefined

  try {
    const { url } = await createStripeSubscriptionSession({
      shopId:        profile.shop_id,
      planKey:       planKey,
      currency:      currency,
      billingCycle:  billingCycle,
      customerEmail: shopEmail,
    })
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
