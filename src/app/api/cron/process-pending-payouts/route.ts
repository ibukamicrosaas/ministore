import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processPayout } from '@/lib/actions/payouts'

export const maxDuration = 300 // 5 minutes max pour la cron

/**
 * Cron job qui traite automatiquement tous les payouts en attente.
 * Appelé quotidiennement via Vercel Crons.
 *
 * Sécurité: Vérifie le CRON_SECRET pour éviter les appels non autorisés.
 */
export async function GET(req: NextRequest) {
  // ✅ Vérifier la signature cron (sécurité)
  const cronSecret = req.headers.get('authorization')?.replace('Bearer ', '')
  const envSecret = process.env.CRON_SECRET

  if (!envSecret) {
    console.error('[cron/process-payouts] CRON_SECRET not configured!')
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  if (cronSecret !== envSecret) {
    console.error('[cron/process-payouts] Unauthorized cron call')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Récupérer tous les payouts 'pending'
  const { data: pendingPayouts, error: selectError } = await admin
    .from('payouts')
    .select('id, shop_id, gross_amount, payout_method, payout_number, requested_at')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true })

  if (selectError) {
    console.error('[cron/process-payouts] Error fetching pending payouts:', selectError)
    return NextResponse.json({ error: selectError.message }, { status: 500 })
  }

  if (!pendingPayouts || pendingPayouts.length === 0) {
    console.log('[cron/process-payouts] No pending payouts to process')
    return NextResponse.json({
      message: '0 payouts à traiter',
      processed: 0,
      failed: 0,
      results: [],
    })
  }

  console.log(`[cron/process-payouts] Starting to process ${pendingPayouts.length} pending payouts`)

  let processed = 0
  let failed = 0
  const results: {
    payoutId: string
    shopId: string
    amount: number
    method: string
    status: 'processed' | 'failed' | 'error'
    error?: string
    transactionId?: string
  }[] = []

  // Traiter chaque payout séquentiellement
  for (const payout of pendingPayouts) {
    try {
      console.log(`[cron/process-payouts] Processing payout ${payout.id} for shop ${payout.shop_id}`)

      const result = await processPayout(
        payout.id,
        payout.shop_id,
        payout.gross_amount,
        payout.payout_method as 'wave' | 'orange_money'
      )

      if (result.error) {
        console.error(`[cron/process-payouts] Payout ${payout.id} failed:`, result.error)
        results.push({
          payoutId: payout.id,
          shopId: payout.shop_id,
          amount: payout.gross_amount,
          method: payout.payout_method,
          status: 'failed',
          error: result.error,
        })
        failed++
      } else {
        console.log(`[cron/process-payouts] ✅ Payout ${payout.id} processed successfully`)
        results.push({
          payoutId: payout.id,
          shopId: payout.shop_id,
          amount: payout.gross_amount,
          method: payout.payout_method,
          status: 'processed',
        })
        processed++
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[cron/process-payouts] Exception processing ${payout.id}:`, err)
      results.push({
        payoutId: payout.id,
        shopId: payout.shop_id,
        amount: payout.gross_amount,
        method: payout.payout_method,
        status: 'error',
        error: errorMsg,
      })
      failed++
    }
  }

  console.log(`[cron/process-payouts] Completed: ${processed} processed, ${failed} failed`)

  return NextResponse.json({
    message: `Traité: ${processed}, Échoué: ${failed}`,
    processed,
    failed,
    total: pendingPayouts.length,
    results,
  })
}
