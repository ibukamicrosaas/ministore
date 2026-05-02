import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp, buildReminderMessage } from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'
import type { Salon, Service } from '@/types'
import { format, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'

export async function GET(_req: NextRequest) {
  const supabase = createAdminClient()

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  // Bookings confirmés demain sans rappel envoyé
  const { data: bookingsData, error } = await supabase
    .from('bookings')
    .select('id, booking_date, booking_time, client_token, salon_id, clients(first_name, whatsapp, phone), services(name), salons(name, slug, phone_whatsapp)')
    .eq('booking_date', tomorrow)
    .in('status', ['confirmed', 'present'])
    .is('reminder_sent_at', null)

  if (error) {
    console.error('[cron/reminders]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const bookings = (bookingsData ?? []) as unknown as Array<{
    id: string
    salon_id: string
    booking_date: string
    booking_time: string
    client_token: string
    clients: { first_name: string; whatsapp: string | null; phone: string }
    services: Pick<Service, 'name'>
    salons: Pick<Salon, 'name' | 'slug' | 'phone_whatsapp'>
  }>

  let sent = 0

  for (const booking of bookings) {
    const clientWhatsapp = booking.clients.whatsapp ?? booking.clients.phone
    const dateFormatted = format(new Date(booking.booking_date + 'T12:00:00'), 'EEEE d MMMM', { locale: fr })
    const timeFormatted = booking.booking_time.slice(0, 5)
    const bookingUrl = `${APP_URL}/${booking.salons.slug}/booking/${booking.id}?token=${booking.client_token}`

    const msg = buildReminderMessage({
      salonName: booking.salons.name,
      serviceName: booking.services.name,
      date: dateFormatted,
      time: timeFormatted,
      bookingUrl,
    })

    const result = await sendWhatsApp(clientWhatsapp, msg)

    await supabase.from('notification_logs').insert({
      salon_id: booking.salon_id,
      booking_id: booking.id,
      recipient_phone: clientWhatsapp,
      notification_type: 'booking_reminder',
      channel: 'whatsapp',
      message: msg,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error ?? null,
    })

    if (result.success) {
      await supabase
        .from('bookings')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', booking.id)
      sent++
    }
  }

  return NextResponse.json({ processed: bookings.length, sent })
}
