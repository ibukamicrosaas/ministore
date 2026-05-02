'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export function MarkPayoutDoneButton({ payoutId }: { payoutId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleMark() {
    if (!confirm('Marquer ce reversement comme effectué ?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/payouts/${payoutId}/complete`, { method: 'POST' })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !data.success) {
        toast.error(data.error ?? 'Erreur')
        return
      }
      toast.success('Reversement marqué comme effectué')
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
      className="mt-2 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
    >
      {loading ? '...' : 'Marquer effectué'}
    </button>
  )
}
