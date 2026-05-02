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

export async function updateSalonPlan(salonId: string, input: {
  plan: string
  is_active: boolean
  trial_ends_at?: string | null
}) {
  const { error: authError } = await assertAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('salons')
    .update({
      plan: input.plan,
      is_active: input.is_active,
      trial_ends_at: input.trial_ends_at === null ? undefined : input.trial_ends_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', salonId)

  if (error) {
    console.error('[admin/updateSalonPlan]', error.message)
    return { error: 'Impossible de mettre à jour le salon.' }
  }

  revalidatePath('/admin/salons')
  revalidatePath(`/admin/salons/${salonId}`)
  return { success: true }
}
