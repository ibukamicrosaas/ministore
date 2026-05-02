'use client'

import { useState } from 'react'
import { ArrowDownToLine, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  salonId: string
  availableBalance: number
  waveNumber: string | null
  omNumber: string | null
  canRequest: boolean
  minAmount: number
}

export function RequestPayoutButton({ salonId, availableBalance, waveNumber, omNumber, canRequest, minAmount }: Props) {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState<'wave' | 'orange_money'>(waveNumber ? 'wave' : 'orange_money')
  const [loading, setLoading] = useState(false)

  const selectedNumber = method === 'wave' ? waveNumber : omNumber

  async function handleRequest() {
    if (!selectedNumber) return
    setLoading(true)
    try {
      const res = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salonId, method, amount: availableBalance }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !data.success) {
        toast.error(data.error ?? 'Erreur lors de la demande')
        return
      }
      toast.success('Demande de retrait envoyée ✓')
      setOpen(false)
      window.location.reload()
    } catch {
      toast.error('Erreur réseau, réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!canRequest}
        className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 active:opacity-80 transition-opacity shrink-0"
      >
        <ArrowDownToLine className="h-4 w-4" />
        Retirer
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Retirer mes fonds</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-500">Montant à retirer</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {availableBalance.toLocaleString('fr-FR')} FCFA
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">Méthode de retrait</p>
              {waveNumber && (
                <button
                  onClick={() => setMethod('wave')}
                  className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-colors ${method === 'wave' ? 'border-[var(--color-primary)] bg-orange-50' : 'border-gray-200'}`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Wave</p>
                    <p className="text-xs text-gray-500">{waveNumber}</p>
                  </div>
                  {method === 'wave' && (
                    <div className="h-5 w-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              )}
              {omNumber && (
                <button
                  onClick={() => setMethod('orange_money')}
                  className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-colors ${method === 'orange_money' ? 'border-[var(--color-primary)] bg-orange-50' : 'border-gray-200'}`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Orange Money</p>
                    <p className="text-xs text-gray-500">{omNumber}</p>
                  </div>
                  {method === 'orange_money' && (
                    <div className="h-5 w-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              )}
            </div>

            <button
              onClick={handleRequest}
              disabled={loading || !selectedNumber}
              className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60 active:opacity-80 transition-opacity"
            >
              {loading ? 'Traitement...' : 'Confirmer le retrait'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Le transfert sera effectué dans les 24 à 48 heures ouvrables.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
