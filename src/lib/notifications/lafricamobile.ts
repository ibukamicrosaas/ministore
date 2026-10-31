// Client SMS Lafricamobile (API LAMSMS — GET request, XML encodé en query string).
// Doc : https://lamsms.lafricamobile.com/api
// Format : GET /api?xml=<push accountid="X" password="Y" sender="Z"><message><text>MSG</text><to>PHONE</to></message></push>

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Réponse brute à journaliser pour documenter le format réel d'un succès et d'une
// erreur (non documenté dans le dépôt : aujourd'hui tout HTTP 2xx vaut « sent »).
// Le numéro du destinataire en est retiré, le reste est tronqué.
export function redactRawResponse(raw: string, to: string): string {
  const digits = to.replace(/\D/g, '')
  let out = raw
  for (const variant of [to, `+${digits}`, digits]) {
    if (variant) out = out.split(variant).join('[destinataire]')
  }
  return out.replace(/\s+/g, ' ').trim().slice(0, 300)
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
  const accountId = process.env.LAFRICAMOBILE_ACCOUNT_ID
  const password  = process.env.LAFRICAMOBILE_PASSWORD
  const sender    = process.env.LAFRICAMOBILE_SENDER_ID

  if (!accountId || !password || !sender) {
    return {
      success: false,
      rawResponse: '',
      error: 'Lafricamobile SMS non configuré (variables d\'environnement manquantes).',
    }
  }

  // Format attendu par l'API : attributs sur <push>, contenu dans <message>
  const xml =
    `<push accountid="${escapeXml(accountId)}" password="${escapeXml(password)}" sender="${escapeXml(sender)}">` +
    `<message>` +
    `<text>${escapeXml(text)}</text>` +
    `<to>${escapeXml(to)}</to>` +
    `</message>` +
    `</push>`

  const endpoint = `https://lamsms.lafricamobile.com/api?xml=${encodeURIComponent(xml)}`

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      signal: AbortSignal.timeout(20000),
    })

    const rawResponse = await res.text()

    // Étape de relevé : la règle de statut ci-dessous n'est PAS modifiée tant que
    // le format d'un succès et d'une erreur n'est pas connu.
    console.log(`[lafricamobile] HTTP ${res.status} réponse brute: ${redactRawResponse(rawResponse, to)}`)

    if (!res.ok) {
      return { success: false, rawResponse, error: `Lafricamobile HTTP ${res.status}` }
    }

    return { success: true, rawResponse }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue'
    return { success: false, rawResponse: '', error: message }
  }
}
