import { getWeek, getYear, startOfWeek, endOfWeek, addWeeks, format } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface WeekOption {
  weekNumber: number
  year: number
  label: string
  startDate: string
  endDate: string
}

export function getWeekOptions(count = 8): WeekOption[] {
  const options: WeekOption[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const date = addWeeks(now, -i)
    const weekNumber = getWeek(date, { weekStartsOn: 1 })
    const year = getYear(date)
    const start = startOfWeek(date, { weekStartsOn: 1 })
    const end = endOfWeek(date, { weekStartsOn: 1 })

    options.push({
      weekNumber,
      year,
      label:
        i === 0
          ? `Cette semaine (S${weekNumber})`
          : i === 1
          ? `Semaine dernière (S${weekNumber})`
          : `S${weekNumber} — ${format(start, 'd MMM', { locale: fr })} au ${format(end, 'd MMM', { locale: fr })}`,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    })
  }

  return options
}
