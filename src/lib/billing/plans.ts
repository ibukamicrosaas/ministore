import type { Plan } from '@/app/dashboard/upgrade/UpgradePlans'
import { isEuCaCountry, getCurrencyForCountry } from '@/lib/utils/country-groups'

export const AFRICA_PLANS: Plan[] = [
  {
    key:          'decouverte',
    name:         'Découverte',
    price:        '2 900',
    priceInt:     2900,
    annualPrice:  29000,
    description:  'Pour commencer simplement',
    promo:        null,
    currency:     'XOF',
    features: [
      'Boutique en ligne immédiatement',
      "Jusqu'à 10 produits actifs",
      'Paiements Wave & Orange Money',
      'Paiement à la livraison',
      'Suivi des commandes en temps réel',
      '3% de commission sur paiements en ligne',
    ],
    highlighted: false,
  },
  {
    key:          'business',
    name:         'Business',
    price:        '4 900',
    priceInt:     4900,
    annualPrice:  49000,
    description:  'Le plus populaire',
    promo:        '🎁 1 MOIS OFFERT — OFFRE DE LANCEMENT',
    currency:     'XOF',
    features: [
      'Tout du plan Découverte',
      'Produits illimités',
      'Confirmations WhatsApp automatiques aux clients',
      'Rappels J-1 avant livraison',
      'Alertes retour en stock pour tes clients',
      'Codes promo & réductions',
      'Dashboard optimisé sur mobile',
      '3% de commission sur paiements en ligne',
    ],
    highlighted: true,
  },
  {
    key:          'pro',
    name:         'Pro',
    price:        '9 900',
    priceInt:     9900,
    annualPrice:  99000,
    description:  'Pour les boutiques ambitieuses',
    promo:        null,
    currency:     'XOF',
    features: [
      'Tout du plan Business',
      '0% de commission sur paiements en ligne',
      'Domaine personnalisé (tonsite.com)',
      'Section "À propos" avec photo de boutique',
      'Statistiques avancées & analyses',
      'Export CSV de tes commandes',
      'Meta Pixel (suivi Facebook/Instagram Ads)',
      'Paiement par carte bancaire (Stripe Connect)',
      'Support prioritaire WhatsApp',
    ],
    highlighted: false,
  },
]

export const EU_CA_PRO_PLAN_EUR: Plan = {
  key:          'pro',
  name:         'Pro',
  price:        '14,90',
  priceInt:     1490,
  annualPrice:  14900,
  description:  'Le seul plan disponible pour votre marché',
  promo:        null,
  currency:     'EUR',
  features: [
    'Boutique en ligne immédiatement',
    'Produits illimités',
    'Paiement par carte bancaire (Stripe)',
    'Domaine personnalisé (tonsite.com)',
    'Section "À propos" avec photo de boutique',
    'Stripe Connect — recevez les paiements directement',
    'Statistiques avancées & export CSV',
    'Notifications automatiques à vos clients',
    'Meta Pixel (Facebook/Instagram Ads)',
    '0% de commission sur vos ventes',
    'Support prioritaire WhatsApp',
  ],
  highlighted: true,
}

export const EU_CA_PRO_PLAN_CAD: Plan = {
  ...EU_CA_PRO_PLAN_EUR,
  price:       '19,90',
  priceInt:    1990,
  annualPrice: 19900,
  currency:    'CAD',
}

export function getPlansForCountry(country: string | null | undefined): { plans: Plan[]; isEuCa: boolean } {
  const isEuCa = isEuCaCountry(country)
  if (!isEuCa) return { plans: AFRICA_PLANS, isEuCa }
  const currency = getCurrencyForCountry(country)
  return { plans: [currency === 'CAD' ? EU_CA_PRO_PLAN_CAD : EU_CA_PRO_PLAN_EUR], isEuCa }
}
