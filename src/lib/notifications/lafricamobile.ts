// Client SMS Lafricamobile (API LAMPUSH — envoi via XML/HTTP POST).
// Doc : https://developers.lafricamobile.com/docs/sms
// Remplace Twilio (~300 FCFA/SMS) par un agrégateur local interconnecté
// directement aux opérateurs ouest-africains — coût et delivrabilité bien meilleurs.

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

interface SendLafricamobileSmsParams {
  to: string
  text: string
}

interface SendLafricamobileSmsResult {
  success: boolean
  rawResponse: string
  error?: string
}

export async function sendLafricamobileSms(
  { to, text }: SendLafricamobileSmsParams
): Promise<SendLafricamobileSmsResult> {
  const baseUrl   = process.env.LAFRICAMOBILE_SMS_BASE_URL
  const accountId = process.env.LAFRICAMOBILE_ACCOUNT_ID
  const password  = process.env.LAFRICAMOBILE_PASSWORD
  const sender    = process.env.LAFRICAMOBILE_SENDER_ID

  if (!baseUrl || !accountId || !password || !sender) {
    return { success: false, rawResponse: '', error: 'Lafricamobile SMS non configuré (variables d\'environnement manquantes).' }
  }

  const xml = `<push>`
    + `<accountid>${escapeXml(accountId)}</accountid>`
    + `<password>${escapeXml(password)}</password>`
    + `<sender>${escapeXml(sender)}</sender>`
    + `<text>${escapeXml(text)}</text>`
    + `<to>${escapeXml(to)}</to>`
    + `</push>`

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/Send`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: xml,
      signal: AbortSignal.timeout(20000),
    })

    const rawResponse = await res.text()

    if (!res.ok) {
      return { success: false, rawResponse, error: `Lafricamobile HTTP ${res.status}` }
    }

    // La doc publique Lafricamobile ne précise pas le format exact de la
    // réponse synchrone (elle décrit surtout les statuts du callback DLR
    // ret_url : SENT/DELIVRD/EXPIRED/REJECTD/UNDELIVERED). On considère ici
    // qu'un HTTP 200 vaut accusé de réception par la passerelle ; la
    // confirmation de livraison réelle nécessitera d'implémenter ret_url
    // si besoin de fiabilité accrue plus tard.
    return { success: true, rawResponse }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue'
    return { success: false, rawResponse: '', error: message }
  }
}
