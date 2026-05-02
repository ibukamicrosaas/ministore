'use client'

import { useState } from 'react'
import { createBlockedSlot, deleteBlockedSlot } from '@/lib/actions/blocked-slots'
import { Lock, Trash2, X, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { BlockedSlot } from '@/types'

interface Props {
  dateStr: string
  blockedSlots: BlockedSlot[]
}

export function BlockSlotForm({ dateStr, blockedSlots }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [start, setStart] = useState('09:00')
  const [end, setEnd]     = useState('10:00')
  const [reason, setReason] = useState('')

  async function handleCreate() {
    setSaving(true)
    const result = await createBlockedSlot({ blocked_date: dateStr, start_time: start, end_time: end, reason: reason || undefined })
    if ('error' in result) {
      toast.error(result.error ?? 'Erreur')
    } else {
      toast.success('Créneau bloqué ✓')
      setOpen(false)
      setReason('')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const result = await deleteBlockedSlot(id)
    if ('error' in result) toast.error(result.error ?? 'Erreur')
    else toast.success('Blocage supprimé')
  }

  const dayLabel = format(parseISO(dateStr + 'T12:00:00'), 'd MMMM', { locale: fr })
  const daySlots = blockedSlots.filter(s => s.blocked_date === dateStr)

  return (
    <div>
      {/* Créneaux bloqués du jour */}
      {daySlots.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {daySlots.map(slot => (
            <div key={slot.id} className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
              <Lock className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <p className="flex-1 text-xs text-red-700">
                {slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}
                {slot.reason && ` · ${slot.reason}`}
              </p>
              <button onClick={() => handleDelete(slot.id)} className="text-red-400 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bouton ouvrir */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors w-full justify-center"
        >
          <Lock className="h-3.5 w-3.5" />
          Bloquer un créneau le {dayLabel}
        </button>
      ) : (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-red-700">Bloquer un créneau</p>
            <button onClick={() => setOpen(false)}><X className="h-4 w-4 text-red-400" /></button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">De</label>
              <input type="time" value={start} onChange={e => setStart(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-red-400" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">À</label>
              <input type="time" value={end} onChange={e => setEnd(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-red-400" />
            </div>
          </div>

          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Raison (optionnel) — déjeuner, congé..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400"
          />

          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full rounded-lg bg-red-500 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Blocage...' : 'Confirmer le blocage'}
          </button>
        </div>
      )}
    </div>
  )
}
