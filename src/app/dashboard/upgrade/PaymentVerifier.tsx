'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { verifySubscriptionPayment, pollShopActivation } from './actions'

interface PaymentVerifierProps {
  activatedPlan: string
  shopIsActive: boolean
}

export function PaymentVerifier({ activatedPlan, shopIsActive }: PaymentVerifierProps) {
  const [status, setStatus] = useState<'verifying' | 'activated' | 'pending' | 'error' | null>(
    shopIsActive ? 'activated' : null
  )
  const [retrying, setRetrying]   = useState(false)
  const pollRef                   = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptsRef               = useRef(0)
  const MAX_ATTEMPTS              = 100 // 100 × 3s = 5 min

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
    // Rechargement complet pour garantir que tous les caches serveur sont invalidés
    setTimeout(() => window.location.replace('/dashboard'), 2000)
  }

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

  useEffect(() => {
    if (shopIsActive) {
      sessionStorage.removeItem('pending_sub_txn')
      sessionStorage.removeItem('pending_sub_plan')
      setTimeout(() => window.location.replace('/dashboard'), 2000)
      return
    }

    const txn  = sessionStorage.getItem('pending_sub_txn')
    const plan = sessionStorage.getItem('pending_sub_plan')

    setStatus('verifying')

    if (txn && plan === activatedPlan) {
      verifySubscriptionPayment(txn, activatedPlan).then(result => {
        if (result.success) {
          onActivated()
          return
        }
        startPolling()
      })
      return
    }

    startPolling()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => stopPolling(), [])

  async function handleManualRetry() {
    setRetrying(true)
    const txn  = sessionStorage.getItem('pending_sub_txn')
    const plan = sessionStorage.getItem('pending_sub_plan') ?? activatedPlan

    // Essai via l'API Bictorys si on a le txn, sinon polling DB direct
    if (txn && plan === activatedPlan) {
      const result = await verifySubscriptionPayment(txn, activatedPlan)
      if (result.success) {
        onActivated()
        setRetrying(false)
        return
      }
    }

    // Fallback : vérifier si le webhook a activé entre-temps
    const { isActive } = await pollShopActivation()
    if (isActive) {
      onActivated()
    } else {
      setStatus('verifying')
      startPolling()
    }
    setRetrying(false)
  }

  if (status === 'activated' || shopIsActive) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-700">Paiement confirmé — ton site est maintenant actif !</p>
          <p className="text-xs text-green-600 mt-0.5">Redirection vers le tableau de bord…</p>
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
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Activation en attente</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Ton paiement a bien été reçu par Bictorys. L&apos;activation peut prendre quelques instants.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleManualRetry}
            disabled={retrying}
            className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Vérification…' : 'Vérifier à nouveau'}
          </button>
          <a
            href="https://wa.me/221781362728"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-white border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
          >
            Contacter le support
          </a>
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
            Actualise la page ou{' '}
            <a href="https://wa.me/221781362728" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
              contacte le support
            </a>
            {' '}avec ta preuve de paiement.
          </p>
        </div>
      </div>
    )
  }

  return null
}
