'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBictorysCharge } from '@/lib/payments/bictorys'
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

  try {
    const charge = await getBictorysCharge(apiKey, txn)
    const expectedRef = `sub-${profile.shop_id}-${planKey}`

    if (charge.status !== 'succeed') {
      return { success: false, error: 'Paiement non encore confirmé' }
    }
    if (charge.merchantReference !== expectedRef) {
      return { success: false, error: 'Référence invalide' }
    }

    const { error: updateError } = await admin
      .from('shops')
      .update({ plan: planKey, is_active: true, updated_at: new Date().toISOString() })
      .eq('id', profile.shop_id)

    if (updateError) {
      console.error('[verifySubscriptionPayment] update error:', updateError.message)
      return { success: false, error: 'Erreur activation boutique' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/upgrade')
    return { success: true }
  } catch (e) {
    console.error('[verifySubscriptionPayment]', e)
    return { success: false, error: 'Erreur de vérification Bictorys' }
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
