'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Truck } from 'lucide-react'

interface Props {
  deliveryToken: string
  primaryColor: string
}

export function DeliveryConfirmButton({ deliveryToken, primaryColor }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleConfirm() {
    setState('loading')
    try {
      const res = await fetch('/api/delivery/confirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ delivery_token: deliveryToken }),
      })
      const data = await res.json() as { ok?: boolean; already?: boolean; error?: string }
      if (data.ok) {
        setState('done')
      } else {
        setErrorMsg(data.error ?? 'Erreur inconnue.')
        setState('error')
      }
    } catch {
      setErrorMsg('Erreur réseau. Vérifie ta connexion et réessaie.')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <p className="text-base font-bold text-green-800">Livraison confirmée !</p>
          <p className="text-sm text-green-600 mt-0.5">Ta confirmation a bien été enregistrée.</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
        <button
          onClick={() => setState('idle')}
          className="w-full rounded-2xl border border-gray-200 py-3 text-sm font-medium text-gray-700"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={state === 'loading'}
      className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-bold text-white transition-opacity disabled:opacity-60 active:scale-[.98]"
      style={{ backgroundColor: primaryColor }}
    >
      {state === 'loading' ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Truck className="h-5 w-5" />
      )}
      {state === 'loading' ? 'Confirmation…' : 'Livraison effectuée'}
    </button>
  )
}
