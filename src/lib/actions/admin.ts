'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { setShopStatus } from '@/lib/billing/shop-status'
import { logShopEvent } from '@/lib/billing/events'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

async function assertAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_USER_IDS.includes(user.id)) return { error: 'Accès non autorisé.', userId: null }
  return { error: null, userId: user.id }
}

export async function updateShopPlan(shopId: string, input: {
  plan: string
  is_active: boolean
  trial_ends_at?: string | null
  subscription_ends_at?: string | null
  suspension_reason?: string
}) {
  const { error: authError, userId } = await assertAdmin()
  if (authError || !userId) return { error: authError }

  const supabase = createAdminClient()

  // Détection de la transition is_active, sur l'état réel en base — pas sur
  // ce que le formulaire admin croit être l'état initial (REPRISE.md §97).
  const { data: current, error: currentError } = await supabase
    .from('shops')
    .select('is_active')
    .eq('id', shopId)
    .single()

  if (currentError || !current) {
    console.error('[admin/updateShopPlan] lecture is_active', currentError?.message)
    return { error: 'Boutique introuvable.' }
  }

  const isSuspending   = current.is_active && !input.is_active
  const isReactivating = !current.is_active && input.is_active

  if (isSuspending && !input.suspension_reason?.trim()) {
    return { error: 'Une raison est obligatoire pour suspendre une boutique.' }
  }

  // Les 3 champs représentent la DERNIÈRE suspension connue — jamais effacés
  // à la réactivation (décision explicite, migration 102), seulement écrits
  // lors d'une vraie transition active→suspendue.
  const suspensionFields = isSuspending
    ? {
        suspension_reason: input.suspension_reason!.trim(),
        suspended_by:      userId,
        suspended_at:      new Date().toISOString(),
      }
    : {}

  const { error } = input.plan === 'trial'
    ? await supabase.from('shops').update({
        plan:          input.plan,
        is_active:     input.is_active,
        trial_ends_at: input.trial_ends_at ?? undefined,
        updated_at:    new Date().toISOString(),
        ...suspensionFields,
      }).eq('id', shopId)
    : await supabase.from('shops').update({
        plan:                 input.plan,
        is_active:            input.is_active,
        subscription_ends_at: input.subscription_ends_at
          ?? new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at:           new Date().toISOString(),
        ...suspensionFields,
      }).eq('id', shopId)

  if (error) {
    console.error('[admin/updateShopPlan]', error.message)
    return { error: 'Impossible de mettre à jour la boutique.' }
  }

  // Historique complet (pas seulement le dernier état) : shop_events porte
  // chaque cycle suspension/réactivation, même mécanisme que
  // free_order_used/order_held/trial_expired.
  if (isSuspending) {
    logShopEvent(shopId, 'shop_suspended', { reason: input.suspension_reason!.trim(), suspended_by: userId })
  } else if (isReactivating) {
    logShopEvent(shopId, 'shop_reactivated', { reactivated_by: userId })
  }

  // Boutique free_orders activée manuellement par l'admin (plan payant + is_active)
  // : traite ça exactement comme un paiement réel — libère les commandes retenues.
  // La direction inverse (admin coupe is_active) n'appelle pas setShopStatus :
  // is_active=false est un interrupteur de sécurité absolu (migration 078, RLS +
  // trigger), qui l'emporte toujours sur `status` — la boutique est réellement
  // masquée et ne peut recevoir aucune commande même si `status` reste
  // 'trial'/'expired'/'active' en base. Le décalage entre les deux champs est
  // donc sans risque fonctionnel, uniquement cosmétique si `status` est inspecté
  // directement (ex. futur tableau de bord admin).
  if (input.plan !== 'trial' && input.is_active) {
    const result = await setShopStatus(shopId, 'active')
    if (result.error) console.error('[admin/updateShopPlan] setShopStatus', result.error)
  }

  revalidatePath('/admin/shops')
  revalidatePath(`/admin/shops/${shopId}`)
  return { success: true }
}
