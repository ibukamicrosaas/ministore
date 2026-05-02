import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStripeCheckoutSession } from '@/lib/payments/stripe'

interface RequestBody {
  bookingId: string
  salonSlug: string
  serviceId: string
  serviceName: string
  customerEmail?: string
  customerName?: string
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RequestBody
  const { bookingId, salonSlug, serviceId, serviceName, customerEmail, customerName } = body

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

  try {
    const { checkoutUrl, sessionId } = await createStripeCheckoutSession({
      bookingId,
      salonSlug,
      serviceId,
      // Stripe expects amount in smallest currency unit
      // XOF is a zero-decimal currency — use amount as-is
      amount: booking.deposit_amount,
      currency: 'XOF',
      description: `Acompte - ${serviceName}`,
      customerEmail,
      customerName,
    })

    // Enregistrer le paiement en attente
    await supabase.from('payments').insert({
      booking_id: bookingId,
      salon_id: booking.salon_id,
      amount: booking.deposit_amount,
      currency: 'XOF',
      payment_method: 'stripe',
      payment_type: 'deposit',
      provider_payment_id: sessionId,
      status: 'pending',
    })

    return NextResponse.json({ checkoutUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Stripe'
    console.error('[stripe/create]', message)
    return NextResponse.json({ error: 'Impossible d\'initialiser le paiement' }, { status: 500 })
  }
}
