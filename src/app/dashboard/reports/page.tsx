import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader } from '@/components/ui/Card'
import { format, startOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ExportButton } from './ExportButton'
import type { Profile } from '@/types'

export const metadata = { title: 'Rapports — Sheka' }

export default async function ReportsPage() {
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

  const now = new Date()
  const todayStr = format(now, 'yyyy-MM-dd')
  const weekStartStr = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const monthStartStr = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEndStr = format(endOfMonth(now), 'yyyy-MM-dd')
  const salonId = profile.salon_id

  const COUNTED_STATUSES = ['confirmed', 'present', 'completed'] as const

  const [todayRes, weekRes, monthRes, statusRes, servicesRes, staffRes, clientsRes] = await Promise.all([
    supabase.from('bookings').select('total_price').eq('salon_id', salonId).eq('booking_date', todayStr).in('status', COUNTED_STATUSES),
    supabase.from('bookings').select('total_price').eq('salon_id', salonId).gte('booking_date', weekStartStr).lte('booking_date', todayStr).in('status', COUNTED_STATUSES),
    supabase.from('bookings').select('total_price').eq('salon_id', salonId).gte('booking_date', monthStartStr).lte('booking_date', monthEndStr).in('status', COUNTED_STATUSES),
    supabase.from('bookings').select('status').eq('salon_id', salonId).gte('booking_date', monthStartStr).lte('booking_date', monthEndStr),
    supabase.from('bookings').select('services(name)').eq('salon_id', salonId).gte('booking_date', monthStartStr).lte('booking_date', monthEndStr).in('status', COUNTED_STATUSES),
    supabase.from('bookings').select('total_price, staff(id, first_name, last_name)').eq('salon_id', salonId).gte('booking_date', monthStartStr).lte('booking_date', monthEndStr).in('status', COUNTED_STATUSES).not('staff_id', 'is', null),
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('salon_id', salonId),
  ])

  const caToday = (todayRes.data ?? []).reduce((s, b) => s + b.total_price, 0)
  const caWeek  = (weekRes.data ?? []).reduce((s, b) => s + b.total_price, 0)
  const caMonth = (monthRes.data ?? []).reduce((s, b) => s + b.total_price, 0)

  const bookingsMonth = statusRes.data ?? []
  const completed   = bookingsMonth.filter(b => b.status === 'completed').length
  const cancelled   = bookingsMonth.filter(b => b.status === 'cancelled').length
  const noShow      = bookingsMonth.filter(b => b.status === 'no_show').length
  const totalBookings = bookingsMonth.length
  const noShowRate  = totalBookings > 0 ? Math.round((noShow / totalBookings) * 100) : 0
  const confirmRate = totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0

  // Top services
  const serviceCount: Record<string, number> = {}
  for (const b of (servicesRes.data ?? []) as unknown as { services: { name: string } | null }[]) {
    const name = b.services?.name
    if (name) serviceCount[name] = (serviceCount[name] ?? 0) + 1
  }
  const topServices = Object.entries(serviceCount).sort(([,a],[,b]) => b - a).slice(0, 5)

  // Top employées
  const staffMap: Record<string, { name: string; count: number; ca: number }> = {}
  for (const b of (staffRes.data ?? []) as unknown as { total_price: number; staff: { id: string; first_name: string; last_name: string } | null }[]) {
    if (!b.staff) continue
    const id = b.staff.id
    if (!staffMap[id]) staffMap[id] = { name: `${b.staff.first_name} ${b.staff.last_name}`, count: 0, ca: 0 }
    staffMap[id].count++
    staffMap[id].ca += b.total_price
  }
  const topStaff = Object.values(staffMap).sort((a, b) => b.ca - a.ca).slice(0, 5)

  const totalClients = clientsRes.count ?? 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rapports</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{format(now, 'MMMM yyyy', { locale: fr })}</p>
        </div>
        <ExportButton monthStart={monthStartStr} monthEnd={monthEndStr} />
      </div>

      {/* CA */}
      <Card>
        <CardHeader title="Chiffre d'affaires" />
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <p className="text-xs text-gray-500">Aujourd'hui</p>
            <p className="text-base font-bold text-gray-900 mt-0.5">{caToday.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-gray-400">FCFA</p>
          </div>
          <div className="rounded-xl bg-orange-50 p-3 text-center">
            <p className="text-xs text-orange-600">Cette semaine</p>
            <p className="text-base font-bold text-orange-700 mt-0.5">{caWeek.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-orange-500">FCFA</p>
          </div>
          <div className="rounded-xl bg-green-50 p-3 text-center">
            <p className="text-xs text-green-600">Ce mois</p>
            <p className="text-base font-bold text-green-700 mt-0.5">{caMonth.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-green-500">FCFA</p>
          </div>
        </div>
      </Card>

      {/* Réservations */}
      <Card>
        <CardHeader title="Réservations ce mois" />
        <div className="mt-4 space-y-2">
          <StatRow label="Total" value={totalBookings} />
          <StatRow label="Terminées" value={completed} color="text-green-600" />
          <StatRow label="Annulées" value={cancelled} color="text-gray-500" />
          <StatRow label="No-show" value={noShow} color="text-red-500" />
          <div className="pt-2 border-t border-gray-100 space-y-1.5">
            <RateRow label="Taux de complétion" value={confirmRate} good={confirmRate >= 70} />
            <RateRow label="Taux de no-show" value={noShowRate} good={noShowRate <= 10} invert />
          </div>
        </div>
      </Card>

      {/* Top prestations */}
      <Card>
        <CardHeader title="Top prestations ce mois" />
        <div className="mt-4">
          {topServices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune prestation terminée ce mois.</p>
          ) : (
            <div className="space-y-2">
              {topServices.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 shrink-0">{i + 1}</span>
                  <p className="flex-1 text-sm text-gray-800 truncate">{name}</p>
                  <span className="text-sm font-semibold text-gray-700">{count}×</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Top employées */}
      <Card>
        <CardHeader title="Top employées ce mois" />
        <div className="mt-4">
          {topStaff.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune prestation assignée ce mois.</p>
          ) : (
            <div className="space-y-2">
              {topStaff.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-[#E85D04] shrink-0">{i + 1}</span>
                  <p className="flex-1 text-sm text-gray-800 truncate">{s.name}</p>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-700">{s.ca.toLocaleString('fr-FR')} FCFA</p>
                    <p className="text-xs text-gray-400">{s.count} presta</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Clientes */}
      <Card>
        <CardHeader title="Base clientes" />
        <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 p-4">
          <p className="text-sm text-gray-600">Clientes enregistrées</p>
          <p className="text-xl font-bold text-gray-900">{totalClients}</p>
        </div>
      </Card>
    </div>
  )
}

function StatRow({ label, value, color = 'text-gray-700' }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <p className="text-sm text-gray-500">{label}</p>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  )
}

function RateRow({ label, value, good, invert = false }: { label: string; value: number; good: boolean; invert?: boolean }) {
  const positive = invert ? !good : good
  return (
    <div className="flex items-center justify-between py-1">
      <p className="text-sm text-gray-500">{label}</p>
      <span className={`text-sm font-bold ${positive ? 'text-green-600' : 'text-red-500'}`}>{value}%</span>
    </div>
  )
}
