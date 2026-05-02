import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Plus, Scissors, Clock, Tag } from 'lucide-react'
import type { Service, Profile } from '@/types'

export const metadata = { title: 'Prestations — Sheka' }

export default async function ServicesPage() {
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

  const servicesResult = await supabase
    .from('services')
    .select('*')
    .eq('salon_id', profile.salon_id)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (servicesResult.error) return <ErrorState message="Impossible de charger les services." />

  const services = (servicesResult.data ?? []) as Service[]

  const byCategory = services.reduce<Record<string, Service[]>>((acc, service) => {
    const cat = service.category ?? 'autre'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(service)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Prestations</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {services.length} prestation{services.length > 1 ? 's' : ''} configurée{services.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/services/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </Link>
      </div>

      {!services.length ? (
        <Card>
          <EmptyState
            icon={Scissors}
            title="Aucune prestation configurée"
            description="Ajoute tes prestations (coiffure, soins, beauté) pour que les clientes puissent réserver."
            action={
              <Link href="/dashboard/services/new">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Ajouter une prestation
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {Object.entries(byCategory).map(([category, items]) => (
            <Card key={category} padding="none">
              <CardHeader
                title={category.charAt(0).toUpperCase() + category.slice(1)}
                description={`${items.length} prestation${items.length > 1 ? 's' : ''}`}
                className="px-4 pt-4 pb-3 border-b border-gray-100"
              />
              <div className="divide-y divide-gray-100">
                {items.map((service) => (
                  <Link
                    key={service.id}
                    href={`/dashboard/services/${service.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {service.photo_url ? (
                      <img
                        src={service.photo_url}
                        alt={service.name}
                        className="h-12 w-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 shrink-0">
                        <Scissors className="h-5 w-5 text-[#E85D04]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{service.name}</p>
                        {!service.is_active && <Badge variant="warning">Inactif</Badge>}
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {service.price.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">→</span>
                  </Link>
                ))}
              </div>
            </Card>
          ))}

          {/* Placeholder — ajouter une prestation */}
          <Link
            href="/dashboard/services/new"
            className="flex items-center gap-4 rounded-xl border border-dashed border-gray-300 p-4 hover:border-[#E85D04] hover:bg-orange-50 transition-colors"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 shrink-0">
              <Plus className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Ajouter une prestation</p>
              <p className="text-xs text-gray-500">Coiffure, soins, beauté...</p>
            </div>
          </Link>
        </>
      )}
    </div>
  )
}
