'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, CreditCard, Smartphone } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
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

const COUNTRIES: Array<{ code: BictorysCountry; name: string; flag: string; phone: string; main: boolean }> = [
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', phone: '+221', main: true },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', phone: '+225', main: true },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯', phone: '+229', main: false },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', phone: '+228', main: false },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', phone: '+223', main: false },
  { code: 'BK', name: 'Burkina Faso', flag: '🇧🇫', phone: '+226', main: false },
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
  const visibleCountries = showAllCountries ? COUNTRIES : COUNTRIES.filter(c => c.main)
  const countryPhone = COUNTRIES.find(c => c.code === selectedCountry)?.phone || '+221'

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
      const normalizedPhone = normalizePhoneForBictorys(`${countryPhone}${customerPhone}`)

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

      const { checkoutUrl } = await response.json()
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
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/dashboard/upgrade')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finaliser votre abonnement</h1>
          <p className="mt-2 text-gray-600">
            Plan <span className="font-semibold">{plan.name}</span> — <span className="font-semibold">{plan.price} FCFA/mois</span>
          </p>
        </div>

        {/* Shop Card */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-xs font-medium uppercase text-gray-500 tracking-wide mb-2">Boutique</p>
          <h2 className="text-2xl font-bold text-gray-900">{shopName}</h2>
        </div>

        {/* Form */}
        <form onSubmit={handlePayment} className="space-y-6">
          {/* Name Field */}
          <div>
            <Input
              label="Nom complet"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Jean Dupont"
              disabled={loading}
              required
            />
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de téléphone</label>
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-offset-0 focus-within:ring-sky-100 transition-all">
              <div className="flex">
                {/* Country Selector */}
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value as BictorysCountry)
                  }}
                  disabled={loading}
                  className="shrink-0 px-4 py-3 border-r border-gray-200 bg-white text-sm text-gray-900 font-medium focus:outline-none cursor-pointer"
                >
                  {visibleCountries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.phone}
                    </option>
                  ))}
                </select>

                {/* Phone Input */}
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="01 23 45 67 89"
                  className="flex-1 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-white"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            {!showAllCountries && COUNTRIES.length > visibleCountries.length && (
              <button
                type="button"
                onClick={() => setShowAllCountries(true)}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                + {COUNTRIES.length - visibleCountries.length} autres pays
              </button>
            )}
          </div>

          {/* Payment Methods */}
          {paymentMethods.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Mode de paiement</label>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const isSelected = selectedPaymentType === method.type
                  const getMethodIcon = () => {
                    switch (method.type) {
                      case 'wave':
                        return '👋'
                      case 'orange_money':
                        return '🟠'
                      case 'maxit':
                        return '💳'
                      default:
                        return '💰'
                    }
                  }

                  return (
                    <button
                      key={method.type}
                      type="button"
                      onClick={() => {
                        setSelectedPaymentType(method.type)
                        setOtpCode('')
                      }}
                      disabled={loading}
                      className="w-full text-left rounded-lg border-2 transition-all p-5"
                      style={
                        isSelected
                          ? {
                              borderColor: primaryColor,
                              backgroundColor: `${primaryColor}0D`,
                            }
                          : {
                              borderColor: '#E5E7EB',
                              backgroundColor: '#FFFFFF',
                            }
                      }
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="text-2xl flex-shrink-0">{getMethodIcon()}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">{method.label}</p>
                            {method.description && (
                              <p className="text-xs text-gray-600 mt-1.5">{method.description}</p>
                            )}
                          </div>
                        </div>
                        <div
                          className="h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors mt-1"
                          style={
                            isSelected
                              ? {
                                  borderColor: primaryColor,
                                  backgroundColor: primaryColor,
                                }
                              : {
                                  borderColor: '#D1D5DB',
                                }
                          }
                        >
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* OTP Field */}
          {requiresOtp && selectedPaymentType && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                  <span>⚡ Code OTP requis</span>
                </p>
                <p className="text-sm text-amber-800 mt-2 leading-relaxed">
                  Composez <span className="inline-block font-mono font-bold bg-amber-100 px-2.5 py-1 rounded text-amber-900">#144*82#</span> sur votre téléphone pour recevoir le code de confirmation.
                </p>
              </div>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border border-amber-300 rounded-lg text-center font-mono text-2xl tracking-wider font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!customerName.trim() || !customerPhone.trim() || !selectedPaymentType}
            style={{ backgroundColor: primaryColor }}
          >
            Payer {plan.price} FCFA
          </Button>

          {/* Info */}
          <p className="text-center text-xs text-gray-600">
            Vos données sont sécurisées. Vous serez redirigé vers Bictorys pour finaliser le paiement.
          </p>
        </form>
      </div>
    </div>
  )
}
