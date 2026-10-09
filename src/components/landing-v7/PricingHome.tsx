'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AFRICA_PLANS } from '@/lib/billing/plans'
import { getCommissionRate, getCommissionRateRangeLabel } from '@/lib/billing/commission'

type PlanFeature = { label: string; locked?: boolean }

function planByKey(key: string) {
  const plan = AFRICA_PLANS.find(p => p.key === key)
  if (!plan) throw new Error(`Plan inconnu dans AFRICA_PLANS: ${key}`)
  return plan
}

function formatFcfa(n: number): string {
  return n.toLocaleString('fr-FR')
}

const business = planByKey('business')
const pro      = planByKey('pro')

// Copie dédiée à la home (lot A landing) — PricingV6.tsx n'est pas touché,
// les 4 pages pays continuent de l'utiliser tel quel. Différences avec
// PricingV6 : pas de carte Découverte (vitrine uniquement — AFRICA_PLANS et
// toute la logique d'abonnement restent intacts, /dashboard/upgrade
// continue d'afficher les 3 plans normalement) ; carte Marques en
// "Bientôt" sans formulaire ; ligne "Carte bancaire" ajoutée au
// comparatif, Pro uniquement ; ligne "Envoi et confirmation de livraison en
// 1 clic" retirée de l'argument différenciant (disponible sur tous les
// plans, vérifié dans SendToDeliveryButton.tsx — pas gardé par plan).
function buildPlans(commissionLabel: string) {
  return [
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
        { label: 'Tableau de bord avancé avec rapports de ventes' },
        { label: `${commissionLabel} sur les paiements en ligne, pour couvrir les frais des opérateurs` },
        { label: 'Image de couverture boutique', locked: true },
        { label: 'Domaine personnalisé (.com)', locked: true },
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
        { label: 'Domaine personnalisé (tonsite.com)' },
        { label: 'Image de couverture boutique' },
        { label: 'Marque TEKKIShop masquée — ta boutique, ta marque' },
        { label: 'Export CSV de tes commandes' },
        { label: 'Carte bancaire (via Stripe, à connecter)' },
        { label: 'Support prioritaire par WhatsApp' },
      ] as PlanFeature[],
      cta: { label: 'Choisir Pro', href: '/start?plan=pro', primary: false },
    },
  ]
}

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

export function PricingHome() {
  const [period, setPeriod] = useState<'month' | 'year'>('month')
  // Pays du visiteur pas connu sur la home générale — fourchette, jamais un taux figé.
  const commissionLabel = getCommissionRateRangeLabel()
  const PLANS = buildPlans(commissionLabel)

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
            <button className={period === 'month' ? 'on' : ''} aria-pressed={period === 'month'} onClick={() => setPeriod('month')}>Mensuel</button>
            <button className={period === 'year' ? 'on' : ''} aria-pressed={period === 'year'} onClick={() => setPeriod('year')}>
              Annuel <span className="save-pill">2 mois offerts</span>
            </button>
          </div>
        </div>

        <div className="plans reveal" style={{ maxWidth: 780, margin: '46px auto 0' }}>
          {PLANS.map((plan) => (
            <article key={plan.name} className={`plan${plan.best ? ' best' : ''}`}>
              {plan.badge && <div className="plan-badge">{plan.badge}</div>}
              <div className="plan-name">{plan.name}</div>
              <p className="plan-desc">{plan.desc}</p>
              <div className="price">
                <em>{period === 'month' ? plan.monthPrice : plan.yearPrice}</em>
                <span>FCFA / mois</span>
              </div>
              <p className="price-note">{period === 'month' ? plan.noteMonth : plan.noteYear}</p>
              <ul>
                <li className="head">{plan.headLine}</li>
                {plan.features.map(f => (
                  <li key={f.label} className={f.locked ? 'locked' : ''}>
                    {f.locked ? LOCK : CHECK}
                    {f.label}
                  </li>
                ))}
              </ul>
              <Link href={plan.cta.href} className={`btn ${plan.cta.primary ? 'btn-primary' : 'btn-secondary'} btn-full`}>
                {plan.cta.label}
              </Link>
              <p className="plan-pay-note">Paiement par mobile money ou CB</p>
            </article>
          ))}

          {/* Plan Marques — affichage seul, "Bientôt", aucun formulaire (la
              liste d'attente attend sa propre migration, validée séparément) */}
          <article className="plan soon">
            <div className="plan-badge" style={{ background: 'var(--ink)', color: '#fff' }}>Bientôt</div>
            <div className="plan-name">Marques</div>
            <p className="plan-desc">Pour les marques établies qui veulent un site complet.</p>
            <div className="price"><em>14 900</em><span>FCFA / mois</span></div>
            <p className="price-note">Disponible prochainement.</p>
            <ul>
              <li className="head">Pour les marques qui veulent aller plus loin</li>
              <li>{CHECK}Tout ce qu&rsquo;offre Pro</li>
              <li>{CHECK}Pages supplémentaires et pages collections</li>
              <li>{CHECK}Vendeur IA qui répond à tes clients</li>
            </ul>
            <button type="button" className="btn btn-secondary btn-full" disabled style={{ opacity: .6, cursor: 'not-allowed' }}>
              Être prévenu — bientôt
            </button>
            <p className="plan-pay-note">Liste d&rsquo;attente à venir</p>
          </article>
        </div>

        <details className="compare-wrap reveal">
          <summary>Voir ce que contient chaque plan en détail</summary>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Ce que tu peux faire</th>
                  <th style={{ textAlign: 'center' }}>Business</th>
                  <th style={{ textAlign: 'center' }}>Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr><th scope="row">Nombre de produits</th><td>Illimités</td><td>Illimités</td></tr>
                <tr><th scope="row">Assistant IA</th><td>50 msg/jour</td><td>Illimité</td></tr>
                <tr><th scope="row">Commission paiements en ligne</th><td>{commissionLabel}</td><td>{commissionLabel}</td></tr>
                <tr><th scope="row">Paiement mobile money</th><td className="yes">✓</td><td className="yes">✓</td></tr>
                <tr><th scope="row">Paiement à la livraison</th><td className="yes">✓</td><td className="yes">✓</td></tr>
                <tr><th scope="row">Tableau de bord avancé et rapports de ventes</th><td className="yes">✓</td><td className="yes">✓</td></tr>
                <tr><th scope="row">Image de couverture boutique</th><td className="no">—</td><td className="yes">✓</td></tr>
                <tr><th scope="row">Domaine personnalisé (.com)</th><td className="no">—</td><td className="yes">✓</td></tr>
                <tr><th scope="row">Marque TEKKIShop masquée</th><td className="no">—</td><td className="yes">✓</td></tr>
                <tr><th scope="row">Export CSV des commandes</th><td className="no">—</td><td className="yes">✓</td></tr>
                <tr><th scope="row">Carte bancaire (via Stripe, à connecter)</th><td className="no">—</td><td className="yes">✓</td></tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </section>
  )
}
