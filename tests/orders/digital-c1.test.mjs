import test from 'node:test'
import assert from 'node:assert/strict'
import {
  digitalOrderEmailError,
  DIGITAL_EMAIL_REQUIRED_MESSAGE,
  merchantAlertDeliveryLabel,
  planDownloadTokens,
} from '../../src/lib/orders/digital-order.ts'

test('panier avec produit digital et sans e-mail : refus avec un message clair', () => {
  for (const email of [undefined, null, '', '   ']) {
    assert.equal(digitalOrderEmailError(true, email), DIGITAL_EMAIL_REQUIRED_MESSAGE)
  }
  assert.match(DIGITAL_EMAIL_REQUIRED_MESSAGE, /e-mail est obligatoire pour un achat numérique/)
})

test('panier avec produit digital et un e-mail : accepté (panier mixte compris)', () => {
  assert.equal(digitalOrderEmailError(true, 'cliente@example.com'), null)
})

test('panier physique sans e-mail : inchangé', () => {
  for (const email of [undefined, null, '']) {
    assert.equal(digitalOrderEmailError(false, email), null)
  }
})

// whatsapp.ts importe './lafricamobile' sans extension, que node --test ne résout
// pas : on teste donc le libellé que buildNewOrderAlertMessage appelle, pas le builder.
test('SMS « Nouvelle commande » vendeuse : « Numerique » pour un achat digital, plus de « Retrait »', () => {
  assert.equal(merchantAlertDeliveryLabel('store_pickup', true), 'Numerique')
  assert.equal(merchantAlertDeliveryLabel('home_delivery', true), 'Numerique')
  assert.equal(merchantAlertDeliveryLabel('store_pickup', false), 'Retrait')
  assert.equal(merchantAlertDeliveryLabel('store_pickup', undefined), 'Retrait')
  assert.equal(merchantAlertDeliveryLabel('home_delivery', false), 'Livraison')
})

const NOW = Date.parse('2026-10-30T12:00:00Z')
const iso = h => new Date(NOW + h * 3600_000).toISOString()
const tok = (product_id, token, hours, download_count = 0) => ({ product_id, token, expires_at: iso(hours), download_count, max_downloads: 5 })

test('bouton : un lien valide existe → réutilisé, aucun nouveau lien', () => {
  const plan = planDownloadTokens(['p1'], [tok('p1', 'tA', 30)], NOW)
  assert.deepEqual(plan.create, [])
  assert.deepEqual(plan.reuse.map(r => r.token), ['tA'])
})

test('bouton : second clic → même résultat que le premier, aucune création', () => {
  // 1er clic : aucun lien valide → 1 création ; le lien créé existe au 2e clic.
  const first = planDownloadTokens(['p1'], [tok('p1', 'vieux', -5)], NOW)
  assert.deepEqual(first.create, ['p1'])
  const second = planDownloadTokens(['p1'], [tok('p1', 'vieux', -5), tok('p1', 'neuf', 48)], NOW)
  assert.deepEqual(second.create, [])
  assert.deepEqual(second.reuse.map(r => r.token), ['neuf'])
})

test('lien expiré ou épuisé : pas réutilisé', () => {
  const plan = planDownloadTokens(['p1', 'p2'], [tok('p1', 'exp', -1), tok('p2', 'epuise', 10, 5)], NOW)
  assert.deepEqual(plan.create.sort(), ['p1', 'p2'])
  assert.deepEqual(plan.reuse, [])
})

test('plusieurs produits : réutilise ceux qui ont un lien valide, crée les autres, ignore les doublons', () => {
  const plan = planDownloadTokens(['p1', 'p2', 'p1'], [tok('p1', 'tA', 20)], NOW)
  assert.deepEqual(plan.reuse.map(r => r.product_id), ['p1'])
  assert.deepEqual(plan.create, ['p2'])
})

test('plusieurs liens valides pour un produit : garde celui qui expire le plus tard', () => {
  const plan = planDownloadTokens(['p1'], [tok('p1', 'court', 2), tok('p1', 'long', 40)], NOW)
  assert.deepEqual(plan.reuse.map(r => r.token), ['long'])
})
