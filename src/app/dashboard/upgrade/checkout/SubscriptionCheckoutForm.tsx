'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  normalizePhoneForBictorys,
  getPaymentMethodsByCountry,
  needsOtpForPayment,
  type BictorysCountry,
  type BictorysPaymentType,
} from '@/lib/payments/bictorys'

const PAYMENT_LOGOS: Record<string, string> = {
  wave_money: '/logo-payments/wave_1.svg',
  orange_money: '/logo-payments/om_1.svg',
  maxit: '/logo-payments/maxit.webp',
  mtn_money: '/logo-payments/mtn_1.svg',
  moov_money: '/logo-payments/moov_1.svg',
}

interface Plan {
  key: string
  name: string
  price: string
  priceInt: number
}

const COUNTRIES: Array<{ code: BictorysCountry; name: string; flag: string; phone: string }> = [
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', phone: '+221' },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', phone: '+225' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯', phone: '+229' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', phone: '+228' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', phone: '+223' },
  { code: 'BK', name: 'Burkina Faso', flag: '🇧🇫', phone: '+226' },
]

interface Props {
  plan: Plan
  shopName: string
  primaryColor: string
}

function StepNumber({ number, primaryColor }: { number: number; primaryColor: string }) {
  return (
    <div
      className="flex items-center justify-center h-7 w-7 rounded-full text-white font-bold text-sm flex-shrink-0"
      style={{ backgroundColor: primaryColor }}
    >
      {number}
    </div>
  )
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

  const paymentMethods = getPaymentMethodsByCountry(selectedCountry)
  const requiresOtp = selectedPaymentType ? needsOtpForPayment(selectedCountry, selectedPaymentType) : false
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
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Finaliser votre abonnement</h1>
          <p className="mt-1 text-sm text-gray-600">
            Plan <span className="font-semibold">{plan.name}</span> — <span className="font-semibold">{plan.price} FCFA/mois</span>
          </p>
        </div>

        {/* Shop Card */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-gray-500 tracking-wide mb-1">Boutique</p>
          <h2 className="text-xl font-bold text-gray-900">{shopName}</h2>
        </div>

        {/* Form */}
        <form onSubmit={handlePayment} className="space-y-5">
          {/* Step 1: Vos informations */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3 mb-4">
              <StepNumber number={1} primaryColor={primaryColor} />
              <h3 className="font-semibold text-gray-900">Vos informations</h3>
            </div>
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

          {/* Step 2: Numéro de téléphone */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3 mb-4">
              <StepNumber number={2} primaryColor={primaryColor} />
              <h3 className="font-semibold text-gray-900">Numéro de téléphone</h3>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-offset-0 focus-within:border-gray-300 transition-all">
              <div className="flex">
                {/* Country Selector */}
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value as BictorysCountry)
                  }}
                  disabled={loading}
                  className="shrink-0 px-3 py-2.5 border-r border-gray-200 bg-white text-sm text-gray-900 font-medium focus:outline-none cursor-pointer"
                >
                  {COUNTRIES.map((country) => (
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
                  className="flex-1 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-gray-50"
                  disabled={loading}
                  required
                />
              </div>
            </div>
          </div>

          {/* Step 3: Mode de paiement */}
          {paymentMethods.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3 mb-4">
                <StepNumber number={3} primaryColor={primaryColor} />
                <h3 className="font-semibold text-gray-900">Mode de paiement</h3>
              </div>
              <div className="space-y-2">
                {paymentMethods.map((method) => {
                  const isSelected = selectedPaymentType === method.type
                  const logoPath = PAYMENT_LOGOS[method.type]

                  return (
                    <button
                      key={method.type}
                      type="button"
                      onClick={() => {
                        setSelectedPaymentType(method.type)
                        setOtpCode('')
                      }}
                      disabled={loading}
                      className="w-full text-left rounded-lg border-2 transition-all p-4"
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
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {logoPath ? (
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
                          ) : (
                            <div className="text-xl flex-shrink-0">💰</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{method.label}</p>
                            {method.description && (
                              <p className="text-xs text-gray-600 mt-1">{method.description}</p>
                            )}
                          </div>
                        </div>
                        <div
                          className="h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5"
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

          {/* Step 4: Code OTP (if needed) */}
          {requiresOtp && selectedPaymentType && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center h-7 w-7 rounded-full text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  4
                </div>
                <h3 className="font-semibold text-gray-900">Code OTP</h3>
              </div>
              <p className="text-sm text-amber-800 mb-3">
                Composez <span className="inline-block font-mono font-bold bg-amber-100 px-2 py-1 rounded text-amber-900 text-xs">#144*82#</span> sur votre téléphone pour recevoir le code.
              </p>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-3 py-2.5 border border-amber-300 rounded-lg text-center font-mono text-lg tracking-wider font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
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
            {loading ? 'Traitement...' : `Payer ${plan.price} FCFA`}
          </Button>

          {/* Info Footer */}
          <p className="text-center text-xs text-gray-600">
            Vos données sont sécurisées. Vous serez redirigé vers Bictorys pour finaliser le paiement.
          </p>
        </form>
      </div>
    </div>
  )
}
