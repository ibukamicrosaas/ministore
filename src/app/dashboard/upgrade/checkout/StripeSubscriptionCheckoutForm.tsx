'use client'

import { useState } from 'react'
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { AFRICA_PLANS, EU_CA_PRO_PLAN_EUR, EU_CA_PRO_PLAN_CAD, resolvePlanFeatures } from '@/lib/billing/plans'

interface Props {
  planKey:       string
  planName:      string
  amountCents:   number
  currency:      'EUR' | 'CAD'
  billingCycle:  'monthly' | 'annual'
  shopName:      string
  primaryColor:  string
  customerEmail?: string
  isEuCa:        boolean
  /** Taux réel du pays, déjà résolu par la page appelante — voir
   * lib/billing/commission.ts. Sans objet si isEuCa (commission Stripe
   * distincte, jamais liée à Bictorys). */
  commissionLabel?: string
}

const CURRENCY_SYMBOL: Record<string, string> = { EUR: '€', CAD: 'CAD' }

function getPlanFeatures(planKey: string, currency: 'EUR' | 'CAD', isEuCa: boolean, commissionLabel: string): string[] {
  if (isEuCa) return (currency === 'CAD' ? EU_CA_PRO_PLAN_CAD : EU_CA_PRO_PLAN_EUR).features
  const base = AFRICA_PLANS.find(p => p.key === planKey)?.features
    ?? AFRICA_PLANS.find(p => p.key === 'pro')!.features
  return resolvePlanFeatures(base, commissionLabel)
}

export function StripeSubscriptionCheckoutForm({
  planKey,
  planName,
  amountCents,
  currency,
  billingCycle,
  shopName,
  primaryColor,
  customerEmail,
  isEuCa,
  commissionLabel,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const sym    = CURRENCY_SYMBOL[currency]
  const amount = (amountCents / 100).toFixed(2).replace('.', ',')
  const period = billingCycle === 'annual' ? 'an' : 'mois'

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/stripe/subscription/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ planKey, billingCycle }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Une erreur est survenue. Réessayez.')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion et réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Link href="/dashboard/upgrade" className="p-1 -ml-1 text-gray-400 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          {shopName[0]?.toUpperCase()}
        </div>
        <p className="text-sm font-semibold text-gray-900 truncate">{shopName}</p>
      </div>

      <div className="flex-1 px-4 py-6 space-y-5 max-w-lg mx-auto w-full">

        {/* Résumé du plan */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Plan sélectionné</p>
              <h2 className="text-xl font-black text-gray-900 mt-0.5">{planName}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {billingCycle === 'annual' ? 'Facturation annuelle' : 'Facturation mensuelle'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-gray-900">
                {amount} {sym}
              </p>
              <p className="text-xs text-gray-500">par {period}</p>
              {billingCycle === 'annual' && (
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                  2 mois offerts
                </p>
              )}
            </div>
          </div>

          <ul className="space-y-2 border-t border-gray-100 pt-4">
            {getPlanFeatures(planKey, currency, isEuCa, commissionLabel ?? '3%').map(f => (
              <li key={f} className="flex items-center gap-2 text-xs text-gray-700">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: primaryColor }} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Message de sécurité */}
        <div className="flex items-start gap-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
          <ShieldCheck className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500">
            Paiement sécurisé par <strong>Stripe</strong>. Vos données bancaires ne transitent jamais
            par nos serveurs. Vous pouvez annuler votre abonnement à tout moment.
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: primaryColor }}
        >
          {loading
            ? <Loader2 className="h-5 w-5 animate-spin" />
            : <CreditCard className="h-5 w-5" />
          }
          {loading ? 'Redirection...' : `Payer ${amount} ${sym} par carte`}
        </button>

        <p className="text-center text-xs text-gray-400">
          En cliquant, vous serez redirigé vers Stripe pour finaliser le paiement.
        </p>
      </div>
    </div>
  )
}
