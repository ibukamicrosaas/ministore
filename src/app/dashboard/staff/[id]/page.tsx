import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { StaffForm } from '@/components/dashboard/StaffForm'
import { Card, CardHeader } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { CommissionsPanel } from './CommissionsPanel'
import Link from 'next/link'
import { ChevronLeft, Phone, MessageCircle } from 'lucide-react'
import type { Staff, Profile } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function StaffDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileResult = await supabase
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileResult.data as Pick<Profile, 'salon_id' | 'role'> | null
  if (!profile?.salon_id) redirect('/onboarding')

  const memberResult = await supabase
    .from('staff')
    .select('*')
    .eq('id', id)
    .eq('salon_id', profile.salon_id)
    .single()

  const member = memberResult.data as Staff | null
  if (memberResult.error || !member) notFound()

  // Stats globales de l'employée
  const { data: statsData } = await supabase
    .from('bookings')
    .select('id, status, total_price')
    .eq('staff_id', id)
    .in('status', ['completed', 'present'])

  const stats = (statsData ?? []) as { id: string; status: string; total_price: number }[]
  const totalCompleted = stats.filter(b => b.status === 'completed').length
  const totalRevenue = stats.reduce((s, b) => s + b.total_price, 0)

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/staff" className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <Avatar
            src={member.photo_url}
            name={`${member.first_name} ${member.last_name}`}
            size="lg"
          />
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {member.first_name} {member.last_name}
            </h1>
            <p className="text-sm text-gray-500">
              {member.remuneration_type === 'commission'
                ? `Commission ${member.commission_rate}%`
                : `Salaire fixe · ${member.fixed_salary?.toLocaleString('fr-FR')} FCFA/mois`}
            </p>
          </div>
        </div>
        {!member.is_active && (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
            Inactive
          </span>
        )}
      </div>

      {/* Contact */}
      {(member.phone || member.whatsapp) && (
        <div className="flex gap-2">
          {member.phone && (
            <a
              href={`tel:${member.phone}`}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Phone className="h-4 w-4 text-gray-400" />
              {member.phone}
            </a>
          )}
          {member.whatsapp && (
            <a
              href={`https://wa.me/${member.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 hover:bg-green-100 transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-green-500" />
              WhatsApp
            </a>
          )}
        </div>
      )}

      {/* Stats globales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Prestations terminées</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalCompleted}</p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs text-gray-500">CA généré</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {totalRevenue.toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-gray-400">FCFA</p>
        </div>
      </div>

      {/* Commissions (seulement si commission) */}
      {member.remuneration_type === 'commission' && (
        <Card>
          <CardHeader title="Commissions" description="Naviguez entre les semaines" />
          <div className="mt-4">
            <CommissionsPanel staffId={member.id} />
          </div>
        </Card>
      )}

      {/* Formulaire d'édition */}
      {profile.role === 'owner' && (
        <Card>
          <CardHeader title="Modifier les informations" />
          <div className="mt-4">
            <StaffForm member={member} />
          </div>
        </Card>
      )}
    </div>
  )
}
