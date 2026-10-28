// Source unique du solde marchand (paiements en ligne Bictorys). Page Revenus,
// route de retrait, retrait manuel admin, Admin Finances et assistant IA
// passent tous par computeBalance : aucun ne refait la formule de son côté.
//
// Fichier volontairement pur (aucun import, aucun accès base) pour être testé
// avec des données fictives, voir tests/billing/balance.test.mjs. Le
// chargement des lignes est dans balance-data.ts.
//
// Formule :
//  - un paiement dont la commande est encore retenue (is_held=true,
//    released_at IS NULL) n'est pas disponible, il est compté à part ;
//  - un retrait pending / processing / completed consomme du BRUT
//    (gross_amount, avant commission). Un retrait failed ne consomme rien ;
//  - la commission est prélevée une seule fois, sur le brut restant :
//    disponible = restant - floor(restant x taux).
//
// Soustraire gross_amount (et non net_amount) est ce qui fait disparaître le
// résidu des anciens retraits avec frais : un retrait de 8 000 F brut payé
// 7 644 F net retire bien 8 000 F du restant, pas 7 644 F.

export const ACTIVE_PAYOUT_STATUSES = ['pending', 'processing', 'completed'] as const

export interface BalancePayment {
  amount: number
  isHeld?: boolean | null
  releasedAt?: string | null
}

export interface BalancePayout {
  status: string
  grossAmount: number
  netAmount: number
}

export interface Balance {
  /** Encaissé en ligne, hors fonds retenus. */
  collectedAvailable: number
  /** Encaissé en ligne mais retenu (boutique non activée). */
  blockedGross: number
  /** Commission sur collectedAvailable (affichage, "Total gagné"). */
  commissionTotal: number
  /** collectedAvailable - commissionTotal. */
  totalNet: number
  /** Net de commission des fonds retenus. */
  blockedNet: number
  /** Somme du net des retraits terminés. */
  paidOutNet: number
  /** Somme du net des retraits pending / processing. */
  pendingNet: number
  /** Brut déjà consommé par les retraits pending / processing / completed. */
  activeGross: number
  /** collectedAvailable - activeGross, jamais négatif. */
  remainingGross: number
  /** Commission sur remainingGross. */
  remainingCommission: number
  /** Ce que le marchand peut retirer maintenant, net de commission. */
  available: number
}

export function commissionOn(gross: number, ratePercent: number): number {
  return Math.floor(gross * (ratePercent / 100))
}

export function netOfCommission(gross: number, ratePercent: number): number {
  return gross - commissionOn(gross, ratePercent)
}

export function isBlockedPayment(p: Pick<BalancePayment, 'isHeld' | 'releasedAt'>): boolean {
  return p.isHeld === true && (p.releasedAt ?? null) === null
}

export function computeBalance(
  payments: BalancePayment[],
  payouts: BalancePayout[],
  commissionRatePercent: number,
): Balance {
  let collectedAvailable = 0
  let blockedGross = 0
  for (const p of payments) {
    if (isBlockedPayment(p)) blockedGross += p.amount
    else collectedAvailable += p.amount
  }

  const commissionTotal = commissionOn(collectedAvailable, commissionRatePercent)
  const totalNet = collectedAvailable - commissionTotal
  const blockedNet = netOfCommission(blockedGross, commissionRatePercent)

  let paidOutNet = 0
  let pendingNet = 0
  let activeGross = 0
  for (const q of payouts) {
    if (q.status === 'completed') {
      paidOutNet += q.netAmount
      activeGross += q.grossAmount
    } else if (q.status === 'pending' || q.status === 'processing') {
      pendingNet += q.netAmount
      activeGross += q.grossAmount
    }
  }

  const remainingGross = Math.max(0, collectedAvailable - activeGross)
  const remainingCommission = commissionOn(remainingGross, commissionRatePercent)
  const available = remainingGross - remainingCommission

  return {
    collectedAvailable, blockedGross, commissionTotal, totalNet, blockedNet,
    paidOutNet, pendingNet, activeGross, remainingGross, remainingCommission, available,
  }
}

type OrderJoin = { is_held: boolean | null; released_at: string | null }

/**
 * Normalise des lignes `payments` lues avec `orders(is_held, released_at)`.
 * Selon l'inférence PostgREST la jointure arrive en objet ou en tableau ;
 * une jointure absente vaut "non retenu".
 */
export function toBalancePayments(
  rows: ReadonlyArray<{ amount: number; orders?: OrderJoin | OrderJoin[] | null }> | null | undefined,
): BalancePayment[] {
  return (rows ?? []).map(r => {
    const o = Array.isArray(r.orders) ? r.orders[0] : r.orders
    return { amount: r.amount, isHeld: o?.is_held ?? false, releasedAt: o?.released_at ?? null }
  })
}

export function toBalancePayouts(
  rows: ReadonlyArray<{ status: string; gross_amount: number; net_amount: number }> | null | undefined,
): BalancePayout[] {
  return (rows ?? []).map(r => ({ status: r.status, grossAmount: r.gross_amount, netAmount: r.net_amount }))
}
