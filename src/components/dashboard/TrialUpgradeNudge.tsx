'use client'

import Link from 'next/link'
import { Check, Zap, Package, CreditCard, Rocket } from 'lucide-react'

interface Props {
  hasProducts: boolean
  hasPayoutNumbers: boolean
}

const STEPS = [
  {
    id:          'products',
    icon:        Package,
    label:       'Produits ajoutés',
    description: 'Ajoute au moins un produit pour que tes clients puissent commander.',
    href:        '/dashboard/products/new',
    cta:         'Ajouter',
  },
  {
    id:          'payout',
    icon:        CreditCard,
    label:       'Paiement configuré',
    description: 'Ajoute ton numéro Wave ou Orange Money pour recevoir tes paiements.',
    href:        '/dashboard/settings',
    cta:         'Configurer',
  },
  {
    id:          'activate',
    icon:        Rocket,
    label:       'Boutique activée',
    description: 'Choisis un plan pour rendre ta boutique visible et recevoir des commandes.',
    href:        '/dashboard/upgrade',
    cta:         'Activer',
  },
] as const

export function TrialUpgradeNudge({ hasProducts, hasPayoutNumbers }: Props) {
  const stepDone = [hasProducts, hasPayoutNumbers, false]
  const doneCount = stepDone.filter(Boolean).length

  const headline =
    doneCount === 2 ? 'Votre boutique est prête — activez-la !' :
    doneCount === 1 ? 'Encore 2 étapes avant le lancement'       :
                     'Lancez votre boutique en 3 étapes'

  return (
    <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-sm">

      {/* En-tête */}
      <div className="mb-3">
        <h2 className="text-sm font-bold text-gray-900">🚀 {headline}</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Votre boutique n&apos;est pas visible tant qu&apos;elle n&apos;est pas activée.
        </p>
      </div>

      {/* Barre de progression */}
      <div className="mb-4 h-1.5 rounded-full bg-orange-200">
        <div
          className="h-1.5 rounded-full bg-orange-500 transition-all duration-500"
          style={{ width: `${(doneCount / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Étapes */}
      <div className="space-y-2 mb-4">
        {STEPS.map((step, i) => {
          const done = stepDone[i]
          const Icon = step.icon
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${done ? 'bg-white/60' : 'bg-white shadow-sm'}`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done ? 'bg-green-100' : 'bg-orange-100'}`}>
                {done
                  ? <Check className="h-4 w-4 text-green-600" />
                  : <Icon className="h-4 w-4 text-orange-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {step.label}
                </p>
                {!done && (
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.description}</p>
                )}
              </div>
              {done ? (
                <span className="text-xs font-semibold text-green-600 shrink-0">✓ Fait</span>
              ) : (
                <Link
                  href={step.href}
                  className="shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
                >
                  {step.cta}
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA principal */}
      <Link
        href="/dashboard/upgrade"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
      >
        <Zap className="h-4 w-4" />
        Activer ma boutique
      </Link>
    </div>
  )
}
