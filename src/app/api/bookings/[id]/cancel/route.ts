import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp, buildCancellationMessage, buildClientCancelledAlertMessage } from '@/lib/notifications/whatsapp'
import type { Salon, Service } from '@/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface CancelBody {
  token?: string
  cancelledBy?: 'client' | 'salon'
  reason?: string
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json()) as CancelBody

  const supabase = createAdminClient()

  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .select('*, clients(whatsapp, phone, first_name), services(name), salons(name, phone_whatsapp, cancellation_hours, cancellation_refund, slug)')
    .eq('id', id)
    .single()

  if (bookingError || !bookingData) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }

  const b = bookingData as unknown as {
    id: string
    salon_id: string
    status: string
    client_token: string
    booking_date: string
    booking_time: string
    deposit_amount: number
    deposit_paid: boolean
    clients: { first_name: string; whatsapp: string | null; phone: string }
    services: Pick<Service, 'name'>
    salons: Pick<Salon, 'name' | 'phone_whatsapp' | 'cancellation_hours' | 'cancellation_refund' | 'slug'>
  }

  // Vérifier le token si annulation par le client
  if (body.cancelledBy === 'client' && body.token !== b.client_token) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 403 })
  }

  if (!['pending', 'confirmed'].includes(b.status)) {
    return NextResponse.json({ error: 'Cette réservation ne peut pas être annulée' }, { status: 400 })
  }

  // Calculer le remboursement
  const bookingDateTime = new Date(`${b.booking_date}T${b.booking_time}`)
  const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  const eligibleForRefund = b.salons.cancellation_refund && hoursUntilBooking >= (b.salons.cancellation_hours ?? 24)
  const refundAmount = eligibleForRefund && b.deposit_paid ? b.deposit_amount : 0

  await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_by: body.cancelledBy ?? 'client',
      cancellation_reason: body.reason ?? null,
      refund_amount: refundAmount,
      refund_status: refundAmount > 0 ? 'pending' : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (refundAmount > 0) {
    await supabase.from('payments').insert({
      booking_id: id,
      salon_id: b.salon_id,
      amount: refundAmount,
      currency: 'XOF',
      payment_method: 'cash',
      payment_type: 'refund',
      status: 'pending',
    })
  }

  const dateFormatted = format(new Date(b.booking_date + 'T12:00:00'), 'EEEE d MMMM yyyy', { locale: fr })
  const timeFormatted = b.booking_time.slice(0, 5)

  if (body.cancelledBy === 'salon') {
    // Notifier la cliente
    const clientWhatsapp = b.clients.whatsapp ?? b.clients.phone
    const msg = buildCancellationMessage({
      salonName: b.salons.name,
      serviceName: b.services.name,
      date: dateFormatted,
      refundAmount,
    })
    const notif = await sendWhatsApp(clientWhatsapp, msg)
    await supabase.from('notification_logs').insert({
      salon_id: b.salon_id,
      booking_id: id,
      recipient_phone: clientWhatsapp,
      notification_type: 'cancellation',
      channel: 'whatsapp',
      message: msg,
      status: notif.success ? 'sent' : 'failed',
      error_message: notif.error ?? null,
    })
  } else {
    // Annulation par la cliente → notifier le salon
    const salonPhone = b.salons.phone_whatsapp ?? ''
    const msg = buildClientCancelledAlertMessage({
      clientName: b.clients.first_name,
      serviceName: b.services.name,
      date: dateFormatted,
      time: timeFormatted,
      refundAmount,
    })
    const notif = await sendWhatsApp(salonPhone, msg)
    await supabase.from('notification_logs').insert({
      salon_id: b.salon_id,
      booking_id: id,
      recipient_phone: salonPhone,
      notification_type: 'cancellation',
      channel: 'whatsapp',
      message: msg,
      status: notif.success ? 'sent' : 'failed',
      error_message: notif.error ?? null,
    })
  }

  return NextResponse.json({ ok: true, refundAmount })
}
