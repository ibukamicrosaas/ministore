import type { Plan } from '@/app/dashboard/upgrade/UpgradePlans'
import { isEuCaCountry, getCurrencyForCountry } from '@/lib/utils/country-groups'
import { getCommissionRate } from '@/lib/billing/commission'

// Marqueur remplacé par le taux réel du pays au moment de la résolution —
// jamais un pourcentage tapé en dur dans la liste de base, voir
// resolvePlanFeatures() et getPlansForCountry() ci-dessous.
const COMMISSION_MARKER = '{{COMMISSION}}'

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
      "Jusqu'à 10 produits actifs",
      'Paiements Wave & Orange Money',
      'Paiement à la livraison',
      'Suivi des commandes en temps réel',
      `${COMMISSION_MARKER} de commission sur paiements en ligne`,
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
    promo:        null,
    currency:     'XOF',
    features: [
      'Tout du plan Découverte',
      'Produits illimités',
      'Alertes retour en stock pour tes clients',
      'Codes promo & réductions',
      'Dashboard optimisé sur mobile',
      `${COMMISSION_MARKER} de commission sur paiements en ligne`,
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
      '0% de commission avec tes propres clés Bictorys',
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

/**
 * Remplace le marqueur de commission par le taux réel — jamais utilisé
 * en dehors de ce fichier pour la résolution automatique via
 * getPlansForCountry(), mais exporté pour les rares consommateurs qui ne
 * passent pas par cette fonction (voir StripeSubscriptionCheckoutForm.tsx).
 */
export function resolvePlanFeatures(features: string[], commissionLabel: string): string[] {
  return features.map(f => f.replace(COMMISSION_MARKER, commissionLabel))
}

export function getPlansForCountry(country: string | null | undefined): { plans: Plan[]; isEuCa: boolean } {
  const isEuCa = isEuCaCountry(country)
  if (isEuCa) {
    const currency = getCurrencyForCountry(country)
    return { plans: [currency === 'CAD' ? EU_CA_PRO_PLAN_CAD : EU_CA_PRO_PLAN_EUR], isEuCa }
  }

  // Le taux dépend du pays réel de la boutique — jamais un plan ne détient
  // ses propres clés Bictorys tant qu'il n'est pas Pro et configuré
  // manuellement (Paramètres → Paiements), donc toujours false ici : cette
  // liste sert à choisir/comparer un plan, pas à refléter un état déjà acquis.
  const commissionLabel = `${getCommissionRate(country, false)}%`
  const plans = AFRICA_PLANS.map(p => ({ ...p, features: resolvePlanFeatures(p.features, commissionLabel) }))
  return { plans, isEuCa }
}
