import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysPayout } from '@/lib/payments/bictorys'
import type { BictorysPayoutPaymentType } from '@/lib/payments/bictorys'
import { TEKKISHOP_COMMISSION_RATE, PAYOUT_MIN_AMOUNT } from '@/constants'
import { getPayoutMethods } from '@/lib/utils/country-groups'
import type { PayoutMethodKey } from '@/lib/utils/country-groups'
import * as Sentry from '@sentry/nextjs'

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
  const shopName = shop?.name ?? 'Boutique TekkiShop'

  if (privateKey) {
    const result = await createBictorysPayout(
      privateKey,
      {
        amount:   netAmount,
        currency: 'XOF',
        country:  shop?.country ?? 'SN',
        customerObject: {
          name:  shopName,
          phone: payoutNumber,
        },
        paymentReason:     `Reversement TEKKIShop — ${shopName}`,
        merchantReference: payoutRecord.id,
      },
      bictorysPaymentType,
      payoutRecord.id, // idempotency key — évite les doubles virements
    )

    if (result.success) {
      const { error: completeError } = await admin.from('payouts').update({
        status:               'completed',
        bictorys_transfer_id: result.transactionId ?? null,
        completed_at:         new Date().toISOString(),
      }).eq('id', payoutRecord.id)

      if (completeError) {
        // L'argent est déjà parti chez Bictorys. Ne pas renvoyer une erreur
        // au marchand ici : côté client, un échec affiché inviterait à
        // recliquer "Retirer", et ça créerait une DEUXIÈME ligne payout
        // (id différent, donc idempotency-key différente côté Bictorys —
        // aucune protection). On répond succès (le virement a bien eu lieu),
        // et on alerte pour que la ligne 'processing' soit rattrapée à la main.
        console.error('[payouts/request] CRITIQUE : virement Bictorys envoyé mais échec de l\'écriture completed', payoutRecord.id, completeError.message)
        Sentry.captureException(new Error('payouts/request: virement Bictorys envoyé mais échec de l\'écriture completed en DB'), {
          level: 'fatal',
          extra: {
            payoutId: payoutRecord.id,
            shopId: profile.shop_id,
            shopName,
            netAmountFcfa: netAmount,
            bictorysTransferId: result.transactionId ?? 'absent de la réponse Bictorys — chercher via idempotency-key ci-dessous',
            bictorysIdempotencyKey: payoutRecord.id,
            dbWriteError: completeError.message,
            marcheASuivre: [
              `1. Confirmer le virement côté Bictorys (dashboard ou support) en cherchant l'idempotency-key "${payoutRecord.id}".`,
              `2. Si confirmé : UPDATE payouts SET status='completed', bictorys_transfer_id=<réf Bictorys>, completed_at=now() WHERE id='${payoutRecord.id}';`,
              `3. Si introuvable côté Bictorys : ne rien conclure seul — contacter le support Bictorys avant toute action.`,
              `4. Ne PAS laisser le marchand relancer un retrait pour cette boutique tant que le point 1 n'est pas tranché.`,
            ].join(' '),
          },
        })
      }

      return NextResponse.json({ success: true, auto: true })
    }

    if (result.uncertain) {
      // Aucune réponse exploitable de Bictorys (timeout/réseau/réponse
      // illisible) : le virement a pu partir sans qu'on le sache. On NE
      // repasse PAS en 'pending' — ce statut alimente directement le rejeu
      // automatique du cron quotidien avec la même idempotency-key, ce
      // qu'on ne peut pas garantir sûr (voir note sur idempotencyKey plus
      // haut). Le statut reste 'processing', ce qui bloque tout rejeu
      // automatique tant qu'un humain n'a pas vérifié manuellement.
      console.error('[payouts/request] INCERTAIN : aucune réponse exploitable de Bictorys — statut conservé à processing', payoutRecord.id, result.error)
      Sentry.captureException(new Error('payouts/request: aucune réponse exploitable de Bictorys — statut du virement inconnu, réconciliation manuelle requise'), {
        level: 'fatal',
        extra: {
          payoutId: payoutRecord.id,
          shopId: profile.shop_id,
          shopName,
          netAmountFcfa: netAmount,
          bictorysIdempotencyKey: payoutRecord.id,
          networkOrTimeoutError: result.error,
          marcheASuivre: [
            `1. Vérifier côté Bictorys (dashboard ou support) si un virement existe pour l'idempotency-key "${payoutRecord.id}".`,
            `2. Si trouvé et effectué : UPDATE payouts SET status='completed', bictorys_transfer_id=<réf Bictorys>, completed_at=now() WHERE id='${payoutRecord.id}';`,
            `3. Si absent côté Bictorys : UPDATE payouts SET status='pending', updated_at=now() WHERE id='${payoutRecord.id}'; — cela autorise le traitement manuel admin ou un nouveau rejeu.`,
            `4. Ne PAS relancer de virement pour cette boutique tant que 1-3 n'ont pas tranché.`,
          ].join(' '),
        },
      })

      return NextResponse.json({
        success: true,
        auto:    false,
        error:   'Ton retrait est en cours de vérification, ça peut prendre un peu plus de temps que d\'habitude.',
      })
    }

    // À partir d'ici : réponse HTTP exploitable reçue de Bictorys, refus
    // explicite — on sait que le virement n'a pas eu lieu, un rejeu est sûr.
    console.error('[payouts/request] Bictorys payout failed:', result.error)
    const { error: pendingError } = await admin.from('payouts').update({ status: 'pending' }).eq('id', payoutRecord.id)

    if (pendingError) {
      // Aucun argent envoyé (Bictorys a refusé explicitement), mais le
      // payout reste bloqué en 'processing' : ni le cron (qui ne prend que
      // 'pending') ni l'admin (qui exige 'pending') ne pourront jamais le
      // reprendre sans correction manuelle.
      console.error('[payouts/request] échec passage à pending', payoutRecord.id, pendingError.message)
      Sentry.captureException(new Error('payouts/request: échec écriture pending — payout restera bloqué en processing'), {
        extra: { payoutId: payoutRecord.id, shopId: profile.shop_id, bictorysError: result.error, dbError: pendingError.message },
      })
    }
  } else {
    // Pas de clé privée configurée : traitement manuel
    const { error: pendingError } = await admin.from('payouts').update({ status: 'pending' }).eq('id', payoutRecord.id)
    if (pendingError) {
      console.error('[payouts/request] échec passage à pending (pas de clé Bictorys)', payoutRecord.id, pendingError.message)
      Sentry.captureException(new Error('payouts/request: échec écriture pending (BICTORYS_PRIVATE_KEY absent) — payout restera bloqué en processing'), {
        extra: { payoutId: payoutRecord.id, shopId: profile.shop_id, dbError: pendingError.message },
      })
    }
  }

  return NextResponse.json({ success: true, auto: false })
}
