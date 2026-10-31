// Résultat d'un envoi d'e-mail et classement des refus de Resend. Sans
// dépendance applicative (pas d'alias '@/') pour être testable avec `node --test`.

export type EmailResult = {
  success: boolean
  error?: string
  /**
   * Refus dû à la configuration (clé absente ou invalide, domaine non vérifié) :
   * il touchera tous les envois suivants tant que personne n'intervient, donc il
   * déclenche l'alerte admin. Une panne passagère (limite de débit, erreur
   * serveur, réseau) ne la déclenche pas.
   */
  configError?: boolean
  /** Nom de l'erreur Resend (ex. validation_error), pour les journaux. */
  errorName?: string
}

export type ResendErrorLike = { name?: string; message?: string; statusCode?: number | null }

const CONFIG_ERROR_NAMES = new Set([
  'missing_api_key',
  'invalid_api_key',
  'restricted_api_key',
  'invalid_from_address',
])

// Resend signale un domaine non vérifié par un `validation_error` (403) dont
// seul le message est explicite : « The tekki.shop domain is not verified ».
const CONFIG_MESSAGE = /domain.*(is not|isn't|not) verified|verify.*domain|api key/i

export const MISSING_KEY_ERROR = 'RESEND_API_KEY non configurée'

export function missingKeyResult(): EmailResult {
  return { success: false, error: MISSING_KEY_ERROR, configError: true, errorName: 'missing_api_key' }
}

export function classifyResendError(err: ResendErrorLike): EmailResult {
  const message = err.message?.trim() || err.name || 'Erreur Resend inconnue'
  const configError =
    (err.name !== undefined && CONFIG_ERROR_NAMES.has(err.name)) ||
    err.statusCode === 401 ||
    (err.statusCode === 403 && CONFIG_MESSAGE.test(message)) ||
    (err.name === 'validation_error' && CONFIG_MESSAGE.test(message))
  return { success: false, error: message, errorName: err.name, ...(configError ? { configError: true } : {}) }
}
