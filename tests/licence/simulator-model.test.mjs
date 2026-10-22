// Lancement : node --experimental-strip-types --test tests/licence/simulator-model.test.mjs
// Fichier .mjs hors de src : ignoré par tsc (include limité à .ts/.tsx/.mts) et par le build.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  simulate, sumRevenue, paybackMonth, checkObjectives, minRecruitsForObjectives,
} from '../../src/app/licence/simulator-model.ts'
import { getSimulatorMode } from '../../src/app/licence/simulator-constants.ts'

const OBJECTIVES = [
  { months: 3, count: 10 },
  { months: 6, count: 30 },
  { months: 12, count: 60 },
]
const SHARES = { year1: 1, year2: 0.8 }
const PRICE = 4900
const LICENCE = 850_000

const run = (r, c, k = 0, p = PRICE) =>
  simulate({ recruitsPerMonth: r, churn: c, price: p, reactivated: k, existingRate: 0.5, shares: SHARES, months: 24 })

const near = (actual, expected, tol = 0.05) =>
  assert.ok(Math.abs(actual - expected) <= tol, `attendu ${expected}, obtenu ${actual}`)

test('r=5, c=0, p=4900, k=0 : A_12 = 60, Revenu_12 = 294 000, cumul année 1 = 1 911 000', () => {
  const sim = run(5, 0)
  assert.equal(sim.active[12], 60)
  assert.equal(sim.revenue[11], 294_000)
  assert.equal(sumRevenue(sim, 1, 12), 1_911_000)
})

test('r=5, c=0, p=4900, k=0 : Revenu_13 = 65 x 4900 x 0,8 = 254 800', () => {
  const sim = run(5, 0)
  assert.equal(sim.active[13], 65)
  assert.equal(sim.revenue[12], 254_800)
})

test('c=0,15, r=1, p=4900, k=0 : cumul 24 mois sous 850 000 F (environ 528 750), « Au-delà de 24 mois »', () => {
  const sim = run(1, 0.15)
  const cumul24 = sim.cumulative[23]
  near(cumul24, 528_750, 5)
  assert.ok(cumul24 < LICENCE)
  assert.equal(paybackMonth(sim, LICENCE), null)
})

test('k=20, r=0, c=0, p=4900 : Revenu_1 = 20 x 4900 x 0,5 = 49 000', () => {
  const sim = run(0, 0, 20)
  assert.equal(sim.revenue[0], 49_000)
})

test('r=5, c=0,05 : A_3 ≈ 14,3 (atteint), A_6 ≈ 26,5 et A_12 ≈ 46,0 (non atteints)', () => {
  const sim = run(5, 0.05)
  near(sim.active[3], 14.3, 0.05)
  near(sim.active[6], 26.5, 0.05)
  near(sim.active[12], 46.0, 0.05)
  const [m3, m6, m12] = checkObjectives(sim, OBJECTIVES)
  assert.equal(m3.reached, true)
  assert.equal(m6.reached, false)
  assert.equal(m12.reached, false)
})

test('c=0,05 : recrutement nécessaire = 7 (r=6 insuffisant, r=7 suffisant)', () => {
  const s6 = run(6, 0.05)
  near(s6.active[12], 55.2, 0.05)
  assert.equal(checkObjectives(s6, OBJECTIVES).every(o => o.reached), false)
  const s7 = run(7, 0.05)
  near(s7.active[3], 20.0, 0.05)
  near(s7.active[6], 37.1, 0.05)
  near(s7.active[12], 64.3, 0.05)
  assert.equal(checkObjectives(s7, OBJECTIVES).every(o => o.reached), true)
  assert.equal(minRecruitsForObjectives(0.05, OBJECTIVES, 40), 7)
})

test('c=0, r=5 : recrutement nécessaire = 5 (exactement 60 au mois 12)', () => {
  assert.equal(minRecruitsForObjectives(0, OBJECTIVES, 40), 5)
  const sim = run(5, 0)
  assert.equal(checkObjectives(sim, OBJECTIVES).every(o => o.reached), true)
})

test("taux de départs inatteignable dans la plage : null (affichage « plus de 40 par mois »)", () => {
  assert.equal(minRecruitsForObjectives(0.9, OBJECTIVES, 40), null)
})

test('les marchands existants réactivés ne comptent jamais dans les objectifs', () => {
  const sans = checkObjectives(run(5, 0.05, 0), OBJECTIVES)
  const avec = checkObjectives(run(5, 0.05, 100), OBJECTIVES)
  assert.deepEqual(avec.map(o => o.value), sans.map(o => o.value))
  assert.deepEqual(avec.map(o => o.reached), sans.map(o => o.reached))
})

test('licence rentabilisée : r=5, c=0 => mois 8 ; résultat 24 mois cohérent', () => {
  const sim = run(5, 0)
  assert.equal(paybackMonth(sim, LICENCE), 8)
  near(sim.cumulative[23] - LICENCE, 5_412_200, 0.5)
})

// Affichage selon l'environnement : section masquée en production tant que les
// valeurs de départs ne sont pas confirmées.
test('mode du simulateur : masqué en production, visible en aperçu seulement', () => {
  const base = { confirmed: false }
  assert.equal(getSimulatorMode({ ...base, nodeEnv: 'production', vercelEnv: 'production' }), 'hidden')
  assert.equal(getSimulatorMode({ ...base, nodeEnv: 'production' }), 'hidden')
  assert.equal(getSimulatorMode({ ...base, nodeEnv: 'production', vercelEnv: 'preview' }), 'test')
  assert.equal(getSimulatorMode({ ...base, nodeEnv: 'development' }), 'test')
  assert.equal(getSimulatorMode({ ...base, nodeEnv: 'production', previewFlag: '1' }), 'test')
  // l'interrupteur ne peut jamais ouvrir la production
  assert.equal(getSimulatorMode({ ...base, nodeEnv: 'production', vercelEnv: 'production', previewFlag: '1' }), 'hidden')
})
