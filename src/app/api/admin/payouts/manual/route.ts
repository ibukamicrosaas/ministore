import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PayoutMethodKey } from '@/lib/utils/country-groups'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)
const TEKKISHOP_COMMISSION_RATE = 3

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const body = await req.json() as {
    shopSlug?: string
    amount?: number
    method?: string
    phoneNumber?: string
    notes?: string
  }

  const { shopSlug, amount, method, phoneNumber, notes } = body

  if (!shopSlug?.trim())  return NextResponse.json({ error: 'Slug de boutique requis' }, { status: 400 })
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
  if (!method?.trim())    return NextResponse.json({ error: 'Méthode de paiement requise' }, { status: 400 })
  if (!phoneNumber?.trim()) return NextResponse.json({ error: 'Numéro mobile money requis' }, { status: 400 })

  const admin = createAdminClient()

  const { data: shop } = await admin
    .from('shops')
    .select('id, name')
    .eq('slug', shopSlug.trim())
    .single()

  if (!shop) {
    return NextResponse.json({ error: `Boutique "${shopSlug}" introuvable` }, { status: 404 })
  }

  // Calcul du solde disponible pour information (non bloquant — admin connaît son contexte)
  const [{ data: payments }, { data: payouts }] = await Promise.all([
    admin.from('payments').select('amount').eq('shop_id', shop.id).eq('status', 'completed'),
    admin.from('payouts').select('gross_amount').eq('shop_id', shop.id).in('status', ['pending', 'processing', 'completed']),
  ])

  const totalCollected   = (payments ?? []).reduce((s, p) => s + p.amount, 0)
  const totalPaidOut     = (payouts ?? []).reduce((s, p) => s + p.gross_amount, 0)
  const grossBalance     = totalCollected - totalPaidOut
  const commissionAmount = Math.floor(grossBalance * (TEKKISHOP_COMMISSION_RATE / 100))
  const netBalance       = grossBalance - commissionAmount

  const grossAmount      = Math.ceil(amount / (1 - TEKKISHOP_COMMISSION_RATE / 100))
  const commission       = grossAmount - amount

  const { data: payout, error } = await admin
    .from('payouts')
    .insert({
      shop_id:           shop.id,
      gross_amount:      grossAmount,
      commission_amount: commission,
      net_amount:        amount,
      payout_method:     method as PayoutMethodKey,
      payout_number:     phoneNumber.trim(),
      status:            'completed',
      completed_at:      new Date().toISOString(),
      notes:             notes?.trim() || `Reversement manuel par admin — solde avant opération : ${netBalance.toLocaleString('fr-FR')} FCFA`,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[admin/payouts/manual]', error.message)
    return NextResponse.json({ error: 'Impossible de créer le reversement' }, { status: 500 })
  }

  return NextResponse.json({ success: true, payoutId: payout.id, shopName: shop.name, netBalance })
}
