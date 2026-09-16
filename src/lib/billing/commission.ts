// Source unique de vérité pour la commission TEKKIShop sur les paiements en
// ligne (PAY IN Bictorys) — jamais un taux tapé en dur ailleurs.
//
// Le taux dépend uniquement du pays (coût réel Bictorys différent selon les
// pays, vérifié contre leur grille tarifaire officielle le 2026-08-16),
// jamais du plan de la boutique. Jusqu'au 2026-09, un mécanisme permettait un
// 0% mécanique si la boutique configurait ses propres clés Bictorys — retiré
// (0 boutique ne l'a jamais utilisé, retrait instantané depuis Revenus le
// rendait redondant). Voir REPRISE.md §4.3 et le chantier de retrait 2026-09.
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
 * (ex: 3 pour 3%).
 */
export function getCommissionRate(
  country: string | null | undefined,
): number {
  return COMMISSION_RATE_BY_COUNTRY[country ?? ''] ?? DEFAULT_COMMISSION_RATE
}

const ALL_RATES = Object.values(COMMISSION_RATE_BY_COUNTRY)
export const MIN_COMMISSION_RATE = Math.min(...ALL_RATES)
export const MAX_COMMISSION_RATE = Math.max(...ALL_RATES)

/** Fourchette affichable sur les pages publiques sans contexte de pays connu. */
export function getCommissionRateRangeLabel(): string {
  return `${MIN_COMMISSION_RATE}% à ${MAX_COMMISSION_RATE}%`
}
