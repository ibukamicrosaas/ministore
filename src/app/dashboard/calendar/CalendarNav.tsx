'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  dateStr: string
}

export function CalendarNav({ dateStr }: Props) {
  const router = useRouter()
  const date = parseISO(dateStr + 'T12:00:00')

  const go = (d: Date) => router.push(`/dashboard/calendar?date=${format(d, 'yyyy-MM-dd')}`)

  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => go(subDays(date, 1))}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <ChevronLeft className="h-4 w-4 text-gray-600" />
      </button>

      <div className="flex-1 text-center">
        <p className="text-sm font-semibold text-gray-900 capitalize">
          {format(date, 'EEEE d MMMM', { locale: fr })}
        </p>
        {isToday && (
          <p className="text-xs text-[#E85D04] font-medium">Aujourd'hui</p>
        )}
      </div>

      <button
        onClick={() => go(addDays(date, 1))}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <ChevronRight className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  )
}
