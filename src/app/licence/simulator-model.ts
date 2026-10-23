// Modèle de calcul du simulateur de revenus de la Licence fondatrice.
//
// Fichier volontairement SANS import : il est chargé tel quel par le lanceur de
// test Node (tests/licence/simulator-model.test.mjs) et par le composant client.
// Aucune valeur de départs (churn) n'est définie ici : elle est toujours passée
// en paramètre (voir simulator-constants.ts).
//
// Calcul, mois par mois (m = 1..months) :
//   A_0 = 0                              marchands recrutés actifs
//   A_m = A_{m-1} x (1 - c) + r
//   E_m = k x (1 - c)^(m - 1)            existants réactivés encore actifs
//   part(m) = shares.year1 si m <= 12, sinon shares.year2
//   Revenu_m = A_m x p x part(m) + E_m x p x existingRate x part(m)

export interface SimulationInput {
  /** Nouveaux marchands recrutés par mois (r) */
  recruitsPerMonth: number
  /** Départs mensuels, entre 0 et 1 (c) */
  churn: number
  /** Abonnement moyen en FCFA par mois (p) */
  price: number
  /** Marchands existants réactivés au mois 1 (k) */
  reactivated: number
  /** Part reversée sur les marchands existants réactivés (0,5 = 50 %) */
  existingRate: number
  /** Part du licencié sur les abonnements, année 1 puis année 2 */
  shares: { year1: number; year2: number }
  /** Durée simulée en mois (24) */
  months: number
}

export interface Simulation {
  /** active[m] = A_m pour m = 0..months (active[0] = 0) */
  active: number[]
  /** revenue[m - 1] = Revenu_m pour m = 1..months */
  revenue: number[]
  /** cumulative[m - 1] = somme de Revenu_1 à Revenu_m */
  cumulative: number[]
}

export interface Objective {
  months: number
  count: number
}

export interface ObjectiveCheck extends Objective {
  /** A_m non arrondi */
  value: number
  reached: boolean
}

// Tolérance pour les comparaisons de nombres décimaux (cas où le calcul tombe
// exactement sur l'objectif, par exemple 60 au mois 12 sans départs).
const EPS = 1e-9

export const YEAR_SWITCH_MONTH = 12

export function simulate(input: SimulationInput): Simulation {
  const { recruitsPerMonth: r, churn: c, price: p, reactivated: k, existingRate, shares, months } = input
  const active: number[] = [0]
  const revenue: number[] = []
  const cumulative: number[] = []
  let total = 0
  for (let m = 1; m <= months; m++) {
    const a = active[m - 1] * (1 - c) + r
    active.push(a)
    const existing = k * Math.pow(1 - c, m - 1)
    const part = m <= YEAR_SWITCH_MONTH ? shares.year1 : shares.year2
    const rev = a * p * part + existing * p * existingRate * part
    revenue.push(rev)
    total += rev
    cumulative.push(total)
  }
  return { active, revenue, cumulative }
}

export function sumRevenue(sim: Simulation, fromMonth: number, toMonth: number): number {
  let s = 0
  for (let m = fromMonth; m <= toMonth; m++) s += sim.revenue[m - 1] ?? 0
  return s
}

/** Premier mois où le cumul atteint le prix de la licence, ou null. */
export function paybackMonth(sim: Simulation, licencePrice: number): number | null {
  for (let i = 0; i < sim.cumulative.length; i++) {
    if (sim.cumulative[i] >= licencePrice - EPS) return i + 1
  }
  return null
}

/** Objectifs atteints ? Seul A_m compte (jamais les marchands existants E_m). */
export function checkObjectives(sim: Simulation, objectives: readonly Objective[]): ObjectiveCheck[] {
  return objectives.map(o => {
    const value = sim.active[o.months] ?? 0
    return { months: o.months, count: o.count, value, reached: value >= o.count - EPS }
  })
}

/**
 * Plus petit nombre entier r (1..maxRecruits) pour lequel les trois objectifs
 * sont atteints avec ce taux de départs, ou null si aucun r de la plage ne
 * convient (l'affichage dit alors « plus de maxRecruits par mois »).
 */
export function minRecruitsForObjectives(
  churn: number,
  objectives: readonly Objective[],
  maxRecruits: number,
): number | null {
  const horizon = Math.max(...objectives.map(o => o.months))
  for (let r = 1; r <= maxRecruits; r++) {
    const sim = simulate({
      recruitsPerMonth: r, churn, price: 0, reactivated: 0, existingRate: 0,
      shares: { year1: 1, year2: 1 }, months: horizon,
    })
    if (checkObjectives(sim, objectives).every(o => o.reached)) return r
  }
  return null
}
