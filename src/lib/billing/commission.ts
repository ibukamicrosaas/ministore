// Source unique de vérité pour la commission TEKKIShop sur les paiements en
// ligne (PAY IN Bictorys) — jamais un taux tapé en dur ailleurs.
//
// Le taux dépend du pays (coût réel Bictorys différent selon les pays,
// vérifié contre leur grille tarifaire officielle le 2026-08-16) et jamais
// du plan de la boutique : le 0% n'est pas un avantage de plan, c'est ce qui
// se produit mécaniquement quand une boutique a configuré ses propres clés
// Bictorys (shops.bictorys_secret_key) — ses clients la paient en direct,
// l'argent ne transite jamais par la plateforme. Voir REPRISE.md §4.3.
export const COMMISSION_RATE_BY_COUNTRY: Record<string, number> = {
  SN: 3,
  CI: 3,
  BJ: 4,
  TG: 4,
  BK: 5,
  ML: 5, // temporaire — grille Bictorys Mali non confirmée, aligné sur BK en attendant
}

// Taux par défaut pour un pays non encore listé ci-dessus — jamais 0 par
// surprise, jamais un pays oublié qui se retrouve gratuit.
const DEFAULT_COMMISSION_RATE = 3

/**
 * Taux de commission réel applicable à une boutique, en pourcentage entier
 * (ex: 3 pour 3%). hasOwnBictorysKeys doit toujours venir de
 * `!!shop.bictorys_secret_key` — jamais de `shop.plan === 'pro'`.
 */
export function getCommissionRate(
  country: string | null | undefined,
  hasOwnBictorysKeys: boolean,
): number {
  if (hasOwnBictorysKeys) return 0
  return COMMISSION_RATE_BY_COUNTRY[country ?? ''] ?? DEFAULT_COMMISSION_RATE
}

const ALL_RATES = Object.values(COMMISSION_RATE_BY_COUNTRY)
export const MIN_COMMISSION_RATE = Math.min(...ALL_RATES)
export const MAX_COMMISSION_RATE = Math.max(...ALL_RATES)

/** Fourchette affichable sur les pages publiques sans contexte de pays connu. */
export function getCommissionRateRangeLabel(): string {
  return `${MIN_COMMISSION_RATE}% à ${MAX_COMMISSION_RATE}%`
}
