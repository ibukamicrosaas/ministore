import { getPaymentMethodsForTargetCountries, type BictorysCountry } from '@/lib/payments/payment-methods'

// Règle de paiement Vitrine (PLAN-THEME-VITRINE.md §18, décidée après l'étape 0
// du Lot A) — DÉLIBÉRÉMENT PLUS STRICTE que Classique, qui ignore
// `accept_online_payment` pour l'affichage (ShopHomeLayout.tsx:153-162,
// produit/[id]/page.tsx:237-239 — vérifié, non corrigé, chantier séparé) :
//
// 1. Si accept_online_payment === false (strictement), aucun moyen mobile
//    money n'est affiché, nulle part (bande de faits, avant de commander,
//    pied de page, texte des 3 étapes).
// 2. Sinon, les moyens du pays tels que définis dans payment-methods.ts,
//    sans filtrage sur un usage déjà constaté.
// 3. "Carte bancaire" reste piloté uniquement par stripe_connect_enabled,
//    indépendamment de accept_online_payment — comme Classique.
// 4. "Paiement à la livraison" reste piloté uniquement par
//    accept_cash_on_delivery — comme Classique.
// 5. Repli générique "Mobile money" seulement si le paiement en ligne est
//    activé ET que le pays n'a aucun moyen listé dans payment-methods.ts.
//
// Lot A, 2e passe : bande « Paiement » et « Avant de commander » = 3 premiers
// moyens mobile money seulement (« … » si d'autres existent) ; le pied de page
// affiche TOUT, en logos (`logo` = chemin existant de payment-methods.ts,
// jamais un fichier créé dans public/).
export const MOBILE_MONEY_PREVIEW_MAX = 3

export interface VitrinePaymentItem {
  label: string
  /** Chemin d'un logo existant dans public/logo-payments, sinon undefined (repli en pilule de texte). */
  logo?: string
}

export interface VitrinePaymentInfo {
  mobileMoney: VitrinePaymentItem[]
  mobileMoneyLabels: string[]
  hasCard: boolean
  hasCash: boolean
  hasAnyPayment: boolean
  allLabels: string[]
  /** Tous les moyens, dans l'ordre : mobile money, carte, espèces (pied de page). */
  allItems: VitrinePaymentItem[]
}

export function getVitrinePaymentInfo(shop: {
  country?: string | null
  target_countries?: string[] | null
  accept_online_payment?: boolean | null
  accept_cash_on_delivery?: boolean | null
  stripe_connect_enabled?: boolean | null
}): VitrinePaymentInfo {
  const onlinePaymentEnabled = shop.accept_online_payment !== false

  const countryMethods = onlinePaymentEnabled
    ? getPaymentMethodsForTargetCountries((shop.country as BictorysCountry) ?? null, shop.target_countries)
    : []

  const mobileMoney: VitrinePaymentItem[] = !onlinePaymentEnabled
    ? []
    : countryMethods.length > 0
      ? countryMethods.map(m => ({ label: m.label, logo: m.icon }))
      : [{ label: 'Mobile money' }]

  const hasCard = !!shop.stripe_connect_enabled
  const hasCash = !!shop.accept_cash_on_delivery

  const allItems: VitrinePaymentItem[] = [
    ...mobileMoney,
    ...(hasCard ? [{ label: 'Carte bancaire' }] : []),
    ...(hasCash ? [{ label: 'Paiement à la livraison' }] : []),
  ]
  const mobileMoneyLabels = mobileMoney.map(m => m.label)

  return {
    mobileMoney,
    mobileMoneyLabels,
    hasCard,
    hasCash,
    hasAnyPayment: allItems.length > 0,
    allLabels: allItems.map(i => i.label),
    allItems,
  }
}

/**
 * Phrase courte pour la bande « Paiement » et « Avant de commander » :
 * « Wave, Orange Money, MTN Money… ou espèces à la livraison. »
 */
export function summarizePayment(p: VitrinePaymentInfo): string {
  const shown = p.mobileMoneyLabels.slice(0, MOBILE_MONEY_PREVIEW_MAX)
  const more = p.mobileMoneyLabels.length > MOBILE_MONEY_PREVIEW_MAX
  const parts: string[] = []
  if (shown.length > 0) parts.push(shown.join(', ') + (more ? '…' : ''))
  if (p.hasCard) parts.push('carte bancaire')
  if (p.hasCash) parts.push('espèces à la livraison')
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts.slice(0, -1).join(', ')} ou ${parts[parts.length - 1]}`
}

/**
 * Texte de l'étape 3 de « Commander, c'est simple » — uniquement des faits
 * réellement affichés ailleurs sur la page. Sans aucun moyen : aucune promesse
 * de paiement (titre et texte neutres).
 */
export function getStep3(p: VitrinePaymentInfo): { title: string; text: string } {
  const mm = p.mobileMoney.length > 0
  if (!mm && !p.hasCard && !p.hasCash) {
    return { title: 'Valide ta commande', text: 'Le marchand te recontacte pour la suite.' }
  }
  const parts: string[] = []
  if (mm) parts.push('par mobile money, tout de suite')
  if (p.hasCard) parts.push('par carte bancaire')
  if (p.hasCash) parts.push('en espèces, à la livraison')
  const sentence = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')}, ou ${parts[parts.length - 1]}`
  const text = sentence.charAt(0).toUpperCase() + sentence.slice(1)
  return { title: 'Paie comme tu préfères', text: `${text}.` }
}
