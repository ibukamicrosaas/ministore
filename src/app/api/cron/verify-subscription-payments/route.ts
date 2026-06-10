import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBictorysCharge } from '@/lib/payments/bictorys'
import { activatePlan } from '@/lib/billing/activate-plan'
import { recordCronRun } from '@/lib/cron/health'

const PLAN_PRICES: Record<string, number> = {
  decouverte: 2900,
  business:   4900,
  pro:        9900,
}

/**
 * Cron job : Vérifie les transactions d'abonnement "pending"
 * auprès de Bictorys et les active si le paiement a réussi.
 *
 * Déclenché toutes les minutes par Vercel Cron.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET ?? ''

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[verify-subscription-payments] ❌ Requête non authentifiée')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.BICTORYS_API_KEY
  if (!apiKey) {
    console.error('[verify-subscription-payments] Clé API Bictorys manquante')
    return NextResponse.json({ error: 'Bictorys non configuré' }, { status: 500 })
  }

  const supabase = createAdminClient()

  // Retrouver toutes les transactions pending depuis moins de 24h
  const { data: pendingTransactions, error: queryError } = await supabase
    .from('subscription_transactions' as never)
    .select('id, shop_id, plan_key, charge_id, created_at')
    .eq('status', 'pending')
    .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(50) as any

  if (queryError) {
    console.error('[verify-subscription-payments] Erreur requête BD:', queryError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!pendingTransactions || pendingTransactions.length === 0) {
    console.log('[verify-subscription-payments] ✓ Aucune transaction pending')
    return NextResponse.json({ processed: 0 })
  }

  console.log(`[verify-subscription-payments] 🔄 Vérification de ${pendingTransactions.length} transactions...`)

  let processed = 0
  let activated = 0
  let failed = 0

  for (const txn of pendingTransactions) {
    const { id: txnId, shop_id: shopId, plan_key: planKey, charge_id: chargeId } = txn

    try {
      // Vérifier le statut chez Bictorys
      const charge = await getBictorysCharge(apiKey, chargeId)

      console.log(`[verify-subscription-payments] Charge ${chargeId.slice(0, 8)}... status: ${charge.status}`)

      // Si paiement échoué, marquer comme failed
      if (charge.status === 'failed') {
        await supabase
          .from('subscription_transactions' as never)
          .update({
            status: 'failed',
            error_message: 'Paiement échoué',
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', txnId)

        failed++
        processed++
        continue
      }

      // Si paiement pas encore terminé, ignorer
      if (charge.status !== 'succeed') {
        console.log(`[verify-subscription-payments] Transaction ${txnId} toujours en attente`)
        continue
      }

      // ✅ Paiement réussi — vérifier le montant
      const expectedAmount = PLAN_PRICES[planKey] ?? 0
      if (charge.amount !== expectedAmount) {
        console.error(`[verify-subscription-payments] Montant mismatch pour ${txnId}:`, {
          expected: expectedAmount,
          actual: charge.amount,
        })
        await supabase
          .from('subscription_transactions' as never)
          .update({
            status: 'failed',
            error_message: `Montant invalide: ${charge.amount} XOF au lieu de ${expectedAmount}`,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', txnId)

        failed++
        processed++
        continue
      }

      // ✅ Activer le plan
      console.log(`[verify-subscription-payments] ✅ Activation du plan ${planKey} pour boutique ${shopId}`)
      const { error: activationError } = await activatePlan(shopId, planKey)

      if (activationError) {
        console.error(`[verify-subscription-payments] Erreur activation plan:`, activationError)
        await supabase
          .from('subscription_transactions' as never)
          .update({
            status: 'error',
            error_message: activationError,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', txnId)

        failed++
        processed++
        continue
      }

      // Marquer comme activé
      await supabase
        .from('subscription_transactions' as never)
        .update({
          status: 'activated',
          verified_at: new Date().toISOString(),
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', txnId)

      activated++
      processed++
    } catch (error) {
      console.error(`[verify-subscription-payments] Erreur traitement transaction ${txnId}:`, error)
      failed++
      processed++
    }
  }

  console.log(`[verify-subscription-payments] ✓ Traité: ${processed}, Activé: ${activated}, Échoué: ${failed}`)

  void recordCronRun('verify-subscription-payments', 'ok', { processed, activated, failed })

  return NextResponse.json({
    processed,
    activated,
    failed,
  })
}
