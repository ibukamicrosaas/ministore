'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TimeSlot {
  time: string
  isAvailable: boolean
}

interface Props {
  salonSlug: string
  serviceId: string
  availableDays: string[]
  onSelect: (date: string, time: string) => void
}

function buildCalendarWeeks(year: number, month: number, availableDays: Set<string>): (string | null)[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // lundi = 0

  const weeks: (string | null)[][] = []
  let week: (string | null)[] = Array(startDow).fill(null)

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    week.push(availableDays.has(dateStr) ? dateStr : null)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  return weeks
}

export function DateTimePicker({ salonSlug, serviceId, availableDays, onSelect }: Props) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const availableSet = new Set(availableDays)
  const weeks = buildCalendarWeeks(viewYear, viewMonth, availableSet)

  const fetchSlots = useCallback(async (date: string) => {
    setLoadingSlots(true)
    setSlots([])
    try {
      const res = await fetch(`/api/salons/${salonSlug}/availability?date=${date}&serviceId=${serviceId}`)
      const json = await res.json() as { slots?: TimeSlot[] }
      setSlots(json.slots ?? [])
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [salonSlug, serviceId])

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate)
  }, [selectedDate, fetchSlots])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    if (selectedDate) onSelect(selectedDate, time)
  }

  return (
    <div className="space-y-6">
      {/* Calendrier */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-gray-900 capitalize">
            {format(new Date(viewYear, viewMonth, 1), 'MMMM yyyy', { locale: fr })}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <div key={i} className="text-[10px] font-medium text-gray-400 py-1">{d}</div>
          ))}
          {weeks.flatMap((week, wi) =>
            week.map((day, di) => {
              if (!day) return <div key={`${wi}-${di}`} />
              const isAvailable = availableSet.has(day)
              const isSelected = selectedDate === day
              const isPast = day < format(today, 'yyyy-MM-dd')

              return (
                <button
                  key={day}
                  disabled={!isAvailable || isPast}
                  onClick={() => { setSelectedDate(day); setSelectedTime(null) }}
                  className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-[var(--color-primary)] text-white'
                      : isAvailable && !isPast
                      ? 'hover:bg-orange-50 text-gray-900'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {parseISO(day).getDate()}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Créneaux horaires */}
      {selectedDate && (
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-3">
            Créneaux disponibles · {format(parseISO(selectedDate + 'T12:00:00'), 'EEEE d MMMM', { locale: fr })}
          </p>

          {loadingSlots ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Aucun créneau disponible ce jour.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  disabled={!slot.isAvailable}
                  onClick={() => handleTimeSelect(slot.time)}
                  className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                    selectedTime === slot.time
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                      : slot.isAvailable
                      ? 'border-gray-200 text-gray-900 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                      : 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
