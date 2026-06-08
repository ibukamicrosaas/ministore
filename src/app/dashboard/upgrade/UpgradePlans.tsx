'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle2, Zap } from 'lucide-react'

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

export function UpgradePlans({ plans, currentPlan }: UpgradePlansProps) {
  const router = useRouter()

  function handleActivatePlan(planKey: string) {
    router.push(`/dashboard/upgrade/checkout?plan=${planKey}`)
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
