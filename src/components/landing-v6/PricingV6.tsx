'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AFRICA_PLANS } from '@/lib/billing/plans'

type PlanFeature = { label: string; locked?: boolean }

function planByKey(key: string) {
  const plan = AFRICA_PLANS.find(p => p.key === key)
  if (!plan) throw new Error(`Plan inconnu dans AFRICA_PLANS: ${key}`)
  return plan
}

function formatFcfa(n: number): string {
  return n.toLocaleString('fr-FR')
}

const decouverte = planByKey('decouverte')
const business   = planByKey('business')
const pro        = planByKey('pro')

// Prix annuel et note dérivés de AFRICA_PLANS.annualPrice — la même valeur
// que /dashboard/upgrade facture réellement, pas un -20% calculé à part.
// annualPrice = priceInt * 10 (2 mois offerts, pay 10 get 12) : le badge
// "2 mois offerts" ci-dessous reste donc exact tant que ce ratio tient côté
// plans.ts.
const PLANS = [
  {
    name: 'Découverte',
    desc: 'Pour lancer ta première boutique et tester tes ventes.',
    monthPrice: decouverte.price,
    yearPrice:  formatFcfa(Math.round(decouverte.annualPrice / 12)),
    noteMonth: 'Payé chaque mois. Tu peux arrêter quand tu veux.',
    noteYear:  `Soit ${formatFcfa(decouverte.annualPrice)} FCFA payés une fois dans l'année.`,
    headLine: 'Pour démarrer simplement',
    features: [
      { label: 'Jusqu\'à 10 produits en ligne' },
      { label: 'Paiement mobile money et à la livraison' },
      { label: 'Assistant IA (20 messages/jour)' },
      { label: 'Envoi et confirmation de livraison en 1 clic' },
      { label: 'Tableau de bord pour suivre tes ventes' },
      { label: '3% sur les paiements en ligne, pour couvrir les frais des opérateurs' },
      { label: 'Produits illimités', locked: true },
      { label: 'Image de couverture boutique', locked: true },
      { label: 'Domaine personnalisé (.com)', locked: true },
      { label: '0% de commission avec tes propres clés de paiement', locked: true },
    ] as PlanFeature[],
    cta: { label: 'Commencer', href: '/start?plan=decouverte', primary: false },
  },
  {
    name: 'Business',
    desc: 'La solution complète pour vendre sans limites.',
    monthPrice: business.price,
    yearPrice:  formatFcfa(Math.round(business.annualPrice / 12)),
    noteMonth: 'Payé chaque mois. Tu peux arrêter quand tu veux.',
    noteYear:  `Soit ${formatFcfa(business.annualPrice)} FCFA payés une fois dans l'année.`,
    headLine: 'Pour vendre sérieusement',
    badge: 'Le plus choisi',
    features: [
      { label: 'Produits illimités' },
      { label: 'Paiement mobile money et à la livraison' },
      { label: 'Assistant IA (50 messages/jour)' },
      { label: 'Envoi et confirmation de livraison en 1 clic' },
      { label: 'Codes promo pour fidéliser tes clients' },
      { label: 'Tableau de bord avancé avec rapports de ventes' },
      { label: '3% sur les paiements en ligne, pour couvrir les frais des opérateurs' },
      { label: 'Image de couverture boutique', locked: true },
      { label: 'Domaine personnalisé (.com)', locked: true },
      { label: '0% de commission avec tes propres clés de paiement', locked: true },
    ] as PlanFeature[],
    cta: { label: 'Choisir Business', href: '/start?plan=business', primary: true },
    best: true,
  },
  {
    name: 'Pro',
    desc: 'Pour les boutiques qui veulent une image professionnelle au maximum.',
    monthPrice: pro.price,
    yearPrice:  formatFcfa(Math.round(pro.annualPrice / 12)),
    noteMonth: 'Payé chaque mois. Tu peux arrêter quand tu veux.',
    noteYear:  `Soit ${formatFcfa(pro.annualPrice)} FCFA payés une fois dans l'année.`,
    headLine: 'Pour les boutiques qui grandissent',
    features: [
      { label: 'Tout ce qu\'offre Business' },
      { label: 'Assistant IA illimité pour ta boutique' },
      { label: '0% de commission avec tes propres clés de paiement' },
      { label: 'Domaine personnalisé (tonsite.com)' },
      { label: 'Image de couverture + produits Coups de cœur' },
      { label: 'Marque TEKKIShop masquée — ta boutique, ta marque' },
      { label: 'Export Excel de tes commandes' },
      { label: 'Support prioritaire par WhatsApp' },
    ] as PlanFeature[],
    cta: { label: 'Choisir Pro', href: '/start?plan=pro', primary: false },
  },
]

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

