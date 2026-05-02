'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { CreateStaffInput, UpdateStaffInput } from '@/types'

async function getOwnerSalonId() {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Non authentifié.' as string, salonId: null, supabase: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.salon_id || profile.role !== 'owner') {
    return { error: 'Accès non autorisé.', salonId: null, supabase: null }
  }

  return { error: null, salonId: profile.salon_id, supabase }
}

export async function createStaff(input: CreateStaffInput) {
  const { error: authError, salonId, supabase } = await getOwnerSalonId()
  if (authError || !salonId || !supabase) return { error: authError ?? 'Erreur.' }

  if (!input.first_name?.trim()) return { error: 'Le prénom est obligatoire.' }

  if (input.remuneration_type === 'commission') {
    if (!input.commission_rate || input.commission_rate <= 0 || input.commission_rate > 100) {
      return { error: 'Le taux de commission doit être entre 1 et 100%.' }
    }
  } else if (input.remuneration_type === 'fixed_salary') {
    if (!input.fixed_salary || input.fixed_salary < 0) {
      return { error: 'Le salaire fixe doit être un montant positif.' }
    }
  }

  const { data, error } = await supabase
    .from('staff')
    .insert({ ...input, salon_id: salonId })
    .select('id')
    .single()

  if (error) {
    console.error('[createStaff]', error.message)
    return { error: 'Impossible de créer l\'employée.' }
  }

  revalidatePath('/dashboard/staff')
  redirect(`/dashboard/staff/${data.id}`)
}

export async function updateStaff(id: string, input: UpdateStaffInput) {
  const { error: authError, salonId, supabase } = await getOwnerSalonId()
  if (authError || !salonId || !supabase) return { error: authError ?? 'Erreur.' }

  const { error } = await supabase
    .from('staff')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('salon_id', salonId)

  if (error) {
    console.error('[updateStaff]', error.message)
    return { error: 'Impossible de mettre à jour l\'employée.' }
  }

  revalidatePath('/dashboard/staff')
  revalidatePath(`/dashboard/staff/${id}`)
  return { success: true }
}

export async function deactivateStaff(id: string) {
  const { error: authError, salonId, supabase } = await getOwnerSalonId()
  if (authError || !salonId || !supabase) return { error: authError ?? 'Erreur.' }

  const { error } = await supabase
    .from('staff')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('salon_id', salonId)

  if (error) {
    console.error('[deactivateStaff]', error.message)
    return { error: 'Impossible de désactiver l\'employée.' }
  }

  revalidatePath('/dashboard/staff')
  return { success: true }
}
