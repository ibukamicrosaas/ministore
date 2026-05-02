'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, ChevronRight, Scissors, LayoutList, LayoutGrid } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Service } from '@/types'

interface ServiceGridProps {
  services: Service[]
  salonSlug: string
}

function formatDuration(minutes: number) {
  return minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)}h${minutes % 60 > 0 ? String(minutes % 60).padStart(2, '0') : ''}`
}

function ServiceListCard({ service, salonSlug }: { service: Service; salonSlug: string }) {
  return (
    <Link
      href={`/${salonSlug}/book/${service.id}`}
      className="flex items-center gap-4 rounded-xl bg-white border border-gray-200 p-4 hover:border-[var(--color-primary)] hover:shadow-sm transition-all active:scale-[0.99]"
    >
      {service.photo_url ? (
        <Image
          src={service.photo_url}
          alt={service.name}
          width={64}
          height={64}
          className="h-16 w-16 rounded-xl object-cover shrink-0"
          loading="lazy"
          sizes="64px"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-orange-50 shrink-0">
          <Scissors className="h-7 w-7 text-[var(--color-primary)]" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{service.name}</h3>
        {service.description && (
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{service.description}</p>
        )}
        <div className="mt-2 flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(service.duration_minutes)}
          </span>
          <span className="text-sm font-bold text-[var(--color-primary)]">
            {service.price.toLocaleString('fr-FR')} FCFA
          </span>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
    </Link>
  )
}

function ServiceGridCard({ service, salonSlug }: { service: Service; salonSlug: string }) {
  return (
    <Link
      href={`/${salonSlug}/book/${service.id}`}
      className="flex flex-col rounded-xl bg-white border border-gray-200 overflow-hidden hover:border-[var(--color-primary)] hover:shadow-sm transition-all active:scale-[0.99]"
    >
      {service.photo_url ? (
        <div className="relative w-full aspect-square">
          <Image
            src={service.photo_url}
            alt={service.name}
            fill
            className="object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 50vw, 180px"
          />
        </div>
      ) : (
        <div className="w-full aspect-square bg-orange-50 flex items-center justify-center">
          <Scissors className="h-10 w-10 text-[var(--color-primary)] opacity-40" />
        </div>
      )}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{service.name}</h3>
        <div className="mt-2 flex items-center justify-between gap-1">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            {formatDuration(service.duration_minutes)}
          </span>
          <span className="text-sm font-bold text-[var(--color-primary)]">
            {service.price.toLocaleString('fr-FR')} F
          </span>
        </div>
      </div>
    </Link>
  )
}

export function ServiceGrid({ services, salonSlug }: ServiceGridProps) {
  const [view, setView] = useState<'list' | 'grid'>('list')

  if (!services.length) {
    return (
      <EmptyState
        title="Aucun service disponible"
        description="Ce salon n'a pas encore configuré ses prestations."
      />
    )
  }

  const byCategory = services.reduce<Record<string, Service[]>>((acc, service) => {
    const cat = service.category ?? 'Autres'
    const label = cat.charAt(0).toUpperCase() + cat.slice(1)
    if (!acc[label]) acc[label] = []
    acc[label].push(service)
    return acc
  }, {})

  const multiCategory = Object.keys(byCategory).length > 1

  const renderCards = (items: Service[]) =>
    view === 'grid' ? (
      <div className="grid grid-cols-2 gap-3">
        {items.map(s => <ServiceGridCard key={s.id} service={s} salonSlug={salonSlug} />)}
      </div>
    ) : (
      <div className="space-y-3">
        {items.map(s => <ServiceListCard key={s.id} service={s} salonSlug={salonSlug} />)}
      </div>
    )

  return (
    <div>
      {/* Toggle list/grid */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${view === 'list' ? 'bg-[var(--color-primary)] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Liste
          </button>
          <button
            type="button"
            onClick={() => setView('grid')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${view === 'grid' ? 'bg-[var(--color-primary)] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Grille
          </button>
        </div>
      </div>

      {multiCategory ? (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                {category}
              </h3>
              {renderCards(items)}
            </div>
          ))}
        </div>
      ) : (
        renderCards(services)
      )}
    </div>
  )
}
