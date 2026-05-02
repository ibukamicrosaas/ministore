import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp, buildBookingConfirmationMessage, buildNewBookingAlertMessage } from '@/lib/notifications/whatsapp'
import type { Salon, Service } from '@/types'
import { APP_URL } from '@/constants'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import crypto from 'crypto'

interface CreateBookingBody {
  salonSlug: string
  serviceId: string
  staffId?: string
  date: string
  time: string
  clientFirstName: string
  clientLastName?: string
  clientPhone: string
  clientWhatsapp?: string
  clientEmail?: string
  notes?: string
  variantLabel?: string
  variantPrice?: number
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateBookingBody

  const {
    salonSlug, serviceId, staffId, date, time,
    clientFirstName, clientLastName, clientPhone,
    clientWhatsapp, clientEmail, notes,
    variantLabel, variantPrice,
  } = body

  if (!salonSlug || !serviceId || !date || !time || !clientFirstName || !clientPhone) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const supabase = await createServerClient()

  const { data: salonData, error: salonError } = await supabase
    .from('salons')
    .select('id, deposit_percentage, name, phone_whatsapp')
    .eq('slug', salonSlug)
    .eq('is_active', true)
    .single()

  if (salonError || !salonData) {
    return NextResponse.json({ error: 'Salon introuvable' }, { status: 404 })
  }

  const salon = salonData as Pick<Salon, 'id' | 'deposit_percentage' | 'name' | 'phone_whatsapp'>

  const { data: serviceData, error: serviceError } = await supabase
    .from('services')
    .select('id, name, duration_minutes, price, deposit_percentage')
    .eq('id', serviceId)
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .single()

  if (serviceError || !serviceData) {
    return NextResponse.json({ error: 'Service introuvable' }, { status: 404 })
  }

  const service = serviceData as Pick<Service, 'id' | 'name' | 'duration_minutes' | 'price'> & { deposit_percentage: number | null }

  // Vérifier le double-booking
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('salon_id', salon.id)
    .eq('booking_date', date)
    .eq('booking_time', time + ':00')
    .in('status', ['pending', 'confirmed', 'present'])

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json({ error: 'Ce créneau n\'est plus disponible.' }, { status: 409 })
  }

  // Upsert client
  const { data: clientIdData, error: clientError } = await supabase
    .rpc('upsert_client_from_booking', {
      p_salon_id: salon.id,
      p_first_name: clientFirstName,
      p_last_name: clientLastName ?? '',
      p_phone: clientPhone,
      p_whatsapp: clientWhatsapp ?? clientPhone,
      p_email: clientEmail ?? '',
    })

  if (clientError) {
    console.error('[createBooking] upsert_client', clientError.message)
    return NextResponse.json({ error: 'Erreur lors de la création du client' }, { status: 500 })
  }

  const effectiveDepositPct = service.deposit_percentage !== null
    ? service.deposit_percentage
    : salon.deposit_percentage
  const totalPrice = variantPrice ?? service.price
  const depositAmount = Math.floor(totalPrice * (effectiveDepositPct / 100))
  const clientToken = crypto.randomUUID()

  // Prepend variant label to notes for salon visibility
  const fullNotes = variantLabel
    ? [variantLabel, notes].filter(Boolean).join(' — ')
    : (notes ?? null)

  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      salon_id: salon.id,
      client_id: clientIdData as string,
      service_id: serviceId,
      staff_id: staffId ?? null,
      booking_date: date,
      booking_time: time + ':00',
      duration_minutes: service.duration_minutes,
      total_price: totalPrice,
      deposit_amount: depositAmount,
      deposit_paid: false,
      status: 'pending',
      notes: fullNotes,
      client_token: clientToken,
    })
    .select('id, status, deposit_amount, total_price, client_token')
    .single()

  if (bookingError || !bookingData) {
    console.error('[createBooking] insert', bookingError?.message)
    return NextResponse.json({ error: 'Impossible de créer la réservation' }, { status: 500 })
  }

  const booking = bookingData as {
    id: string
    status: string
    deposit_amount: number
    total_price: number
    client_token: string
  }

  const bookingUrl = `${APP_URL}/${salonSlug}/booking/${booking.id}?token=${booking.client_token}`

  return NextResponse.json({
    bookingId: booking.id,
    status: booking.status,
    depositAmount: booking.deposit_amount,
    totalPrice: booking.total_price,
    requiresPayment: true,
    bookingUrl,
  })
}
