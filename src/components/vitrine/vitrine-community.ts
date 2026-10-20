// Lien « communauté / chaîne WhatsApp » du marchand — validation stricte.
// Lot A : alimenté uniquement par les fixtures du harnais de dev ; aucun champ
// de réglage ni colonne n'existe encore (voir PLAN-THEME-VITRINE.md §21).
//
// Accepte UNIQUEMENT :
//   https://chat.whatsapp.com/<code>        (groupe ou communauté)
//   https://whatsapp.com/channel/<code>     (chaîne)
// Refuse : http, autre domaine/sous-domaine, identifiants dans l'URL, port,
// chemin vide, caractères hors [A-Za-z0-9_-] dans le code. Tout est normalisé
// vers origin + chemin (requête et fragment retirés).
export type CommunityLink = { href: string; kind: 'group' | 'channel' }

const CODE = /^[A-Za-z0-9_-]{6,64}$/

export function parseCommunityLink(raw: unknown): CommunityLink | null {
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  if (value.length === 0 || value.length > 200) return null
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null

  if (url.hostname === 'chat.whatsapp.com') {
    const code = url.pathname.replace(/^\/|\/$/g, '')
    return CODE.test(code) ? { href: `https://chat.whatsapp.com/${code}`, kind: 'group' } : null
  }
  if (url.hostname === 'whatsapp.com') {
    const m = url.pathname.match(/^\/channel\/([^/]+)\/?$/)
    return m && CODE.test(m[1]) ? { href: `https://whatsapp.com/channel/${m[1]}`, kind: 'channel' } : null
  }
  return null
}

/** Lien http(s) uniquement (réseaux sociaux saisis librement par le marchand). */
export function safeHttpUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  try {
    const u = new URL(raw.trim())
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null
  } catch {
    return null
  }
}
