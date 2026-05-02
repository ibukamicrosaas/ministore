import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatCard } from '@/components/dashboard/StatCard'
import { SalonLinkCard } from '@/components/dashboard/SalonLinkCard'
import { SetupChecklist } from '@/components/dashboard/SetupChecklist'
import { Card, CardHeader } from '@/components/ui/Card'
import { BookingStatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { CalendarDays, TrendingUp, Users, Scissors } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { APP_URL } from '@/constants'
import type { BookingWithRelations, Profile, Salon } from '@/types'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileResult = await supabase
    .from('profiles')
    .select('salon_id, onboarding_completed')
    .eq('id', user.id)
    .single()

  const profile = profileResult.data as (Pick<Profile, 'salon_id'> & { onboarding_completed: boolean }) | null
  if (!profile?.salon_id) redirect('/onboarding')

  const { data: salonData } = await supabase
    .from('salons')
    .select('slug, name, business_type, payout_wave_number, payout_om_number')
    .eq('id', profile.salon_id)
    .single()

  const salon = salonData as (Pick<Salon, 'slug' | 'payout_wave_number' | 'payout_om_number'> & {
    name: string; business_type: 'independent' | 'salon' | null
  }) | null

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const weekStart = format(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7)),
    'yyyy-MM-dd'
  )

  const monthStart = format(
    new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd'
  )

  const [todayBookingsResult, todayRevenueResult, weekBookingsResult, clientsResult, monthStatsResult, servicesCountResult] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, services(id, name, price), staff(id, first_name, last_name), clients(id, first_name, last_name, phone)')
      .eq('salon_id', profile.salon_id)
      .eq('booking_date', todayStr)
      .in('status', ['confirmed', 'present', 'completed'])
      .order('booking_time', { ascending: true }),
    supabase
      .from('bookings')
      .select('total_price')
      .eq('salon_id', profile.salon_id)
      .eq('booking_date', todayStr)
      .eq('status', 'completed'),
    supabase
      .from('bookings')
      .select('id, status')
      .eq('salon_id', profile.salon_id)
      .gte('booking_date', weekStart)
      .in('status', ['confirmed', 'present', 'completed']),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('salon_id', profile.salon_id),
    supabase
      .from('bookings')
      .select('status')
      .eq('salon_id', profile.salon_id)
      .gte('booking_date', monthStart)
      .lte('booking_date', todayStr),
    supabase
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('salon_id', profile.salon_id)
      .eq('is_active', true),
  ])

  const todayBookings = (todayBookingsResult.data ?? []) as unknown as BookingWithRelations[]
  const todayRevenueData = (todayRevenueResult.data ?? []) as { total_price: number }[]
  const weekBookings = weekBookingsResult.data ?? []
  const revenueToday = todayRevenueData.reduce((sum, b) => sum + b.total_price, 0)
  const totalClients = clientsResult.count ?? 0
  const hasService = (servicesCountResult.count ?? 0) > 0

  const monthBookings = monthStatsResult.data ?? []
  const monthTotal = monthBookings.length
  const monthCompleted = monthBookings.filter(b => b.status === 'completed').length
  const monthNoShow = monthBookings.filter(b => b.status === 'no_show').length
  const completionRate = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : null
  const noShowRate = monthTotal > 0 ? Math.round((monthNoShow / monthTotal) * 100) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {salon && (
        <SetupChecklist
          salonSlug={salon.slug}
          salonName={salon.name}
          hasService={hasService}
          hasPayoutNumbers={!!(salon.payout_wave_number || salon.payout_om_number)}
        />
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="CA aujourd'hui"
          value={revenueToday.toLocaleString('fr-FR')}
          subtitle="FCFA"
          icon={TrendingUp}
        />
        <StatCard
          title="RDV aujourd'hui"
          value={todayBookings.length}
          icon={CalendarDays}
        />
        <StatCard
          title="RDV cette semaine"
          value={weekBookings.length}
          icon={CalendarDays}
        />
        <StatCard
          title="Clientes"
          value={totalClients}
          icon={Users}
        />
      </div>

      {/* Lien de réservation */}
      {salon && (
        <SalonLinkCard salonSlug={salon.slug} appUrl={APP_URL} />
      )}

      {/* Taux du mois */}
      {completionRate !== null && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <p className="text-xs text-gray-500">Complétion ce mois</p>
            <p className={`text-xl font-bold mt-1 ${completionRate >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
              {completionRate}%
            </p>
            <p className="text-xs text-gray-400">{monthCompleted}/{monthTotal} RDV</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <p className="text-xs text-gray-500">No-show ce mois</p>
            <p className={`text-xl font-bold mt-1 ${(noShowRate ?? 0) > 15 ? 'text-red-600' : 'text-gray-700'}`}>
              {noShowRate}%
            </p>
            <p className="text-xs text-gray-400">{monthNoShow} absence{monthNoShow > 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader
          title="Réservations du jour"
          action={
            <Link href="/dashboard/calendar" className="text-xs font-medium text-[#E85D04] hover:underline">
              Calendrier
            </Link>
          }
        />
        <div className="mt-4">
          {!todayBookings.length ? (
            <EmptyState
              icon={CalendarDays}
              title="Aucune réservation aujourd'hui"
              description="Les nouvelles réservations apparaîtront ici automatiquement."
            />
          ) : (
            <div className="space-y-2">
              {todayBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/dashboard/bookings/${booking.id}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 shrink-0">
                    <Scissors className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {booking.clients?.first_name ?? 'Cliente'}{' '}
                      {booking.clients?.last_name ?? ''}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {booking.services?.name} · {booking.booking_time.slice(0, 5)}
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/services/new"
          className="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 p-4 hover:border-[#E85D04] hover:bg-orange-50 transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
            <Scissors className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Ajouter une prestation</p>
            <p className="text-xs text-gray-500">Coiffure, soins, beauté...</p>
          </div>
        </Link>
        <Link
          href="/dashboard/staff/new"
          className="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 p-4 hover:border-[#E85D04] hover:bg-orange-50 transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
            <Users className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Ajouter une employée</p>
            <p className="text-xs text-gray-500">Commission ou salaire fixe</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
