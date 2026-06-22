'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Image from 'next/image'
import {
  normalizePhoneForBictorys,
  detectCountryFromPhone,
  getPaymentMethodsByCountry,
  needsOtpForPayment,
  getOtpInstruction,
  type BictorysPaymentType,
} from '@/lib/payments/bictorys'

const PAYMENT_LOGOS: Record<string, string> = {
  wave_money:   '/logo-payments/wave_1.svg',
  orange_money: '/logo-payments/om_1.svg',
  maxit:        '/logo-payments/maxit.webp',
  mtn_money:    '/logo-payments/mtn_1.svg',
  moov:         '/logo-payments/moov_1.svg',
  mobicash:     '/logo-payments/mobicash.png',
  togocell:     '/logo-payments/togocell.jpg',
}

interface Props {
  shopSlug: string
  orderId: string
  customerName: string
  customerPhone: string
}

export function CheckoutForm({ shopSlug, orderId, customerName, customerPhone }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPaymentType, setSelectedPaymentType] = useState<BictorysPaymentType | null>(null)
  const [otpCode, setOtpCode] = useState('')

  const normalizedPhone = normalizePhoneForBictorys(customerPhone)
  const detectedCountry = detectCountryFromPhone(normalizedPhone)
  const paymentMethods = detectedCountry ? getPaymentMethodsByCountry(detectedCountry) : []
  const requiresOtp = selectedPaymentType && detectedCountry ? needsOtpForPayment(detectedCountry, selectedPaymentType) : false

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selectedPaymentType) {
      setError('Veuillez choisir un moyen de paiement')
      return
    }

    if (requiresOtp && !otpCode.trim()) {
      setError('Veuillez entrer le code OTP')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/checkout/bictorys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          shopSlug,
          customerName,
          customerPhone: normalizedPhone,
          paymentType: selectedPaymentType,
          otp: requiresOtp ? otpCode.trim() : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la création du paiement')
      }

      const { checkoutUrl } = await response.json()
      if (checkoutUrl) {
        window.location.assign(checkoutUrl as string)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setLoading(false)
    }
  }

  if (!detectedCountry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Pays non détecté</h1>
        <p className="text-sm text-gray-500 mb-6">Impossible de détecter votre pays depuis le numéro de téléphone fourni.</p>
        <button
          onClick={() => router.back()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Retour
        </button>
      </div>
    )
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <div className="text-4xl mb-4">😔</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Aucun moyen disponible</h1>
        <p className="text-sm text-gray-500 mb-6">Aucun moyen de paiement n'est disponible pour votre pays.</p>
        <button
          onClick={() => router.back()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Retour
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Retour</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={handlePayment} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Choisir un moyen de paiement</h2>
              <p className="text-sm text-gray-600 mt-1">Pays détecté: <span className="font-semibold">{detectedCountry}</span></p>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const logoPath = PAYMENT_LOGOS[method.type]
                return (
                  <button
                    key={method.type}
                    type="button"
                    onClick={() => {
                      setSelectedPaymentType(method.type)
                      setOtpCode('')
                    }}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                      selectedPaymentType === method.type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {logoPath && (
                          <div className="flex-shrink-0 w-10 h-8 relative flex items-center">
                            <Image
                              src={logoPath}
                              alt={method.label}
                              width={40}
                              height={32}
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{method.label}</p>
                          {method.description && (
                            <p className="text-xs text-gray-600 mt-1">{method.description}</p>
                          )}
                        </div>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selectedPaymentType === method.type
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedPaymentType === method.type && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* OTP Field */}
            {requiresOtp && selectedPaymentType && detectedCountry && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-amber-900">Code OTP requis</p>
                  <p className="text-xs text-amber-800 mt-1">
                    {getOtpInstruction(detectedCountry)}
                  </p>
                </div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-amber-300 rounded-lg text-sm text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={loading}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-900">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedPaymentType}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {loading ? 'Traitement...' : 'Payer maintenant'}
            </button>
          </form>
        </div>

        {/* Info Footer */}
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-600">
            Vos données sont sécurisées. Vous serez redirigé vers Bictorys pour finaliser le paiement.
          </p>
        </div>
      </div>
    </div>
  )
}
