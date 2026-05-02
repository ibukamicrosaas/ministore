import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { constructStripeEvent } from '@/lib/payments/stripe'
import { sendWhatsApp, buildBookingConfirmationMessage, buildNewBookingAlertMessage } from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'
import type { Salon, Service } from '@/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const rawBody = await req.arrayBuffer()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = await constructStripeEvent(Buffer.from(rawBody), signature)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Signature invalide'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ ok: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const bookingId = session.metadata?.booking_id
  const salonSlug = session.metadata?.salon_slug

  if (!bookingId) {
    return NextResponse.json({ error: 'booking_id manquant' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Idempotence
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('status')
    .eq('provider_payment_id', session.id)
    .single()

  if (existingPayment?.status === 'completed') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  await supabase
    .from('payments')
    .update({ status: 'completed', paid_at: new Date().toISOString() })
    .eq('provider_payment_id', session.id)

  const { data: bookingData } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      deposit_paid: true,
      confirmation_sent_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .eq('status', 'pending')
    .select('*, clients(first_name, last_name, whatsapp, phone), services(name, price), salons(name, phone_whatsapp, slug)')
    .single()

  if (!bookingData) {
    return NextResponse.json({ ok: true })
  }

  const b = bookingData as unknown as {
    id: string
    salon_id: string
    booking_date: string
    booking_time: string
    deposit_amount: number
    total_price: number
    client_token: string
    clients: { first_name: string; last_name: string | null; whatsapp: string | null; phone: string }
    services: Pick<Service, 'name' | 'price'>
    salons: Pick<Salon, 'name' | 'phone_whatsapp' | 'slug'>
  }

  const dateFormatted = format(new Date(b.booking_date + 'T12:00:00'), 'EEEE d MMMM yyyy', { locale: fr })
  const timeFormatted = b.booking_time.slice(0, 5)
  const slug = salonSlug ?? b.salons.slug
  const bookingUrl = `${APP_URL}/${slug}/booking/${b.id}?token=${b.client_token}`
  const clientName = `${b.clients.first_name} ${b.clients.last_name ?? ''}`.trim()
  const clientWhatsapp = b.clients.whatsapp ?? b.clients.phone

  const confirmMsg = buildBookingConfirmationMessage({
    salonName: b.salons.name,
    serviceName: b.services.name,
    date: dateFormatted,
    time: timeFormatted,
    depositAmount: b.deposit_amount,
    remainingAmount: b.total_price - b.deposit_amount,
    bookingUrl,
  })

  const clientNotif = await sendWhatsApp(clientWhatsapp, confirmMsg)
  await supabase.from('notification_logs').insert({
    salon_id: b.salon_id,
    booking_id: b.id,
    recipient_phone: clientWhatsapp,
    notification_type: 'booking_confirmation',
    channel: 'whatsapp',
    message: confirmMsg,
    status: clientNotif.success ? 'sent' : 'failed',
    error_message: clientNotif.error ?? null,
  })

  const alertMsg = buildNewBookingAlertMessage({
    clientName,
    serviceName: b.services.name,
    date: dateFormatted,
    time: timeFormatted,
    depositAmount: b.deposit_amount,
  })

  const salonNotif = await sendWhatsApp(b.salons.phone_whatsapp ?? '', alertMsg)
  await supabase.from('notification_logs').insert({
    salon_id: b.salon_id,
    booking_id: b.id,
    recipient_phone: b.salons.phone_whatsapp ?? '',
    notification_type: 'new_booking_salon',
    channel: 'whatsapp',
    message: alertMsg,
    status: salonNotif.success ? 'sent' : 'failed',
    error_message: salonNotif.error ?? null,
  })

  return NextResponse.json({ ok: true })
}
