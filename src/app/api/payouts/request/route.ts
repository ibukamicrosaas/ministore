import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { TEKKISHOP_COMMISSION_RATE, PAYOUT_MIN_AMOUNT } from '@/constants'

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

  const body = await req.json() as { method: 'wave' | 'orange_money'; amount: number }
  const { method, amount } = body

  if (!method || !amount || amount < PAYOUT_MIN_AMOUNT) {
    return NextResponse.json({ error: `Montant minimum : ${PAYOUT_MIN_AMOUNT} FCFA` }, { status: 400 })
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('payout_wave_number, payout_om_number')
    .eq('id', profile.shop_id)
    .single()

  const payoutNumber = method === 'wave' ? shop?.payout_wave_number : shop?.payout_om_number
  if (!payoutNumber) {
    return NextResponse.json({ error: 'Numéro de paiement non configuré' }, { status: 400 })
  }

  const grossAmount      = amount
  const commissionAmount = Math.floor(grossAmount * (TEKKISHOP_COMMISSION_RATE / 100))
  const netAmount        = grossAmount - commissionAmount

  const { error } = await supabase.from('payouts').insert({
    shop_id:          profile.shop_id,
    gross_amount:     grossAmount,
    commission_amount: commissionAmount,
    net_amount:       netAmount,
    payout_method:    method,
    payout_number:    payoutNumber,
    status:           'pending',
  })

  if (error) {
    console.error('[payouts/request]', error.message)
    return NextResponse.json({ error: 'Impossible de créer la demande' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
