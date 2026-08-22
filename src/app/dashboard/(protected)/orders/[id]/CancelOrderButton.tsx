'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { cancelOrder } from '@/lib/actions/orders'

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router              = useRouter()
  const [open, setOpen]     = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    setLoading(true)
    const result = await cancelOrder(orderId, reason)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Commande annulée.')
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
      >
        Annuler
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Annuler la commande ?</p>
                <p className="text-xs text-gray-500 mt-0.5">Le client recevra un SMS de notification.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Motif d'annulation <span className="text-gray-400">(optionnel)</span>
              </label>
              <input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ex : rupture de stock, problème de livraison..."
                maxLength={200}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-300 transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setOpen(false); setReason('') }}
                disabled={loading}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Conserver
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Annulation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
