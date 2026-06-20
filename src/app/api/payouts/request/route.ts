import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { TEKKISHOP_COMMISSION_RATE, PAYOUT_MIN_AMOUNT } from '@/constants'
import { getPayoutMethods } from '@/lib/utils/country-groups'
import type { PayoutMethodKey } from '@/lib/utils/country-groups'

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

  const body = await req.json() as { method: string; amount: number }
  const { method, amount } = body

  if (!method || !amount || amount < PAYOUT_MIN_AMOUNT) {
    return NextResponse.json({ error: `Montant minimum : ${PAYOUT_MIN_AMOUNT}` }, { status: 400 })
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('country, payout_wave_number, payout_om_number')
    .eq('id', profile.shop_id)
    .single()

  // Résoudre le numéro depuis le bon slot DB selon la méthode et le pays
  const methodDef = getPayoutMethods(shop?.country ?? null).find(m => m.key === method)
  if (!methodDef) {
    return NextResponse.json({ error: 'Méthode de payout non reconnue' }, { status: 400 })
  }
  const payoutNumber = methodDef.col === 'payout_wave_number'
    ? shop?.payout_wave_number
    : shop?.payout_om_number
  if (!payoutNumber) {
    return NextResponse.json({ error: 'Numéro de paiement non configuré' }, { status: 400 })
  }

  // ── Validation du solde disponible ───────────────────────────────────
  // Revenus collectés : acomptes en ligne payés + commandes livrées (paiement à la réception)
  const { data: ordersData } = await supabase
    .from('orders')
    .select('total_price, deposit_amount, deposit_paid, payment_type, status')
    .eq('shop_id', profile.shop_id)
    .in('status', ['confirmed', 'preparing', 'ready', 'delivered'])

  const totalRevenue = (ordersData ?? []).reduce((sum, o) => {
    if (o.payment_type === 'online_full' || o.payment_type === 'online_deposit') {
      return sum + (o.deposit_paid ? (o.deposit_amount ?? 0) : 0)
    }
    if (o.status === 'delivered') {
      return sum + (o.total_price ?? 0)
    }
    return sum
  }, 0)

  // Payouts déjà effectués ou en cours
  const { data: existingPayouts } = await supabase
    .from('payouts')
    .select('gross_amount')
    .eq('shop_id', profile.shop_id)
    .in('status', ['pending', 'processing', 'completed'])

  const totalPayouts = (existingPayouts ?? []).reduce((sum, p) => sum + (p.gross_amount ?? 0), 0)
  const availableBalance = Math.max(0, totalRevenue - totalPayouts)

  if (amount > availableBalance) {
    return NextResponse.json({
      error: `Solde insuffisant. Disponible : ${availableBalance.toLocaleString('fr-FR')}.`,
    }, { status: 400 })
  }

  const grossAmount      = amount
  const commissionAmount = Math.floor(grossAmount * (TEKKISHOP_COMMISSION_RATE / 100))
  const netAmount        = grossAmount - commissionAmount

  const { error } = await supabase.from('payouts').insert({
    shop_id:          profile.shop_id,
    gross_amount:     grossAmount,
    commission_amount: commissionAmount,
    net_amount:       netAmount,
    payout_method:    method as PayoutMethodKey,
    payout_number:    payoutNumber,
    status:           'pending',
  })

  if (error) {
    console.error('[payouts/request]', error.message)
    return NextResponse.json({ error: 'Impossible de créer la demande' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
