import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysPayout } from '@/lib/payments/bictorys'
import type { BictorysPayoutPaymentType } from '@/lib/payments/bictorys'
import { TEKKISHOP_COMMISSION_RATE, PAYOUT_MIN_AMOUNT } from '@/constants'
import { getPayoutMethods } from '@/lib/utils/country-groups'
import type { PayoutMethodKey } from '@/lib/utils/country-groups'

const PAYOUT_METHOD_BICTORYS: Record<string, BictorysPayoutPaymentType> = {
  wave:         'wave_money',
  orange_money: 'orange_money',
  mtn:          'mtn_money',
  moov:         'moov',
  tmoney:       'moov',
  flooz:        'moov',
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const body = await req.json() as { method: string }
  const { method } = body

  if (!method) {
    return NextResponse.json({ error: 'Méthode de retrait manquante' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: shop } = await admin
    .from('shops')
    .select('name, country, payout_wave_number, payout_om_number')
    .eq('id', profile.shop_id)
    .single()

  // Résoudre le numéro selon pays + méthode
  const methodDef = getPayoutMethods(shop?.country ?? null).find(m => m.key === method)
  if (!methodDef) {
    return NextResponse.json({ error: 'Méthode de retrait non reconnue' }, { status: 400 })
  }
  const payoutNumber = methodDef.col === 'payout_wave_number'
    ? shop?.payout_wave_number
    : shop?.payout_om_number
  if (!payoutNumber) {
    return NextResponse.json({ error: 'Numéro de paiement non configuré' }, { status: 400 })
  }

  // Calcul serveur-side (ne pas faire confiance au montant envoyé par le client)
  // grossBalance = total collecté − total déjà sorti (gross_amount des payouts actifs)
  const [paymentsResult, payoutsResult] = await Promise.all([
    supabase
      .from('payments')
      .select('amount')
      .eq('shop_id', profile.shop_id)
      .eq('status', 'completed'),
    admin
      .from('payouts')
      .select('gross_amount')
      .eq('shop_id', profile.shop_id)
      .in('status', ['pending', 'processing', 'completed']),
  ])

  const totalCollected   = (paymentsResult.data ?? []).reduce((s, p) => s + p.amount, 0)
  const totalPaidOutGross = (payoutsResult.data ?? []).reduce((s, p) => s + p.gross_amount, 0)
  const grossBalance     = totalCollected - totalPaidOutGross

  const commissionAmount = Math.floor(grossBalance * (TEKKISHOP_COMMISSION_RATE / 100))
  const netAmount        = grossBalance - commissionAmount

  if (netAmount < PAYOUT_MIN_AMOUNT) {
    return NextResponse.json({
      error: `Solde insuffisant. Disponible : ${netAmount.toLocaleString('fr-FR')} FCFA (minimum : ${PAYOUT_MIN_AMOUNT} FCFA).`,
    }, { status: 400 })
  }

  // Insérer en "processing" immédiatement, puis appeler Bictorys
  const { data: payoutRecord, error: insertError } = await admin
    .from('payouts')
    .insert({
      shop_id:           profile.shop_id,
      gross_amount:      grossBalance,
      commission_amount: commissionAmount,
      net_amount:        netAmount,
      payout_method:     method as PayoutMethodKey,
      payout_number:     payoutNumber,
      status:            'processing',
    })
    .select('id')
    .single()

  if (insertError || !payoutRecord) {
    console.error('[payouts/request] insert error:', insertError?.message, insertError?.code)
    return NextResponse.json({ error: 'Impossible de créer la demande' }, { status: 500 })
  }

  // Appel Bictorys immédiat — retrait automatique
  const privateKey         = process.env.BICTORYS_PRIVATE_KEY
  const bictorysPaymentType = PAYOUT_METHOD_BICTORYS[method] ?? 'wave_money'

  if (privateKey) {
    const result = await createBictorysPayout(
      privateKey,
      {
        amount:   netAmount,
        currency: 'XOF',
        country:  shop?.country ?? 'SN',
        customerObject: {
          name:  shop?.name ?? 'Boutique TekkiShop',
          phone: payoutNumber,
        },
        paymentReason:     `Reversement TEKKIShop — ${shop?.name ?? 'Boutique'}`,
        merchantReference: payoutRecord.id,
      },
      bictorysPaymentType,
      payoutRecord.id, // idempotency key — évite les doubles virements
    )

    if (result.success) {
      await admin.from('payouts').update({
        status:               'completed',
        bictorys_transfer_id: result.transactionId ?? null,
        completed_at:         new Date().toISOString(),
      }).eq('id', payoutRecord.id)

      return NextResponse.json({ success: true, auto: true })
    }

    // Échec Bictorys : repasse en "pending" pour traitement manuel admin
    console.error('[payouts/request] Bictorys payout failed:', result.error)
    await admin.from('payouts').update({ status: 'pending' }).eq('id', payoutRecord.id)
  } else {
    // Pas de clé privée configurée : traitement manuel
    await admin.from('payouts').update({ status: 'pending' }).eq('id', payoutRecord.id)
  }

  return NextResponse.json({ success: true, auto: false })
}
