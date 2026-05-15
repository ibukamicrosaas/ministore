import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const ENCRYPTED_PREFIX = 'enc:v1:'

function getKey(): Buffer | null {
  const hex = process.env.BICTORYS_KEY_ENCRYPTION_SECRET ?? ''
  if (hex.length !== 64) return null
  return Buffer.from(hex, 'hex')
}

// Chiffre une clé API tierce avant stockage en DB.
// Format de sortie : "enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>"
// Si BICTORYS_KEY_ENCRYPTION_SECRET n'est pas configuré, logue un warning et
// renvoie le texte brut (rétrocompatibilité / déploiements sans secret).
export function encryptApiKey(plaintext: string): string {
  const key = getKey()
  if (!key) {
    console.warn('[crypto] BICTORYS_KEY_ENCRYPTION_SECRET absent — clé stockée en clair. Configurez cette variable.')
    return plaintext
  }

  const iv        = crypto.randomBytes(12)
  const cipher    = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag       = cipher.getAuthTag()

  return `${ENCRYPTED_PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

// Déchiffre une valeur stockée en DB.
// Si la valeur ne commence pas par le préfixe, elle est retournée telle quelle
// (migration transparente des anciennes valeurs stockées en clair).
export function decryptApiKey(stored: string): string {
  if (!stored.startsWith(ENCRYPTED_PREFIX)) return stored

  const key = getKey()
  if (!key) {
    console.error('[crypto] BICTORYS_KEY_ENCRYPTION_SECRET manquant — impossible de déchiffrer la clé.')
    throw new Error('Clé de chiffrement non configurée.')
  }

  const parts    = stored.slice(ENCRYPTED_PREFIX.length).split(':')
  if (parts.length !== 3) throw new Error('Format de clé chiffrée invalide.')

  const [ivHex, tagHex, encryptedHex] = parts
  const iv        = Buffer.from(ivHex, 'hex')
  const tag       = Buffer.from(tagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
}
