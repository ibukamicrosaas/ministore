import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createMonerooRefund } from '@/lib/payments/moneroo'
import { createStripeRefund } from '@/lib/payments/stripe'

export async function GET(_req: NextRequest) {
  const supabase = createAdminClient()

  // Paiements de remboursement en attente avec clé API du salon
  const { data: paymentsData, error } = await supabase
    .from('payments')
    .select('id, booking_id, salon_id, amount, payment_method, provider_payment_id, salons(moneroo_api_key)')
    .eq('payment_type', 'refund')
    .eq('status', 'pending')
    .not('provider_payment_id', 'is', null)
    .limit(20)

  if (error) {
    console.error('[cron/process-refunds]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  type RefundPayment = {
    id: string
    booking_id: string
    salon_id: string
    amount: number
    payment_method: string
    provider_payment_id: string
    salons: { moneroo_api_key: string | null }
  }

  const payments = (paymentsData ?? []) as unknown as RefundPayment[]
  let processed = 0
  let failed = 0

  for (const payment of payments) {
    let result: { success: boolean; error?: string }

    if (payment.payment_method === 'moneroo') {
      const apiKey = payment.salons.moneroo_api_key
      if (!apiKey) {
        console.error('[process-refunds] Missing moneroo_api_key for salon', payment.salon_id)
        failed++
        continue
      }
      result = await createMonerooRefund(apiKey, payment.provider_payment_id)
    } else if (payment.payment_method === 'stripe') {
      result = await createStripeRefund(payment.provider_payment_id)
    } else {
      // Méthode cash/manuelle — marquer directement comme traité
      result = { success: true }
    }

    if (result.success) {
      await supabase
        .from('payments')
        .update({ status: 'completed', paid_at: new Date().toISOString() })
        .eq('id', payment.id)

      await supabase
        .from('bookings')
        .update({ refund_status: 'processed' })
        .eq('id', payment.booking_id)

      processed++
    } else {
      console.error('[process-refunds] Failed', payment.id, result.error)
      failed++
    }
  }

  return NextResponse.json({ total: payments.length, processed, failed })
}
