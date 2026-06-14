'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, Zap } from 'lucide-react'

const MONTHLY = 'monthly'
const ANNUAL  = 'annual'
type Billing = typeof MONTHLY | typeof ANNUAL

const PLANS = [
  {
    key: 'decouverte',
    name: 'Découverte',
    badge: null,
    highlight: false,
    monthly: 2900,
    annual: 29000,
    annualPerMonth: Math.round(29000 / 12),
    cta: 'Commencer',
    ctaStyle: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
    note: 'Paiement par Wave ou Orange Money',
    features: [
      { text: 'Jusqu\'à 10 produits', included: true },
      { text: 'Ton site en ligne immédiatement', included: true },
      { text: 'Page produit avec photos et prix', included: true },
      { text: 'Paiement Wave & Orange Money', included: true },
      { text: 'Paiement à la livraison', included: true },
      { text: '3% de commission sur paiements', included: true },
      { text: 'Commandes illimitées', included: true },
      { text: 'Tableau de bord basique', included: true },
      { text: 'Produits illimités', included: false },
      { text: 'Image de couverture boutique', included: false },
      { text: 'Section "À propos" boutique', included: false },
      { text: 'Domaine personnalisé (.com)', included: false },
      { text: '0% de commission', included: false },
    ],
    diff: 'Idéal pour tester TekkiShop avec quelques produits.',
  },
  {
    key: 'business',
    name: 'Business',
    badge: '🎁 1 MOIS OFFERT',
    highlight: true,
    monthly: 4900,
    annual: 49000,
    annualPerMonth: Math.round(49000 / 12),
    cta: 'Créer mon site',
    ctaStyle: 'bg-white text-sky-600 font-bold hover:opacity-90 shadow-sm',
    note: 'Paiement par Wave ou Orange Money',
    features: [
      { text: 'Produits illimités', included: true },
      { text: 'Ton site en ligne immédiatement', included: true },
      { text: 'Page produit avec photos et prix', included: true },
      { text: 'Paiement Wave & Orange Money', included: true },
      { text: 'Paiement à la livraison', included: true },
      { text: '3% de commission sur paiements', included: true },
      { text: 'Commandes illimitées', included: true },
      { text: 'Tableau de bord avancé + rapports', included: true },
      { text: 'Notifications WhatsApp automatiques', included: true },
      { text: 'Codes promo pour tes clients', included: true },
      { text: 'Image de couverture boutique', included: false },
      { text: 'Domaine personnalisé (.com)', included: false },
      { text: '0% de commission', included: false },
    ],
    diff: 'La solution complète pour vendre sans limites.',
  },
  {
    key: 'pro',
    name: 'Pro',
    badge: null,
    highlight: false,
    monthly: 9900,
    annual: 99000,
    annualPerMonth: Math.round(99000 / 12),
    cta: 'Choisir Pro',
    ctaStyle: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
    note: 'Paiement par Wave ou Orange Money',
    features: [
      { text: 'Tout du plan Business', included: true },
      { text: '0% de commission sur paiements', included: true },
      { text: 'Image de couverture boutique', included: true },
      { text: 'Section "À propos" + photo boutique', included: true },
      { text: 'Produits "Coup de cœur" mis en avant', included: true },
      { text: 'Domaine personnalisé (monbusiness.com)', included: true },
      { text: 'Branding TekkiShop masqué', included: true },
      { text: 'Statistiques avancées', included: true },
      { text: 'Export CSV de toutes tes commandes', included: true },
      { text: 'Support prioritaire WhatsApp', included: true },
    ],
    diff: 'Pour les boutiques qui veulent une image professionnelle au maximum.',
  },
]

