'use client'

import { useState } from 'react'
import { CheckCircle2, Zap, X, ArrowRight, ExternalLink } from 'lucide-react'
import Image from 'next/image'

export interface Plan {
  key: string
  name: string
  price: string
  priceInt: number
  description: string
  promo: string | null
  features: string[]
  highlighted: boolean
}

interface UpgradePlansProps {
  plans: Plan[]
  currentPlan: string
}

type PaymentMethod = 'wave_money' | 'orange_money' | 'maxit'

const PAYMENT_METHODS: { key: PaymentMethod; label: string; logo: string }[] = [
  { key: 'wave_money',   label: 'Wave',         logo: '/logo-payments/wave_1.svg'  },
  { key: 'orange_money', label: 'Orange Money', logo: '/logo-payments/om_1.svg'    },
  { key: 'maxit',        label: 'MaxIt',        logo: '/logo-payments/maxit.webp'  },
]

export function UpgradePlans({ plans, currentPlan }: UpgradePlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [loading, setLoading]           = useState<PaymentMethod | 'all' | null>(null)
  const [error, setError]               = useState<string | null>(null)

  function closeModal() {
    setSelectedPlan(null)
    setError(null)
    setLoading(null)
  }

  async function handlePayment(method: PaymentMethod | null) {
    if (!selectedPlan || loading) return
    setLoading(method ?? 'all')
    setError(null)

    try {
      const res = await fetch('/api/payments/bictorys/subscription', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ planKey: selectedPlan.key, paymentType: method }),
      })
      const data = await res.json() as { checkoutUrl?: string; transactionId?: string; error?: string }

      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? 'Erreur lors de la création du paiement.')
        setLoading(null)
        return
      }

      // Stocker le txn pour vérification au retour de Bictorys
      if (data.transactionId) {
        sessionStorage.setItem('pending_sub_txn', data.transactionId)
        sessionStorage.setItem('pending_sub_plan', selectedPlan.key)
      }

      window.location.href = data.checkoutUrl
    } catch {
      setError('Erreur réseau. Vérifie ta connexion.')
      setLoading(null)
    }
  }

  return (
    <>
      {/* Grille des plans */}
      <div className="space-y-3">
        {plans.map(plan => {
          const isCurrentPlan = plan.key === currentPlan
          return (
            <div
              key={plan.key}
              className={`rounded-xl border p-4 ${plan.highlighted ? 'border-[var(--color-primary)] bg-sky-50' : 'border-gray-200 bg-white'}`}
            >
              {plan.promo && (
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                    {plan.promo}
                  </span>
                </div>
              )}
              {plan.highlighted && !plan.promo && (
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-semibold text-white">
                    <Zap className="h-3 w-3" /> Recommandé
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-500">{plan.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-gray-900">{plan.price}</p>
                  <p className="text-xs text-gray-500">FCFA/mois</p>
                </div>
              </div>

              <ul className="space-y-1.5 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-700">
                    <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${plan.highlighted ? 'text-[var(--color-primary)]' : 'text-gray-400'}`} />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 py-2.5 text-sm font-semibold text-green-700">
                  <CheckCircle2 className="h-4 w-4" /> Plan actuel
                </div>
              ) : (
                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-opacity active:opacity-80 ${
                    plan.highlighted
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'border border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  Activer ce plan
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal paiement */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Sheet */}
          <div className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[92dvh] flex flex-col">

            {/* Header — couleurs TekkiShop */}
            <div className="bg-[var(--color-primary)] px-5 pt-6 pb-5 shrink-0">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 rounded-full p-1 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">
                PAIEMENT MOBILE MONEY
              </p>
              <h2 className="text-xl font-bold text-white leading-tight">Tu y es presque.</h2>
              <p className="text-sm text-white/70 mt-1">
                Plan {selectedPlan.name} — {selectedPlan.price} FCFA/mois
              </p>
            </div>

            {/* Body */}
            <div className="bg-white px-5 pt-4 pb-6 overflow-y-auto">
              <button
                onClick={closeModal}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-4 transition-colors"
              >
                ← Retour
              </button>

              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Choisis ton opérateur
              </p>

              <div className="space-y-2">
                {PAYMENT_METHODS.map(method => (
                  <button
                    key={method.key}
                    onClick={() => handlePayment(method.key)}
                    disabled={loading !== null}
                    className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3.5 hover:border-[var(--color-primary)] hover:bg-sky-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                      <Image
                        src={method.logo}
                        alt={method.label}
                        width={36}
                        height={36}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900">{method.label}</p>
                      <p className="text-xs text-gray-400">{selectedPlan.price} FCFA</p>
                    </div>
                    {loading === method.key ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-primary)] shrink-0" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {error && (
                <p className="mt-3 text-xs text-red-500 text-center">{error}</p>
              )}

              {/* Lien autres opérateurs */}
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <button
                  onClick={() => handlePayment(null)}
                  disabled={loading !== null}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:opacity-75 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading === 'all' ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-sky-200 border-t-[var(--color-primary)]" />
                  ) : (
                    <ExternalLink className="h-3 w-3" />
                  )}
                  Tu n&apos;es pas au Sénégal ? Vois les autres opérateurs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
