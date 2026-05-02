import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarNav } from './CalendarNav'
import { BlockSlotForm } from './BlockSlotForm'
import { BookingStatusBadge } from '@/components/ui/Badge'
import { CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { getUpcomingBlockedSlots } from '@/lib/actions/blocked-slots'
import type { Profile, BookingWithRelations } from '@/types'

export const metadata = { title: 'Calendrier — Sheka' }

interface Props {
  searchParams: Promise<{ date?: string }>
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'border-l-blue-400  bg-blue-50',
  present:   'border-l-orange-400 bg-orange-50',
  completed: 'border-l-green-400  bg-green-50',
  cancelled: 'border-l-gray-300   bg-gray-50 opacity-60',
  no_show:   'border-l-red-300    bg-red-50  opacity-60',
  pending:   'border-l-yellow-400 bg-yellow-50',
}

export default async function CalendarPage({ searchParams }: Props) {
  const { date: dateParam } = await searchParams
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const dateStr = dateParam ?? todayStr

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'salon_id' | 'role'> | null
  if (!profile?.salon_id || profile.role !== 'owner') redirect('/dashboard')

  const [{ data: bookingsData }, blockedSlots] = await Promise.all([
    supabase
    .from('bookings')
    .select('*, services(id, name, duration_minutes, price), staff(id, first_name, last_name), clients(id, first_name, last_name, phone)')
    .eq('salon_id', profile.salon_id)
    .eq('booking_date', dateStr)
    .order('booking_time', { ascending: true }),
    getUpcomingBlockedSlots(profile.salon_id),
  ])

  const bookings = (bookingsData ?? []) as unknown as BookingWithRelations[]

  const activeBookings   = bookings.filter(b => !['cancelled', 'no_show'].includes(b.status))
  const inactiveBookings = bookings.filter(b =>  ['cancelled', 'no_show'].includes(b.status))

  const totalCA = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.total_price, 0)

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <CalendarNav dateStr={dateStr} />

      {/* Résumé du jour */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-gray-50 p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{activeBookings.length}</p>
          <p className="text-xs text-gray-500">RDV actifs</p>
        </div>
        <div className="rounded-xl bg-green-50 p-3 text-center">
          <p className="text-lg font-bold text-green-700">{bookings.filter(b => b.status === 'completed').length}</p>
          <p className="text-xs text-green-600">Terminés</p>
        </div>
        <div className="rounded-xl bg-orange-50 p-3 text-center">
          <p className="text-base font-bold text-orange-700">{totalCA.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-orange-600">FCFA encaissés</p>
        </div>
      </div>

      {/* Liste des réservations */}
      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 py-16">
          <CalendarDays className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Aucune réservation ce jour.</p>
          <Link
            href={`/dashboard/calendar?date=${format(new Date(), 'yyyy-MM-dd')}`}
            className="text-xs text-[#E85D04] hover:underline"
          >
            Retour à aujourd'hui
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Actives */}
          {activeBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}

          {/* Annulées / no-show en bas avec séparateur */}
          {inactiveBookings.length > 0 && (
            <>
              <p className="text-xs font-medium text-gray-400 pt-2 pb-1">Annulées / No-show</p>
              {inactiveBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </>
          )}
        </div>
      )}

      <BlockSlotForm dateStr={dateStr} blockedSlots={blockedSlots} />
    </div>
  )
}

function BookingCard({ booking }: { booking: BookingWithRelations }) {
  const colorClass = STATUS_COLORS[booking.status] ?? 'border-l-gray-200 bg-white'
  const clientName = [booking.clients?.first_name, booking.clients?.last_name].filter(Boolean).join(' ') || 'Cliente'

  return (
    <Link
      href={`/dashboard/bookings/${booking.id}`}
      className={`flex items-stretch gap-0 rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow`}
    >
      {/* Barre de couleur statut */}
      <div className={`w-1 shrink-0 ${colorClass.split(' ')[0].replace('border-l-', 'bg-')}`} />

      <div className={`flex flex-1 items-center gap-3 px-3 py-3 ${colorClass.split(' ').slice(1).join(' ')}`}>
        {/* Heure */}
        <div className="shrink-0 text-center w-12">
          <p className="text-sm font-bold text-gray-900">{booking.booking_time.slice(0, 5)}</p>
          <p className="text-xs text-gray-400">
            {booking.services?.duration_minutes ? `${booking.services.duration_minutes}min` : ''}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{clientName}</p>
          <p className="text-xs text-gray-500 truncate">
            {booking.services?.name}
            {booking.staff && ` · ${booking.staff.first_name}`}
          </p>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1">
          <BookingStatusBadge status={booking.status} />
          <p className="text-xs font-semibold text-gray-700">{booking.total_price.toLocaleString('fr-FR')} F</p>
        </div>
      </div>
    </Link>
  )
}
