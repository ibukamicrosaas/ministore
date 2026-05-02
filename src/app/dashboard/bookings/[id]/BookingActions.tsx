'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { updateBookingStatus } from '@/lib/actions/bookings'

interface Props {
  bookingId: string
  currentStatus: string
}

type Action = {
  label: string
  status: 'confirmed' | 'present' | 'completed' | 'cancelled' | 'no_show'
  variant: 'primary' | 'secondary' | 'danger'
}

const ACTIONS_BY_STATUS: Record<string, Action[]> = {
  pending: [
    { label: 'Confirmer', status: 'confirmed', variant: 'primary' },
    { label: 'Annuler', status: 'cancelled', variant: 'danger' },
  ],
  confirmed: [
    { label: 'Marquer présente', status: 'present', variant: 'primary' },
    { label: 'No-show', status: 'no_show', variant: 'secondary' },
    { label: 'Annuler', status: 'cancelled', variant: 'danger' },
  ],
  present: [
    { label: 'Terminer la prestation', status: 'completed', variant: 'primary' },
    { label: 'Annuler', status: 'cancelled', variant: 'danger' },
  ],
}

export function BookingActions({ bookingId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const actions = ACTIONS_BY_STATUS[currentStatus] ?? []

  if (!actions.length) return null

  const handleAction = async (action: Action) => {
    setLoading(action.status)
    const result = await updateBookingStatus(bookingId, action.status, {
      cancellationReason: action.status === 'cancelled' ? 'Annulée par le salon' : undefined,
    })

    if ('error' in result) {
      toast.error(result.error ?? 'Erreur')
    } else {
      toast.success(
        action.status === 'completed' ? 'Prestation terminée !' :
        action.status === 'present' ? 'Cliente marquée présente' :
        action.status === 'confirmed' ? 'Réservation confirmée' :
        action.status === 'cancelled' ? 'Réservation annulée' :
        action.status === 'no_show' ? 'No-show enregistré' : 'Mis à jour'
      )
      router.refresh()
    }
    setLoading(null)
  }

  return (
    <div className="space-y-2 pt-2">
      {actions.map((action) => (
        <button
          key={action.status}
          onClick={() => handleAction(action)}
          disabled={loading !== null}
          className={`w-full rounded-xl py-3 text-sm font-semibold transition-opacity disabled:opacity-60 ${
            action.variant === 'primary'
              ? 'bg-[#E85D04] text-white'
              : action.variant === 'danger'
              ? 'border border-red-200 text-red-600 hover:bg-red-50'
              : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {loading === action.status ? 'Traitement...' : action.label}
        </button>
      ))}
    </div>
  )
}
