'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getWeek, getYear } from 'date-fns'

export interface CommissionWithBooking {
  id: string
  staff_id: string
  booking_id: string
  service_price: number
  commission_rate: number | null
  commission_amount: number
  week_number: number
  year: number
  is_paid: boolean
  paid_at: string | null
  created_at: string
  bookings: {
    booking_date: string
    booking_time: string
    services: { name: string } | null
  } | null
}


export async function getStaffWeekCommissions(
  staffId: string,
  weekNumber: number,
  year: number,
): Promise<{ data?: CommissionWithBooking[]; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('salon_id')
    .eq('id', user.id)
    .single()

  if (!profile?.salon_id) return { error: 'Accès non autorisé.' }

  const { data, error } = await supabase
    .from('commissions')
    .select('*, bookings(booking_date, booking_time, services(name))')
    .eq('staff_id', staffId)
    .eq('week_number', weekNumber)
    .eq('year', year)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getStaffWeekCommissions]', error.message)
    return { error: 'Impossible de charger les commissions.' }
  }

  return { data: (data ?? []) as unknown as CommissionWithBooking[] }
}

export async function markCommissionsPaid(
  staffId: string,
  weekNumber: number,
  year: number,
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

  const { error } = await supabase
    .from('commissions')
    .update({ is_paid: true, paid_at: new Date().toISOString() })
    .eq('staff_id', staffId)
    .eq('week_number', weekNumber)
    .eq('year', year)
    .eq('salon_id', profile.salon_id)
    .eq('is_paid', false)

  if (error) {
    console.error('[markCommissionsPaid]', error.message)
    return { error: 'Impossible de marquer les commissions comme payées.' }
  }

  revalidatePath(`/dashboard/staff/${staffId}`)
  revalidatePath('/dashboard/commissions')
  return { success: true }
}

export async function getAllStaffUnpaidCommissions(salonId: string) {
  const supabase = await createServerClient()

  const now = new Date()
  const currentWeek = getWeek(now, { weekStartsOn: 1 })
  const currentYear = getYear(now)

  const { data, error } = await supabase
    .from('commissions')
    .select('*, staff(id, first_name, last_name, photo_url, commission_rate)')
    .eq('salon_id', salonId)
    .eq('week_number', currentWeek)
    .eq('year', currentYear)
    .eq('is_paid', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getAllStaffUnpaidCommissions]', error.message)
    return { error: 'Impossible de charger les commissions.' }
  }

  return { data: data ?? [], weekNumber: currentWeek, year: currentYear }
}
