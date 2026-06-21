'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysPayout } from '@/lib/payments/bictorys'
import type { BictorysPayoutPaymentType } from '@/lib/payments/bictorys'
import { getPayoutMethods } from '@/lib/utils/country-groups'
import type { PayoutMethodKey } from '@/lib/utils/country-groups'
import { revalidatePath } from 'next/cache'

// Mapping clé interne → payment_type Bictorys
const PAYOUT_METHOD_MAP: Record<string, BictorysPayoutPaymentType> = {
  wave:         'wave_money',
  orange_money: 'orange_money',
  mtn:          'mtn_money',
  moov:         'moov',
  tmoney:       'moov',  // Togocel/Flooz non nativement supportés → moov fallback
  flooz:        'moov',
}

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
  payoutMethod: string,
): Promise<{ error?: string }> {
  const privateKey         = process.env.BICTORYS_PRIVATE_KEY
  const merchantSecretCode = process.env.BICTORYS_MERCHANT_SECRET_CODE  // optionnel
  if (!privateKey) return { error: 'BICTORYS_PRIVATE_KEY non configuré.' }

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
    .select('plan, payout_wave_number, payout_om_number, country, name')
    .eq('id', shopId)
    .single()

  if (!shop) return { error: 'Boutique introuvable.' }

  const country = (shop as any).country as string | null ?? 'SN'
  const shopName = (shop as any).name as string | null ?? 'Marchand TekkiShop'

  // Résoudre le numéro de réception depuis le bon slot DB selon pays + méthode
  const methodDef = getPayoutMethods(country).find(m => m.key === payoutMethod)
  const recipientPhone = methodDef?.col === 'payout_wave_number'
    ? shop.payout_wave_number
    : shop.payout_om_number

  if (!recipientPhone) {
    return { error: `Numéro de reversement "${payoutMethod}" non configuré.` }
  }

  const commissionRate = COMMISSION_RATES[shop.plan ?? 'decouverte'] ?? 0.03
  const commissionAmount = Math.round(grossAmount * commissionRate)
  const netAmount = grossAmount - commissionAmount

  const bictorysPaymentType: BictorysPayoutPaymentType = PAYOUT_METHOD_MAP[payoutMethod] ?? 'wave_money'

  // Créer ou mettre à jour le payout en DB
  if (!existing) {
    await admin.from('payouts').insert({
      id:                payoutId,
      shop_id:           shopId,
      gross_amount:      grossAmount,
      commission_amount: commissionAmount,
      net_amount:        netAmount,
      payout_method:     payoutMethod as PayoutMethodKey,
      payout_number:     recipientPhone,
      status:            'processing',
    })
  } else {
    await admin
      .from('payouts')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', payoutId)
  }

  const result = await createBictorysPayout(
    privateKey,
    {
      amount:   netAmount,
      currency: 'XOF',
      country,
      customerObject: {
        name:  shopName,
        phone: recipientPhone,
      },
      paymentReason:     'Reversement TekkiShop',
      merchantReference: `payout-${payoutId.slice(0, 8)}`,
      ...(merchantSecretCode ? { merchant: { secretCode: merchantSecretCode } } : {}),
    },
    bictorysPaymentType,
    payoutId,
  )

  if (result.success) {
    await admin
      .from('payouts')
      .update({
        status:               'completed',
        bictorys_transfer_id: result.transactionId ?? null,
        completed_at:         new Date().toISOString(),
        updated_at:           new Date().toISOString(),
      })
      .eq('id', payoutId)

    revalidatePath('/dashboard/revenues')
    return {}
  }

  const message = result.error ?? 'Erreur Bictorys inconnue'
  console.error('[processPayout]', message)

  await admin
    .from('payouts')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', payoutId)

  return { error: message }
}
