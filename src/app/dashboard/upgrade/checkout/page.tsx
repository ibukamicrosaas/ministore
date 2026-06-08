'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import {
  detectCountryFromPhone,
  normalizePhoneForBictorys,
  getPaymentMethodsByCountry,
  needsOtpForPayment,
  type BictorysCountry,
  type BictorysPaymentType,
} from '@/lib/payments/bictorys'

interface Plan {
  key: string
  name: string
  price: string
  priceInt: number
}

const PLANS: Record<string, Plan> = {
  discovery: { key: 'discovery', name: 'Découverte', price: '2 900', priceInt: 2900 },
  business: { key: 'business', name: 'Business', price: '4 900', priceInt: 4900 },
  pro: { key: 'pro', name: 'Pro', price: '9 900', priceInt: 9900 },
}

export default function SubscriptionCheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const planKey = searchParams.get('plan')
  const plan = planKey && PLANS[planKey] ? PLANS[planKey] : null

  const [step, setStep] = useState<'info' | 'payment' | 'otp'>('info')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [shopName, setShopName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedPaymentType, setSelectedPaymentType] = useState<BictorysPaymentType | null>(null)
  const [otpCode, setOtpCode] = useState('')

  const detectedCountry = customerPhone ? detectCountryFromPhone(normalizePhoneForBictorys(customerPhone)) : null
  const paymentMethods = detectedCountry ? getPaymentMethodsByCountry(detectedCountry) : []
  const requiresOtp = selectedPaymentType && detectedCountry ? needsOtpForPayment(detectedCountry, selectedPaymentType) : false

  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <div className="text-4xl mb-4">😕</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Plan non trouvé</h1>
        <p className="text-sm text-gray-500 mb-6">Le plan demandé n'existe pas.</p>
        <button
          onClick={() => router.push('/dashboard/upgrade')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Retour aux plans
        </button>
      </div>
    )
  }

  async function handleContinueToPayment(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!shopName.trim()) {
      setError('Veuillez entrer le nom de votre boutique')
      return
    }

    if (!customerPhone.trim()) {
      setError('Veuillez entrer votre numéro de téléphone')
      return
    }

    if (!detectedCountry) {
      setError('Pays non reconnu. Veuillez vérifier votre numéro de téléphone (format: +XXX...)')
      return
    }

    if (paymentMethods.length === 0) {
      setError(`Aucun moyen de paiement disponible pour votre pays (${detectedCountry})`)
      return
    }

    setStep('payment')
  }

  async function handleCreateCharge(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!plan) {
      setError('Plan invalide')
      return
    }

    if (!selectedPaymentType) {
      setError('Veuillez choisir un moyen de paiement')
      return
    }

    if (requiresOtp && !otpCode.trim()) {
      setError('Veuillez entrer le code OTP reçu')
      return
    }

    setLoading(true)

    try {
      const normalizedPhone = normalizePhoneForBictorys(customerPhone)
      const response = await fetch('/api/payments/bictorys/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey: plan.key,
          paymentType: selectedPaymentType,
          customerPhone: normalizedPhone,
          customerName: shopName.trim(),
          otp: requiresOtp ? otpCode.trim() : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la création du paiement')
      }

      const { checkoutUrl, transactionId } = await response.json()

      if (transactionId) {
        sessionStorage.setItem('pending_sub_txn', transactionId)
        sessionStorage.setItem('pending_sub_plan', plan.key)
        const maxAge = 60 * 60
        document.cookie = `pending_sub_txn=${encodeURIComponent(transactionId)}; path=/dashboard/upgrade; max-age=${maxAge}; samesite=lax`
        document.cookie = `pending_sub_plan=${encodeURIComponent(plan.key)}; path=/dashboard/upgrade; max-age=${maxAge}; samesite=lax`
      }

      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <button
          onClick={() => router.push('/dashboard/upgrade')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Retour</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {step === 'info' && (
            <form onSubmit={handleContinueToPayment} className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Finaliser votre abonnement</h2>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de votre boutique
                </label>
                <input
                  id="name"
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Ma Boutique"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de téléphone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+225 01 23 45 67 89"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format international: +225 (Côte d'Ivoire), +221 (Sénégal), etc.
                </p>
              </div>

              {detectedCountry && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    ✓ Pays détecté: <span className="font-semibold">{detectedCountry}</span>
                  </p>
                  {paymentMethods.length > 0 && (
                    <p className="text-xs text-blue-700 mt-1">
                      {paymentMethods.length} moyen(s) de paiement disponible(s)
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-900">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Continuer vers le paiement
              </button>
            </form>
          )}

          {step === 'payment' && detectedCountry && (
            <form onSubmit={handleCreateCharge} className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Choisir un moyen de paiement</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  Plan <span className="font-semibold">{plan.name}</span> — {plan.price} FCFA/mois
                </p>
              </div>

              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.type}
                    type="button"
                    onClick={() => {
                      setSelectedPaymentType(method.type)
                      setOtpCode('')
                    }}
                    className={`w-full text-left p-3 border-2 rounded-lg transition-colors ${
                      selectedPaymentType === method.type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{method.label}</p>
                        {method.description && (
                          <p className="text-xs text-gray-600 mt-0.5">{method.description}</p>
                        )}
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
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
                ))}
              </div>

              {requiresOtp && selectedPaymentType && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
                  <p className="text-sm font-semibold text-amber-900">Code OTP requis</p>
                  <p className="text-xs text-amber-800">
                    Tapez <span className="font-mono font-semibold">#144*82#</span> sur votre téléphone Orange Money pour recevoir un code OTP.
                  </p>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Entrez le code OTP (6 chiffres)"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    disabled={loading}
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-900">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  disabled={loading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition-colors"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedPaymentType}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Traitement...' : 'Payer maintenant'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Info footer */}
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-600">
            Vos données sont sécurisées. Vous serez redirigé vers la page de paiement Bictorys.
          </p>
        </div>
      </div>
    </div>
  )
}
