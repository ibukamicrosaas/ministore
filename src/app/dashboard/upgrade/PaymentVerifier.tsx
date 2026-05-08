'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { verifySubscriptionPayment, pollShopActivation } from './actions'

interface PaymentVerifierProps {
  activatedPlan: string
  shopIsActive: boolean
}

export function PaymentVerifier({ activatedPlan, shopIsActive }: PaymentVerifierProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'activated' | 'pending' | 'error' | null>(
    shopIsActive ? 'activated' : null
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptsRef = useRef(0)
  const MAX_ATTEMPTS = 20 // 20 × 3s = 60s max

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function onActivated() {
    stopPolling()
    sessionStorage.removeItem('pending_sub_txn')
    sessionStorage.removeItem('pending_sub_plan')
    setStatus('activated')
    setTimeout(() => router.refresh(), 2000)
  }

  useEffect(() => {
    // Déjà activé côté serveur (webhook a tiré avant le redirect)
    if (shopIsActive) {
      sessionStorage.removeItem('pending_sub_txn')
      sessionStorage.removeItem('pending_sub_plan')
      setTimeout(() => router.refresh(), 2000)
      return
    }

    const txn  = sessionStorage.getItem('pending_sub_txn')
    const plan = sessionStorage.getItem('pending_sub_plan')

    setStatus('verifying')

    // Chemin rapide : txn en sessionStorage → vérification directe Bictorys
    if (txn && plan === activatedPlan) {
      verifySubscriptionPayment(txn, activatedPlan).then(result => {
        if (result.success) {
          onActivated()
          return
        }
        // Txn existe mais paiement pas encore confirmé → basculer en polling
        startPolling()
      })
      return
    }

    // Pas de txn (redirect depuis app mobile, onglet différent, etc.) → polling direct
    startPolling()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startPolling() {
    attemptsRef.current = 0
    pollRef.current = setInterval(async () => {
      attemptsRef.current += 1
      const { isActive } = await pollShopActivation()
      if (isActive) {
        onActivated()
        return
      }
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        stopPolling()
        setStatus('pending')
      }
    }, 3000)
  }

  useEffect(() => () => stopPolling(), [])

  if (status === 'activated' || shopIsActive) {
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

  if (status === 'verifying') {
    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 flex items-center gap-3">
        <Loader2 className="h-5 w-5 text-sky-500 shrink-0 animate-spin" />
        <p className="text-sm font-medium text-sky-700">Vérification du paiement en cours…</p>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <Loader2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 animate-spin" />
        <div>
          <p className="text-sm font-semibold text-amber-700">Activation en cours de traitement</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Ton paiement a été reçu. Ton site sera activé dans les prochaines secondes. Actualise la page si ça tarde.
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
