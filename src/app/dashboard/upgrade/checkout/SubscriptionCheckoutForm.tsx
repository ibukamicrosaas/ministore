'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, Check } from 'lucide-react'
import Image from 'next/image'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  normalizePhoneForBictorys,
  getPaymentMethodsByCountry,
  needsOtpForPayment,
  getOtpInstruction,
  type BictorysCountry,
  type BictorysPaymentType,
} from '@/lib/payments/bictorys'

const PAYMENT_LOGOS: Record<string, string> = {
  wave_money:   '/logo-payments/wave_1.svg',
  orange_money: '/logo-payments/om_1.svg',
  maxit:        '/logo-payments/maxit.webp',
  mtn_money:    '/logo-payments/mtn_1.svg',
  moov:         '/logo-payments/moov_1.svg',
}

interface Plan {
  key: string
  name: string
  price: string
  priceInt: number
}

const COUNTRIES: Array<{ code: BictorysCountry; name: string; flag: string; phone: string; placeholder: string }> = [
  { code: 'SN', name: 'Sénégal',       flag: '🇸🇳', phone: '+221', placeholder: '77 123 45 67' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', phone: '+225', placeholder: '07 00 00 00 00' },
  { code: 'BJ', name: 'Bénin',         flag: '🇧🇯', phone: '+229', placeholder: '97 00 00 00' },
  { code: 'BK', name: 'Burkina Faso',  flag: '🇧🇫', phone: '+226', placeholder: '70 00 00 00' },
  { code: 'ML', name: 'Mali',          flag: '🇲🇱', phone: '+223', placeholder: '70 00 00 00' },
  { code: 'TG', name: 'Togo',          flag: '🇹🇬', phone: '+228', placeholder: '90 00 00 00' },
]

interface Props {
  plan: Plan
  shopName: string
  primaryColor: string
}

function StepBadge({ n, color }: { n: number; color: string }) {
  return (
    <div
      className="flex items-center justify-center h-7 w-7 rounded-full text-white font-bold text-xs flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {n}
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
  const [countryOpen, setCountryOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const paymentMethods = getPaymentMethodsByCountry(selectedCountry)
  const requiresOtp = selectedPaymentType ? needsOtpForPayment(selectedCountry, selectedPaymentType) : false
  const selectedCountryData = COUNTRIES.find(c => c.code === selectedCountry)
  const countryPhone = selectedCountryData?.phone || '+221'
  const phonePlaceholder = selectedCountryData?.placeholder || '77 123 45 67'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCountryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!customerName.trim()) { setError('Veuillez entrer votre nom complet'); return }
    if (!customerPhone.trim()) { setError('Veuillez entrer votre numéro de téléphone'); return }
    if (!selectedPaymentType) { setError('Veuillez choisir un moyen de paiement'); return }
    if (requiresOtp && !otpCode.trim()) { setError('Veuillez entrer le code OTP'); return }

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

      const data = await response.json() as {
        checkoutUrl?: string; transactionId?: string; message?: string; error?: string
      }

      if (!response.ok) throw new Error(data.error || 'Erreur lors de la création du paiement')
      if (data.checkoutUrl) { window.location.href = data.checkoutUrl; return }
      if (data.transactionId) {
        sessionStorage.setItem('pending_sub_txn', data.transactionId)
        sessionStorage.setItem('pending_sub_plan', plan.key)
        router.push(`/dashboard/upgrade?success=1&plan=${plan.key}`)
        return
      }
      throw new Error('Réponse inattendue du serveur de paiement')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard/upgrade')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-gray-400 font-medium">Paiement sécurisé</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-12">
        {/* Plan banner */}
        <div
          className="rounded-2xl p-5 mb-6 text-white relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}BB 100%)` }}
        >
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-4 w-20 h-20 rounded-full bg-white/5" />
          <p className="text-sm font-medium text-white/70 mb-0.5">{shopName}</p>
          <h1 className="text-xl font-bold mb-1">Plan {plan.name}</h1>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold">{plan.price}</span>
            <span className="text-sm text-white/70">FCFA/mois</span>
          </div>
        </div>

        <form onSubmit={handlePayment} className="space-y-3">
          {/* Step 1 – Infos */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <StepBadge n={1} color={primaryColor} />
              <h3 className="font-semibold text-gray-900 text-sm">Vos informations</h3>
            </div>
            <Input
              label="Nom complet"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Fanta Diallo"
              disabled={loading}
              required
            />
          </div>

          {/* Step 2 – Téléphone */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <StepBadge n={2} color={primaryColor} />
              <h3 className="font-semibold text-gray-900 text-sm">Numéro de téléphone</h3>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Numéro mobile money
            </label>
            <div className="flex rounded-xl border border-gray-200 overflow-visible focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-300 transition-all">
              {/* Dropdown pays */}
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setCountryOpen(o => !o)}
                  disabled={loading}
                  className="flex h-full items-center gap-1.5 px-3 bg-gray-50 border-r border-gray-200 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-l-xl min-h-[46px]"
                >
                  <span className="text-base leading-none">{selectedCountryData?.flag}</span>
                  <span className="font-medium">{countryPhone}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
                </button>

                {countryOpen && (
                  <div className="absolute left-0 top-full mt-1 z-50 min-w-[220px] rounded-xl border border-gray-200 bg-white shadow-xl py-1">
                    {COUNTRIES.map(country => {
                      const isActive = selectedCountry === country.code
                      return (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country.code)
                            setSelectedPaymentType(null)
                            setCustomerPhone('')
                            setCountryOpen(false)
                          }}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                            isActive ? 'bg-sky-50 font-medium' : 'text-gray-700'
                          }`}
                          style={isActive ? { color: primaryColor } : {}}
                        >
                          <span className="text-base">{country.flag}</span>
                          <span className="flex-1 text-left">{country.name}</span>
                          <span className="text-gray-400 text-xs">{country.phone}</span>
                          {isActive && <Check className="h-4 w-4 flex-shrink-0" style={{ color: primaryColor }} />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Numéro */}
              <input
                type="tel"
                inputMode="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder={phonePlaceholder}
                className="flex-1 px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-white rounded-r-xl"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Step 3 – Mode de paiement */}
          {paymentMethods.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <StepBadge n={3} color={primaryColor} />
                <h3 className="font-semibold text-gray-900 text-sm">Mode de paiement</h3>
              </div>
              <div className="space-y-2">
                {paymentMethods.map((method) => {
                  const isSelected = selectedPaymentType === method.type
                  const logoPath = PAYMENT_LOGOS[method.type]
                  return (
                    <button
                      key={method.type}
                      type="button"
                      onClick={() => { setSelectedPaymentType(method.type); setOtpCode('') }}
                      disabled={loading}
                      className="w-full text-left rounded-xl border-2 transition-all p-3.5"
                      style={
                        isSelected
                          ? { borderColor: primaryColor, backgroundColor: `${primaryColor}0D` }
                          : { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                          style={
                            isSelected
                              ? { borderColor: primaryColor, backgroundColor: primaryColor }
                              : { borderColor: '#D1D5DB' }
                          }
                        >
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        {logoPath ? (
                          <div className="flex-shrink-0 w-10 h-7 relative flex items-center">
                            <Image src={logoPath} alt={method.label} width={40} height={28} className="object-contain" unoptimized />
                          </div>
                        ) : (
                          <span className="text-xl flex-shrink-0">💰</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{method.label}</p>
                          {method.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{method.description}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 4 – OTP */}
          {requiresOtp && selectedPaymentType && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <StepBadge n={4} color={primaryColor} />
                <h3 className="font-semibold text-gray-900 text-sm">Code OTP</h3>
              </div>
              <p className="text-sm text-amber-800 mb-3">
                {getOtpInstruction(selectedCountry, plan.priceInt)}
              </p>
              <input
                type="text"
                inputMode="numeric"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-3 py-3 border border-amber-300 rounded-xl text-center font-mono text-2xl tracking-widest font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white transition-all"
                disabled={loading}
              />
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          {/* Submit */}
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

          <p className="text-center text-xs text-gray-400 pb-2">
            Paiement sécurisé par Bictorys · Sans carte bancaire
          </p>
        </form>
      </div>
    </div>
  )
}
