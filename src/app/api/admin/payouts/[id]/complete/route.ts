import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processPayout } from '@/lib/actions/payouts'

const ADMIN_USER_IDS  = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)
const BICTORYS_METHODS = new Set(['wave', 'orange_money'])

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

  const { data: payout, error: fetchError } = await admin
    .from('payouts')
    .select('id, shop_id, gross_amount, payout_method, status')
    .eq('id', id)
    .single()

  if (fetchError || !payout) {
    return NextResponse.json({ error: 'Payout non trouvé' }, { status: 404 })
  }

  if (payout.status !== 'pending') {
    return NextResponse.json({ error: `Payout non en attente (statut: ${payout.status})` }, { status: 400 })
  }

  const isAuto = BICTORYS_METHODS.has(payout.payout_method)

  if (isAuto) {
    // Déclencher via l'API Bictorys
    console.log(`[admin/payouts/complete] Auto Bictorys: ${id}`)
    const result = await processPayout(
      payout.id,
      payout.shop_id,
      payout.gross_amount,
      payout.payout_method as 'wave' | 'orange_money',
    )
    if (result.error) {
      console.error(`[admin/payouts/complete] Bictorys failed: ${result.error}`)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } else {
    // Méthode manuelle (MTN, Moov, TMoney, Flooz…) — l'admin confirme avoir envoyé l'argent
    console.log(`[admin/payouts/complete] Manuel confirmé par admin ${user.id}: ${id}`)
    const { error } = await admin
      .from('payouts')
      .update({
        status:       'completed',
        completed_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
        notes:        `Traité manuellement par l'admin le ${new Date().toLocaleDateString('fr-FR')}`,
      })
      .eq('id', id)

    if (error) {
      console.error('[admin/payouts/complete] DB update failed:', error.message)
      return NextResponse.json({ error: 'Impossible de mettre à jour le payout' }, { status: 500 })
    }
  }

  console.log(`[admin/payouts/complete] ✅ ${id} terminé`)
  return NextResponse.json({ success: true })
}
