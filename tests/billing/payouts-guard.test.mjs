// Lancement : node --experimental-strip-types --test tests/billing/payouts-guard.test.mjs
// Fichier .mjs hors de src : ignoré par tsc et par le build.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { arePayoutsEnabled, PAYOUTS_DISABLED_MESSAGE, PAYOUTS_DISABLED_CODE } from '../../src/lib/billing/payouts-guard.ts'

test('production : retraits autorisés', () => {
  assert.equal(arePayoutsEnabled('production'), true)
})

test('aperçu Vercel : refusé', () => {
  assert.equal(arePayoutsEnabled('preview'), false)
})

test('développement Vercel : refusé', () => {
  assert.equal(arePayoutsEnabled('development'), false)
})

test('local sans VERCEL_ENV : refusé', () => {
  assert.equal(arePayoutsEnabled(undefined), false)
  assert.equal(arePayoutsEnabled(''), false)
})

test('valeur proche de production : refusée (comparaison exacte)', () => {
  assert.equal(arePayoutsEnabled('Production'), false)
  assert.equal(arePayoutsEnabled('production '), false)
  assert.equal(arePayoutsEnabled('prod'), false)
})

test('sans argument, lit process.env.VERCEL_ENV au moment de l\'appel', () => {
  const saved = process.env.VERCEL_ENV
  try {
    process.env.VERCEL_ENV = 'production'
    assert.equal(arePayoutsEnabled(), true)
    process.env.VERCEL_ENV = 'preview'
    assert.equal(arePayoutsEnabled(), false)
    delete process.env.VERCEL_ENV
    assert.equal(arePayoutsEnabled(), false)
  } finally {
    if (saved === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = saved
  }
})

test('message exact et code stable', () => {
  assert.equal(PAYOUTS_DISABLED_MESSAGE, 'Retraits désactivés hors production')
  assert.equal(PAYOUTS_DISABLED_CODE, 'payouts_disabled')
})

// Garde structurelle : dans chaque point d'entrée, l'appel de la garde précède toute lecture de session,
// toute lecture du corps, tout accès base et toute lecture de clé Bictorys.
const ENTRY_POINTS = [
  'src/app/api/payouts/request/route.ts',
  'src/app/api/admin/finances/withdraw/route.ts',
  'src/app/api/admin/payouts/manual/route.ts',
  'src/lib/actions/payouts.ts',
  'src/app/api/cron/process-pending-payouts/route.ts',
]
const SIDE_EFFECTS = ['createServerClient()', 'createAdminClient()', 'req.json()', 'process.env.BICTORYS_PRIVATE_KEY', 'process.env.CRON_SECRET']

for (const file of ENTRY_POINTS) {
  test(`garde avant tout effet : ${file}`, () => {
    const src = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8')
    const body = src.slice(src.search(/export async function (POST|GET|processPayout)/))
    const guardAt = body.indexOf('arePayoutsEnabled()')
    assert.ok(guardAt > 0, 'appel de la garde absent')
    for (const effect of SIDE_EFFECTS) {
      const at = body.indexOf(effect)
      if (at !== -1) assert.ok(guardAt < at, `${effect} apparaît avant la garde`)
    }
  })
}

test('les routes de retrait répondent 403 avec le message et le code', () => {
  for (const file of ENTRY_POINTS.slice(0, 3)) {
    const src = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8')
    assert.match(src, /PAYOUTS_DISABLED_MESSAGE, code: PAYOUTS_DISABLED_CODE \}, \{ status: 403 \}/, file)
  }
})
