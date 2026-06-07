import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processPayout } from '@/lib/actions/payouts'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

/**
 * Admin endpoint to manually process a payout immediately.
 * Calls Bictorys Payout API to send the money.
 *
 * This is used when admin wants to process a payout outside of the scheduled cron.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const admin = createAdminClient()

  // ✅ Récupérer le payout
  const { data: payout, error: fetchError } = await admin
    .from('payouts')
    .select('id, shop_id, gross_amount, payout_method, status')
    .eq('id', id)
    .single()

  if (fetchError || !payout) {
    console.error('[admin/payouts/complete] Payout not found:', id)
    return NextResponse.json({ error: 'Payout non trouvé' }, { status: 404 })
  }

  if (payout.status !== 'pending') {
    console.warn(`[admin/payouts/complete] Payout ${id} is not pending (status: ${payout.status})`)
    return NextResponse.json({
      error: `Payout n'est pas en attente (statut: ${payout.status})`,
    }, { status: 400 })
  }

  // ✅ Appeler processPayout() pour faire l'appel Bictorys!
  console.log(`[admin/payouts/complete] Processing payout ${id} for shop ${payout.shop_id}`)
  const result = await processPayout(
    payout.id,
    payout.shop_id,
    payout.gross_amount,
    payout.payout_method as 'wave' | 'orange_money'
  )

  if (result.error) {
    console.error(`[admin/payouts/complete] Payout ${id} failed:`, result.error)
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  console.log(`[admin/payouts/complete] ✅ Payout ${id} completed by admin ${user.id}`)
  return NextResponse.json({ success: true })
}
