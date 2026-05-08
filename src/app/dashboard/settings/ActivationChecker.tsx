'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { pollShopActivation } from '../upgrade/actions'

export function ActivationChecker() {
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [notFound, setNotFound] = useState(false)

  async function handleCheck() {
    setChecking(true)
    setNotFound(false)
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
