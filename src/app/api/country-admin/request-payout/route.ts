import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCountryManagerFull, getCMSubscriptionBalance, CM_PAYOUT_MIN } from '@/lib/actions/country-admin'
import { getPayoutMethods, type PayoutMethodKey } from '@/lib/utils/country-groups'

export async function POST(req: NextRequest) {
  let cm: Awaited<ReturnType<typeof requireCountryManagerFull>>
  try {
    cm = await requireCountryManagerFull()
  } catch {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await req.json() as {
    amount?: number
    provider?: string
    mobileMoneyNumber?: string
  }

  const { amount, provider, mobileMoneyNumber } = body

  if (!amount || amount < CM_PAYOUT_MIN) {
    return NextResponse.json({ error: `Montant minimum : ${CM_PAYOUT_MIN.toLocaleString('fr-FR')} FCFA` }, { status: 400 })
  }
  if (!provider?.trim() || !mobileMoneyNumber?.trim()) {
    return NextResponse.json({ error: 'Méthode et numéro mobile money requis' }, { status: 400 })
  }

  // Valider que le provider est autorisé pour ce pays
  const allowedProviders = getPayoutMethods(cm.country).map(m => m.key)
  if (!allowedProviders.includes(provider as PayoutMethodKey)) {
    return NextResponse.json({ error: 'Méthode de paiement non autorisée pour ce pays' }, { status: 400 })
  }

  // Vérifier le solde disponible
  const balance = await getCMSubscriptionBalance(cm.id, cm.country, cm.licenseStartAt)

  if (balance.pendingRequest) {
    return NextResponse.json({ error: 'Une demande est déjà en cours de traitement' }, { status: 400 })
  }
  if (amount > balance.available) {
    return NextResponse.json({ error: 'Montant supérieur au solde disponible' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await (admin
    .from('country_manager_payouts' as never)
    .insert({
      country_manager_id:  cm.id,
      country:             cm.country,
      amount,
      provider,
      mobile_money_number: mobileMoneyNumber.trim(),
      status:              'pending',
    } as never) as unknown as Promise<{ error: Error | null }>)

  if (error) {
    console.error('[cm/request-payout]', error.message)
    return NextResponse.json({ error: 'Impossible de créer la demande' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
