import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processPayout } from '@/lib/actions/payouts'
import { sendSMS } from '@/lib/notifications/whatsapp'

export const maxDuration = 300

// Méthodes gérées automatiquement via l'API Bictorys
const BICTORYS_METHODS = new Set(['wave', 'orange_money'])

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('authorization')?.replace('Bearer ', '')
  const envSecret  = process.env.CRON_SECRET

  if (!envSecret) {
    console.error('[cron/process-payouts] CRON_SECRET not configured!')
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (cronSecret !== envSecret) {
    console.error('[cron/process-payouts] Unauthorized cron call')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: pendingPayouts, error: selectError } = await admin
    .from('payouts')
    .select('id, shop_id, gross_amount, net_amount, payout_method, payout_number, requested_at')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true })

  if (selectError) {
    console.error('[cron/process-payouts] Error fetching pending payouts:', selectError)
    return NextResponse.json({ error: selectError.message }, { status: 500 })
  }

  if (!pendingPayouts || pendingPayouts.length === 0) {
    return NextResponse.json({ message: '0 payouts à traiter', processed: 0, manual: 0, failed: 0, results: [] })
  }

  console.log(`[cron/process-payouts] ${pendingPayouts.length} payouts en attente`)

  let processed = 0
  let manualCount = 0
  let failed = 0

  const results: {
    payoutId: string
    shopId: string
    amount: number
    method: string
    status: 'processed' | 'manual' | 'failed' | 'error'
    error?: string
  }[] = []

  for (const payout of pendingPayouts) {
    const isAuto = BICTORYS_METHODS.has(payout.payout_method)

    if (!isAuto) {
      // ── Retrait manuel requis (MTN, Moov, TMoney, Flooz, Airtel, MVola…) ──
      console.log(`[cron/process-payouts] Manuel requis: ${payout.id} (${payout.payout_method})`)

      // Annoter le payout pour que l'admin sache qu'il doit agir
      await admin
        .from('payouts')
        .update({
          notes:      `Reversement manuel requis via ${payout.payout_method.toUpperCase()} — à envoyer au ${payout.payout_number}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payout.id)

      // Alerter l'admin par WhatsApp
      const adminPhone = process.env.ADMIN_ALERT_PHONE
      if (adminPhone) {
        const msg =
          `🔔 Reversement manuel requis\n` +
          `Méthode : ${payout.payout_method.toUpperCase()}\n` +
          `Numéro : ${payout.payout_number}\n` +
          `Montant net : ${payout.net_amount.toLocaleString('fr-FR')}\n` +
          `Payout ID : ${payout.id.slice(0, 8)}\n` +
          `→ Traitez-le dans l'admin TEKKIShop.`

        await sendSMS(adminPhone, msg).catch(err => {
          console.error('[cron/process-payouts] WhatsApp admin alert failed:', err)
        })
      }

      results.push({
        payoutId: payout.id,
        shopId:   payout.shop_id,
        amount:   payout.gross_amount,
        method:   payout.payout_method,
        status:   'manual',
      })
      manualCount++
      continue
    }

    // ── Retrait automatique via Bictorys (Wave / Orange Money) ──
    try {
      console.log(`[cron/process-payouts] Auto Bictorys: ${payout.id} (${payout.payout_method})`)

      const result = await processPayout(
        payout.id,
        payout.shop_id,
        payout.gross_amount,
        payout.payout_method as 'wave' | 'orange_money',
      )

      if (result.error) {
        console.error(`[cron/process-payouts] Payout ${payout.id} failed:`, result.error)
        results.push({ payoutId: payout.id, shopId: payout.shop_id, amount: payout.gross_amount, method: payout.payout_method, status: 'failed', error: result.error })
        failed++
      } else {
        console.log(`[cron/process-payouts] ✅ Payout ${payout.id} traité`)
        results.push({ payoutId: payout.id, shopId: payout.shop_id, amount: payout.gross_amount, method: payout.payout_method, status: 'processed' })
        processed++
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[cron/process-payouts] Exception ${payout.id}:`, err)
      results.push({ payoutId: payout.id, shopId: payout.shop_id, amount: payout.gross_amount, method: payout.payout_method, status: 'error', error: errorMsg })
      failed++
    }
  }

  console.log(`[cron/process-payouts] Terminé — auto:${processed} manuel:${manualCount} échec:${failed}`)

  return NextResponse.json({
    message: `Auto: ${processed}, Manuel: ${manualCount}, Échec: ${failed}`,
    processed,
    manual: manualCount,
    failed,
    total: pendingPayouts.length,
    results,
  })
}
