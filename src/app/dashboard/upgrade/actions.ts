'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBictorysCharge } from '@/lib/payments/bictorys'
import { activatePlan } from '@/lib/billing/activate-plan'
import { revalidatePath } from 'next/cache'

const VALID_PLAN_KEYS = new Set(['decouverte', 'business', 'pro'])

export async function verifySubscriptionPayment(
  txn: string,
  planKey: string,
): Promise<{ success: boolean; error?: string }> {
  console.log('[verifySubscriptionPayment] Vérification du paiement — txn:', txn?.slice(0, 8) + '...', 'plan:', planKey)

  if (!txn || typeof txn !== 'string' || txn.length > 200) {
    console.warn('[verifySubscriptionPayment] Paramètre txn invalide')
    return { success: false, error: 'Paramètre invalide' }
  }
  if (!VALID_PLAN_KEYS.has(planKey)) {
    console.warn('[verifySubscriptionPayment] Plan invalide:', planKey)
    return { success: false, error: 'Plan invalide' }
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.warn('[verifySubscriptionPayment] Utilisateur non authentifié')
    return { success: false, error: 'Non authentifié' }
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') {
    console.warn('[verifySubscriptionPayment] Profil invalide ou accès refusé')
    return { success: false, error: 'Accès refusé' }
  }

  const apiKey = process.env.BICTORYS_SECRET_KEY
  if (!apiKey) {
    console.error('[verifySubscriptionPayment] Clé API Bictorys manquante')
    return { success: false, error: 'Bictorys non configuré' }
  }

  // 1. Vérifier d'abord si le webhook a déjà activé la boutique
  console.log('[verifySubscriptionPayment] Vérification de l\'état de la boutique...')
  const { data: currentShop } = await admin
    .from('shops')
    .select('is_active, plan')
    .eq('id', profile.shop_id)
    .single()

  if (currentShop?.is_active && currentShop.plan === planKey) {
    console.log('[verifySubscriptionPayment] ✅ Boutique déjà activée — webhook a fonctionné')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/upgrade')
    revalidatePath('/dashboard/settings')
    return { success: true }
  }

  console.log('[verifySubscriptionPayment] Boutique non activée — vérification via API Bictorys...')

  // 2. Vérification directe via l'API Bictorys
  try {
    const charge = await getBictorysCharge(apiKey, txn)
    console.log('[verifySubscriptionPayment] Réponse API Bictorys:', {
      id: charge.id,
      status: charge.status,
      merchantRef: charge.merchantReference?.slice(0, 20) + '...',
    })

    const expectedRef = `sub-${profile.shop_id}-${planKey}`

    if (charge.status !== 'succeed') {
      console.warn('[verifySubscriptionPayment] Paiement non encore confirmé — status:', charge.status)
      return { success: false, error: 'Paiement non encore confirmé' }
    }

    if (charge.merchantReference && charge.merchantReference !== expectedRef) {
      console.error('[verifySubscriptionPayment] merchantReference mismatch:', {
        expected: expectedRef,
        actual: charge.merchantReference,
      })
      return { success: false, error: 'Référence invalide' }
    }

    // ✅ Activer le plan
    console.log('[verifySubscriptionPayment] Activation du plan:', { shopId: profile.shop_id, planKey })
    const { error: activationError } = await activatePlan(profile.shop_id, planKey)
    if (activationError) {
      console.error('[verifySubscriptionPayment] Erreur lors de l\'activation:', activationError)
      return { success: false, error: activationError }
    }

    console.log('[verifySubscriptionPayment] ✅ Plan activé avec succès')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/upgrade')
    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (e) {
    console.error('[verifySubscriptionPayment] Erreur API Bictorys:', e instanceof Error ? e.message : e)
    return { success: false, error: 'Vérification Bictorys échouée — le webhook devrait activer très bientôt' }
  }
}

/**
 * Vérifie si le webhook Bictorys a déjà activé la boutique.
 * Appelé en polling côté client quand le redirect Bictorys
 * ne ramène pas l'utilisateur avec le txn en sessionStorage.
 */
export async function pollShopActivation(): Promise<{ isActive: boolean; plan: string | null }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isActive: false, plan: null }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id) return { isActive: false, plan: null }

  const { data: shop } = await admin
    .from('shops')
    .select('is_active, plan')
    .eq('id', profile.shop_id)
    .single()

  if (shop?.is_active) {
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/upgrade')
    revalidatePath('/dashboard/settings')
  }

  return { isActive: shop?.is_active ?? false, plan: shop?.plan ?? null }
}
