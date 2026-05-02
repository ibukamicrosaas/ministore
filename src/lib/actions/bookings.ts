'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendWhatsApp, buildCancellationMessage } from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'
import type { BookingWithRelations, Salon, Service } from '@/types'
import type { Database } from '@/types/database'

type BookingUpdate = Database['public']['Tables']['bookings']['Update']
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export async function updateBookingStatus(
  bookingId: string,
  status: 'confirmed' | 'present' | 'completed' | 'cancelled' | 'no_show',
  options?: { internalNotes?: string; cancellationReason?: string },
) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.salon_id || profile.role !== 'owner') return { error: 'Accès non autorisé.' }

  const updates: BookingUpdate = {
    status,
    updated_at: new Date().toISOString(),
    internal_notes: options?.internalNotes ?? undefined,
    ...(status === 'cancelled' ? {
      cancellation_reason: options?.cancellationReason ?? null,
      cancelled_by: 'salon',
    } : {}),
  }

  const { data: bookingData, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
    .eq('salon_id', profile.salon_id)
    .select('*, clients(first_name, last_name, whatsapp, phone), services(name), salons(name, slug)')
    .single()

  if (error || !bookingData) {
    console.error('[updateBookingStatus]', error?.message)
    return { error: 'Impossible de mettre à jour la réservation.' }
  }

  if (status === 'completed') {
    const adminSupabase = createAdminClient()
    await adminSupabase.rpc('calculate_and_insert_commission', { p_booking_id: bookingId })
  }

  if (status === 'cancelled') {
    const b = bookingData as unknown as BookingWithRelations & {
      client_token: string
      clients: { first_name: string; last_name: string | null; whatsapp: string | null; phone: string }
      services: Pick<Service, 'name'>
      salons: Pick<Salon, 'name' | 'slug'>
    }

    const clientWhatsapp = b.clients?.whatsapp ?? b.clients?.phone
    if (clientWhatsapp) {
      const dateFormatted = format(new Date((bookingData as { booking_date: string }).booking_date + 'T12:00:00'), 'EEEE d MMMM yyyy', { locale: fr })
      const msg = buildCancellationMessage({
        salonName: b.salons?.name ?? '',
        serviceName: b.services?.name ?? '',
        date: dateFormatted,
        refundAmount: (bookingData as { refund_amount: number }).refund_amount ?? 0,
      })
      await sendWhatsApp(clientWhatsapp, msg)
    }
  }

  revalidatePath('/dashboard/bookings')
  revalidatePath(`/dashboard/bookings/${bookingId}`)
  return { success: true }
}

export async function assignStaffToBooking(bookingId: string, staffId: string | null) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.salon_id || profile.role !== 'owner') return { error: 'Accès non autorisé.' }

  const { error } = await supabase
    .from('bookings')
    .update({ staff_id: staffId, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .eq('salon_id', profile.salon_id)

  if (error) {
    console.error('[assignStaffToBooking]', error.message)
    return { error: 'Impossible d\'assigner l\'employée.' }
  }

  revalidatePath(`/dashboard/bookings/${bookingId}`)
  revalidatePath('/dashboard/bookings')
  return { success: true }
}

export async function getBookingsByStatus(status?: string) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('salon_id')
    .eq('id', user.id)
    .single()

  if (!profile?.salon_id) return { error: 'Salon introuvable.' }

  let query = supabase
    .from('bookings')
    .select('*, services(id, name, price, duration_minutes), staff(id, first_name, last_name), clients(id, first_name, last_name, phone)')
    .eq('salon_id', profile.salon_id)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getBookingsByStatus]', error.message)
    return { error: 'Impossible de charger les réservations.' }
  }

  return { data: (data ?? []) as unknown as BookingWithRelations[] }
}
