// Point de vérité unique pour tout ce qui dépend du plan d'une boutique sur
// les pages publiques (accueil, fiche produit) et les réglages associés.
//
// TODO : coverImage et richDescription sont encore réservés à 'pro'
// ci-dessous, alors que la décision arrêtée (REPRISE.md §5) est : coverImage
// descend à 'business' ; richDescription (les images dans la description
// produit) s'ouvre aux trois plans, tranché au même titre que socialLinks —
// ce que voit l'acheteur ne dépend pas du plan du marchand. Pas une
// hypothèse : à corriger avec le reste de la page Tarifs, pas isolément.
//
// Aucun `if (plan === 'pro')` ne doit exister en dehors de ce fichier et des
// points d'application qui l'importent — à l'exception explicite de
// src/app/api/payments/bictorys/create/route.ts et
// src/app/api/checkout/bictorys/create/route.ts, qui choisissent la clé API
// Bictorys (marchand ou plateforme) : un sujet d'infrastructure de paiement,
// pas un drapeau de fonctionnalité boutique, volontairement hors de cette
// matrice.

export type PlanKey = 'decouverte' | 'business' | 'pro'

export interface PlanFeatures {
  coverImage: boolean
  featuredProducts: boolean
  customDomain: boolean
  hideTekkishopFooter: boolean
  socialLinks: boolean
  verificationEligible: boolean
  productLimit: number | null // null = illimité
  richDescription: boolean // rendu des images inline (![alt](url)) dans la description produit
}

export const PLAN_FEATURES: Record<PlanKey, PlanFeatures> = {
  decouverte: {
    coverImage:           false,
    featuredProducts:     true,
    customDomain:         false,
    hideTekkishopFooter:  false,
    socialLinks:          true,
    verificationEligible: true,
    productLimit:         10,
    richDescription:      false,
  },
  business: {
    coverImage:           false,
    featuredProducts:     true,
    customDomain:         false,
    hideTekkishopFooter:  false,
    socialLinks:          true,
    verificationEligible: true,
    productLimit:         null,
    richDescription:      false,
  },
  pro: {
    coverImage:           true,
    featuredProducts:     true,
    customDomain:         true,
    hideTekkishopFooter:  true,
    socialLinks:          true,
    verificationEligible: true,
    productLimit:         null,
    richDescription:      true,
  },
}

const VALID_PLAN_KEYS = new Set<PlanKey>(['decouverte', 'business', 'pro'])

// shops.plan CHECK autorise aussi la valeur 'trial' (boutique legacy en
// essai, avant tout paiement — 1 375 boutiques au 2026-08-13). 'trial'
// n'étant pas dans VALID_PLAN_KEYS, elle retombe ici sur 'decouverte' :
// effet voulu, pas un oubli — une boutique en essai hérite donc du plafond
// de 10 produits actifs de Découverte tant qu'elle n'a pas payé un plan.
function normalizePlan(plan: string | null | undefined): PlanKey {
  return plan && VALID_PLAN_KEYS.has(plan as PlanKey) ? (plan as PlanKey) : 'decouverte'
}

export function getPlanFeatures(plan: string | null | undefined): PlanFeatures {
  return PLAN_FEATURES[normalizePlan(plan)]
}

export function canUseCustomDomain(plan: string | null | undefined): boolean {
  return getPlanFeatures(plan).customDomain
}

export function canHideTekkishopFooter(plan: string | null | undefined): boolean {
  return getPlanFeatures(plan).hideTekkishopFooter
}

export function canShowCoverImage(plan: string | null | undefined): boolean {
  return getPlanFeatures(plan).coverImage
}

export function hasRichDescription(plan: string | null | undefined): boolean {
  return getPlanFeatures(plan).richDescription
}

// null = illimité, jamais bloquant.
export function getProductLimit(plan: string | null | undefined): number | null {
  return getPlanFeatures(plan).productLimit
}

// Gate à la création uniquement — ne détermine jamais si un produit déjà
// actif doit être désactivé. `activeCount` doit être le nombre de produits
// actifs AVANT l'opération candidate (création, réactivation, ou taille d'un
// lot d'import) ; `additionalCount` le nombre de produits que l'opération
// ajouterait aux actifs.
export function canAddActiveProducts(
  plan: string | null | undefined,
  activeCount: number,
  additionalCount = 1,
): boolean {
  const limit = getProductLimit(plan)
  if (limit === null) return true
  return activeCount + additionalCount <= limit
}

const PLAN_LABELS: Record<PlanKey, string> = { decouverte: 'Découverte', business: 'Business', pro: 'Pro' }

// Du moins cher au plus cher — condition de correction de minimumPlanLabel
// ci-dessous (le premier plan de la liste qui satisfait le check est censé
// être le minimum), pas une convention d'affichage. Un ajout de plan doit
// être inséré au bon rang ici, pas juste ajouté en fin de tableau.
const PLAN_ORDER: PlanKey[] = ['decouverte', 'business', 'pro']

// Nom du plan le moins cher qui satisfait un check donné (canUseCustomDomain,
// canHideTekkishopFooter, etc.) — dérivé de PLAN_FEATURES, jamais codé en dur
// dans un message d'erreur : reste vrai quand la matrice bouge.
export function minimumPlanLabel(check: (plan: string | null | undefined) => boolean): string {
  const key = PLAN_ORDER.find(k => check(k)) ?? 'pro'
  return PLAN_LABELS[key]
}
