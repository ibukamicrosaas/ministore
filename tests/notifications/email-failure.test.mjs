import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyResendError, missingKeyResult } from '../../src/lib/notifications/email-result.ts'
import { recordEmailOutcome, alertAdminOnEmailConfigError, ALERT_WINDOW_MS } from '../../src/lib/notifications/email-alert.ts'
import { sendLafricamobileSms, redactRawResponse } from '../../src/lib/notifications/lafricamobile.ts'

// Faux client Supabase en mémoire : cron_health (1 ligne par job) + notification_logs.
function fakeAdmin({ readError = null } = {}) {
  const state = { cronHealth: new Map(), logs: [] }
  const admin = {
    state,
    from(table) {
      if (table === 'notification_logs') {
        return { insert: async row => { state.logs.push(row); return { error: null } } }
      }
      assert.equal(table, 'cron_health')
      return {
        select: () => ({ eq: (_c, job) => ({ maybeSingle: async () => ({ data: state.cronHealth.get(job) ?? null, error: readError }) }) }),
        upsert: async (row) => { state.cronHealth.set(row.job_name, row); return { error: null } },
      }
    },
  }
  return admin
}

const domainRefusal = { name: 'validation_error', statusCode: 403, message: 'The tekki.shop domain is not verified. Please, add and verify your domain.' }
const ctx = { shopId: 'shop-1', orderId: 'order-1', type: 'order_confirmation', toEmail: 'client@example.com', label: 'Confirmation de commande (e-mail client)' }

function deps(admin, sent, extra = {}) {
  return { admin, phone: '+221700000000', alertEnabled: true, sendSms: async (to, msg) => { sent.push({ to, msg }); return { success: true } }, ...extra }
}

test('classement : domaine non vérifié, clé invalide ou absente = configuration', () => {
  assert.equal(classifyResendError(domainRefusal).configError, true)
  assert.equal(classifyResendError({ name: 'invalid_api_key', statusCode: 403, message: 'API key is invalid' }).configError, true)
  assert.equal(classifyResendError({ name: 'missing_api_key', statusCode: 401, message: 'Missing API key' }).configError, true)
  assert.equal(missingKeyResult().configError, true)
})

test('classement : panne passagère = pas de configuration', () => {
  assert.equal(classifyResendError({ name: 'rate_limit_exceeded', statusCode: 429, message: 'Too many requests' }).configError, undefined)
  assert.equal(classifyResendError({ name: 'internal_server_error', statusCode: 500, message: 'Oops' }).configError, undefined)
  assert.equal(classifyResendError({ name: 'validation_error', statusCode: 422, message: 'Invalid `to` field' }).configError, undefined)
})

test('domaine non vérifié : un journal par e-mail refusé et une seule alerte', async () => {
  const admin = fakeAdmin(); const sent = []
  const result = classifyResendError(domainRefusal)
  await recordEmailOutcome(deps(admin, sent), ctx, result)
  await recordEmailOutcome(deps(admin, sent), { ...ctx, orderId: 'order-2' }, result)
  await recordEmailOutcome(deps(admin, sent), { ...ctx, orderId: 'order-3' }, result)

  assert.equal(admin.state.logs.length, 3)
  assert.ok(admin.state.logs.every(l => l.status === 'failed' && l.channel === 'email' && l.notification_type === 'order_confirmation'))
  assert.match(admin.state.logs[0].error_message, /not verified/)
  assert.equal(sent.length, 1, 'une seule alerte pour trois refus')
  assert.match(sent[0].msg, /ALERTE E-MAIL/)
})

test('l\'alerte repart une fois la fenêtre écoulée', async () => {
  const admin = fakeAdmin(); const sent = []
  const t0 = Date.parse('2026-10-30T10:00:00Z')
  const result = classifyResendError(domainRefusal)
  await recordEmailOutcome(deps(admin, sent, { now: t0 }), ctx, result)
  await recordEmailOutcome(deps(admin, sent, { now: t0 + ALERT_WINDOW_MS - 1000 }), ctx, result)
  assert.equal(sent.length, 1)
  await recordEmailOutcome(deps(admin, sent, { now: t0 + ALERT_WINDOW_MS + 1000 }), ctx, result)
  assert.equal(sent.length, 2)
})

test('clé absente : alerte', async () => {
  const admin = fakeAdmin(); const sent = []
  await recordEmailOutcome(deps(admin, sent), ctx, missingKeyResult())
  assert.equal(sent.length, 1)
  assert.match(sent[0].msg, /RESEND_API_KEY/)
})

test('panne passagère : journalisée, aucune alerte', async () => {
  const admin = fakeAdmin(); const sent = []
  await recordEmailOutcome(deps(admin, sent), ctx, classifyResendError({ name: 'rate_limit_exceeded', statusCode: 429, message: 'Too many requests' }))
  assert.equal(admin.state.logs.length, 1)
  assert.equal(sent.length, 0)
})

