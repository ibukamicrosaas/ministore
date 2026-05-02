import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createMonerooPayment } from '@/lib/payments/moneroo'
import { APP_URL } from '@/constants'
import type { Salon } from '@/types'

interface RequestBody {
  bookingId: string
  salonSlug: string
  serviceId: string
  customerFirstName: string
  customerLastName?: string
  customerEmail?: string
  customerPhone?: string
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RequestBody
  const { bookingId, salonSlug, customerFirstName, customerLastName, customerEmail, customerPhone, serviceId } = body

  if (!bookingId || !salonSlug) {
    return NextResponse.json({ error: 'bookingId et salonSlug requis' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .select('id, deposit_amount, salon_id, status')
    .eq('id', bookingId)
    .single()

  if (bookingError || !bookingData) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }

  const booking = bookingData as { id: string; deposit_amount: number; salon_id: string; status: string }

  if (booking.status !== 'pending') {
    return NextResponse.json({ error: 'Réservation déjà traitée' }, { status: 400 })
  }

  const { data: salonData, error: salonError } = await supabase
    .from('salons')
    .select('moneroo_api_key, name')
    .eq('id', booking.salon_id)
    .single()

  if (salonError || !salonData) {
    return NextResponse.json({ error: 'Salon introuvable' }, { status: 404 })
  }

  const salon = salonData as Pick<Salon, 'moneroo_api_key' | 'name'>

  if (!salon.moneroo_api_key) {
    return NextResponse.json({ error: 'Moneroo non configuré pour ce salon' }, { status: 400 })
  }

  try {
    const { checkoutUrl, transactionId } = await createMonerooPayment(
      salon.moneroo_api_key,
      {
        amount: booking.deposit_amount,
        currency: 'XOF',
        description: `Acompte réservation - ${salon.name}`,
        customer: {
          first_name: customerFirstName,
          last_name: customerLastName,
          email: customerEmail,
          phone: customerPhone,
        },
        metadata: {
          booking_id: bookingId,
          salon_slug: salonSlug,
        },
        return_url: `${APP_URL}/${salonSlug}/book/success?booking_id=${bookingId}`,
        cancel_url: `${APP_URL}/${salonSlug}/book/${serviceId}/pay?cancelled=1&booking_id=${bookingId}`,
        notify_url: `${APP_URL}/api/webhooks/moneroo`,
      },
    )

    // Enregistrer le paiement en attente
    await supabase.from('payments').insert({
      booking_id: bookingId,
      salon_id: booking.salon_id,
      amount: booking.deposit_amount,
      currency: 'XOF',
      payment_method: 'moneroo',
      payment_type: 'deposit',
      provider_payment_id: transactionId,
      status: 'pending',
    })

    return NextResponse.json({ checkoutUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Moneroo'
    console.error('[moneroo/create]', message)
    return NextResponse.json({ error: 'Impossible d\'initialiser le paiement' }, { status: 500 })
  }
}
