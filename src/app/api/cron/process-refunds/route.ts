import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/auth/verify-cron'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createAdminClient()

  // Paiements de remboursement en attente
  const { data: paymentsData, error } = await supabase
    .from('payments')
    .select('id, order_id, shop_id, amount, payment_method, provider_payment_id')
    .eq('payment_type', 'refund')
    .eq('status', 'pending')
    .not('provider_payment_id', 'is', null)
    .limit(20)

  if (error) {
    console.error('[cron/process-refunds]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const payments = (paymentsData ?? []) as {
    id: string; order_id: string; shop_id: string
    amount: number; payment_method: string; provider_payment_id: string
  }[]

  // Les remboursements Bictorys sont traités manuellement via le dashboard admin.
  // Ce cron identifie les remboursements en attente pour traitement humain.
  console.log(`[process-refunds] ${payments.length} remboursement(s) en attente de traitement manuel`)

  return NextResponse.json({ total: payments.length, pending_manual_review: payments.length })
}