test('envoi réussi : journal « sent », aucune alerte', async () => {
  const admin = fakeAdmin(); const sent = []
  await recordEmailOutcome(deps(admin, sent), ctx, { success: true })
  assert.equal(admin.state.logs[0].status, 'sent')
  assert.equal(sent.length, 0)
})

test('hors production : journal mais pas de SMS admin', async () => {
  const admin = fakeAdmin(); const sent = []
  await recordEmailOutcome(deps(admin, sent, { alertEnabled: false }), ctx, missingKeyResult())
  assert.equal(admin.state.logs.length, 1)
  assert.equal(sent.length, 0)
})

test('sans boutique (candidature licence) : pas de journal, alerte quand même', async () => {
  const admin = fakeAdmin(); const sent = []
  await recordEmailOutcome(deps(admin, sent), { toEmail: 'x@example.com', label: 'Candidature' }, classifyResendError(domainRefusal))
  assert.equal(admin.state.logs.length, 0)
  assert.equal(sent.length, 1)
})

test('SMS admin en échec : l\'alerte n\'est pas mémorisée, le refus suivant retente', async () => {
  const admin = fakeAdmin(); const attempts = []
  const failing = { admin, phone: '+221700000000', sendSms: async (to, msg) => { attempts.push(msg); return { success: false, error: 'HTTP 500' } } }
  assert.equal(await alertAdminOnEmailConfigError(failing, 'x'), 'sms_failed')
  assert.equal(await alertAdminOnEmailConfigError(failing, 'x'), 'sms_failed')
  assert.equal(attempts.length, 2)
})

test('lecture de l\'état d\'alerte en erreur : pas d\'alerte (même règle que cron-health-check)', async () => {
  const admin = fakeAdmin({ readError: { message: 'boom' } }); const sent = []
  assert.equal(await alertAdminOnEmailConfigError({ admin, phone: '+221700000000', sendSms: async (t, m) => { sent.push(m); return { success: true } } }, 'x'), 'read_failed')
  assert.equal(sent.length, 0)
})

test('sans ADMIN_ALERT_PHONE : rien d\'envoyé, rien de mémorisé', async () => {
  const admin = fakeAdmin()
  assert.equal(await alertAdminOnEmailConfigError({ admin, phone: undefined, sendSms: async () => ({ success: true }) }, 'x'), 'no_phone')
  assert.equal(admin.state.cronHealth.size, 0)
})

// ─── Lafricamobile ───
function withEnvAndFetch(fakeFetch, fn) {
  const saved = { fetch: globalThis.fetch, log: console.log, env: { ...process.env } }
  process.env.LAFRICAMOBILE_ACCOUNT_ID = 'acc'; process.env.LAFRICAMOBILE_PASSWORD = 'pw'; process.env.LAFRICAMOBILE_SENDER_ID = 'TEKKI'
  globalThis.fetch = fakeFetch
  const logs = []; console.log = (...a) => logs.push(a.join(' '))
  return fn(logs).finally(() => { globalThis.fetch = saved.fetch; console.log = saved.log; process.env = saved.env })
}
const fakeResponse = (status, body) => async () => ({ ok: status >= 200 && status < 300, status, text: async () => body })

test('Lafricamobile : réponse en erreur (HTTP 400) = échec, réponse brute journalisée sans le numéro', () =>
  withEnvAndFetch(fakeResponse(400, 'Parameter accountid is required ! +221700000000'), async logs => {
    const r = await sendLafricamobileSms({ to: '+221700000000', text: 'Bonjour' })
    assert.equal(r.success, false)
    assert.match(r.error, /HTTP 400/)
    assert.equal(logs.length, 1)
    assert.match(logs[0], /réponse brute: Parameter accountid is required ! \[destinataire\]/)
    assert.doesNotMatch(logs[0], /700000000/)
  }))

test('Lafricamobile : la règle de statut est inchangée (HTTP 200 = envoyé), la réponse brute est journalisée', () =>
  withEnvAndFetch(fakeResponse(200, '<ok>12345</ok>'), async logs => {
    const r = await sendLafricamobileSms({ to: '+221700000000', text: 'Bonjour' })
    assert.equal(r.success, true)
    assert.match(logs[0], /HTTP 200 réponse brute: <ok>12345<\/ok>/)
  }))

test('redactRawResponse : retire le numéro sous toutes ses formes et tronque', () => {
  assert.equal(redactRawResponse('to=221700000000 / +221700000000', '+221700000000'), 'to=[destinataire] / [destinataire]')
  assert.equal(redactRawResponse('x'.repeat(500), '+221700000000').length, 300)
})
