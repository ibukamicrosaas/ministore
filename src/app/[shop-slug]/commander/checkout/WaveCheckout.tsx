'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

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
  country: 'SN' | 'CI'
}

export function WaveCheckout({
  orderId,
  shopSlug,
  customerPhone,
  amount,
  shopName,
  shopLogo,
  primaryColor,
  country,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'initiated' | 'waiting' | 'verifying' | 'success' | 'failed'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    initiateWavePayment()
  }, [])

  async function initiateWavePayment() {
    try {
      setStatus('initiated')

      // Créer une URL de deep link Wave
      const waveDeepLink = generateWaveDeepLink(customerPhone, amount, country)

      // Enregistrer la tentative de paiement
      const response = await fetch('/api/orders/wave-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerPhone,
          amount,
          method: 'wave',
        }),
      })

      if (!response.ok) {
        throw new Error('Impossible de créer le paiement Wave')
      }

      setStatus('waiting')

      // Lancer le deep link Wave
      if (country === 'SN') {
        // Sénégal: USSD
        window.location.href = `tel:${waveDeepLink}`
      } else {
        // Côte d'Ivoire: Deep link
        window.location.href = waveDeepLink
      }

      // Attendre la confirmation (polling toutes les 2 secondes)
      const maxAttempts = 30 // 60 secondes
      let attempts = 0

      const pollInterval = setInterval(async () => {
        attempts++
        setStatus('verifying')

        try {
          const verifyRes = await fetch(
            `/api/orders/${orderId}/verify-payment?method=wave`
          )
          const verifyData = (await verifyRes.json()) as {
            confirmed: boolean
            error?: string
          }

          if (verifyData.confirmed) {
            clearInterval(pollInterval)
            setStatus('success')
            // Rediriger vers la page success
            setTimeout(() => {
              router.push(
                `/${shopSlug}/commander/success?order_id=${orderId}`
              )
            }, 1500)
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            setStatus('waiting')
          }
        } catch (err) {
          console.error('Erreur lors de la vérification:', err)
        }
      }, 2000)

      // Nettoyer l'intervalle au démontage
      return () => clearInterval(pollInterval)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setErrorMessage(message)
      setStatus('failed')
      toast.error(message)
    }
  }

  function generateWaveDeepLink(phone: string, amount: number, country: string): string {
    const cleanPhone = phone.replace(/\D/g, '')

    if (country === 'SN') {
      // Sénégal: USSD - appel spécial
      return `*384*${amount}#`
    } else {
      // Côte d'Ivoire: Deep link HTTP
      return `https://pay.wave.mobi/?amount=${amount}&phone=${cleanPhone}`
    }
  }

  const statusMessages = {
    loading: {
      icon: '⏳',
      title: 'Préparation du paiement',
      description: 'Vérification de vos informations...',
    },
    initiated: {
      icon: '🌊',
      title: 'Paiement Wave initié',
      description: 'Ouverture de Wave Money...',
    },
    waiting: {
      icon: '⏱️',
      title: 'En attente de confirmation',
      description: 'Complétez le paiement dans Wave Money',
    },
    verifying: {
      icon: '✓',
      title: 'Vérification du paiement',
      description: 'Nous vérifions votre transaction...',
    },
    success: {
      icon: '✅',
      title: 'Paiement reçu!',
      description: 'Votre commande est confirmée',
    },
    failed: {
      icon: '❌',
      title: 'Erreur lors du paiement',
      description: errorMessage || 'Une erreur est survenue',
    },
  }

  const current = statusMessages[status]

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center px-4 text-center pb-10">
      <div className="text-6xl mb-6">{current.icon}</div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{current.title}</h1>
      <p className="text-sm text-gray-500 mb-8 max-w-xs">{current.description}</p>

      {status === 'waiting' && (
        <button
          onClick={() => {
            // Relancer le paiement
            initiateWavePayment()
          }}
          className="rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors"
        >
          Relancer le paiement
        </button>
      )}

      {status === 'failed' && (
        <div className="space-y-3">
          <button
            onClick={() => {
              setStatus('loading')
              initiateWavePayment()
            }}
            className="w-full rounded-xl px-6 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Réessayer
          </button>
          <a
            href={`/${shopSlug}/commander`}
            className="block rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors"
          >
            Retour à la commande
          </a>
        </div>
      )}

      {(status === 'loading' || status === 'initiated' || status === 'verifying') && (
        <div className="mt-6">
          <div className="inline-block">
            <div
              className="h-2 w-2 rounded-full mb-2"
              style={{
                backgroundColor: primaryColor,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