export function PricingSection() {
  const [billing, setBilling] = useState<Billing>(MONTHLY)

  return (
    <section id="tarifs" className="mx-auto max-w-5xl px-4 py-20">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3">Tarifs</p>
        <h2
          className="text-3xl sm:text-4xl font-black text-gray-900 mb-3"
          style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
        >
          Un tarif simple et honnête
        </h2>
        <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
          Tu paies par Wave ou Orange Money. Ton site est en ligne en quelques minutes.
        </p>

        {/* Toggle mensuel / annuel */}
        <div className="inline-flex items-center rounded-2xl bg-gray-100 p-1 gap-1">
          <button
            onClick={() => setBilling(MONTHLY)}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
              billing === MONTHLY
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBilling(ANNUAL)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
              billing === ANNUAL
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Annuel
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              2 MOIS OFFERTS
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-3 gap-5 items-start">
        {PLANS.map((plan) => {
          const price = billing === MONTHLY ? plan.monthly : plan.annualPerMonth
          const isAnnual = billing === ANNUAL

          return (
            <div
              key={plan.key}
              className={`relative rounded-3xl p-6 flex flex-col ${
                plan.highlight
                  ? 'bg-[var(--color-primary)] ring-4 ring-sky-200 shadow-xl'
                  : 'border border-gray-200 bg-white'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black text-amber-900 shadow-sm whitespace-nowrap">
                    <Zap className="h-3 w-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan name */}
              <p className={`text-xs font-bold uppercase tracking-wide mb-1 mt-2 ${plan.highlight ? 'text-sky-200' : 'text-gray-400'}`}>
                {plan.name}
              </p>

              {/* Price */}
              <div className="flex items-end gap-1.5 mb-1">
                <p className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {price.toLocaleString('fr-FR')}
                </p>
                <p className={`text-sm mb-1.5 ${plan.highlight ? 'text-white/80' : 'text-gray-500'}`}>FCFA</p>
              </div>

              {isAnnual ? (
                <>
                  <p className={`text-xs mb-0.5 ${plan.highlight ? 'text-sky-200' : 'text-gray-400'}`}>
                    /mois · facturé <strong className={plan.highlight ? 'text-white' : 'text-gray-700'}>{plan.annual.toLocaleString('fr-FR')} FCFA/an</strong>
                  </p>
                  <p className={`text-[11px] mb-6 ${plan.highlight ? 'text-sky-300/70' : 'text-emerald-600 font-semibold'}`}>
                    Économie de {(plan.monthly * 12 - plan.annual).toLocaleString('fr-FR')} FCFA/an
                  </p>
                </>
              ) : (
                <>
                  {plan.highlight ? (
                    <>
                      <p className="text-sky-200 text-xs mb-1">pour <strong className="text-white">2 mois</strong> — au lieu de 1</p>
                      <p className="text-sky-300/70 text-[11px] mb-6">Puis {plan.monthly.toLocaleString('fr-FR')} FCFA/mois</p>
                    </>
                  ) : (
                    <p className={`text-xs mb-6 ${plan.highlight ? 'text-sky-200' : 'text-gray-400'}`}>/mois</p>
                  )}
                </>
              )}

              {/* Pitch différenciateur */}
              <p className={`text-xs mb-5 leading-relaxed px-0 ${plan.highlight ? 'text-sky-100' : 'text-gray-500'}`}>
                {plan.diff}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className={`flex items-start gap-2 text-sm ${
                    f.included
                      ? plan.highlight ? 'text-sky-100' : 'text-gray-700'
                      : plan.highlight ? 'text-sky-300/40 line-through' : 'text-gray-300 line-through'
                  }`}>
                    {f.included ? (
                      <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-sky-200' : 'text-emerald-500'}`} />
                    ) : (
                      <XCircle className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-sky-400/40' : 'text-gray-200'}`} />
                    )}
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/onboarding"
                className={`block w-full rounded-2xl py-3 text-center text-sm font-semibold transition-all ${plan.ctaStyle}`}
              >
                {plan.cta}
                {plan.key === 'business' && billing === MONTHLY && ' — 4 900 FCFA'}
                {plan.key === 'business' && billing === ANNUAL && ' — 49 000 FCFA/an'}
              </Link>
              <p className={`text-center text-[11px] mt-3 ${plan.highlight ? 'text-sky-300/70' : 'text-gray-400'}`}>
                {plan.note}
              </p>
            </div>
          )
        })}
      </div>

      {/* Comparaison rapide */}
      <div className="mt-10 rounded-2xl bg-gray-50 border border-gray-100 p-5">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
          Résumé des différences clés
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-gray-500 font-medium pb-3 pr-4"></th>
                <th className="text-center text-gray-700 font-bold pb-3 px-2">Découverte</th>
                <th className="text-center text-[var(--color-primary)] font-bold pb-3 px-2">Business</th>
                <th className="text-center text-gray-700 font-bold pb-3 px-2">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { label: 'Produits', d: '10 max', b: 'Illimités', p: 'Illimités' },
                { label: 'Commission paiements', d: '3%', b: '3%', p: '0%' },
                { label: 'Image de couverture', d: '✗', b: '✗', p: '✓' },
                { label: 'Section À propos', d: '✗', b: '✗', p: '✓' },
                { label: 'Domaine personnalisé', d: '✗', b: '✗', p: '✓' },
                { label: 'Branding TekkiShop', d: 'Visible', b: 'Visible', p: 'Masqué' },
              ].map((row) => (
                <tr key={row.label}>
                  <td className="py-2.5 pr-4 text-gray-500 font-medium">{row.label}</td>
                  <td className="py-2.5 px-2 text-center text-gray-600">{row.d}</td>
                  <td className="py-2.5 px-2 text-center text-[var(--color-primary)] font-semibold">{row.b}</td>
                  <td className="py-2.5 px-2 text-center text-gray-600">{row.p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
