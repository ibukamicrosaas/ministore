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
    note: 'Paiement par mobile money ou CB',
    features: [
      { text: 'Jusqu\'à 10 produits en ligne', included: true },
      { text: 'Tes clients paient par mobile money ou à la livraison', included: true },
      { text: 'Assistant IA inclus (20 messages/jour) pour gérer ta boutique', included: true },
      { text: 'Livraison simplifiée : envoi et confirmation en 1 clic avec ton livreur', included: true },
      { text: 'Un tableau de bord pour suivre tes ventes', included: true },
      { text: '3% de commission sur les paiements en ligne', included: true },
      { text: 'Produits illimités', included: false },
      { text: 'Image de couverture boutique', included: false },
      { text: 'Domaine personnalisé (.com)', included: false },
      { text: '0% de commission', included: false },
    ],
    diff: 'Idéal pour tester TekkiShop avec quelques produits.',
  },
  {
    key: 'business',
    name: 'Business',
    badge: '⭐ Le plus choisi',
    highlight: true,
    monthly: 4900,
    annual: 49000,
    annualPerMonth: Math.round(49000 / 12),
    cta: 'Créer ma boutique',
    ctaStyle: 'bg-white text-sky-600 font-bold hover:opacity-90 shadow-sm',
    note: 'Paiement par mobile money ou CB',
    features: [
      { text: 'Produits illimités', included: true },
      { text: 'Tes clients paient par mobile money ou à la livraison', included: true },
      { text: 'Assistant IA inclus (50 messages/jour) pour gérer ta boutique', included: true },
      { text: 'Livraison simplifiée : envoi et confirmation en 1 clic avec ton livreur', included: true },
      { text: 'Notifications WhatsApp automatiques à chaque commande', included: true },
      { text: 'Codes promo pour fidéliser tes clients', included: true },
      { text: 'Tableau de bord avancé avec rapports de ventes', included: true },
      { text: '3% de commission sur les paiements en ligne', included: true },
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
    note: 'Paiement par mobile money ou CB',
    features: [
      { text: 'Tout ce qu\'offre Business', included: true },
      { text: 'Assistant IA illimité pour piloter ta boutique à tout moment', included: true },
      { text: '0% de commission sur tous tes paiements', included: true },
      { text: 'Domaine personnalisé (tonsite.com)', included: true },
      { text: 'Image de couverture + produits « Coup de cœur » mis en avant', included: true },
      { text: 'Marque TekkiShop masquée — ta boutique, ta marque', included: true },
      { text: 'Télécharge toutes tes commandes en fichier Excel', included: true },
      { text: 'Support prioritaire par WhatsApp', included: true },
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
          className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 mb-4"
          style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
        >
          Crée ta boutique gratuitement. Paie seulement quand tu es prêt à vendre.
        </h2>
        <p className="text-gray-500 text-lg max-w-md mx-auto mb-8">
          Tu paies ton abonnement par mobile money ou carte bancaire. Tu peux arrêter quand tu veux.
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
                <p className={`text-xs mb-6 ${plan.highlight ? 'text-sky-200' : 'text-gray-400'}`}>/mois</p>
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
                { label: 'Assistant IA', d: '20 msg/jour', b: '50 msg/jour', p: 'Illimité' },
                { label: 'Commission paiements', d: '3%', b: '3%', p: '0%' },
                { label: 'Image de couverture', d: '✗', b: '✗', p: '✓' },
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
