import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PayoutMethodKey } from '@/lib/utils/country-groups'
import { getCommissionRate } from '@/lib/billing/commission'
import { computeBalance } from '@/lib/billing/balance'
import { loadBalanceInputs } from '@/lib/billing/balance-data'
import { arePayoutsEnabled, PAYOUTS_DISABLED_CODE, PAYOUTS_DISABLED_MESSAGE } from '@/lib/billing/payouts-guard'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

export async function POST(req: NextRequest) {
  if (!arePayoutsEnabled()) {
    return NextResponse.json({ error: PAYOUTS_DISABLED_MESSAGE, code: PAYOUTS_DISABLED_CODE }, { status: 403 })
  }

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
    .select('id, name, country')
    .eq('slug', shopSlug.trim())
    .single()

  if (!shop) {
    return NextResponse.json({ error: `Boutique "${shopSlug}" introuvable` }, { status: 404 })
  }

  const commissionRate = getCommissionRate(shop.country)

  // Calcul du solde disponible pour information (non bloquant — admin connaît son contexte)
  const { payments, payouts, error: balanceError } = await loadBalanceInputs(admin, shop.id)
  if (balanceError) console.error('[admin/payouts/manual] chargement du solde:', balanceError)
  const netBalance = computeBalance(payments, payouts, commissionRate).available

  // Reversement manuel hors Bictorys (virement bancaire, espèces...) : pas de
  // frais de retrait Bictorys à appliquer ici, seulement la commission PAY IN.
  const grossAmount      = Math.ceil(amount / (1 - commissionRate / 100))
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
