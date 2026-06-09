'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PAYMENT_METHODS_BY_COUNTRY,
  getCountryFromPhone,
  type PaymentMethod,
} from '@/lib/payments/payment-methods'
import {
  needsOtpForPayment,
  getOtpInstruction,
  normalizePhoneForBictorys,
  type BictorysCountry,
  type BictorysPaymentType,
} from '@/lib/payments/bictorys'

const PAYMENT_TYPE_MAP: Record<string, BictorysPaymentType> = {
  wave:         'wave_money',
  orange_money: 'orange_money',
  maxit:        'maxit',
  mtn_money:    'mtn_money',
  moov_money:   'moov',
}

interface Props {
  orderId: string
  shopSlug: string
  customerFirstName: string
  customerPhone: string
  amount: number
  primaryColor: string
  isDeposit: boolean
  clientToken: string
}

export function PaymentMethodSelector({
  orderId,
  shopSlug,
  customerPhone,
  customerFirstName,
  amount,
  primaryColor,
  clientToken,
}: Props) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  const normalizedPhone = normalizePhoneForBictorys(customerPhone)
  const country = (
    getCountryFromPhone(normalizedPhone) ?? getCountryFromPhone(customerPhone)
  ) as BictorysCountry | null
  const methods = country ? PAYMENT_METHODS_BY_COUNTRY[country] : []

  const paymentType = selectedMethod ? PAYMENT_TYPE_MAP[selectedMethod] : null
  const requiresOtp =
    paymentType && country ? needsOtpForPayment(country, paymentType) : false

  const successUrl = `/${shopSlug}/commander/success?order_id=${orderId}&token=${clientToken}`

  const checkPaymentStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/verify-payment?method=poll`)
      const data = (await res.json()) as { confirmed?: boolean }
      if (data.confirmed) {
        window.location.href = successUrl
      }
    } catch {
      // Ignore polling errors silently
    }
  }, [orderId, successUrl])

  useEffect(() => {
    if (!pendingMessage) return
    const interval = setInterval(checkPaymentStatus, 5000)
    return () => clearInterval(interval)
  }, [pendingMessage, checkPaymentStatus])

  async function handlePay() {
    if (!selectedMethod || !paymentType) return
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/payments/bictorys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          shopSlug,
          customerFirstName,
          customerPhone,
          paymentType,
          ...(requiresOtp && otpCode.trim() ? { otp: otpCode.trim() } : {}),
        }),
      })

      const data = (await response.json()) as {
        checkoutUrl?: string
        message?: string
        error?: string
      }

      if (!response.ok) {
        throw new Error(data.error ?? 'Erreur lors de la création du paiement')
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }

      if (data.message) {
        setPendingMessage(data.message)
        setLoading(false)
        return
      }

      throw new Error('Réponse inattendue du serveur de paiement')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setLoading(false)
    }
  }

  // Paiement MoMo initié — en attente de validation sur le téléphone du client
  if (pendingMessage) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center space-y-3">
          <div className="text-4xl">📱</div>
          <h2 className="font-bold text-gray-900">Paiement en cours</h2>
          <p className="text-sm text-green-800 font-medium">{pendingMessage}</p>
          <p className="text-xs text-gray-500">
            Validez le paiement sur votre téléphone. Votre commande sera confirmée
            automatiquement.
          </p>
        </div>
        <button
          onClick={checkPaymentStatus}
          className="w-full py-3 rounded-2xl font-semibold text-white"
          style={{ backgroundColor: primaryColor }}
        >
          Vérifier le paiement
        </button>
        <a href={successUrl} className="block text-center text-sm text-gray-500 underline">
          Voir ma commande
        </a>
      </div>
    )
  }

  if (!country || methods.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">
          Impossible de détecter votre pays. Veuillez contacter le vendeur.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Liste des méthodes */}
      <div className="space-y-3">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => {
                setSelectedMethod(method.id as PaymentMethod)
                setOtpCode('')
                setError(null)
              }}
              disabled={loading}
              className="w-full text-left rounded-2xl border-2 p-4 transition-all"
              style={
                isSelected
                  ? { borderColor: primaryColor, backgroundColor: `${primaryColor}0d` }
                  : { borderColor: '#e5e7eb', backgroundColor: '#ffffff' }
              }
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors"
                  style={isSelected ? { borderColor: primaryColor } : { borderColor: '#d1d5db' }}
                >
                  {isSelected && (
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: primaryColor }}
                    />
                  )}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={method.icon}
                  alt={method.label}
                  className="w-10 h-8 object-contain flex-shrink-0"
                />
                <div>
                  <p className="font-semibold text-gray-900">{method.label}</p>
                  <p className="text-xs text-gray-500">{method.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Champ OTP — Orange Money CI / Burkina */}
      {requiresOtp && country && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <p className="text-sm font-bold text-amber-900">Code OTP requis</p>
          <p className="text-sm text-amber-800">
            {getOtpInstruction(country, amount)}
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="000000"
            maxLength={8}
            disabled={loading}
            className="w-full px-3 py-3 border border-amber-300 rounded-xl text-center font-mono text-xl tracking-widest font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          />
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Bouton payer */}
      <button
        onClick={handlePay}
        disabled={!selectedMethod || loading || (requiresOtp && !otpCode.trim())}
        className="w-full py-4 rounded-2xl font-bold text-base text-white shadow-lg transition-opacity disabled:opacity-40"
        style={{ backgroundColor: primaryColor }}
      >
        {loading ? 'Traitement en cours...' : `Payer ${amount.toLocaleString('fr-FR')} FCFA`}
      </button>

      <p className="text-xs text-center text-gray-500">
        Vos données sont sécurisées par Bictorys.
      </p>
    </div>
  )
}
