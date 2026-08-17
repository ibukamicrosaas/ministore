'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Zap, CreditCard, RefreshCw } from 'lucide-react'
import type { ShopCurrency } from '@/lib/utils/country-groups'

export interface Plan {
  key:         string
  name:        string
  price:       string
  priceInt:    number
  annualPrice: number
  description: string
  promo:       string | null
  currency:    ShopCurrency
  features:    string[]
  highlighted: boolean
}

interface UpgradePlansProps {
  plans:                Plan[]
  currentPlan:          string
  isEuCa:               boolean
  showCardOption?:      boolean
  subscriptionEndsAt?:  string | null
}

const CURRENCY_SYMBOL: Record<ShopCurrency, string> = {
  XOF: 'FCFA',
  EUR: '€',
  CAD: 'CAD',
}

function formatAnnualPrice(plan: Plan): string {
  if (plan.currency === 'EUR') return `${(plan.annualPrice / 100).toFixed(0)} €`
  if (plan.currency === 'CAD') return `${(plan.annualPrice / 100).toFixed(0)} CAD`
  return `${plan.annualPrice.toLocaleString('fr-FR')} FCFA`
}

function formatMonthlyEquiv(plan: Plan): string {
  if (plan.currency === 'EUR') return `≈ ${(plan.annualPrice / 100 / 12).toFixed(2)} €/mois`
  if (plan.currency === 'CAD') return `≈ ${(plan.annualPrice / 100 / 12).toFixed(2)} CAD/mois`
  return `≈ ${Math.round(plan.annualPrice / 12).toLocaleString('fr-FR')} FCFA/mois`
}

function formatExpiryDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function UpgradePlans({ plans, currentPlan, isEuCa, showCardOption, subscriptionEndsAt }: UpgradePlansProps) {
  const router  = useRouter()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  function handleActivatePlan(plan: Plan) {
    const query = billing === 'annual' ? `?plan=${plan.key}&billing=annual` : `?plan=${plan.key}`
    router.push(`/dashboard/upgrade/checkout${query}`)
  }

  function handleActivatePlanByCard(plan: Plan) {
    const query = billing === 'annual' ? `?plan=${plan.key}&billing=annual&method=stripe` : `?plan=${plan.key}&method=stripe`
    router.push(`/dashboard/upgrade/checkout${query}`)
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
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            billing === 'annual' ? 'translate-x-6' : 'translate-x-1'
          }`} />
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

      {/* Info EU/CA */}
      {isEuCa && (
        <div className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50 p-4">
          <CreditCard className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-sky-900">Paiement par carte bancaire</p>
            <p className="text-xs text-sky-700 mt-0.5">
              Les marchands en Europe et au Canada accèdent uniquement au plan Pro,
              avec paiement sécurisé par carte bancaire via Stripe.
            </p>
          </div>
        </div>
      )}

      {/* Grille des plans */}
      <div className="space-y-3">
        {plans.map(plan => {
          const isCurrentPlan = plan.key === currentPlan
          const sym  = CURRENCY_SYMBOL[plan.currency]

          let displayPrice: string
          let displayUnit: string
          if (billing === 'annual') {
            displayPrice = formatAnnualPrice(plan)
            displayUnit  = `${sym}/an`
          } else {
            displayPrice = plan.currency === 'XOF' ? plan.price : (plan.priceInt / 100).toFixed(2).replace('.', ',')
            displayUnit  = `${sym}/mois`
          }

          const monthlyEquiv = billing === 'annual' ? formatMonthlyEquiv(plan) : null

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
                    <Zap className="h-3 w-3" /> {isEuCa ? 'Plan unique' : 'Recommandé'}
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
                    <p className="text-[10px] text-emerald-600 font-medium">{monthlyEquiv}</p>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0" /> Plan actuel
                    </div>
                    {subscriptionEndsAt && (
                      <span className="text-[11px] text-green-600">
                        Expire le {formatExpiryDate(subscriptionEndsAt)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleActivatePlan(plan)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Renouveler maintenant
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => handleActivatePlan(plan)}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-opacity active:opacity-80 ${
                      plan.highlighted
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'border border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {isEuCa ? <CreditCard className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                    {isEuCa ? 'Payer par carte bancaire' : 'Choisir ce plan'}
                  </button>
                  {showCardOption && (
                    <button
                      onClick={() => handleActivatePlanByCard(plan)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-sky-200 py-2 text-xs font-medium text-sky-600 hover:bg-sky-50 transition-colors"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Payer en € par carte bancaire
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
