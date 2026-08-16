'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysPayout } from '@/lib/payments/bictorys'
import type { BictorysPayoutPaymentType } from '@/lib/payments/bictorys'
import { getPayoutMethods } from '@/lib/utils/country-groups'
import type { PayoutMethodKey } from '@/lib/utils/country-groups'
import { revalidatePath } from 'next/cache'
import * as Sentry from '@sentry/nextjs'

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
  const { data: existing, error: existingError } = await admin
    .from('payouts')
    .select('id, status')
    .eq('id', payoutId)
    .maybeSingle()

  if (existingError) {
    console.error('[processPayout] échec lecture statut existant', payoutId, existingError.message)
    Sentry.captureException(new Error('processPayout: échec lecture idempotence'), {
      extra: { payoutId, shopId, dbError: existingError.message },
    })
    return { error: 'Impossible de vérifier le statut du reversement.' }
  }

  if (existing) {
    if (existing.status === 'completed') return {}
    if (existing.status === 'processing') return { error: 'Reversement déjà en cours.' }
  }

  // Récupérer les infos de la boutique
  const { data: shop, error: shopError } = await admin
    .from('shops')
    .select('plan, payout_wave_number, payout_om_number, country, name')
    .eq('id', shopId)
    .single()

  if (shopError || !shop) {
    if (shopError) {
      console.error('[processPayout] échec lecture boutique', shopId, shopError.message)
      Sentry.captureException(new Error('processPayout: échec lecture boutique'), {
        extra: { payoutId, shopId, dbError: shopError.message },
      })
    }
    return { error: 'Boutique introuvable.' }
  }

  const rawCountry = (shop as any).country as string | null ?? 'SN'
  // Garde-fou : 'BF' n'est pas un code pays valide côté Bictorys (seul 'BK'
  // l'est), voir migration 093 et REPRISE.md §4. shops.country ne devrait
  // plus jamais valoir 'BF' après cette migration, mais ce chemin envoie
  // le code tel quel à l'API sans aucune autre validation — on ne suppose
  // pas que la source restera propre indéfiniment.
  const country = rawCountry === 'BF' ? 'BK' : rawCountry
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

  // Créer ou mettre à jour le payout en DB — avant tout envoi d'argent.
  // Si cette écriture échoue, on n'a aucune trace fiable du reversement en
  // cours : mieux vaut arrêter ici que d'envoyer de l'argent sans pouvoir
  // le consigner (et sans que le garde-fou "déjà en cours" puisse jouer).
  const { error: markProcessingError } = !existing
    ? await admin.from('payouts').insert({
        id:                payoutId,
        shop_id:           shopId,
        gross_amount:      grossAmount,
        commission_amount: commissionAmount,
        net_amount:        netAmount,
        payout_method:     payoutMethod as PayoutMethodKey,
        payout_number:     recipientPhone,
        status:            'processing',
      })
    : await admin
        .from('payouts')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', payoutId)

  if (markProcessingError) {
    console.error('[processPayout] échec passage à processing', payoutId, markProcessingError.message)
    Sentry.captureException(new Error('processPayout: échec passage à processing'), {
      extra: { payoutId, shopId, dbError: markProcessingError.message },
    })
    return { error: 'Impossible d\'initier le reversement.' }
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
    const { error: completeError } = await admin
      .from('payouts')
      .update({
        status:               'completed',
        bictorys_transfer_id: result.transactionId ?? null,
        completed_at:         new Date().toISOString(),
        updated_at:           new Date().toISOString(),
      })
      .eq('id', payoutId)

    if (completeError) {
      // L'argent est déjà parti chez Bictorys à ce stade. On ne renvoie PAS
      // une erreur ici : ça inviterait un appelant (cron, admin) à relancer
      // processPayout et donc à envoyer un second virement pour le même
      // reversement. La seule réponse sûre est une alerte forte — un humain
      // doit vérifier manuellement, pas relancer automatiquement.
      //
      // La ligne payouts reste bloquée en 'processing' : aucune tâche de
      // réconciliation n'existe à ce jour pour la rattraper automatiquement
      // (voir NOTE_ERREURS_SUPABASE_NON_VERIFIEES.md). En attendant, cette
      // alerte est la seule trace ; elle doit donc porter de quoi agir sans
      // rouvrir le code.
      console.error('[processPayout] CRITIQUE : virement Bictorys envoyé mais échec de l\'écriture completed', payoutId, completeError.message)
      Sentry.captureException(new Error('processPayout: virement Bictorys envoyé mais échec de l\'écriture completed en DB'), {
        level: 'fatal',
        extra: {
          payoutId,
          shopId,
          shopName,
          netAmountFcfa: netAmount,
          bictorysTransferId: result.transactionId ?? 'absent de la réponse Bictorys — chercher via idempotency-key ci-dessous',
          bictorysIdempotencyKey: payoutId,
          dbWriteError: completeError.message,
          marcheASuivre: [
            `1. Confirmer le virement côté Bictorys (dashboard ou support) en cherchant l'idempotency-key "${payoutId}".`,
            `2. Si confirmé : UPDATE payouts SET status='completed', bictorys_transfer_id=<réf Bictorys>, completed_at=now() WHERE id='${payoutId}';`,
            `3. Si introuvable côté Bictorys : ne rien conclure seul — contacter le support Bictorys avant toute action, le virement peut être en cours de traitement.`,
            `4. Ne PAS relancer processPayout pour ce payoutId ni recréer un nouveau payout pour cette boutique tant que le point 1 n'est pas tranché.`,
          ].join(' '),
        },
      })
    }

    revalidatePath('/dashboard/revenues')
    return {}
  }

  if (result.uncertain) {
    // Aucune réponse HTTP reçue de Bictorys (timeout 30s ou erreur réseau) :
    // le virement a pu partir sans qu'on le sache. On NE marque PAS 'failed'
    // — ce statut n'est pas protégé par le garde d'idempotence ci-dessus, et
    // le marquer autoriserait un rejeu qui pourrait envoyer une seconde fois
    // le même argent. Le statut reste 'processing', ce qui bloque tout rejeu
    // automatique tant qu'un humain n'a pas vérifié manuellement auprès de
    // Bictorys.
    console.error('[processPayout] INCERTAIN : aucune réponse de Bictorys (timeout/réseau) — statut conservé à processing', payoutId, result.error)
    Sentry.captureException(new Error('processPayout: aucune réponse de Bictorys — statut du virement inconnu, réconciliation manuelle requise'), {
      level: 'fatal',
      extra: {
        payoutId,
        shopId,
        shopName,
        netAmountFcfa: netAmount,
        bictorysIdempotencyKey: payoutId,
        networkOrTimeoutError: result.error,
        marcheASuivre: [
          `1. Vérifier côté Bictorys (dashboard ou support) si un virement existe pour l'idempotency-key "${payoutId}".`,
          `2. Si trouvé et effectué : UPDATE payouts SET status='completed', bictorys_transfer_id=<réf Bictorys>, completed_at=now() WHERE id='${payoutId}';`,
          `3. Si absent côté Bictorys : UPDATE payouts SET status='failed', updated_at=now() WHERE id='${payoutId}'; — cela autorise un nouveau reversement pour cette boutique.`,
          `4. Ne PAS relancer processPayout pour ce payoutId tant que 1-3 n'ont pas tranché.`,
        ].join(' '),
      },
    })
    return { error: 'Reversement en attente de vérification manuelle (aucune réponse du prestataire).' }
  }

  // À partir d'ici : réponse HTTP reçue de Bictorys, refus explicite —
  // on sait que le virement n'a pas eu lieu, un rejeu est sûr.
  const message = result.error ?? 'Erreur Bictorys inconnue'
  console.error('[processPayout]', message)

  const { error: failError } = await admin
    .from('payouts')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', payoutId)

  if (failError) {
    // Aucun argent envoyé (Bictorys a refusé explicitement), mais le payout
    // reste bloqué en 'processing' en DB : le garde-fou d'idempotence en
    // tête de fonction le traitera comme "déjà en cours" indéfiniment, sans
    // qu'un nouveau reversement ne puisse jamais être tenté. Nécessite une
    // correction manuelle.
    console.error('[processPayout] échec passage à failed', payoutId, failError.message)
    Sentry.captureException(new Error('processPayout: échec écriture failed — payout restera bloqué en processing'), {
      extra: { payoutId, shopId, bictorysError: message, dbError: failError.message },
    })
  }

  return { error: message }
}
