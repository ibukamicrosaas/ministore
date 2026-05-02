import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { BookingClientForm } from '@/components/booking/BookingClientForm'
import type { Salon, Service } from '@/types'
import { BookingSteps } from '@/components/booking/BookingSteps'

interface Props {
  params: Promise<{ 'salon-slug': string; 'service-id': string }>
  searchParams: Promise<{ date?: string; time?: string; vl?: string; vp?: string }>
}

export default async function BookInfoPage({ params, searchParams }: Props) {
  const { 'salon-slug': slug, 'service-id': serviceId } = await params
  const { date, time, vl: variantLabel, vp: variantPriceStr } = await searchParams
  const variantPrice = variantPriceStr ? parseInt(variantPriceStr) : undefined

  if (!date || !time) redirect(`/${slug}/book/${serviceId}`)

  const supabase = await createServerClient()

  const { data: salonData } = await supabase
    .from('salons')
    .select('id, name, deposit_percentage')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!salonData) notFound()
  const salon = salonData as Pick<Salon, 'id' | 'name' | 'deposit_percentage'>

  const { data: serviceData } = await supabase
    .from('services')
    .select('id, name, duration_minutes, price, deposit_percentage')
    .eq('id', serviceId)
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .single()

  if (!serviceData) notFound()
  const service = serviceData as Pick<Service, 'id' | 'name' | 'duration_minutes' | 'price'> & { deposit_percentage: number | null }
  const effectiveDepositPct = service.deposit_percentage !== null
    ? service.deposit_percentage
    : salon.deposit_percentage

  const steps = [
    { label: 'Date', active: false, done: true },
    { label: 'Infos', active: true, done: false },
    { label: 'Paiement', active: false, done: false },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href={`/${slug}/book/${serviceId}`} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-500">{salon.name}</p>
          <h1 className="text-sm font-semibold text-gray-900">Vos informations</h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <BookingSteps steps={steps} />
        </div>

        <BookingClientForm
          salonSlug={slug}
          service={service}
          date={date}
          time={time}
          depositPercentage={effectiveDepositPct}
          variantLabel={variantLabel}
          variantPrice={variantPrice}
        />
      </div>
    </div>
  )
}
