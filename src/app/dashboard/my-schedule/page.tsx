import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { BookingStatusBadge } from '@/components/ui/Badge'
import { CalendarDays, Banknote, Scissors } from 'lucide-react'
import { format, getWeek, getYear } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Profile, Staff, Service, Booking } from '@/types'

export const metadata = { title: 'Mon planning — Sheka' }

interface BookingRow extends Booking {
  services: Pick<Service, 'name' | 'duration_minutes' | 'price'>
}

interface CommissionRow {
  id: string
  commission_amount: number
  commission_rate: number | null
  service_price: number
  is_paid: boolean
  created_at: string
}

export default async function MySchedulePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'salon_id' | 'role'> | null
  if (!profile?.salon_id) redirect('/onboarding')

  // Trouver le staff lié à ce profil
  const { data: staffData } = await supabase
    .from('staff')
    .select('id, first_name, last_name, remuneration_type, commission_rate')
    .eq('user_id', user.id)
    .eq('salon_id', profile.salon_id)
    .eq('is_active', true)
    .single()

  const staff = staffData as Pick<Staff, 'id' | 'first_name' | 'last_name' | 'remuneration_type' | 'commission_rate'> | null

  // Si pas de staff lié → voir dashboard owner
  if (!staff && profile.role === 'owner') redirect('/dashboard')

  const today = format(new Date(), 'yyyy-MM-dd')
  const now = new Date()
  const currentWeek = getWeek(now, { weekStartsOn: 1 })
  const currentYear = getYear(now)

  // Bookings du jour pour cet employé
  const { data: todayBookingsData } = staff
    ? await supabase
        .from('bookings')
        .select('*, services(name, duration_minutes, price)')
        .eq('salon_id', profile.salon_id)
        .eq('staff_id', staff.id)
        .eq('booking_date', today)
        .in('status', ['confirmed', 'present', 'completed'])
        .order('booking_time', { ascending: true })
    : { data: [] }

  const todayBookings = (todayBookingsData ?? []) as unknown as BookingRow[]

  // Commissions de la semaine
  const { data: commissionsData } = staff
    ? await supabase
        .from('commissions')
        .select('id, commission_amount, commission_rate, service_price, is_paid, created_at')
        .eq('staff_id', staff.id)
        .eq('week_number', currentWeek)
        .eq('year', currentYear)
        .order('created_at', { ascending: false })
    : { data: [] }

  const commissions = (commissionsData ?? []) as CommissionRow[]
  const weekTotal = commissions.reduce((s, c) => s + c.commission_amount, 0)
  const weekUnpaid = commissions.filter(c => !c.is_paid).reduce((s, c) => s + c.commission_amount, 0)

  const greeting = staff
    ? `Bonjour, ${staff.first_name} 👋`
    : 'Mon planning'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{greeting}</h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Résumé semaine */}
      {staff?.remuneration_type === 'commission' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs text-gray-500">Commissions semaine</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{weekTotal.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-gray-400">FCFA</p>
          </div>
          <div className={`rounded-xl border p-4 ${weekUnpaid > 0 ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
            <p className={`text-xs ${weekUnpaid > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {weekUnpaid > 0 ? 'En attente' : 'Payé ✓'}
            </p>
            <p className={`text-xl font-bold mt-1 ${weekUnpaid > 0 ? 'text-orange-700' : 'text-green-700'}`}>
              {weekUnpaid.toLocaleString('fr-FR')}
            </p>
            <p className={`text-xs ${weekUnpaid > 0 ? 'text-orange-500' : 'text-green-500'}`}>FCFA</p>
          </div>
        </div>
      )}

      {/* Planning du jour */}
      <Card>
        <CardHeader
          title="Mes RDV aujourd'hui"
          description={`${todayBookings.length} réservation${todayBookings.length > 1 ? 's' : ''}`}
        />
        <div className="mt-4">
          {todayBookings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Aucun RDV aujourd'hui"
              description="Profitez de cette journée libre !"
            />
          ) : (
            <div className="space-y-2">
              {todayBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 shrink-0">
                    <Scissors className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{booking.services.name}</p>
                    <p className="text-xs text-gray-500">
                      {booking.booking_time.slice(0, 5)} · {booking.services.duration_minutes} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-gray-900">
                      {booking.total_price.toLocaleString('fr-FR')} FCFA
                    </span>
                    <BookingStatusBadge status={booking.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Détail commissions semaine */}
      {staff?.remuneration_type === 'commission' && commissions.length > 0 && (
        <Card>
          <CardHeader
            title={`Commissions — Semaine ${currentWeek}`}
            description={`${commissions.length} prestation${commissions.length > 1 ? 's' : ''}`}
          />
          <div className="mt-4 space-y-2">
            {commissions.map((c) => (
              <div key={c.id} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${c.is_paid ? 'border-green-100 bg-green-50' : 'border-gray-100'}`}>
                <div>
                  <p className="text-xs text-gray-500">
                    {c.commission_rate}% de {c.service_price.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold ${c.is_paid ? 'text-green-600' : 'text-gray-900'}`}>
                    {c.commission_amount.toLocaleString('fr-FR')} FCFA
                  </p>
                  {c.is_paid && <span className="text-xs text-green-500">✓</span>}
                </div>
              </div>
            ))}
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <p className="text-sm font-semibold text-gray-700">Total</p>
              <p className="text-sm font-bold text-[#E85D04]">{weekTotal.toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>
        </Card>
      )}

      {!staff && (
        <Card>
          <div className="py-6 text-center">
            <Banknote className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Ton compte n'est pas encore lié à un profil d'employée.
              Demande à la patronne de faire le lien depuis la fiche employée.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
