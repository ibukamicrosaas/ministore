// Lancement : node --experimental-strip-types --test tests/licence/application-validation.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  LICENCE_APPLICATION_LIMITS,
  OTHER_COUNTRY_VALUE,
  validateLicenceApplicationInput,
} from '../../src/app/licence/application-validation.ts'

const allowedCountries = ['Bénin', 'Togo (liste d’attente)', OTHER_COUNTRY_VALUE]
const valid = {
  country: 'Bénin',
  fullName: 'Awa Diop',
  whatsappPhone: '+221 77 000 00 00',
  email: 'awa@example.com',
  experience: 'Commerçante depuis 4 ans.',
  acquisitionPlan: 'Réseau et associations.',
  financing: 'Épargne personnelle.',
}

test('accepte une candidature complète et normalise le pays librement précisé', () => {
  assert.deepEqual(validateLicenceApplicationInput(valid, allowedCountries), { data: valid })
  assert.deepEqual(validateLicenceApplicationInput({ ...valid, country: OTHER_COUNTRY_VALUE, otherCountry: 'Ghana' }, allowedCountries), {
    data: { ...valid, country: 'Autre pays : Ghana' },
  })
})

test('rejette les champs manquants et les pays injectés', () => {
  for (const key of Object.keys(valid)) {
    const result = validateLicenceApplicationInput({ ...valid, [key]: '' }, allowedCountries)
    assert.ok('error' in result, `le champ ${key} doit être requis`)
  }
  assert.match(validateLicenceApplicationInput({ ...valid, country: 'Pays arbitraire' }, allowedCountries).error, /pays proposé/i)
  assert.match(validateLicenceApplicationInput({ ...valid, country: OTHER_COUNTRY_VALUE }, allowedCountries).error, /Pays à préciser/)
})

test('rejette les e-mails invalides, les caractères de contrôle et les champs trop longs', () => {
  assert.match(validateLicenceApplicationInput({ ...valid, email: 'awa@invalid' }, allowedCountries).error, /e-mail invalide/i)
  assert.match(validateLicenceApplicationInput({ ...valid, fullName: 'Awa\nBcc: victim@example.com' }, allowedCountries).error, /caractères non valides/i)
  assert.match(validateLicenceApplicationInput({ ...valid, financing: 'x'.repeat(LICENCE_APPLICATION_LIMITS.financing + 1) }, allowedCountries).error, /trop long/i)
  assert.match(validateLicenceApplicationInput(null, allowedCountries).error, /Formulaire invalide/i)
})
