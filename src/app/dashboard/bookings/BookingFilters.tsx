'use client'

import { useRouter, usePathname } from 'next/navigation'
import { BOOKING_STATUS_LABELS } from '@/constants'
import { CalendarDays, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUSES = ['confirmed', 'present', 'completed', 'cancelled', 'pending', 'no_show']

interface Props {
  activeStatus?: string
  activeDate?: string
}

export function BookingFilters({ activeStatus, activeDate }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const setFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams()
    if (activeStatus) params.set('status', activeStatus)
    if (activeDate) params.set('date', activeDate)

    if (value) params.set(key, value)
    else params.delete(key)

    router.push(`${pathname}?${params}`)
  }

  const dateLabel = activeDate
    ? format(parseISO(activeDate + 'T12:00:00'), 'd MMMM yyyy', { locale: fr })
    : null

  return (
    <div className="space-y-2">
      {/* Filtre statut */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilter('status', null)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            !activeStatus ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tous
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter('status', s)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeStatus === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {BOOKING_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Filtre date — picker stylisé */}
      <div className="flex items-center gap-2">
        <label className={`relative flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition-colors ${
          activeDate ? 'border-[#E85D04] bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'
        }`}>
          <CalendarDays className={`h-4 w-4 shrink-0 ${activeDate ? 'text-[#E85D04]' : 'text-gray-400'}`} />
          <span className={`text-sm font-medium ${activeDate ? 'text-[#E85D04]' : 'text-gray-500'}`}>
            {dateLabel ?? 'Filtrer par date'}
          </span>
          <input
            type="date"
            value={activeDate ?? ''}
            onChange={(e) => setFilter('date', e.target.value || null)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full"
          />
        </label>
        {activeDate && (
          <button
            onClick={() => setFilter('date', null)}
            className="flex items-center justify-center h-8 w-8 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
