'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

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

  revalidatePath('/admin/shops')
  revalidatePath(`/admin/shops/${shopId}`)
  return { success: true }
}
