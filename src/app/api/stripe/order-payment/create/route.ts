import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createStripeOrderPaymentSession } from '@/lib/payments/stripe'
import { isEuCaCountry, getCurrencyForCountry, toStripeAmount } from '@/lib/utils/country-groups'

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role env vars manquants')
  return createClient(url, key)
}

interface RequestBody {
  orderId:    string
  shopSlug:   string
  isDeposit?: boolean
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json() as RequestBody
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const { orderId, shopSlug, isDeposit = false } = body

  if (!orderId || !shopSlug) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Récupérer la commande et le shop en même temps
  const [{ data: order }, { data: shop }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, client_token, total_price, deposit_amount, status, shop_id')
      .eq('id', orderId)
      .single(),
    supabase
      .from('shops')
      .select('id, slug, country, stripe_account_id, stripe_connect_enabled, plan')
      .eq('slug', shopSlug)
      .single(),
  ])

  if (!order || !shop) {
    return NextResponse.json({ error: 'Commande ou boutique introuvable' }, { status: 404 })
  }

  const shopRaw = shop as {
    id: string
    slug: string
    country?: string
    stripe_account_id?: string | null
    stripe_connect_enabled?: boolean
    plan: string
  }

  const orderRaw = order as {
    id: string
    client_token: string
    total_price: number
    deposit_amount?: number | null
    status: string
    shop_id: string
  }

  // Vérifier que la commande appartient bien à cette boutique
  if (orderRaw.shop_id !== shopRaw.id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // Vérifier le statut de la commande
  if (!['pending', 'confirmed'].includes(orderRaw.status)) {
    return NextResponse.json({ error: 'Cette commande ne peut plus être payée' }, { status: 400 })
  }

  // Vérifier que le marchand a Stripe Connect actif
  if (!shopRaw.stripe_connect_enabled || !shopRaw.stripe_account_id) {
    return NextResponse.json({ error: 'Paiement par carte non disponible pour cette boutique' }, { status: 400 })
  }

  // Vérifier que le pays est EU/CA
  if (!isEuCaCountry(shopRaw.country ?? null)) {
    return NextResponse.json({ error: 'Paiement par carte disponible uniquement en Europe et au Canada' }, { status: 400 })
  }

  const currency     = getCurrencyForCountry(shopRaw.country ?? null)
  if (currency === 'XOF') {
    return NextResponse.json({ error: 'Devise non supportée' }, { status: 400 })
  }

  const displayAmount = isDeposit && orderRaw.deposit_amount
    ? orderRaw.deposit_amount
    : orderRaw.total_price

  if (!displayAmount || displayAmount <= 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
  }

  // Convertir en centimes pour Stripe (EUR/CAD stockés en unités d'affichage, ex: 14.90 → 1490)
  const stripeAmount = toStripeAmount(displayAmount, currency)

  try {
    const { url } = await createStripeOrderPaymentSession({
      orderId:           orderRaw.id,
      shopSlug:          shopRaw.slug,
      amount:            stripeAmount,
      currency:          currency,
      merchantAccountId: shopRaw.stripe_account_id,
      clientToken:       orderRaw.client_token,
      isDeposit,
    })
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
