'use client'

import { useState } from 'react'
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
}

export function OrangeMoneyCheckout({
  orderId,
  shopSlug,
  customerPhone,
  amount,
  shopName,
  shopLogo,
  primaryColor,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<'init' | 'waiting_otp' | 'verifying' | 'success' | 'failed'>('init')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleOrangeMoneyPayment() {
    setLoading(true)
    try {
      const response = await fetch('/api/orders/orange-money-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerPhone,
          amount,
        }),
      })

      if (!response.ok) {
        throw new Error('Impossible de créer le paiement Orange Money')
      }

      setStatus('waiting_otp')
      toast.success('Code OTP envoyé! Veuillez le saisir ci-dessous.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setErrorMessage(message)
      setStatus('failed')
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitOtp() {
    if (!otp.trim()) {
      toast.error('Veuillez entrer le code OTP')
      return
    }

    setLoading(true)
    setStatus('verifying')

    try {
      const response = await fetch('/api/orders/verify-orange-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          otp: otp.trim(),
        }),
      })

      const data = (await response.json()) as {
        confirmed: boolean
        error?: string
      }

      if (data.confirmed) {
        setStatus('success')
        toast.success('Paiement confirmé!')
        setTimeout(() => {
          router.push(`/${shopSlug}/commander/success?order_id=${orderId}`)
        }, 1500)
      } else {
        setStatus('failed')
        setErrorMessage(data.error || 'Code OTP invalide')
        toast.error(data.error || 'Code OTP invalide')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setErrorMessage(message)
      setStatus('failed')
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const statusMessages = {
    init: {
      icon: '📱',
      title: 'Orange Money (Code OTP)',
      description: 'Vous recevrez un code OTP sur votre téléphone',
    },
    waiting_otp: {
      icon: '🔐',
      title: 'Entrez le code OTP',
      description: 'Code reçu sur votre téléphone Orange',
    },
    verifying: {
      icon: '⏳',
      title: 'Vérification du code',
      description: 'Vérification en cours...',
    },
    success: {
      icon: '✅',
      title: 'Paiement confirmé!',
      description: 'Votre commande est confirmée',
    },
    failed: {
      icon: '❌',
      title: 'Erreur',
      description: errorMessage,
    },
  }

  const current = statusMessages[status]

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center px-4 pb-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{current.icon}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{current.title}</h1>
          <p className="text-sm text-gray-500">{current.description}</p>
        </div>

        {/* Afficher le montant */}
        <div
          className="inline-flex w-full rounded-2xl px-4 py-3 text-center font-bold text-white mb-8 justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          {amount.toLocaleString('fr-FR')} FCFA
        </div>

        {status === 'init' && (
          <button
            onClick={handleOrangeMoneyPayment}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl font-semibold text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? 'Chargement...' : 'Demander le code OTP'}
          </button>
        )}

        {status === 'waiting_otp' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Code OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Ex: 123456"
                maxLength={6}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg font-bold tracking-widest outline-none focus:border-gray-300"
              />
              <p className="text-xs text-gray-500 mt-2">
                Code reçu sur votre numéro Orange
              </p>
            </div>

            <button
              onClick={handleSubmitOtp}
              disabled={loading || !otp}
              className="w-full py-3 px-4 rounded-2xl font-semibold text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? 'Vérification...' : 'Confirmer le paiement'}
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-3">
            <button
              onClick={() => {
                setStatus('init')
                setOtp('')
                setErrorMessage('')
              }}
              className="w-full py-3 px-4 rounded-2xl font-semibold text-white transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              Réessayer
            </button>
            <a
              href={`/${shopSlug}/commander/pay?order_id=${orderId}`}
              className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors"
            >
              Changer de méthode
            </a>
          </div>
        )}

        {(status === 'verifying' || status === 'success') && (
          <div className="text-center">
            <div
              className="h-3 w-3 rounded-full mx-auto mb-4"
              style={{
                backgroundColor: primaryColor,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
