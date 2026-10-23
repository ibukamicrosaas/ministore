// Lancement : node --experimental-strip-types --test tests/licence/admin-legacy.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applicationPlanAndFinancingText } from '../../src/app/admin/licence-applications/application-display.ts'

// Fixture shaped like a row created before the financing prompt existed.
const olderApplication = {
  id: 'legacy-fixture',
  country: 'Bénin',
  full_name: 'Awa Diop',
  whatsapp_phone: '+221 77 000 00 00',
  email: 'awa@example.com',
  experience: 'Commerce depuis 4 ans.',
  acquisition_plan: 'Réseau et associations de commerçants.',
  status: 'pending',
  created_at: '2026-01-01T00:00:00.000Z',
}

test('la lecture admin conserve le plan historique sans champ financing', () => {
  assert.equal('financing' in olderApplication, false)
  assert.equal(applicationPlanAndFinancingText(olderApplication.acquisition_plan), 'Réseau et associations de commerçants.')
  assert.equal(applicationPlanAndFinancingText(null), '')
})
