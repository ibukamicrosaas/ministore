'use client'

import { useState } from 'react'
import { ArrowDownToLine, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'

export interface PayoutOption {
  label:   string
  key:     string
  number:  string
  feeRate: number | null
}

interface Props {
  shopId:          string
  availableBalance: number
  payoutMethods:   PayoutOption[]
  currency:        ShopCurrency
  canRequest:      boolean
  minAmount:       number
}

export function RequestPayoutButton({ shopId, availableBalance, payoutMethods, currency, canRequest, minAmount }: Props) {
  const [open, setOpen]     = useState(false)
  const [method, setMethod] = useState<string>(payoutMethods[0]?.key ?? '')
  const [loading, setLoading] = useState(false)

  const selected = payoutMethods.find(m => m.key === method) ?? payoutMethods[0]

  async function handleRequest() {
    if (!selected?.number) return
    setLoading(true)
    try {
      const res = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: selected.key }),
      })
      const data = await res.json() as { success?: boolean; auto?: boolean; error?: string }
      if (!res.ok || !data.success) {
        toast.error(data.error ?? 'Erreur lors de la demande')
        return
      }
      toast.success(data.auto ? 'Retrait effectué ✓' : 'Demande de retrait envoyée ✓')
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
              <p className="text-xs text-gray-500">Solde avant frais de retrait</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {formatPrice(availableBalance, currency)}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">Méthode de retrait</p>
              {payoutMethods.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-colors ${method === m.key ? 'border-[var(--color-primary)] bg-orange-50' : 'border-gray-200'}`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {m.feeRate === null ? 'Frais à confirmer' : `Frais ${m.feeRate}%`}
                    </span>
                    {method === m.key && (
                      <div className="h-5 w-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selected && (
              selected.feeRate === null ? (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  Les frais de retrait pour cette méthode ne sont pas encore confirmés — contacte le support avant de retirer.
                </p>
              ) : (
                <div className="rounded-xl border border-gray-100 p-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Frais de retrait Bictorys ({selected.feeRate}%)</span>
                    <span className="font-medium text-red-500">
                      − {formatPrice(Math.round(availableBalance * (selected.feeRate / 100)), currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-100 pt-1.5">
                    <span className="font-semibold text-gray-900">Tu recevras</span>
                    <span className="font-bold text-gray-900">
                      {formatPrice(availableBalance - Math.round(availableBalance * (selected.feeRate / 100)), currency)}
                    </span>
                  </div>
                </div>
              )
            )}

            <button
              onClick={handleRequest}
              disabled={loading || !selected?.number || selected?.feeRate === null}
              className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60 active:opacity-80 transition-opacity"
            >
              {loading ? 'Traitement...' : 'Confirmer le retrait'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Le transfert mobile money est généralement instantané.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
