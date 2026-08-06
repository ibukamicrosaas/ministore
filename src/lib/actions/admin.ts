'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { setShopStatus } from '@/lib/billing/shop-status'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

async function assertAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_USER_IDS.includes(user.id)) return { error: 'Accès non autorisé.' }
  return { error: null }
}

export async function updateShopPlan(shopId: string, input: {
  plan: string
  is_active: boolean
  trial_ends_at?: string | null
  subscription_ends_at?: string | null
}) {
  const { error: authError } = await assertAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()

  const { error } = input.plan === 'trial'
    ? await supabase.from('shops').update({
        plan:          input.plan,
        is_active:     input.is_active,
        trial_ends_at: input.trial_ends_at ?? undefined,
        updated_at:    new Date().toISOString(),
      }).eq('id', shopId)
    : await supabase.from('shops').update({
        plan:                 input.plan,
        is_active:            input.is_active,
        subscription_ends_at: input.subscription_ends_at
          ?? new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at:           new Date().toISOString(),
      }).eq('id', shopId)

  if (error) {
    console.error('[admin/updateShopPlan]', error.message)
    return { error: 'Impossible de mettre à jour la boutique.' }
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
