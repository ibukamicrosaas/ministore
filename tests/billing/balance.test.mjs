// Lancement : node --experimental-strip-types --test tests/billing/balance.test.mjs
// Données fictives uniquement. Fichier .mjs hors de src : ignoré par tsc et par le build.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeBalance, commissionOn, netOfCommission, isBlockedPayment,
  toBalancePayments, toBalancePayouts,
} from '../../src/lib/billing/balance.ts'

const pay = (amount, isHeld = false, releasedAt = null) => ({ amount, isHeld, releasedAt })
const out = (status, grossAmount, netAmount) => ({ status, grossAmount, netAmount })

// Ancienne formule de la page Revenus, gardée ici pour montrer l'écart.
const ancienneFormulePage = (payments, payouts, rate) => {
  const collected = payments.filter(p => !isBlockedPayment(p)).reduce((s, p) => s + p.amount, 0)
  const net = collected - Math.floor(collected * rate / 100)
  const actifs = payouts.filter(q => ['pending', 'processing', 'completed'].includes(q.status))
  return net - actifs.reduce((s, q) => s + q.netAmount, 0)
}

test('aucun paiement : tout vaut 0', () => {
  const b = computeBalance([], [], 3)
  assert.equal(b.available, 0)
  assert.equal(b.remainingGross, 0)
  assert.equal(b.totalNet, 0)
  assert.equal(b.blockedNet, 0)
})

test('une vente digitale de 8 000 F à 3 % : 7 760 F disponibles', () => {
  const b = computeBalance([pay(8000)], [], 3)
  assert.equal(b.commissionTotal, 240)
  assert.equal(b.totalNet, 7760)
  assert.equal(b.available, 7760)
})

test('un paiement retenu n\'est pas disponible et est compté à part', () => {
  const b = computeBalance([pay(8000), pay(10000, true, null)], [], 3)
  assert.equal(b.collectedAvailable, 8000)
  assert.equal(b.blockedGross, 10000)
  assert.equal(b.blockedNet, 9700)
  assert.equal(b.available, 7760)
})

test('un paiement retenu puis libéré redevient disponible', () => {
  const b = computeBalance([pay(10000, true, '2026-10-01T10:00:00Z')], [], 3)
  assert.equal(b.blockedGross, 0)
  assert.equal(b.available, 9700)
})

test('un retrait en cours consomme le brut et reste compté en attente', () => {
  const b = computeBalance([pay(8000)], [out('processing', 8000, 7760)], 3)
  assert.equal(b.pendingNet, 7760)
  assert.equal(b.paidOutNet, 0)
  assert.equal(b.remainingGross, 0)
  assert.equal(b.available, 0)
})

test('un retrait échoué ne consomme rien', () => {
  const b = computeBalance([pay(8000)], [out('failed', 8000, 7760)], 3)
  assert.equal(b.activeGross, 0)
  assert.equal(b.available, 7760)
})

test('un retrait manuel enregistré (completed, frais 0, brut avant commission) ramène à 0 sans compter la commission deux fois', () => {
  // 20 000 F encaissés, commission 3 % = 600, net 19 400 retiré à la main.
  const b = computeBalance([pay(20000)], [out('completed', 20000, 19400)], 3)
  assert.equal(b.activeGross, 20000)
  assert.equal(b.remainingGross, 0)
  assert.equal(b.available, 0)
  assert.equal(b.paidOutNet, 19400)
  // Si on avait enregistré le NET comme brut, il resterait 600 F de brut, soit 582 F affichés : l'erreur à éviter.
  const mauvais = computeBalance([pay(20000)], [out('completed', 19400, 19400)], 3)
  assert.equal(mauvais.available, 582)
})

test('retrait passé avec frais : le résidu disparaît, sans être recrédité', () => {
  // 8 000 F brut, commission 240, frais de retrait 116, net envoyé 7 644.
  const payments = [pay(8000)]
  const payouts = [out('completed', 8000, 7644)]
  assert.equal(ancienneFormulePage(payments, payouts, 3), 116) // l'ancienne page affichait 116 F inretirables
  const b = computeBalance(payments, payouts, 3)
  assert.equal(b.available, 0)
  assert.equal(b.remainingGross, 0)
})

test('retrait passé avec frais puis nouvelle vente : seule la nouvelle vente est disponible', () => {
  const b = computeBalance([pay(8000), pay(5000)], [out('completed', 8000, 7644)], 3)
  assert.equal(b.remainingGross, 5000)
  assert.equal(b.available, 4850)
})

test('plusieurs retraits successifs', () => {
  const b = computeBalance(
    [pay(8000), pay(5000), pay(2000)],
    [out('completed', 8000, 7760), out('completed', 5000, 4850)],
    3,
  )
  assert.equal(b.remainingGross, 2000)
  assert.equal(b.available, 1940)
})

test('retrait supérieur aux paiements : jamais négatif', () => {
  const b = computeBalance([pay(1000)], [out('completed', 3000, 2910)], 3)
  assert.equal(b.remainingGross, 0)
  assert.equal(b.available, 0)
})

test('commission arrondie à l\'inférieur, taux par pays', () => {
  assert.equal(commissionOn(999, 3), 29)
  assert.equal(netOfCommission(999, 3), 970)
  assert.equal(computeBalance([pay(10000)], [], 5).available, 9500)
})

test('toBalancePayments : jointure en objet, en tableau, ou absente', () => {
  const rows = [
    { amount: 100, orders: { is_held: true, released_at: null } },
    { amount: 200, orders: [{ is_held: true, released_at: '2026-10-01T00:00:00Z' }] },
    { amount: 300, orders: null },
    { amount: 400 },
  ]
  const b = computeBalance(toBalancePayments(rows), [], 0)
  assert.equal(b.blockedGross, 100)
  assert.equal(b.collectedAvailable, 900)
})

test('toBalancePayouts convertit les noms de colonnes', () => {
  assert.deepEqual(
    toBalancePayouts([{ status: 'completed', gross_amount: 10, net_amount: 9 }]),
    [{ status: 'completed', grossAmount: 10, netAmount: 9 }],
  )
})
