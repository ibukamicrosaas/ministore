import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeConnectAccountStatus } from '@/lib/payments/stripe'
import { APP_URL } from '@/constants'

// Service role pour mettre à jour le statut sans dépendre de la session utilisateur
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role env vars manquants')
  return createClient(url, key)
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const shopId = searchParams.get('shop_id')

  if (!shopId) {
    return NextResponse.redirect(`${APP_URL}/dashboard/settings?stripe_error=missing_shop`)
  }

  const supabase = createServiceClient()

  const { data: shop } = await supabase
    .from('shops')
    .select('stripe_account_id')
    .eq('id', shopId)
    .single()

  const accountId = (shop as { stripe_account_id?: string | null } | null)?.stripe_account_id

  if (!accountId) {
    return NextResponse.redirect(`${APP_URL}/dashboard/settings?stripe_error=no_account`)
  }

  try {
    const { enabled, detailsSubmitted } = await getStripeConnectAccountStatus(accountId)

    await supabase
      .from('shops')
      .update({ stripe_connect_enabled: enabled })
      .eq('id', shopId)

    const status = enabled ? 'connected' : (detailsSubmitted ? 'pending' : 'incomplete')
    return NextResponse.redirect(`${APP_URL}/dashboard/settings?stripe_connect=${status}`)
  } catch {
    return NextResponse.redirect(`${APP_URL}/dashboard/settings?stripe_error=check_failed`)
  }
}
