import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createStripeConnectAccount, createStripeConnectAccountLink } from '@/lib/payments/stripe'

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
    .select('plan, country, email, stripe_account_id')
    .eq('id', profile.shop_id)
    .single()

  if (!shop) {
    return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
  }

  const shopRaw = shop as typeof shop & {
    plan: string
    country?: string
    email?: string
    stripe_account_id?: string | null
  }

  if (shopRaw.plan !== 'pro') {
    return NextResponse.json({ error: 'Stripe Connect nécessite le plan Pro' }, { status: 403 })
  }

  const email   = shopRaw.email ?? user.email
  const country = shopRaw.country ?? 'FR'

  try {
    let accountId = shopRaw.stripe_account_id ?? null

    if (!accountId) {
      const { accountId: newId } = await createStripeConnectAccount(
        profile.shop_id,
        email ?? '',
        country,
      )
      accountId = newId

      const { error: updateError } = await supabase
        .from('shops')
        .update({ stripe_account_id: accountId })
        .eq('id', profile.shop_id)

      if (updateError) throw new Error('Erreur sauvegarde compte Stripe')
    }

    const { url } = await createStripeConnectAccountLink(accountId, profile.shop_id)
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne'
    if (
      message.includes('not currently supported') ||
      message.includes('country') ||
      message.includes('invalid_request')
    ) {
      return NextResponse.json({
        error: 'Votre pays n\'est pas encore supporté par Stripe Connect. Contactez le support TEKKIShop pour une solution alternative.',
      }, { status: 400 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
