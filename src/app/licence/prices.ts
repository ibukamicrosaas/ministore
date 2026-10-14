// Pays de la licence et prix unique (FCFA). Les pays en liste d'attente
// n'affichent aucun prix.
export const OPEN_COUNTRIES = [
  { code: 'BJ', name: 'Bénin' },
  { code: 'TG', name: 'Togo' },
  { code: 'BK', name: 'Burkina Faso' }, // code interne BK, pas BF
  { code: 'ML', name: 'Mali' },
] as const

// Pays en liste d'attente (paiement mobile non intégré) : liste explicite,
// jamais déduite du statut ou de merchant_count en base. Lue par la page et
// par le formulaire.
export const WAITLIST_COUNTRIES = [
  { code: 'NE', name: 'Niger' },
  { code: 'GN', name: 'Guinée' },
  { code: 'CM', name: 'Cameroun' },
  { code: 'GA', name: 'Gabon' },
] as const

// Suffixe ajouté au pays dans licence_applications.country pour une
// candidature en liste d'attente. Partagé entre le formulaire (écriture) et
// l'admin « Candidatures de licence » (badge).
export const WAITLIST_SUFFIX = " — liste d'attente"

// Prix unique de la licence (FCFA, 12 mois), identique pour les quatre pays
// ouverts. Le build échoue s'il est absent ou invalide : aucune valeur
// provisoire ne doit atteindre la production.
export const LICENSE_PRICE_FCFA = 850_000

if (typeof LICENSE_PRICE_FCFA !== 'number' || !Number.isFinite(LICENSE_PRICE_FCFA) || LICENSE_PRICE_FCFA <= 0) {
  throw new Error('[licence] LICENSE_PRICE_FCFA (prices.ts) est absent ou invalide : le prix de la licence doit être un nombre positif.')
}

// Équivalent indicatif en euros : parité fixe officielle du franc CFA
// (1 € = 655,957 F). Dollar et livre retirés tant qu'aucun taux daté n'est fourni.
const FCFA_PER_EUR = 655.957

// Nombre au format français avec espace insécable normale (U+00A0) : la
// police d'affichage rend l'espace fine insécable (U+202F) presque invisible.
export function formatNumberFr(n: number): string {
  return n.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0')
}

const fr = formatNumberFr

export function formatFcfa(n: number): string {
  return `${fr(n)} F`
}

export function indicativeEquivalents(fcfa: number): string[] {
  return [`≈ ${fr(Math.round(fcfa / FCFA_PER_EUR / 10) * 10)} €`]
}

export interface TerritoryRow {
  country_code: string
  status: string
}

export type TerritorySection = 'disponible' | 'attente' | 'ferme' | 'masque'

// Classement d'un territoire de licence_territories : l'appartenance aux
// pays ouverts / en liste d'attente vient des constantes ci-dessus, la base
// ne fait que confirmer la disponibilité (status 'libre'). Un territoire
// 'reserve' (ex. Togo avant mise à jour) n'est affiché nulle part.
export function sectionForTerritory(t: TerritoryRow): TerritorySection {
  if (t.status === 'attribue' || t.status === 'dukka') return 'ferme'
  if (t.status !== 'libre') return 'masque'
  if (OPEN_COUNTRIES.some(c => c.code === t.country_code)) return 'disponible'
  if (WAITLIST_COUNTRIES.some(c => c.code === t.country_code)) return 'attente'
  return 'masque'
}
