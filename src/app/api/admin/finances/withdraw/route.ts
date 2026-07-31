import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysPayout, detectCountryFromPhone } from '@/lib/payments/bictorys'
import type { BictorysPayoutPaymentType } from '@/lib/payments/bictorys'
import { CM_PLAN_PRICES } from '@/lib/country-manager-config'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

const PAYOUT_METHOD_BICTORYS: Record<string, BictorysPayoutPaymentType> = {
  wave:         'wave_money',
  orange_money: 'orange_money',
  mtn:          'mtn_money',
  moov:         'moov',
  flooz:        'moov',
  tmoney:       'togocell',
  mobicash:     'mobicash',
  maxit:        'maxit',
}

type AdminWithdrawal = { id: string }

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const body = await req.json() as {
    amount?: number
    method?: string
    phoneNumber?: string
    notes?: string
  }
  const { amount, method, phoneNumber, notes } = body

  if (!amount || amount <= 0)  return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
  if (!method?.trim())         return NextResponse.json({ error: 'Méthode requise' }, { status: 400 })
  if (!phoneNumber?.trim())    return NextResponse.json({ error: 'Numéro requis' }, { status: 400 })

  const admin = createAdminClient()

  // Calcul serveur-side du solde disponible
  const [subResult, withdrawalResult] = await Promise.all([
    (admin
      .from('subscription_transactions' as never)
      .select('plan_key')
      .eq('status' as never, 'activated') as unknown as Promise<{ data: { plan_key: string }[] | null }>),
    (admin
      .from('admin_withdrawals')
      .select('amount')
      .eq('status', 'completed') as unknown as Promise<{ data: { amount: number }[] | null }>),
  ])

  const totalRevenue   = (subResult.data ?? []).reduce((s, t) => s + (CM_PLAN_PRICES[t.plan_key] ?? 0), 0)
  const totalWithdrawn = (withdrawalResult.data ?? []).reduce((s, w) => s + w.amount, 0)
  const available      = totalRevenue - totalWithdrawn

  if (amount > available) {
    return NextResponse.json({
      error: `Montant supérieur au solde disponible (${available.toLocaleString('fr-FR')} F)`,
    }, { status: 400 })
  }

  // Créer l'enregistrement en 'processing'
  const { data: record, error: insertError } = await (admin
    .from('admin_withdrawals')
    .insert({
      amount,
      method,
      phone_number: phoneNumber.trim(),
      status:       'processing',
      notes:        notes?.trim() || null,
    })
    .select('id')
    .single() as unknown as Promise<{ data: AdminWithdrawal | null; error: { message: string } | null }>)

  if (insertError || !record) {
    console.error('[admin/finances/withdraw] insert error:', insertError?.message)
    return NextResponse.json({ error: 'Impossible de créer le retrait' }, { status: 500 })
  }

  const privateKey  = process.env.BICTORYS_PRIVATE_KEY
  const bictorysType = PAYOUT_METHOD_BICTORYS[method] ?? 'wave_money'
  const country      = detectCountryFromPhone(phoneNumber) ?? 'SN'

  if (privateKey) {
    const result = await createBictorysPayout(
      privateKey,
      {
        amount,
        currency: 'XOF',
        country,
        customerObject: {
          name:    'TEKKIShop',
          phone:   phoneNumber.trim(),
          country,
        },
        paymentReason:     `Retrait revenus abonnements TEKKIShop${notes ? ` — ${notes}` : ''}`,
        merchantReference: record.id,
      },
      bictorysType,
      record.id,
    )

    if (result.success) {
      await admin
        .from('admin_withdrawals')
        .update({
          status:               'completed',
          bictorys_transfer_id: result.transactionId ?? null,
          withdrawn_at:         new Date().toISOString(),
        })
        .eq('id', record.id)
      return NextResponse.json({ success: true, auto: true })
    }

    // Bictorys a refusé — on marque 'failed' pour ne pas déduire du solde
    console.error('[admin/finances/withdraw] Bictorys failed:', result.error)
    await admin.from('admin_withdrawals').update({ status: 'failed' }).eq('id', record.id)
    return NextResponse.json({
      error: `Bictorys a refusé le virement : ${result.error}. Solde non débité. Retentez ou effectuez le retrait manuellement depuis Bictorys.`,
    }, { status: 502 })
  }

  // Pas de clé privée configurée — on enregistre comme effectué manuellement
  await admin
    .from('admin_withdrawals')
    .update({ status: 'completed' })
    .eq('id', record.id)

  return NextResponse.json({ success: true, auto: false })
}
