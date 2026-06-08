'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-react'
import {
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

const COUNTRIES: Array<{ code: BictorysCountry; name: string; flag: string; phone: string; mainMarket: boolean }> = [
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', phone: '+221', mainMarket: true },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', phone: '+225', mainMarket: true },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯', phone: '+229', mainMarket: false },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', phone: '+228', mainMarket: false },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', phone: '+223', mainMarket: false },
  { code: 'BK', name: 'Burkina Faso', flag: '🇧🇫', phone: '+226', mainMarket: false },
]

interface Props {
  plan: Plan
  shopName: string
  primaryColor: string
}

export function SubscriptionCheckoutForm({ plan, shopName, primaryColor }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [customerName, setCustomerName] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<BictorysCountry>('SN')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedPaymentType, setSelectedPaymentType] = useState<BictorysPaymentType | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [showAllCountries, setShowAllCountries] = useState(false)

  const paymentMethods = getPaymentMethodsByCountry(selectedCountry)
  const requiresOtp = selectedPaymentType ? needsOtpForPayment(selectedCountry, selectedPaymentType) : false

  const visibleCountries = showAllCountries ? COUNTRIES : COUNTRIES.filter(c => c.mainMarket)

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!customerName.trim()) {
      setError('Veuillez entrer votre nom complet')
      return
    }

    if (!customerPhone.trim()) {
      setError('Veuillez entrer votre numéro de téléphone')
      return
    }

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
      const normalizedPhone = normalizePhoneForBictorys(`${COUNTRIES.find(c => c.code === selectedCountry)?.phone}${customerPhone}`)

      const response = await fetch('/api/payments/bictorys/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey: plan.key,
          paymentType: selectedPaymentType,
          customerPhone: normalizedPhone,
          customerName: customerName.trim(),
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <button
          onClick={() => router.push('/dashboard/upgrade')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Retour</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <form onSubmit={handlePayment} className="space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finaliser votre abonnement</h1>
            <p className="mt-1 text-gray-600">Plan {plan.name} — {plan.price} FCFA/mois</p>
          </div>

          {/* Shop Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Boutique</p>
            <h2 className="text-2xl font-bold text-gray-900">{shopName}</h2>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                Nom complet
              </label>
              <input
                id="name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jean Dupont"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primaryColor } as any}
                disabled={loading}
              />
            </div>

            {/* Phone Field with Country Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Numéro de téléphone
              </label>
              <div className="flex gap-3">
                {/* Country Selector */}
                <div className="relative w-32 shrink-0">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value as BictorysCountry)}
                    disabled={loading}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm appearance-none bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': primaryColor } as any}
                  >
                    {visibleCountries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.phone}
                      </option>
                    ))}
                  </select>
                  {!showAllCountries && COUNTRIES.length > visibleCountries.length && (
                    <button
                      type="button"
                      onClick={() => setShowAllCountries(true)}
                      className="mt-2 text-xs text-gray-500 hover:text-gray-700 w-full text-center"
                    >
                      + {COUNTRIES.length - visibleCountries.length} autres
                    </button>
                  )}
                </div>

                {/* Phone Input */}
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="01 23 45 67 89"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': primaryColor } as any}
                  disabled={loading}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {COUNTRIES.find(c => c.code === selectedCountry)?.phone} {selectedCountry}
              </p>
            </div>

            {/* Payment Methods */}
            {paymentMethods.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Mode de paiement
                </label>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.type}
                      type="button"
                      onClick={() => {
                        setSelectedPaymentType(method.type)
                        setOtpCode('')
                      }}
                      className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                        selectedPaymentType === method.type
                          ? 'border-opacity-100 bg-opacity-5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={selectedPaymentType === method.type ? { borderColor: primaryColor, backgroundColor: primaryColor + '0D' } : undefined}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{method.label}</p>
                          {method.description && (
                            <p className="text-xs text-gray-600 mt-1">{method.description}</p>
                          )}
                        </div>
                        <div
                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors`}
                          style={
                            selectedPaymentType === method.type
                              ? { borderColor: primaryColor, backgroundColor: primaryColor }
                              : { borderColor: '#D1D5DB' }
                          }
                        >
                          {selectedPaymentType === method.type && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* OTP Field */}
            {requiresOtp && selectedPaymentType && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-amber-900">Code OTP requis</p>
                  <p className="text-xs text-amber-800 mt-1">
                    Tapez <span className="font-mono font-bold">#144*82#</span> sur votre téléphone Orange Money pour recevoir le code.
                  </p>
                </div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-amber-300 rounded-lg text-sm text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{ '--tw-ring-color': primaryColor } as any}
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
              disabled={loading || !customerName.trim() || !customerPhone.trim() || !selectedPaymentType}
              className="w-full py-3 rounded-lg font-semibold text-white transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {loading ? 'Traitement...' : `Payer ${plan.price} FCFA`}
            </button>
          </div>

          {/* Info Footer */}
          <div className="text-center text-xs text-gray-600">
            <p>Vos données sont sécurisées. Vous serez redirigé vers Bictorys pour finaliser le paiement.</p>
          </div>
        </form>
      </div>
    </div>
  )
}
