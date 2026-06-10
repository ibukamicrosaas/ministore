'use client'

import { useState, useTransition } from 'react'
import { cancelSubscription, revertCancellation } from '@/lib/actions/account'
import { AlertTriangle, Undo2, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  cancelAtPeriodEnd: boolean
  expiresAt: string | null
}

export function CancelSubscriptionButton({ cancelAtPeriodEnd, expiresAt }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelSubscription()
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Annulation programmée. Ton accès reste actif jusqu\'à la fin de la période.')
        setOpen(false)
      }
    })
  }

  function handleRevert() {
    startTransition(async () => {
      const result = await revertCancellation()
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Annulation annulée. Ton abonnement continue normalement.')
      }
    })
  }

  if (cancelAtPeriodEnd) {
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-200 px-3 py-2.5 text-sm text-orange-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Annulation programmée
            {expiryLabel ? ` — accès jusqu'au ${expiryLabel}` : ''}.
          </span>
        </div>
        <button
          onClick={handleRevert}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Undo2 className="h-4 w-4" />
          {pending ? 'Chargement…' : 'Rétablir l\'abonnement'}
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors"
      >
        Annuler l&apos;abonnement
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Annuler l&apos;abonnement</h2>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-600">
                Tu conserveras l&apos;accès à toutes tes fonctionnalités payantes jusqu&apos;à la fin de ta période en cours
                {expiryLabel ? <strong> ({expiryLabel})</strong> : ''}.
              </p>
              <p className="text-sm text-gray-600">
                Passé cette date, ta boutique repassera en mode Essai et sera suspendue.
              </p>
              <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                Tu pourras rétablir ton abonnement à tout moment avant l&apos;expiration.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Garder mon abonnement
              </button>
              <button
                onClick={handleCancel}
                disabled={pending}
                className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {pending ? 'Chargement…' : 'Confirmer l\'annulation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
