import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SalonHeader } from '@/components/pwa/SalonHeader'
import { ServiceGrid } from '@/components/pwa/ServiceGrid'
import { ErrorState } from '@/components/ui'
import type { Salon, Service } from '@/types'

interface Props {
  params: Promise<{ 'salon-slug': string }>
}

export default async function SalonHomePage({ params }: Props) {
  const { 'salon-slug': slug } = await params
  const supabase = await createServerClient()

  const salonResult = await supabase
    .from('salons')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  const salon = salonResult.data as Salon | null
  if (salonResult.error || !salon) notFound()

  const servicesResult = await supabase
    .from('services')
    .select('*')
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (servicesResult.error) {
    return <ErrorState message="Impossible de charger les prestations." />
  }

  const services = (servicesResult.data ?? []) as Service[]

  return (
    <div className="pb-8">
      <SalonHeader salon={salon} />
      <div className="px-4 pt-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Nos prestations
        </h2>
        <ServiceGrid
          services={services}
          salonSlug={salon.slug}
        />
      </div>
      <div className="mt-10 pb-4 text-center">
        <a
          href="https://sheka.store"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
        >
          Mettez votre salon en ligne gratuitement
        </a>
      </div>
    </div>
  )
}
