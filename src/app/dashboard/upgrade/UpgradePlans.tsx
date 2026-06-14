'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Zap } from 'lucide-react'

export interface Plan {
  key: string
  name: string
  price: string
  priceInt: number
  annualPrice: number
  description: string
  promo: string | null
  features: string[]
  highlighted: boolean
}

interface UpgradePlansProps {
  plans: Plan[]
  currentPlan: string
}

export function UpgradePlans({ plans, currentPlan }: UpgradePlansProps) {
  const router = useRouter()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  function handleActivatePlan(planKey: string) {
    const url = billing === 'annual'
      ? `/dashboard/upgrade/checkout?plan=${planKey}&billing=annual`
      : `/dashboard/upgrade/checkout?plan=${planKey}`
    router.push(url)
  }

  return (
    <>
      {/* Toggle mensuel / annuel */}
      <div className="flex items-center justify-center gap-3 py-1">
        <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
          Mensuel
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={billing === 'annual'}
          onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            billing === 'annual' ? 'bg-[var(--color-primary)]' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              billing === 'annual' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${billing === 'annual' ? 'text-gray-900' : 'text-gray-400'}`}>
          Annuel
        </span>
        {billing === 'annual' && (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
            2 mois offerts
          </span>
        )}
      </div>

      {/* Grille des plans */}
      <div className="space-y-3">
        {plans.map(plan => {
          const isCurrentPlan = plan.key === currentPlan
          const displayPrice = billing === 'annual'
            ? plan.annualPrice.toLocaleString('fr-FR')
            : plan.price
          const displayUnit = billing === 'annual' ? 'FCFA/an' : 'FCFA/mois'
          const monthlyEquiv = billing === 'annual'
            ? Math.round(plan.annualPrice / 12).toLocaleString('fr-FR')
            : null

          return (
            <div
              key={plan.key}
              className={`rounded-xl border p-4 ${plan.highlighted ? 'border-[var(--color-primary)] bg-sky-50' : 'border-gray-200 bg-white'}`}
            >
              {plan.promo && billing === 'monthly' && (
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
              {plan.highlighted && plan.promo && billing === 'annual' && (
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
                  <p className="text-lg font-bold text-gray-900">{displayPrice}</p>
                  <p className="text-xs text-gray-500">{displayUnit}</p>
                  {monthlyEquiv && (
                    <p className="text-[10px] text-emerald-600 font-medium">≈ {monthlyEquiv} FCFA/mois</p>
                  )}
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
                  onClick={() => handleActivatePlan(plan.key)}
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
    </>
  )
}
