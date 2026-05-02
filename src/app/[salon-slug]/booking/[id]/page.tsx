import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Calendar, Clock, CreditCard, User } from 'lucide-react'
import { BookingStatusBadge } from '@/components/ui/Badge'
import { CancelBookingButton } from './CancelBookingButton'
import type { Salon, Service } from '@/types'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  params: Promise<{ 'salon-slug': string; id: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function BookingDetailPage({ params, searchParams }: Props) {
  const { 'salon-slug': slug, id } = await params
  const { token } = await searchParams

  const supabase = await createServerClient()

  const { data: bookingData } = await supabase
    .from('bookings')
    .select('*, services(name, duration_minutes, price), salons(name, phone_whatsapp, cancellation_hours, cancellation_refund, slug)')
    .eq('id', id)
    .single()

  if (!bookingData) notFound()

  const b = bookingData as unknown as {
    id: string
    booking_date: string
    booking_time: string
    deposit_amount: number
    total_price: number
    status: string
    client_token: string
    notes: string | null
    services: Pick<Service, 'name' | 'duration_minutes' | 'price'>
    salons: Pick<Salon, 'name' | 'phone_whatsapp' | 'cancellation_hours' | 'cancellation_refund' | 'slug'>
  }

  if (b.salons.slug !== slug) notFound()

  // Vérifier le token client
  const isOwner = !token || token === b.client_token
  if (!isOwner) notFound()

  const dateFormatted = format(parseISO(b.booking_date + 'T12:00:00'), 'EEEE d MMMM yyyy', { locale: fr })

  // Vérifier si annulation possible
  const bookingDateTime = new Date(`${b.booking_date}T${b.booking_time}`)
  const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  const canCancel = ['pending', 'confirmed'].includes(b.status) && hoursUntilBooking > 0
  const eligibleForRefund = hoursUntilBooking >= (b.salons.cancellation_hours ?? 24)

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href={`/${slug}`} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-500">{b.salons.name}</p>
          <h1 className="text-sm font-semibold text-gray-900">Ma réservation</h1>
        </div>
        <div className="ml-auto">
          <BookingStatusBadge status={b.status} />
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto space-y-4">
        <div className="rounded-xl border border-gray-100 divide-y divide-gray-100">
          <div className="flex items-center gap-3 p-4">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{dateFormatted}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Clock className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Heure</p>
              <p className="text-sm font-medium text-gray-900">{b.booking_time.slice(0, 5)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Service</p>
              <p className="text-sm font-medium text-gray-900">{b.services.name}</p>
              <p className="text-xs text-gray-400">{b.services.duration_minutes} min</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Paiement</p>
              <p className="text-sm font-medium text-gray-900">
                Acompte : {b.deposit_amount.toLocaleString('fr-FR')} FCFA
              </p>
              <p className="text-xs text-gray-500">
                Solde sur place : {(b.total_price - b.deposit_amount).toLocaleString('fr-FR')} FCFA
              </p>
            </div>
          </div>
        </div>

        {b.notes && (
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Vos notes</p>
            <p className="text-sm text-gray-700">{b.notes}</p>
          </div>
        )}

        {canCancel && (
          <div className="space-y-3">
            {eligibleForRefund && b.deposit_amount > 0 && (
              <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-2.5 text-xs text-green-700">
                Annulation gratuite · Remboursement intégral de {b.deposit_amount.toLocaleString('fr-FR')} FCFA
              </div>
            )}
            {!eligibleForRefund && b.deposit_amount > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-2.5 text-xs text-amber-700">
                Annulation hors délais · L'acompte sera retenu
              </div>
            )}
            <CancelBookingButton
              bookingId={b.id}
              salonSlug={slug}
              token={token ?? b.client_token}
            />
          </div>
        )}
      </div>
    </div>
  )
}
