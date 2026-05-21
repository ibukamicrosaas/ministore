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
  if (!txn || typeof txn !== 'string' || txn.length > 200) {
    return { success: false, error: 'Paramètre invalide' }
  }
  if (!VALID_PLAN_KEYS.has(planKey)) {
    return { success: false, error: 'Plan invalide' }
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') {
    return { success: false, error: 'Accès refusé' }
  }

  const apiKey = process.env.BICTORYS_SECRET_KEY
  if (!apiKey) return { success: false, error: 'Bictorys non configuré' }

  // 1. Vérifier d'abord si le webhook a déjà activé la boutique
  const { data: currentShop } = await admin
    .from('shops')
    .select('is_active, plan')
    .eq('id', profile.shop_id)
    .single()

  if (currentShop?.is_active && currentShop.plan === planKey) {
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/upgrade')
    revalidatePath('/dashboard/settings')
    return { success: true }
  }

  // 2. Vérification directe via l'API Bictorys
  try {
    const charge = await getBictorysCharge(apiKey, txn)
    const expectedRef = `sub-${profile.shop_id}-${planKey}`

    if (charge.status !== 'succeed') {
      return { success: false, error: 'Paiement non encore confirmé' }
    }
    if (charge.merchantReference && charge.merchantReference !== expectedRef) {
      console.warn('[verifySubscriptionPayment] merchantReference mismatch:', charge.merchantReference)
      return { success: false, error: 'Référence invalide' }
    }

    // Activer via la fonction centralisée (pose subscription_ends_at)
    const { error: activationError } = await activatePlan(profile.shop_id, planKey)
    if (activationError) {
      return { success: false, error: activationError }
    }

    return { success: true }
  } catch (e) {
    console.error('[verifySubscriptionPayment] Bictorys API error:', e)
    return { success: false, error: 'Vérification Bictorys échouée — activation via webhook en attente' }
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
