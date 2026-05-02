'use client'

import { useState } from 'react'
import { updateSalon } from '@/lib/actions/settings'
import { DAYS_OF_WEEK } from '@/constants'
import toast from 'react-hot-toast'
import type { OpeningHours, DayHours } from '@/types'

interface Props {
  initialHours: OpeningHours
}

export function OpeningHoursForm({ initialHours }: Props) {
  const [hours, setHours] = useState<OpeningHours>(initialHours)
  const [saving, setSaving] = useState(false)

  const update = (day: string, patch: Partial<DayHours>) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...((prev as Record<string, DayHours>)[day] ?? { open: '09:00', close: '19:00', closed: false }), ...patch },
    }))
  }

  async function handleSave() {
    setSaving(true)
    const result = await updateSalon({ opening_hours: hours })
    if ('error' in result) {
      toast.error(result.error ?? 'Erreur')
    } else {
      toast.success('Horaires enregistrés ✓')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      {DAYS_OF_WEEK.map(({ key, label }) => {
        const day = (hours as Record<string, DayHours>)[key] ?? { open: '09:00', close: '19:00', closed: false }
        return (
          <div key={key} className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${day.closed ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'}`}>
            {/* Toggle closed */}
            <button
              type="button"
              onClick={() => update(key, { closed: !day.closed })}
              className={`relative h-5 w-9 rounded-full shrink-0 transition-colors ${day.closed ? 'bg-gray-300' : 'bg-[#E85D04]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${day.closed ? '' : 'translate-x-4'}`} />
            </button>

            {/* Jour */}
            <p className={`w-20 text-sm font-medium shrink-0 ${day.closed ? 'text-gray-400' : 'text-gray-900'}`}>{label}</p>

            {day.closed ? (
              <p className="text-xs text-gray-400 italic">Fermé</p>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={day.open}
                  onChange={e => update(key, { open: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-[#E85D04]"
                />
                <span className="text-xs text-gray-400">–</span>
                <input
                  type="time"
                  value={day.close}
                  onChange={e => update(key, { close: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-[#E85D04]"
                />
              </div>
            )}
          </div>
        )
      })}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-[#E85D04] py-3 text-sm font-semibold text-white disabled:opacity-60 transition-opacity mt-2"
      >
        {saving ? 'Enregistrement...' : 'Sauvegarder les horaires'}
      </button>
    </div>
  )
}
