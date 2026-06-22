/**
 * Test de l'intégration LafricaMobile SMS
 *
 * Usage :
 *   node --env-file=.env.local scripts/test-sms.mjs +221XXXXXXXXX
 *
 * Remplace +221XXXXXXXXX par ton propre numéro (format international).
 */

const phone = process.argv[2]

if (!phone) {
  console.error('\n❌  Numéro manquant.')
  console.error('   Usage : node --env-file=.env.local scripts/test-sms.mjs +221XXXXXXXXX\n')
  process.exit(1)
}

// ── Vérification des variables ─────────────────────────────────────────────
const ACCOUNT_ID = process.env.LAFRICAMOBILE_ACCOUNT_ID
const PASSWORD   = process.env.LAFRICAMOBILE_PASSWORD
const SENDER_ID  = process.env.LAFRICAMOBILE_SENDER_ID

const missing = [
  !ACCOUNT_ID && 'LAFRICAMOBILE_ACCOUNT_ID',
  !PASSWORD   && 'LAFRICAMOBILE_PASSWORD',
  !SENDER_ID  && 'LAFRICAMOBILE_SENDER_ID',
].filter(Boolean)

if (missing.length > 0) {
  console.error('\n❌  Variables manquantes dans .env.local :')
  missing.forEach(v => console.error(`   • ${v}`))
  console.error()
  process.exit(1)
}

// ── Encodage XML ───────────────────────────────────────────────────────────
function escapeXml(v) {
  return v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;').replace(/'/g,'&apos;')
}

const message = `TEKKIShop - Test SMS. Si vous recevez ce message, l'integration LafricaMobile fonctionne.`

const xml =
  `<push accountid="${escapeXml(ACCOUNT_ID)}" password="${escapeXml(PASSWORD)}" sender="${escapeXml(SENDER_ID)}">` +
  `<message>` +
  `<text>${escapeXml(message)}</text>` +
  `<to>${escapeXml(phone)}</to>` +
  `</message>` +
  `</push>`

const endpoint = `https://lamsms.lafricamobile.com/api?xml=${encodeURIComponent(xml)}`

// ── Envoi ──────────────────────────────────────────────────────────────────
console.log('\n📤  Envoi du SMS de test...')
console.log(`   Destinataire : ${phone}`)
console.log(`   Sender       : ${SENDER_ID}`)
console.log(`   Message      : ${message}\n`)

try {
  const response = await fetch(endpoint, {
    method: 'GET',
    signal: AbortSignal.timeout(20_000),
  })

  const body = await response.text()

  if (!response.ok) {
    console.error(`❌  Erreur HTTP ${response.status}`)
    console.error(`   Réponse : ${body}\n`)
    process.exit(1)
  }

  console.log(`✅  Requête envoyée (HTTP ${response.status})`)
  console.log(`   Réponse LafricaMobile : ${body}\n`)

  // La réponse contient généralement un code de statut
  if (body.toLowerCase().includes('error') || body.toLowerCase().includes('fail')) {
    console.warn('⚠️   La réponse contient peut-être une erreur — vérifiez les clés API.')
  } else {
    console.log('👉  Vérifiez votre téléphone dans les 30 secondes.')
    console.log('   Format de réponse OK → l\'intégration est opérationnelle.\n')
  }

} catch (err) {
  if (err.name === 'TimeoutError') {
    console.error('❌  Timeout (20s) — LafricaMobile ne répond pas.\n')
  } else {
    console.error(`❌  Erreur réseau : ${err.message}\n`)
  }
  process.exit(1)
}
