'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  orderId: string
  shopSlug: string
  customerName: string
  customerPhone: string
  amount: number
  shopName: string
  shopLogo: string | null
  primaryColor: string
  isDeposit: boolean
}

export function BictorysCheckout({
  orderId,
  shopSlug,
  amount,
  shopName,
  shopLogo,
  primaryColor,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    initiateBictorysPayment()
  }, [])

  async function initiateBictorysPayment() {
    try {
      setStatus('loading')

      // Créer une session de paiement Bictorys
      const response = await fetch('/api/orders/bictorys-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount,
        }),
      })

      if (!response.ok) {
        throw new Error('Impossible de créer la session Bictorys')
      }

      const data = (await response.json()) as { checkoutUrl?: string }

      if (data.checkoutUrl) {
        setStatus('redirecting')
        // Rediriger vers Bictorys
        window.location.href = data.checkoutUrl
      } else {
        throw new Error('URL de paiement manquante')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      setStatus('error')
    }
  }

  if (status === 'error') {
    return (
      <div className="max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center px-4 text-center pb-10">
        <div className="text-6xl mb-6">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
        <p className="text-sm text-gray-500 mb-8">{error}</p>

        <div className="space-y-3">
          <button
            onClick={() => {
              setStatus('loading')
              setError('')
              initiateBictorysPayment()
            }}
            className="w-full py-3 px-4 rounded-2xl font-semibold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Réessayer
          </button>
          <a
            href={`/${shopSlug}/commander`}
            className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors"
          >
            Retour à la commande
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center px-4 text-center pb-10">
      <div className="text-6xl mb-6">⏳</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {status === 'redirecting' ? 'Redirection vers le paiement' : 'Préparation...'}
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        {status === 'redirecting'
          ? 'Vous êtes redirigé vers Bictorys...'
          : 'Initialisation de la session de paiement...'}
      </p>

      <div className="mb-6">
        <div className="inline-block">
          <div
            className="h-3 w-3 rounded-full mb-2"
            style={{
              backgroundColor: primaryColor,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <div
        className="inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: primaryColor }}
      >
        {amount.toLocaleString('fr-FR')} FCFA
      </div>
    </div>
  )
}
