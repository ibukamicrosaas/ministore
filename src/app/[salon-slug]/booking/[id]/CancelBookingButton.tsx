'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
  bookingId: string
  salonSlug: string
  token: string
}

export function CancelBookingButton({ bookingId, salonSlug, token }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleCancel = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, cancelledBy: 'client' }),
      })

      const data = await res.json() as { error?: string }

      if (!res.ok) {
        toast.error(data.error ?? 'Impossible d\'annuler la réservation')
        return
      }

      toast.success('Réservation annulée')
      router.refresh()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-center text-gray-600">Confirmer l'annulation ?</p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700"
          >
            Retour
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Annulation...' : 'Confirmer'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
    >
      Annuler ma réservation
    </button>
  )
}
