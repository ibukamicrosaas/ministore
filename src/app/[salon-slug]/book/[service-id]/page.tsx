import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, MapPin } from 'lucide-react'
import { DateTimePickerWrapper } from './DateTimePickerWrapper'
import type { Salon, Service, ServiceVariant } from '@/types'
import type { OpeningHours } from '@/types'
import { getNextAvailableDays } from '@/lib/utils/availability'

interface Props {
  params: Promise<{ 'salon-slug': string; 'service-id': string }>
}

export default async function BookDatePage({ params }: Props) {
  const { 'salon-slug': slug, 'service-id': serviceId } = await params
  const supabase = await createServerClient()

  const { data: salonData } = await supabase
    .from('salons')
    .select('id, name, opening_hours, deposit_percentage, address, city')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!salonData) notFound()
  const salon = salonData as Pick<Salon, 'id' | 'name' | 'opening_hours' | 'deposit_percentage' | 'address' | 'city'>

  const { data: serviceData } = await supabase
    .from('services')
    .select('id, name, duration_minutes, price, description, photo_url, deposit_percentage, variants')
    .eq('id', serviceId)
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .single()

  if (!serviceData) notFound()
  const service = serviceData as Pick<Service, 'id' | 'name' | 'duration_minutes' | 'price' | 'description' | 'photo_url'> & {
    deposit_percentage: number | null
    variants: ServiceVariant[] | null
  }

  const openingHours = salon.opening_hours as OpeningHours
  const availableDays = getNextAvailableDays(openingHours, 60)
  const effectiveDepositPct = service.deposit_percentage !== null
    ? service.deposit_percentage
    : salon.deposit_percentage
  const depositAmount = Math.floor(service.price * (effectiveDepositPct / 100))

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href={`/${slug}`} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-500">{salon.name}</p>
          <h1 className="text-sm font-semibold text-gray-900">{service.name}</h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Info service */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
          <div className="flex items-start gap-3">
            {service.photo_url && (
              <img
                src={service.photo_url}
                alt={service.name}
                className="h-20 w-20 rounded-xl object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">Durée</span>
                <span className="text-xs font-medium text-gray-700">{service.duration_minutes} min</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">Prix</span>
                <div className="text-right">
                  {service.variants && service.variants.length > 0 ? (
                    <span className="text-sm font-bold text-gray-900">
                      à partir de {Math.min(...service.variants.map(v => v.price)).toLocaleString('fr-FR')} FCFA
                    </span>
                  ) : (
                    <>
                      <span className="text-sm font-bold text-gray-900">{service.price.toLocaleString('fr-FR')} FCFA</span>
                      {depositAmount > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">Acompte : {depositAmount.toLocaleString('fr-FR')} FCFA</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {service.description && (
            <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-200 pt-3">{service.description}</p>
          )}

          {(salon.address || salon.city) && (
            <div className="flex items-start gap-2 border-t border-gray-200 pt-3">
              <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-500">
                {[salon.address, salon.city].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </div>

        <DateTimePickerWrapper
          salonSlug={slug}
          serviceId={serviceId}
          availableDays={availableDays}
          depositPercentage={effectiveDepositPct}
          servicePrice={service.price}
          variants={service.variants}
        />
      </div>
    </div>
  )
}
