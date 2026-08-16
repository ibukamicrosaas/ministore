import type { PayoutMethodKey } from '@/lib/utils/country-groups'

// Source unique de vérité pour les frais de retrait (PAY OUT Bictorys) —
// distincts de la commission sur l'encaissement (voir commission.ts).
// Grille vérifiée contre le document tarifaire officiel Bictorys du
// 2026-08-16 (section 3, "Frais applicables pour la distribution des
// paiements — PAY OUT"). Deux composantes, gardées séparées pour rester
// auditables l'une de l'autre :
//  - le taux de l'opérateur mobile money, qui varie par pays et par opérateur
//  - les frais Bictorys eux-mêmes, fixes à 0,50% sur tous les pays/opérateurs
const BICTORYS_PAYOUT_FEE = 0.5

// Taux opérateur (%), avant ajout des frais Bictorys ci-dessus. Clé =
// PayoutMethodKey tel qu'utilisé dans le reste du code (pas le nom brut
// Bictorys) — voir PAYOUT_METHODS_BY_COUNTRY dans country-groups.ts pour la
// correspondance opérateur → méthode offerte par pays.
const OPERATOR_PAYOUT_RATE_BY_COUNTRY: Record<string, Partial<Record<PayoutMethodKey, number>>> = {
  SN: { wave: 1, orange_money: 1 },
  CI: { wave: 1.5, orange_money: 1.10, mtn: 1, moov: 1 },
  TG: { tmoney: 1, flooz: 1 }, // tmoney = Togocell, flooz = Moov Togo dans la grille Bictorys
  BK: { orange_money: 1.70, wave: 2, moov: 1.50 },
  BJ: { moov: 0.50, mtn: 0.50 },
  // ML absent de la grille Bictorys fournie — non confirmé, voir getPayoutFeeRate.
}

/**
 * Taux total de frais de retrait (opérateur + Bictorys), en pourcentage.
 * Retourne null si le taux n'est pas encore confirmé pour ce pays/méthode
 * (aujourd'hui : tout le Mali) — à afficher explicitement comme "à confirmer",
 * jamais comme 0% ou comme une valeur devinée.
 */
export function getPayoutFeeRate(country: string | null | undefined, method: PayoutMethodKey): number | null {
  const operatorRate = OPERATOR_PAYOUT_RATE_BY_COUNTRY[country ?? '']?.[method]
  if (operatorRate === undefined) return null
  return operatorRate + BICTORYS_PAYOUT_FEE
}
