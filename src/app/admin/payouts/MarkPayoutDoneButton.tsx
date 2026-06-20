'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export function MarkPayoutDoneButton({ payoutId, isManual }: { payoutId: string; isManual: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleMark() {
    const msg = isManual
      ? 'Confirmez-vous avoir envoyé l\'argent manuellement via mobile money ?'
      : 'Déclencher le reversement Bictorys automatiquement ?'
    if (!confirm(msg)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/payouts/${payoutId}/complete`, { method: 'POST' })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !data.success) {
        toast.error(data.error ?? 'Erreur')
        return
      }
      toast.success(isManual ? 'Reversement manuel marqué comme effectué' : 'Reversement Bictorys envoyé ✓')
      router.refresh()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleMark}
      disabled={loading}
      className={`mt-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-60 ${
        isManual ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'
      }`}
    >
      {loading ? '...' : isManual ? 'Confirmer envoi' : 'Marquer effectué'}
    </button>
  )
}
