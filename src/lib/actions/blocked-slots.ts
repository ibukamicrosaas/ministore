'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { BlockedSlot } from '@/types'

async function getOwnerSalonId() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Non authentifié.', salonId: null, supabase: null }
  const { data: profile } = await supabase.from('profiles').select('salon_id, role').eq('id', user.id).single()
  if (!profile?.salon_id || profile.role !== 'owner') return { error: 'Accès non autorisé.', salonId: null, supabase: null }
  return { error: null, salonId: profile.salon_id, supabase }
}

export async function createBlockedSlot(input: {
  blocked_date: string
  start_time: string
  end_time: string
  reason?: string
  staff_id?: string | null
}) {
  const { error: authError, salonId, supabase } = await getOwnerSalonId()
  if (authError || !salonId || !supabase) return { error: authError ?? 'Erreur.' }

  if (input.start_time >= input.end_time) return { error: "L'heure de fin doit être après l'heure de début." }

  const { error } = await supabase.from('blocked_slots').insert({
    salon_id: salonId,
    staff_id: input.staff_id ?? null,
    blocked_date: input.blocked_date,
    start_time: input.start_time,
    end_time: input.end_time,
    reason: input.reason ?? null,
  })

  if (error) {
    console.error('[createBlockedSlot]', error.message)
    return { error: 'Impossible de créer le blocage.' }
  }

  revalidatePath('/dashboard/calendar')
  return { success: true }
}

export async function deleteBlockedSlot(id: string) {
  const { error: authError, salonId, supabase } = await getOwnerSalonId()
  if (authError || !salonId || !supabase) return { error: authError ?? 'Erreur.' }

  const { error } = await supabase.from('blocked_slots').delete().eq('id', id).eq('salon_id', salonId)
  if (error) {
    console.error('[deleteBlockedSlot]', error.message)
    return { error: 'Impossible de supprimer.' }
  }

  revalidatePath('/dashboard/calendar')
  return { success: true }
}

export async function getUpcomingBlockedSlots(salonId: string): Promise<BlockedSlot[]> {
  const supabase = await createServerClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('blocked_slots')
    .select('*')
    .eq('salon_id', salonId)
    .gte('blocked_date', today)
    .order('blocked_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(20)
  return (data ?? []) as BlockedSlot[]
}
