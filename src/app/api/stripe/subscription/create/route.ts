import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createStripeSubscriptionSession } from '@/lib/payments/stripe'
import { isEuCaCountry, getCurrencyForCountry } from '@/lib/utils/country-groups'

const VALID_PLANS = new Set(['decouverte', 'business', 'pro'])

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

  let body: { planKey?: string; billingCycle?: string }
  try {
    body = await req.json() as { planKey?: string; billingCycle?: string }
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const { planKey, billingCycle: rawCycle } = body
  const billingCycle = rawCycle === 'annual' ? 'annual' : 'monthly'

  if (!planKey || !VALID_PLANS.has(planKey)) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
  }

  const shopCountry = (shop as typeof shop & { country?: string; email?: string }).country ?? null
  const shopEmail   = (shop as typeof shop & { country?: string; email?: string }).email ?? undefined
  const isEuCa      = isEuCaCountry(shopCountry)

  // EU/CA : uniquement Pro
  if (isEuCa && planKey !== 'pro') {
    return NextResponse.json({ error: 'Plan invalide pour ce marché' }, { status: 400 })
  }

  const currency     = isEuCa ? getCurrencyForCountry(shopCountry) : 'EUR'
  const metaType     = isEuCa ? 'subscription_eu_ca' : 'subscription_global'

  try {
    const { url } = await createStripeSubscriptionSession({
      shopId:        profile.shop_id,
      planKey,
      currency:      currency as 'EUR' | 'CAD',
      billingCycle,
      customerEmail: shopEmail,
      metaType,
    })
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[stripe/subscription/create]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Impossible d\'initier le paiement. Réessayez.' }, { status: 500 })
  }
}
