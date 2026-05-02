import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PaymentSelector } from '@/components/booking/PaymentSelector'
import { BookingSteps } from '@/components/booking/BookingSteps'
import type { Salon, Service } from '@/types'

interface Props {
  params: Promise<{ 'salon-slug': string; 'service-id': string }>
  searchParams: Promise<{
    booking_id?: string
    date?: string
    time?: string
    first_name?: string
    last_name?: string
    phone?: string
    email?: string
    cancelled?: string
  }>
}

export default async function BookPayPage({ params, searchParams }: Props) {
  const { 'salon-slug': slug, 'service-id': serviceId } = await params
  const sp = await searchParams

  if (!sp.booking_id) redirect(`/${slug}/book/${serviceId}`)

  const supabase = await createServerClient()

  const { data: salonData } = await supabase
    .from('salons')
    .select('id, name, deposit_percentage, moneroo_api_key, stripe_account_id')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!salonData) notFound()
  const salon = salonData as Pick<Salon, 'id' | 'name' | 'deposit_percentage' | 'moneroo_api_key' | 'stripe_account_id'>

  const { data: serviceData } = await supabase
    .from('services')
    .select('id, name, price')
    .eq('id', serviceId)
    .eq('salon_id', salon.id)
    .single()

  if (!serviceData) notFound()
  const service = serviceData as Pick<Service, 'id' | 'name' | 'price'>

  const { data: bookingData } = await supabase
    .from('bookings')
    .select('id, deposit_amount, status, booking_date, booking_time')
    .eq('id', sp.booking_id)
    .single()

  if (!bookingData) notFound()
  const booking = bookingData as { id: string; deposit_amount: number; status: string; booking_date: string; booking_time: string }

  if (booking.status === 'confirmed') {
    redirect(`/${slug}/book/success?booking_id=${booking.id}`)
  }

  const steps = [
    { label: 'Date', active: false, done: true },
    { label: 'Infos', active: false, done: true },
    { label: 'Paiement', active: true, done: false },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href={`/${slug}/book/${serviceId}/info`} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-500">{salon.name}</p>
          <h1 className="text-sm font-semibold text-gray-900">Paiement</h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <BookingSteps steps={steps} />
        </div>

        {sp.cancelled === '1' && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            Le paiement a été annulé. Tu peux réessayer.
          </div>
        )}

        <PaymentSelector
          salonSlug={slug}
          service={service}
          bookingId={booking.id}
          depositAmount={booking.deposit_amount}
          date={booking.booking_date}
          time={booking.booking_time.slice(0, 5)}
          customerFirstName={sp.first_name ?? ''}
          customerLastName={sp.last_name}
          customerEmail={sp.email}
          customerPhone={sp.phone}
          hasMoneroo={!!salon.moneroo_api_key}
          hasStripe={!!salon.stripe_account_id || !!process.env.STRIPE_SECRET_KEY}
          hasBictorys={!!process.env.BICTORYS_SECRET_KEY}
        />
      </div>
    </div>
  )
}
