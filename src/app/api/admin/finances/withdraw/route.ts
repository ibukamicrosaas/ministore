import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysPayout, detectCountryFromPhone } from '@/lib/payments/bictorys'
import type { BictorysPayoutPaymentType } from '@/lib/payments/bictorys'
import { CM_PLAN_PRICES } from '@/lib/country-manager-config'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

// Méthodes confirmées par Bictorys uniquement — tmoney/mobicash/maxit/celtis
// retirés : aucune confirmée dans leur réponse écrite (audit payout,
// 2026-09-30). Bloquées explicitement plus bas, pas de mapping deviné.
const PAYOUT_METHOD_BICTORYS: Record<string, BictorysPayoutPaymentType> = {
  wave:         'wave_money',
  orange_money: 'orange_money',
  mtn:          'mtn_money',
  moov:         'moov',
  flooz:        'moov',
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

  // Méthode non confirmée par Bictorys (tmoney/mobicash/maxit/celtis) :
  // refus explicite avant tout calcul de solde ou toute écriture.
  if (!PAYOUT_METHOD_BICTORYS[method]) {
    return NextResponse.json({ error: `Le retrait par "${method}" n'est pas encore disponible — méthode non confirmée par Bictorys.` }, { status: 400 })
  }

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

  // Refuser tant qu'un retrait reste 'processing' — même principe que
  // payouts.ts:59-62, adapté : ici chaque requête crée une nouvelle ligne
  // (pas d'id de retrait existant à relire), donc on vérifie l'absence de
  // toute ligne 'processing' plutôt qu'un id précis. Échec fermé : une
  // erreur de lecture refuse aussi, jamais de continuation sur un état inconnu.
  const { data: pendingWithdrawal, error: pendingError } = await admin
    .from('admin_withdrawals')
    .select('id')
    .eq('status', 'processing')
    .limit(1)
    .maybeSingle()

  if (pendingError) {
    console.error('[admin/finances/withdraw] échec lecture retraits en cours', pendingError.message)
    return NextResponse.json({ error: 'Impossible de vérifier les retraits en cours.' }, { status: 500 })
  }

  if (pendingWithdrawal) {
    return NextResponse.json({
      error: 'Un retrait est déjà en cours (statut "processing") — vérifiez-le avant d\'en lancer un nouveau.',
    }, { status: 409 })
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
  // method déjà confirmé présent dans PAYOUT_METHOD_BICTORYS par le garde plus haut.
  const bictorysType = PAYOUT_METHOD_BICTORYS[method]
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

    if (result.uncertain) {
      // Aucune réponse exploitable de Bictorys (timeout réseau ou page
      // illisible, ex. WAF/proxy) : le virement a pu partir malgré tout. On
      // NE marque PAS 'failed' — ce statut n'est pas protégé par un garde
      // d'idempotence ici, et le marquer autoriserait un rejeu qui pourrait
      // envoyer une seconde fois le même argent. Le statut reste
      // 'processing', ce qui bloque désormais tout nouveau retrait (voir la
      // vérification juste avant l'insertion, plus haut dans ce fichier) tant
      // qu'un humain n'a pas vérifié manuellement auprès de Bictorys (même
      // modèle que lib/actions/payouts.ts:224-234).
      console.error('[admin/finances/withdraw] INCERTAIN : aucune réponse exploitable de Bictorys — statut conservé à processing', record.id, result.error)
      Sentry.captureException(new Error('admin/finances/withdraw: aucune réponse de Bictorys — statut du virement inconnu, réconciliation manuelle requise'), {
        level: 'fatal',
        extra: {
          withdrawalId: record.id,
          amount,
          method,
          bictorysIdempotencyKey: record.id,
          bictorysError: result.error,
          marcheASuivre: [
            `1. Vérifier côté Bictorys (dashboard ou support) si un virement existe pour l'idempotency-key "${record.id}".`,
            `2. Si confirmé : UPDATE admin_withdrawals SET status='completed', bictorys_transfer_id=<réf Bictorys>, withdrawn_at=now() WHERE id='${record.id}';`,
            `3. Si introuvable côté Bictorys : ne rien conclure seul — contacter le support Bictorys avant toute action.`,
            `4. Ne PAS relancer ce retrait ni en recréer un nouveau tant que le point 1 n'est pas tranché.`,
          ].join(' '),
        },
      })
      return NextResponse.json({
        error: `Réponse Bictorys incertaine — vérification manuelle requise avant tout nouveau retrait. Référence : ${record.id.slice(0, 8)}.`,
      }, { status: 502 })
    }

    // Refus explicite (réponse JSON lisible de Bictorys, pas une incertitude)
    // — on marque 'failed' pour ne pas déduire du solde.
    console.error('[admin/finances/withdraw] Bictorys a refusé:', result.error)
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
