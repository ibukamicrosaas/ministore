import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBictorysCharge, type BictorysPaymentType } from '@/lib/payments/bictorys'
import { APP_URL } from '@/constants'

interface RequestBody {
  bookingId: string
  salonSlug: string
  serviceId: string
  customerFirstName: string
  customerLastName?: string
  customerPhone?: string
  paymentType?: BictorysPaymentType
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.BICTORYS_SECRET_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Bictorys non configuré (clé manquante)' }, { status: 500 })
  }

  const body = (await req.json()) as RequestBody
  const { bookingId, salonSlug, serviceId, customerFirstName, customerLastName, customerPhone, paymentType } = body

  if (!bookingId || !salonSlug) {
    return NextResponse.json({ error: 'bookingId et salonSlug requis' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .select('id, deposit_amount, total_price, salon_id, status, services(name)')
    .eq('id', bookingId)
    .single()

  if (bookingError || !bookingData) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }

  const booking = bookingData as unknown as {
    id: string
    deposit_amount: number
    total_price: number
    salon_id: string
    status: string
    services: { name: string } | null
  }

  if (booking.status !== 'pending') {
    return NextResponse.json({ error: 'Réservation déjà traitée' }, { status: 400 })
  }

  const amountToCharge = booking.deposit_amount > 0 ? booking.deposit_amount : booking.total_price

  if (amountToCharge <= 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
  }

  const serviceName = booking.services?.name ?? 'Prestation'
  const customerName = [customerFirstName, customerLastName].filter(Boolean).join(' ')

  try {
    const { checkoutUrl, transactionId } = await createBictorysCharge(
      apiKey,
      {
        amount: amountToCharge,
        currency: 'XOF',
        paymentReference: `sheka-${bookingId.slice(0, 8)}`,
        merchantReference: bookingId,
        successRedirectUrl: `${APP_URL}/${salonSlug}/book/success?booking_id=${bookingId}`,
        errorRedirectUrl: `${APP_URL}/${salonSlug}/book/${serviceId}/pay?cancelled=1&booking_id=${bookingId}`,
        orderDetails: [{ name: serviceName, price: amountToCharge, quantity: 1, taxRate: 0 }],
        customerObject: {
          name: customerName || undefined,
          phone: customerPhone,
          locale: 'fr-FR',
        },
      },
      paymentType,
    )

    await supabase.from('payments').insert({
      booking_id: bookingId,
      salon_id: booking.salon_id,
      amount: amountToCharge,
      currency: 'XOF',
      payment_method: 'bictorys',
      payment_type: booking.deposit_amount > 0 ? 'deposit' : 'full',
      provider_payment_id: transactionId || `bictorys-${bookingId}`,
      status: 'pending',
    })

    return NextResponse.json({ checkoutUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Bictorys inconnue'
    console.error('[bictorys/create]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
