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

// Inventaire : tout fichier de src qui appelle l'API de retrait Bictorys ou écrit dans une table de retraits
// doit figurer dans ENTRY_POINTS, ou dans la liste des fichiers sans effet de retrait ci-dessous.
// Un nouveau fichier qui apparaît dans ce balayage fait échouer ce test tant qu'il n'est pas classé.
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('../../', import.meta.url).pathname
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(p.slice(ROOT.length))
  }
  return out
}
// Lectures seules, définitions ou composants sans effet : revus à la main.
const SANS_EFFET = new Set([
  'src/lib/payments/bictorys.ts',            // définit createBictorysPayout, appelé seulement depuis les points d'entrée
  'src/lib/billing/balance-data.ts',         // lecture
  'src/lib/ai/tools.ts',                     // lecture
  'src/lib/actions/country-admin.ts',        // lectures de country_manager_payouts
  'src/app/admin/page.tsx',                  // lecture
  'src/app/admin/finances/page.tsx',         // lecture
  'src/app/admin/payouts/page.tsx',          // lecture
  'src/app/dashboard/(protected)/revenues/page.tsx', // lecture
])
const WRITES = /createBictorysPayout\(|processPayout\(|from\('(payouts|admin_withdrawals)'\)[\s\S]{0,40}\.(insert|update|delete|upsert)|from\('country_manager_payouts' as never\)[\s\S]{0,80}\.(insert|update|delete|upsert)/

test('aucun fichier non classé n\'écrit un retrait ou n\'appelle l\'API de retrait', () => {
  const inconnus = []
  for (const f of walk(join(ROOT, 'src'))) {
    if (ENTRY_POINTS.includes(f) || SANS_EFFET.has(f)) continue
    const src = readFileSync(join(ROOT, f), 'utf8')
    if (WRITES.test(src)) inconnus.push(f)
  }
  assert.deepEqual(inconnus, [])
})

// Garde structurelle : dans chaque point d'entrée, l'appel de la garde précède toute lecture de session,
// toute lecture du corps, tout accès base et toute lecture de clé Bictorys.
const ROUTES_403 = [
  'src/app/api/payouts/request/route.ts',
  'src/app/api/admin/finances/withdraw/route.ts',
  'src/app/api/admin/payouts/manual/route.ts',
  'src/app/api/admin/payouts/[id]/complete/route.ts',
  'src/app/api/country-admin/request-payout/route.ts',
  'src/app/api/admin/cm-payouts/[id]/complete/route.ts',
]
const ENTRY_POINTS = [
  ...ROUTES_403,
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

test('les six routes de retrait répondent 403 avec le message et le code', () => {
  for (const file of ROUTES_403) {
    const src = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8')
    assert.match(src, /PAYOUTS_DISABLED_MESSAGE, code: PAYOUTS_DISABLED_CODE \}, \{ status: 403 \}/, file)
  }
})

// Route de vérification de l'environnement : réservée aux administrateurs, 404 sinon,
// aucun accès base ni Bictorys, renvoie { vercelEnv, payoutsEnabled }.
test('env-check : admin seulement, 404 sinon, sans base ni Bictorys', () => {
  const src = readFileSync(new URL('../../src/app/api/admin/env-check/route.ts', import.meta.url), 'utf8')
  const body = src.slice(src.search(/export async function GET/))
  assert.match(src, /ADMIN_USER_IDS\.includes\(user\.id\)/)
  assert.match(body, /\{ status: 404 \}/)
  assert.ok(body.indexOf('{ status: 404 }') < body.indexOf('vercelEnv'), 'le 404 doit précéder la réponse')
  assert.match(body, /vercelEnv: process\.env\.VERCEL_ENV \?\? null, payoutsEnabled: arePayoutsEnabled\(\)/)
  for (const interdit of ['createAdminClient', '.from(', '.rpc(', 'bictorys', 'BICTORYS']) {
    assert.ok(!src.includes(interdit), `${interdit} ne doit pas apparaître`)
  }
})
