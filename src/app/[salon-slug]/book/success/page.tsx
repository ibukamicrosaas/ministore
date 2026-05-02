import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Calendar, Clock, CreditCard } from 'lucide-react'
import type { Salon, Service } from '@/types'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  params: Promise<{ 'salon-slug': string }>
  searchParams: Promise<{ booking_id?: string }>
}

export default async function BookSuccessPage({ params, searchParams }: Props) {
  const { 'salon-slug': slug } = await params
  const { booking_id } = await searchParams

  if (!booking_id) notFound()

  const supabase = await createServerClient()

  const { data: bookingData } = await supabase
    .from('bookings')
    .select('*, services(name, duration_minutes), salons(name, phone_whatsapp)')
    .eq('id', booking_id)
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
    services: Pick<Service, 'name' | 'duration_minutes'>
    salons: Pick<Salon, 'name' | 'phone_whatsapp'>
  }

  const dateFormatted = format(parseISO(b.booking_date + 'T12:00:00'), 'EEEE d MMMM yyyy', { locale: fr })

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Icône succès */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Réservation confirmée !</h1>
          <p className="mt-1 text-sm text-gray-500">
            Vous recevrez une confirmation sur WhatsApp.
          </p>
        </div>

        {/* Détails */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100">
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-100">
              <Calendar className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{dateFormatted}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-100">
              <Clock className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Heure · Service</p>
              <p className="text-sm font-medium text-gray-900">{b.booking_time.slice(0, 5)} · {b.services.name}</p>
            </div>
          </div>
          {b.deposit_amount > 0 && (
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-100">
                <CreditCard className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Acompte payé</p>
                <p className="text-sm font-medium text-gray-900">{b.deposit_amount.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Solde restant</p>
                <p className="text-sm font-semibold text-gray-900">{(b.total_price - b.deposit_amount).toLocaleString('fr-FR')} FCFA</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Link
            href={`/${slug}/booking/${b.id}?token=${b.client_token}`}
            className="block w-full rounded-xl border border-gray-200 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Gérer ma réservation
          </Link>
          <Link
            href={`/${slug}`}
            className="block w-full rounded-xl bg-[var(--color-primary)] py-3 text-center text-sm font-semibold text-white active:opacity-80 transition-opacity"
          >
            Retour au salon
          </Link>
        </div>
      </div>
    </div>
  )
}
