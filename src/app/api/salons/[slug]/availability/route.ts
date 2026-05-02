import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { Salon, Service } from '@/types'
import type { OpeningHours } from '@/types'
import { getDayKey, generateSlots, timeToMinutes } from '@/lib/utils/availability'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const { searchParams } = req.nextUrl
  const date = searchParams.get('date')
  const serviceId = searchParams.get('serviceId')

  if (!date || !serviceId) {
    return NextResponse.json({ error: 'date et serviceId requis' }, { status: 400 })
  }

  const supabase = await createServerClient()

  const { data: salonData, error: salonError } = await supabase
    .from('salons')
    .select('id, opening_hours')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (salonError || !salonData) {
    return NextResponse.json({ error: 'Salon introuvable' }, { status: 404 })
  }

  const salon = salonData as Pick<Salon, 'id' | 'opening_hours'>

  const { data: serviceData, error: serviceError } = await supabase
    .from('services')
    .select('id, duration_minutes')
    .eq('id', serviceId)
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .single()

  if (serviceError || !serviceData) {
    return NextResponse.json({ error: 'Service introuvable' }, { status: 404 })
  }

  const service = serviceData as Pick<Service, 'id' | 'duration_minutes'>

  const dayKey = getDayKey(new Date(date + 'T12:00:00'))
  const openingHours = salon.opening_hours as OpeningHours
  const dayHours = openingHours[dayKey]

  if (!dayHours || dayHours.closed) {
    return NextResponse.json({ slots: [] })
  }

  const allSlots = generateSlots(dayHours.open, dayHours.close, service.duration_minutes)

  // Filtrer les créneaux passés si la date est aujourd'hui
  const nowUTC = new Date()
  const todayStr = `${nowUTC.getUTCFullYear()}-${String(nowUTC.getUTCMonth() + 1).padStart(2, '0')}-${String(nowUTC.getUTCDate()).padStart(2, '0')}`
  const currentMinutes = nowUTC.getUTCHours() * 60 + nowUTC.getUTCMinutes() + 60 // +60min buffer WAT (UTC+1)

  // Récupérer les réservations confirmées uniquement (pending expire et ne doit pas bloquer)
  const { data: bookingsData } = await supabase
    .from('bookings')
    .select('booking_time, duration_minutes, staff_id')
    .eq('salon_id', salon.id)
    .eq('booking_date', date)
    .in('status', ['confirmed', 'present'])

  const bookings = (bookingsData ?? []) as { booking_time: string; duration_minutes: number; staff_id: string | null }[]

  // Récupérer les créneaux bloqués
  const { data: blockedData } = await supabase
    .from('blocked_slots')
    .select('start_time, end_time, staff_id')
    .eq('salon_id', salon.id)
    .eq('blocked_date', date)

  const blocked = (blockedData ?? []) as { start_time: string; end_time: string; staff_id: string | null }[]

  // Calculer les slots disponibles
  const slots = allSlots.map((slot) => {
    const slotStart = timeToMinutes(slot)
    const slotEnd = slotStart + service.duration_minutes

    const conflictsWithBooking = bookings.some((b) => {
      const bStart = timeToMinutes(b.booking_time.slice(0, 5))
      const bEnd = bStart + b.duration_minutes
      return slotStart < bEnd && slotEnd > bStart
    })

    const conflictsWithBlocked = blocked.some((b) => {
      const bStart = timeToMinutes(b.start_time.slice(0, 5))
      const bEnd = timeToMinutes(b.end_time.slice(0, 5))
      // Créneau bloqué global (staff_id null) ou pas de staff spécifique
      if (b.staff_id === null) {
        return slotStart < bEnd && slotEnd > bStart
      }
      return false
    })

    const isPastSlot = date === todayStr && slotStart < currentMinutes

    return {
      time: slot,
      isAvailable: !conflictsWithBooking && !conflictsWithBlocked && !isPastSlot,
    }
  })

  return NextResponse.json({ slots })
}
