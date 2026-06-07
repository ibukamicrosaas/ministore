import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { activatePlan } from '@/lib/billing/activate-plan'

/**
 * Endpoint pour activer manuellement un plan d'abonnement.
 * Utilisé par l'admin pour les paiements vérifiés manuellement.
 */
export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('X-Admin-Secret') ?? ''
  const envSecret = process.env.ADMIN_SECRET ?? ''

  // Vérifier que c'est une requête interne
  if (!envSecret || (adminSecret && adminSecret !== envSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { txnId, shopId, planKey } = await req.json()

  if (!txnId || !shopId || !planKey) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    // 1. Vérifier que la transaction existe
    const { data: txn, error: txnError } = await supabase
      .from('subscription_transactions' as never)
      .select('id, status')
      .eq('id', txnId)
      .single() as any

    if (txnError || !txn) {
      return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 })
    }

    // 2. Activer le plan
    const { error: activationError } = await activatePlan(shopId, planKey)
    if (activationError) {
      return NextResponse.json({ error: activationError }, { status: 500 })
    }

    // 3. Marquer la transaction comme activée
    await supabase
      .from('subscription_transactions' as never)
      .update({
        status: 'activated',
        verified_at: new Date().toISOString(),
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', txnId)

    console.log('[admin/activate-subscription] ✅ Plan activé manuellement', { shopId, planKey, txnId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/activate-subscription] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
