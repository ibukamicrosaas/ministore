'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
  payoutId: string
  cmName: string
  reference: string
  setReference: (v: string) => void
}

export function MarkCMPayoutDoneButton({ payoutId, cmName, reference, setReference }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleMark() {
    if (!confirm(`Confirmer le virement à ${cmName} ?\nRéférence : ${reference || '(aucune)'}`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/cm-payouts/${payoutId}/complete`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ adminReference: reference }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !data.success) { toast.error(data.error ?? 'Erreur'); return }
      toast.success('Reversement CM marqué comme effectué ✓')
      router.refresh()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <input
        type="text"
        value={reference}
        onChange={e => setReference(e.target.value)}
        placeholder="Réf. de transaction (optionnel)"
        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-sky-400 outline-none"
      />
      <button
        onClick={handleMark}
        disabled={loading}
        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60 transition-colors"
      >
        {loading ? '…' : 'Confirmer envoi'}
      </button>
    </div>
  )
}
