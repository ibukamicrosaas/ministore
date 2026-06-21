import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { activatePlan } from '@/lib/billing/activate-plan'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_PLANS = new Set(['decouverte', 'business', 'pro'])

/**
 * Activation manuelle d'un plan par un admin.
 * Double sécurité : session Supabase (ADMIN_USER_IDS) + ADMIN_SECRET header.
 */
export async function POST(req: NextRequest) {
  // 1. Vérifier la session admin via Supabase (cookie JWT)
  const supabaseUser = await createServerClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Vérifier le secret admin en header (défense en profondeur)
  const envSecret = process.env.ADMIN_SECRET ?? ''
  const headerSecret = req.headers.get('X-Admin-Secret') ?? ''
  if (!envSecret || headerSecret !== envSecret) {
    console.warn('[admin/activate-subscription] Header secret invalide — user:', user.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Valider et parser le body (prévenir les injections)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { txnId, shopId, planKey } = body as Record<string, unknown>

  if (
    typeof txnId !== 'string' || !UUID_RE.test(txnId) ||
    typeof shopId !== 'string' || !UUID_RE.test(shopId) ||
    typeof planKey !== 'string' || !VALID_PLANS.has(planKey)
  ) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    // 4. Vérifier que la transaction existe et appartient bien à ce shop
    const { data: txn, error: txnError } = await supabase
      .from('subscription_transactions' as never)
      .select('id, status, shop_id, billing_cycle')
      .eq('id', txnId)
      .eq('shop_id', shopId)
      .single() as any

    if (txnError || !txn) {
      return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 })
    }

    if (txn.status === 'activated') {
      return NextResponse.json({ error: 'Transaction déjà activée' }, { status: 409 })
    }

    // 5. Activer le plan avec la bonne durée selon le cycle
    const billingCycle = txn.billing_cycle ?? 'monthly'
    const durationDays = billingCycle === 'annual' ? 365 : 31

    const { error: activationError } = await activatePlan(shopId, planKey, durationDays)
    if (activationError) {
      return NextResponse.json({ error: activationError }, { status: 500 })
    }

    // 6. Marquer la transaction comme activée
    await supabase
      .from('subscription_transactions' as never)
      .update({
        status: 'activated',
        verified_at: new Date().toISOString(),
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', txnId)

    console.log('[admin/activate-subscription] ✅ Plan activé manuellement par', user.id, { shopId, planKey, txnId, billingCycle })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/activate-subscription] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
