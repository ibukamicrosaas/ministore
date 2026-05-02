import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ServiceForm } from '@/components/dashboard/ServiceForm'
import type { Service, Profile } from '@/types'

export const metadata = { title: 'Modifier la prestation — Sheka' }

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}

export default async function EditServicePage({ params, searchParams }: Props) {
  const { id } = await params
  const { created } = await searchParams
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

  const serviceResult = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .eq('salon_id', profile.salon_id)
    .single()

  const service = serviceResult.data as Service | null
  if (serviceResult.error || !service) notFound()

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/dashboard/services"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Prestations
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{service.name}</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {created === '1'
            ? 'Prestation créée ✓ — tu peux modifier ou compléter les informations.'
            : 'Modifier les informations de la prestation.'}
        </p>
      </div>
      <ServiceForm service={service} />
    </div>
  )
}
