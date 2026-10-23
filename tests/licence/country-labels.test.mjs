// Lancement : node --experimental-strip-types --test tests/licence/country-labels.test.mjs
// Fichier .mjs hors de src : ignoré par tsc (include limité à .ts/.tsx/.mts) et par le build.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { WAITLIST_SUFFIX, LEGACY_WAITLIST_SUFFIX, isWaitlistCountry, displayCountryLabel } from '../../src/app/licence/prices.ts'

const EM = '—'
const EN = '–'

test("le suffixe écrit aujourd'hui ne contient aucun tiret long", () => {
  assert.equal(WAITLIST_SUFFIX, " (liste d'attente)")
  assert.ok(!/[—–]/.test(WAITLIST_SUFFIX))
})

test("nouvelles et anciennes valeurs de liste d'attente sont reconnues", () => {
  assert.equal(isWaitlistCountry("Niger (liste d'attente)"), true)
  assert.equal(isWaitlistCountry(`Niger${LEGACY_WAITLIST_SUFFIX}`), true)
  assert.equal(isWaitlistCountry(`Guinée ${EM} liste d'attente`), true)
})

test("les autres valeurs ne sont pas des listes d'attente", () => {
  for (const v of ['Niger', 'Bénin', `Bénin ${EM} marchands déjà actifs`, 'Autre pays (à préciser ci-dessous)', 'Togo']) {
    assert.equal(isWaitlistCountry(v), false, v)
  }
})

test("affichage : anciennes valeurs normalisées, nouvelles inchangées", () => {
  assert.equal(displayCountryLabel(`Niger ${EM} liste d'attente`), "Niger (liste d'attente)")
  assert.equal(displayCountryLabel(`Bénin ${EM} marchands déjà actifs`), 'Bénin (marchands déjà actifs)')
  assert.equal(displayCountryLabel(`Togo ${EN} en cours de finalisation`), 'Togo (en cours de finalisation)')
  assert.equal(displayCountryLabel("Niger (liste d'attente)"), "Niger (liste d'attente)")
  assert.equal(displayCountryLabel('Guinée'), 'Guinée')
  assert.equal(displayCountryLabel('Autre pays (à préciser ci-dessous)'), 'Autre pays (à préciser ci-dessous)')
})
