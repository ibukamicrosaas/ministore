import type { OpeningHours } from '@/types'
import { SLOT_GRANULARITY_MINUTES } from '@/constants'

const DAY_KEYS: Record<number, keyof OpeningHours> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function getDayKey(date: Date): keyof OpeningHours {
  return DAY_KEYS[date.getDay()]
}

export function generateSlots(
  openTime: string,
  closeTime: string,
  serviceDurationMinutes: number,
): string[] {
  const start = timeToMinutes(openTime)
  const end = timeToMinutes(closeTime)
  const slots: string[] = []

  for (
    let t = start;
    t + serviceDurationMinutes <= end;
    t += SLOT_GRANULARITY_MINUTES
  ) {
    slots.push(minutesToTime(t))
  }

  return slots
}

export function isDateInPast(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dateStr) < today
}

export function getNextAvailableDays(
  openingHours: OpeningHours,
  daysAhead = 60,
): string[] {
  const days: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const key = getDayKey(d)
    const dayHours = openingHours[key]
    if (dayHours && !dayHours.closed) {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      days.push(`${yyyy}-${mm}-${dd}`)
    }
  }

  return days
}
