'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { setShopStatus } from '@/lib/billing/shop-status'
import { logShopEvent } from '@/lib/billing/events'
import { TRIAL_EXTENSION_DAYS } from '@/constants'

/**
 * Prolongation unique de 7 jours (cas B, §6) — déclenchée par le clic sur
 * « Partager ma boutique ». Ne s'applique qu'à une boutique free_orders en
 * cas B (essai expiré par la date, quota non atteint), jamais déjà prolongée.
 */
export async function extendTrialByShare(): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') return { error: 'Accès non autorisé.' }

  const admin = createAdminClient()
  const { data: shop } = await admin
    .from('shops')
    .select('trial_model, status, free_orders_used, free_orders_quota, trial_extended_at')
    .eq('id', profile.shop_id)
    .single()

  if (!shop) return { error: 'Boutique introuvable.' }
  if (shop.trial_model !== 'free_orders' || shop.status !== 'expired') {
    return { error: "Cette prolongation ne s'applique pas à ta boutique actuellement." }
  }
  if (shop.free_orders_used >= shop.free_orders_quota) {
    return { error: "Cette prolongation ne s'applique pas à ta boutique actuellement." }
  }
  if (shop.trial_extended_at) return { error: 'Tu as déjà utilisé ta prolongation.' }

  const statusResult = await setShopStatus(profile.shop_id, 'trial')
  if (statusResult.error) return { error: statusResult.error }

  const now    = new Date()
  const newEnd = new Date(now.getTime() + TRIAL_EXTENSION_DAYS * 24 * 60 * 60 * 1000)

  const { error } = await admin
    .from('shops')
    .update({ trial_extended_at: now.toISOString(), trial_ends_at: newEnd.toISOString() })
    .eq('id', profile.shop_id)

  if (error) {
    console.error('[extendTrialByShare]', error.message)
    return { error: 'Impossible de prolonger ton essai.' }
  }

  logShopEvent(profile.shop_id, 'trial_extended', {})
  revalidatePath('/dashboard')

  return { success: true }
}
