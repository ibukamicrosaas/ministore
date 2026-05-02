import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Plus, Users } from 'lucide-react'
import type { Staff, Profile } from '@/types'

export const metadata = { title: 'Employées — Sheka' }

export default async function StaffPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileResult = await supabase
    .from('profiles')
    .select('salon_id')
    .eq('id', user.id)
    .single()

  const profile = profileResult.data as Pick<Profile, 'salon_id'> | null
  if (!profile?.salon_id) redirect('/onboarding')

  const staffResult = await supabase
    .from('staff')
    .select('*')
    .eq('salon_id', profile.salon_id)
    .order('created_at', { ascending: true })

  if (staffResult.error) return <ErrorState message="Impossible de charger les employées." />

  const staffList = (staffResult.data ?? []) as Staff[]
  const active = staffList.filter((s) => s.is_active)
  const inactive = staffList.filter((s) => !s.is_active)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Employées</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {active.length} employée{active.length > 1 ? 's' : ''} active{active.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/staff/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </Link>
      </div>

      {!staffList.length ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Aucune employée configurée"
            description="Ajoute tes employées pour suivre leurs commissions et plannings."
            action={
              <Link href="/dashboard/staff/new">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Ajouter une employée
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <Card padding="none">
              <CardHeader
                title="Actives"
                description={`${active.length} employée${active.length > 1 ? 's' : ''}`}
                className="px-4 pt-4 pb-3 border-b border-gray-100"
              />
              <div className="divide-y divide-gray-100">
                {active.map((member) => (
                  <Link
                    key={member.id}
                    href={`/dashboard/staff/${member.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <Avatar
                      src={member.photo_url}
                      name={`${member.first_name} ${member.last_name}`}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.remuneration_type === 'commission'
                          ? `Commission ${member.commission_rate}%`
                          : `Salaire fixe — ${member.fixed_salary?.toLocaleString('fr-FR')} FCFA/mois`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">→</span>
                  </Link>
                ))}
              </div>
            </Card>
          )}
          {inactive.length > 0 && (
            <Card padding="none">
              <CardHeader
                title="Inactives"
                description={`${inactive.length} employée${inactive.length > 1 ? 's' : ''}`}
                className="px-4 pt-4 pb-3 border-b border-gray-100"
              />
              <div className="divide-y divide-gray-100">
                {inactive.map((member) => (
                  <Link
                    key={member.id}
                    href={`/dashboard/staff/${member.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors opacity-60"
                  >
                    <Avatar src={member.photo_url} name={`${member.first_name} ${member.last_name}`} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{member.first_name} {member.last_name}</p>
                        <Badge variant="warning">Inactive</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