const LOCK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M15 9l-6 6M9 9l6 6"/>
  </svg>
)

export function PricingV6() {
  const [period, setPeriod] = useState<'month' | 'year'>('month')

  return (
    <section className="section" id="tarifs">
      <div className="container">
        <div className="section-head center reveal">
          <span className="label">Des prix accessibles</span>
          <h2>Vends dès aujourd&rsquo;hui. <span className="grad">Paie après avoir vendu.</span></h2>
          <p className="lead">Ta boutique est en ligne dès ton premier produit publié, et tes 3 premières commandes sont offertes. Tu choisis un plan seulement quand tu veux continuer à en recevoir.</p>
        </div>

        <div className="center reveal">
          <div className="toggle" role="group" aria-label="Choix de la période de facturation">
            <button
              className={period === 'month' ? 'on' : ''}
              aria-pressed={period === 'month'}
              onClick={() => setPeriod('month')}
            >
              Mensuel
            </button>
            <button
              className={period === 'year' ? 'on' : ''}
              aria-pressed={period === 'year'}
              onClick={() => setPeriod('year')}
            >
              Annuel <span className="save-pill">2 mois offerts</span>
            </button>
          </div>
        </div>

        <div className="plans reveal">
          {PLANS.map((plan) => (
            <article key={plan.name} className={`plan${plan.best ? ' best' : ''}`}>
              {plan.badge && <div className="plan-badge">{plan.badge}</div>}
              <div className="plan-name">{plan.name}</div>
              <p className="plan-desc">{plan.desc}</p>
              <div className="price">
                <em>{period === 'month' ? plan.monthPrice : plan.yearPrice}</em>
                <span>FCFA / mois</span>
              </div>
              <p className="price-note">
                {period === 'month' ? plan.noteMonth : plan.noteYear}
              </p>
              <ul>
                <li className="head">{plan.headLine}</li>
                {plan.features.map(f => (
                  <li key={f.label} className={f.locked ? 'locked' : ''}>
                    {f.locked ? LOCK : CHECK}
                    {f.label}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.cta.href}
                className={`btn ${plan.cta.primary ? 'btn-primary' : 'btn-secondary'} btn-full`}
              >
                {plan.cta.label}
              </Link>
              <p className="plan-pay-note">Paiement par mobile money ou CB</p>
            </article>
          ))}
        </div>

        <details className="compare-wrap reveal">
          <summary>Voir ce que contient chaque plan en détail</summary>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Ce que tu peux faire</th>
                  <th style={{ textAlign: 'center' }}>Découverte</th>
                  <th style={{ textAlign: 'center' }}>Business</th>
                  <th style={{ textAlign: 'center' }}>Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr><th scope="row">Nombre de produits</th><td>10 max</td><td>Illimités</td><td>Illimités</td></tr>
                <tr><th scope="row">Assistant IA</th><td>20 msg/jour</td><td>50 msg/jour</td><td>Illimité</td></tr>
                <tr><th scope="row">Commission paiements en ligne</th><td>3%</td><td>3%</td><td>0%*</td></tr>
                <tr><th scope="row">Paiement mobile money</th><td className="yes">✓</td><td className="yes">✓</td><td className="yes">✓</td></tr>
                <tr><th scope="row">Paiement à la livraison</th><td className="yes">✓</td><td className="yes">✓</td><td className="yes">✓</td></tr>
                <tr><th scope="row">Envoi et confirmation livraison</th><td className="yes">✓</td><td className="yes">✓</td><td className="yes">✓</td></tr>
                <tr><th scope="row">Image de couverture boutique</th><td className="no">—</td><td className="no">—</td><td className="yes">✓</td></tr>
                <tr><th scope="row">Domaine personnalisé (.com)</th><td className="no">—</td><td className="no">—</td><td className="yes">✓</td></tr>
                <tr><th scope="row">Marque TEKKIShop masquée</th><td className="no">—</td><td className="no">—</td><td className="yes">✓</td></tr>
                <tr><th scope="row">Export Excel des commandes</th><td className="no">—</td><td className="no">—</td><td className="yes">✓</td></tr>
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 13, color: '#697893', marginTop: 12 }}>
            * 0% uniquement si tu configures tes propres clés Bictorys (plan Pro, Paramètres → Paiements). Sans clés propres, la commission de 3% s&rsquo;applique comme sur les autres plans.
          </p>
        </details>
      </div>
    </section>
  )
}
