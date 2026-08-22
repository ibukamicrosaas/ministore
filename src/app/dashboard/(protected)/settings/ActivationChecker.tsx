'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { pollShopActivation, verifySubscriptionPayment } from '../../upgrade/actions'

export function ActivationChecker() {
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [notFound, setNotFound] = useState(false)

  async function handleCheck() {
    setChecking(true)
    setNotFound(false)

    // Lire les cookies depuis le navigateur
    const txnCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('pending_sub_txn='))
      ?.split('=')[1]
    const planCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('pending_sub_plan='))
      ?.split('=')[1]

    // Si les cookies existent, vérifier via l'API Bictorys
    if (txnCookie && planCookie) {
      const result = await verifySubscriptionPayment(txnCookie, planCookie)
      if (result.success) {
        router.refresh()
        return
      }
    }

    // Fallback : vérifier juste si la boutique est active
    const { isActive } = await pollShopActivation()
    if (isActive) {
      router.refresh()
    } else {
      setChecking(false)
      setNotFound(true)
    }
  }

  if (checking) {
    return (
      <span className="inline-flex items-center gap-1 mt-2 text-xs text-orange-500">
        <Loader2 className="h-3 w-3 animate-spin" /> Vérification…
      </span>
    )
  }

  if (notFound) {
    return (
      <span className="block mt-2 text-xs text-orange-500">
        Paiement non trouvé.{' '}
        <a href="/dashboard/upgrade" className="underline font-medium">Réessayer</a>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleCheck}
      className="inline-flex items-center gap-1 mt-1 text-xs text-orange-500 underline hover:text-orange-700 transition-colors"
    >
      <CheckCircle2 className="h-3 w-3" />
      J&apos;ai déjà payé — vérifier l&apos;activation
    </button>
  )
}
