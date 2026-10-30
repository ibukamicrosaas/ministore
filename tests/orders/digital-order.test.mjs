// Lancement : node --experimental-strip-types --test tests/orders/digital-order.test.mjs
// Fichier .mjs hors de src : ignoré par tsc et par le build. Aucune base : le
// client Supabase est remplacé par un faux client en mémoire.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isFullyDigitalOrder,
  confirmationDeliveryLabel,
  loadDownloadTokensForMerchantOrder,
} from '../../src/lib/orders/digital-order.ts'

// Faux client : applique réellement les filtres .eq() sur des lignes en mémoire
// et enregistre les appels, pour prouver ce qui est demandé à la base.
function fakeAdmin(rows) {
  const calls = []
  return {
    calls,
    from(table) {
      const call = { table, select: null, filters: {} }
      calls.push(call)
      const builder = {
        select(cols) { call.select = cols; return builder },
        eq(col, val) { call.filters[col] = val; return builder },
        then(resolve) {
          const data = rows.filter(r => Object.entries(call.filters).every(([k, v]) => r[k] === v))
          resolve({ data, error: null })
        },
      }
      return builder
    },
  }
}

const rows = [
  { id: 't1', token: 'tok-a1', order_id: 'order-A', shop_id: 'shop-A', expires_at: '2099-01-01', download_count: 0, max_downloads: 5, downloaded_at: null, products: { name: 'Fichier A', digital_file_name: 'a.pdf' } },
  { id: 't2', token: 'tok-b1', order_id: 'order-B', shop_id: 'shop-B', expires_at: '2099-01-01', download_count: 0, max_downloads: 5, downloaded_at: null, products: { name: 'Fichier B', digital_file_name: 'b.pdf' } },
]

test('une commande avec lien affiche son lien', async () => {
  const admin = fakeAdmin(rows)
  const tokens = await loadDownloadTokensForMerchantOrder(admin, { orderId: 'order-A', shopId: 'shop-A', blocked: false })
  assert.equal(tokens.length, 1)
  assert.equal(tokens[0].token, 'tok-a1')
})

test('la boutique B ne voit rien de la boutique A, même avec l\'identifiant de la commande', async () => {
  const admin = fakeAdmin(rows)
  const tokens = await loadDownloadTokensForMerchantOrder(admin, { orderId: 'order-A', shopId: 'shop-B', blocked: false })
  assert.deepEqual(tokens, [])
})

test('la requête filtre toujours sur la commande ET sur la boutique', async () => {
  const admin = fakeAdmin(rows)
  await loadDownloadTokensForMerchantOrder(admin, { orderId: 'order-A', shopId: 'shop-A', blocked: false })
  assert.equal(admin.calls.length, 1)
  assert.equal(admin.calls[0].table, 'download_tokens')
  assert.deepEqual(admin.calls[0].filters, { order_id: 'order-A', shop_id: 'shop-A' })
})

test('une commande retenue reste masquée : aucun lien, aucune lecture', async () => {
  const admin = fakeAdmin(rows)
  const tokens = await loadDownloadTokensForMerchantOrder(admin, { orderId: 'order-A', shopId: 'shop-A', blocked: true })
  assert.deepEqual(tokens, [])
  assert.equal(admin.calls.length, 0)
})

test('digital_file_path n\'est jamais sélectionné', async () => {
  const admin = fakeAdmin(rows)
  await loadDownloadTokensForMerchantOrder(admin, { orderId: 'order-A', shopId: 'shop-A', blocked: false })
  assert.ok(!admin.calls[0].select.includes('digital_file_path'))
})

test('erreur de lecture : liste vide, pas d\'exception', async () => {
  const admin = { from: () => ({ select() { return this }, eq() { return this }, then(resolve) { resolve({ data: null, error: { message: 'boom' } }) } }) }
  const tokens = await loadDownloadTokensForMerchantOrder(admin, { orderId: 'order-A', shopId: 'shop-A', blocked: false })
  assert.deepEqual(tokens, [])
})

test('isFullyDigitalOrder : tout digital, mixte, physique, vide, produit supprimé', () => {
  const d = { products: { product_type: 'digital' } }
  const p = { products: { product_type: 'physical' } }
  assert.equal(isFullyDigitalOrder([d, d]), true)
  assert.equal(isFullyDigitalOrder([d, p]), false)
  assert.equal(isFullyDigitalOrder([p]), false)
  assert.equal(isFullyDigitalOrder([]), false)
  assert.equal(isFullyDigitalOrder([d, { products: null }]), false)
})

test('SMS de confirmation : un achat digital n\'affiche ni Retrait ni Livraison', () => {
  assert.equal(confirmationDeliveryLabel('store_pickup', true), 'Telechargement numerique')
  assert.equal(confirmationDeliveryLabel('home_delivery', true), 'Telechargement numerique')
  assert.ok(!confirmationDeliveryLabel('store_pickup', true).includes('Retrait'))
})

test('SMS de confirmation : les commandes physiques gardent leur libellé', () => {
  assert.equal(confirmationDeliveryLabel('store_pickup', false), 'Retrait boutique')
  assert.equal(confirmationDeliveryLabel('store_pickup', undefined), 'Retrait boutique')
  assert.equal(confirmationDeliveryLabel('home_delivery', false), 'Livraison')
})
