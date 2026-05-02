import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, Plus } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { BookingStatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { BookingFilters } from './BookingFilters'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { BookingWithRelations, Profile } from '@/types'

interface Props {
  searchParams: Promise<{ status?: string; date?: string }>
}

export default async function BookingsPage({ searchParams }: Props) {
  const { status, date } = await searchParams
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('salon_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'salon_id'> | null
  if (!profile?.salon_id) redirect('/onboarding')

  let query = supabase
    .from('bookings')
    .select('*, services(id, name, price, duration_minutes), staff(id, first_name, last_name), clients(id, first_name, last_name, phone)')
    .eq('salon_id', profile.salon_id)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: true })

  if (status) query = query.eq('status', status)
  if (date) query = query.eq('booking_date', date)

  const { data: bookingsData } = await query

  const bookings = (bookingsData ?? []) as unknown as BookingWithRelations[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Réservations</h1>
        <span className="text-sm text-gray-500">{bookings.length} résultat{bookings.length > 1 ? 's' : ''}</span>
      </div>

      <BookingFilters activeStatus={status} activeDate={date} />

      <Card>
        {!bookings.length ? (
          <div className="p-4">
            <EmptyState
              icon={CalendarDays}
              title="Aucune réservation"
              description={status ? `Aucune réservation avec le statut « ${status} ».` : 'Les réservations apparaîtront ici.'}
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {booking.clients?.first_name ?? 'Cliente'} {booking.clients?.last_name ?? ''}
                    </p>
                    <BookingStatusBadge status={booking.status} />
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {booking.services?.name} · {format(new Date(booking.booking_date + 'T12:00:00'), 'EEE d MMM', { locale: fr })} · {booking.booking_time.slice(0, 5)}
                  </p>
                  {booking.staff && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {booking.staff.first_name} {booking.staff.last_name}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">{booking.total_price.toLocaleString('fr-FR')}</p>
                  <p className="text-xs text-gray-400">FCFA</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
