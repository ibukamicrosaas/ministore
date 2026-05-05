'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { verifySubscriptionPayment } from './actions'

interface PaymentVerifierProps {
  activatedPlan: string
}

export function PaymentVerifier({ activatedPlan }: PaymentVerifierProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'activated' | 'pending' | 'error' | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const txn  = sessionStorage.getItem('pending_sub_txn')
    const plan = sessionStorage.getItem('pending_sub_plan')

    if (!txn || plan !== activatedPlan) return

    setStatus('verifying')

    verifySubscriptionPayment(txn, activatedPlan).then(result => {
      sessionStorage.removeItem('pending_sub_txn')
      sessionStorage.removeItem('pending_sub_plan')

      if (result.success) {
        setStatus('activated')
        // Recharger la page après 2s pour que le plan affiché soit à jour
        setTimeout(() => router.refresh(), 2000)
      } else if (result.error === 'Paiement non encore confirmé') {
        setStatus('pending')
      } else {
        setStatus('error')
        setErrorMsg(result.error ?? 'Erreur inconnue')
      }
    })
  }, [activatedPlan, router])

  if (status === 'verifying') {
    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 flex items-center gap-3">
        <Loader2 className="h-5 w-5 text-sky-500 shrink-0 animate-spin" />
        <p className="text-sm font-medium text-sky-700">Vérification du paiement en cours…</p>
      </div>
    )
  }

  if (status === 'activated') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-700">Paiement confirmé — ton site est maintenant actif !</p>
          <p className="text-xs text-green-600 mt-0.5">Actualisation en cours…</p>
        </div>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <Loader2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 animate-spin" />
        <div>
          <p className="text-sm font-semibold text-amber-700">Paiement en attente de confirmation</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Le paiement est en cours de traitement. Ton site sera activé automatiquement dans quelques minutes.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-700">Impossible de vérifier le paiement</p>
          <p className="text-xs text-red-600 mt-0.5">
            {errorMsg} — Si tu as bien payé, contacte le support.
          </p>
        </div>
      </div>
    )
  }

  return null
}
