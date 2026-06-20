'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysPayout } from '@/lib/payments/bictorys'
import { revalidatePath } from 'next/cache'

const COMMISSION_RATES: Record<string, number> = {
  decouverte: 0.03,
  business:   0.03,
  pro:        0,
}

/**
 * Déclenche un reversement Bictorys (Wave ou Orange Money) pour une boutique.
 * Appelé par le cron ou l'admin — la vérification d'accès est à la charge du appelant.
 * payoutId sert de clé d'idempotence Bictorys.
 */
export async function processPayout(
  payoutId: string,
  shopId: string,
  grossAmount: number,
  payoutMethod: 'wave' | 'orange_money',
): Promise<{ error?: string }> {
  const apiKey = process.env.BICTORYS_API_KEY
  if (!apiKey) return { error: 'Bictorys non configuré.' }

  const admin = createAdminClient()

  // Vérifier que le payout n'a pas déjà été traité (idempotence)
  const { data: existing } = await admin
    .from('payouts')
    .select('id, status')
    .eq('id', payoutId)
    .single()

  if (existing) {
    if (existing.status === 'completed') return {}
    if (existing.status === 'processing') return { error: 'Reversement déjà en cours.' }
  }

  // Récupérer les infos de la boutique
  const { data: shop } = await admin
    .from('shops')
    .select('plan, payout_wave_number, payout_om_number')
    .eq('id', shopId)
    .single()

  if (!shop) return { error: 'Boutique introuvable.' }

  const recipientPhone = payoutMethod === 'wave'
    ? shop.payout_wave_number
    : shop.payout_om_number

  if (!recipientPhone) {
    return { error: `Numéro de reversement ${payoutMethod === 'wave' ? 'Wave' : 'Orange Money'} non configuré.` }
  }

  const commissionRate = COMMISSION_RATES[shop.plan ?? 'decouverte'] ?? 0.03
  const commissionAmount = Math.round(grossAmount * commissionRate)
  const netAmount = grossAmount - commissionAmount

  const bictorysPaymentType = payoutMethod === 'wave' ? 'wave_money' : 'orange_money'

  // Créer ou mettre à jour le payout en DB
  if (!existing) {
    await admin.from('payouts').insert({
      id:                payoutId,
      shop_id:           shopId,
      gross_amount:      grossAmount,
      commission_amount: commissionAmount,
      net_amount:        netAmount,
      payout_method:     payoutMethod,
      payout_number:     recipientPhone,
      status:            'processing',
    })
  } else {
    await admin
      .from('payouts')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', payoutId)
  }

  try {
    const { transactionId } = await createBictorysPayout(
      apiKey,
      {
        amount:           netAmount,
        currency:         'XOF',
        paymentReference: `payout-${payoutId.slice(0, 8)}`,
        recipientPhone,
        description:      `Reversement TekkiShop — boutique ${shopId.slice(0, 8)}`,
      },
      bictorysPaymentType,
      payoutId, // idempotency key = payout UUID
    )

    await admin
      .from('payouts')
      .update({
        status:               'completed',
        bictorys_transfer_id: transactionId || null,
        completed_at:         new Date().toISOString(),
        updated_at:           new Date().toISOString(),
      })
      .eq('id', payoutId)

    revalidatePath('/dashboard/payouts')
    return {}
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Bictorys inconnue'
    console.error('[processPayout]', message)

    await admin
      .from('payouts')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', payoutId)

    return { error: message }
  }
}
