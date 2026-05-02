import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { MarkPaidButton } from './MarkPaidButton'
import { Banknote, Users } from 'lucide-react'
import { getWeek, getYear, startOfWeek, endOfWeek, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Profile, Staff } from '@/types'

export const metadata = { title: 'Commissions — Sheka' }

interface CommissionRow {
  id: string
  staff_id: string
  commission_amount: number
  is_paid: boolean
  staff: Pick<Staff, 'id' | 'first_name' | 'last_name' | 'photo_url' | 'commission_rate'>
}

export default async function CommissionsPage() {
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
  const currentWeek = getWeek(now, { weekStartsOn: 1 })
  const currentYear = getYear(now)
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'd MMMM', { locale: fr })
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'd MMMM yyyy', { locale: fr })

  const { data: commissionsData } = await supabase
    .from('commissions')
    .select('id, staff_id, commission_amount, is_paid, staff(id, first_name, last_name, photo_url, commission_rate)')
    .eq('salon_id', profile.salon_id)
    .eq('week_number', currentWeek)
    .eq('year', currentYear)
    .order('created_at', { ascending: false })

  const commissions = (commissionsData ?? []) as unknown as CommissionRow[]

  // Grouper par employée
  const byStaff = commissions.reduce<Record<string, {
    staff: CommissionRow['staff']
    total: number
    unpaid: number
    count: number
  }>>((acc, c) => {
    const sid = c.staff_id
    if (!acc[sid]) {
      acc[sid] = { staff: c.staff, total: 0, unpaid: 0, count: 0 }
    }
    acc[sid].total += c.commission_amount
    if (!c.is_paid) acc[sid].unpaid += c.commission_amount
    acc[sid].count++
    return acc
  }, {})

  const staffEntries = Object.entries(byStaff)
  const grandTotal = staffEntries.reduce((s, [, e]) => s + e.total, 0)
  const grandUnpaid = staffEntries.reduce((s, [, e]) => s + e.unpaid, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Commissions</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Semaine {currentWeek} · {weekStart} – {weekEnd}
        </p>
      </div>

      {/* Récap global */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs text-gray-500">CA commissionné</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{grandTotal.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-400">FCFA</p>
        </div>
        <div className={`rounded-xl border p-4 ${grandUnpaid > 0 ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
          <p className={`text-xs ${grandUnpaid > 0 ? 'text-orange-600' : 'text-green-600'}`}>À verser</p>
          <p className={`text-2xl font-bold mt-1 ${grandUnpaid > 0 ? 'text-orange-700' : 'text-green-700'}`}>
            {grandUnpaid.toLocaleString('fr-FR')}
          </p>
          <p className={`text-xs ${grandUnpaid > 0 ? 'text-orange-500' : 'text-green-500'}`}>FCFA</p>
        </div>
      </div>

      {/* Par employée */}
      <Card padding="none">
        <CardHeader
          title="Par employée"
          description={`${staffEntries.length} employée${staffEntries.length > 1 ? 's' : ''} avec commissions`}
          className="px-4 pt-4 pb-3 border-b border-gray-100"
        />

        {staffEntries.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Users}
              title="Aucune commission cette semaine"
              description="Les commissions apparaissent automatiquement quand une prestation est terminée."
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {staffEntries.map(([staffId, entry]) => (
              <div key={staffId} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/dashboard/staff/${staffId}`}>
                  <Avatar
                    src={entry.staff.photo_url}
                    name={`${entry.staff.first_name} ${entry.staff.last_name}`}
                    size="md"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/dashboard/staff/${staffId}`} className="hover:underline">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.staff.first_name} {entry.staff.last_name}
                    </p>
                  </Link>
                  <p className="text-xs text-gray-500">
                    {entry.count} prestation{entry.count > 1 ? 's' : ''} · Taux {entry.staff.commission_rate}%
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {entry.unpaid > 0 ? (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-orange-600">
                        {entry.unpaid.toLocaleString('fr-FR')} FCFA
                      </p>
                      <MarkPaidButton
                        staffId={staffId}
                        weekNumber={currentWeek}
                        year={currentYear}
                        amount={entry.unpaid}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-green-600 font-medium">Payé ✓</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Banknote className="h-3.5 w-3.5" />
        <span>Les commissions sont calculées automatiquement à la fin de chaque prestation.</span>
      </div>
    </div>
  )
}
