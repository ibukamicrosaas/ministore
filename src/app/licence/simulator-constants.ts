// Valeurs et interrupteurs du simulateur de revenus (Licence fondatrice).
//
// SERVEUR SEULEMENT : ce fichier est importé par page.tsx (composant serveur) et
// jamais par un composant client, pour qu'aucune valeur de départs ne parte dans
// le JavaScript envoyé au navigateur quand le simulateur est masqué. Les valeurs
// utiles sont transmises au composant client par props, seulement s'il s'affiche.
//
// Fichier volontairement SANS import (chargé aussi par le lanceur de test Node).

export type ChurnScenarioKey = 'prudent' | 'median' | 'optimiste'

export interface ChurnScenario {
  key: ChurnScenarioKey
  label: string
  /** Départs mensuels, entre 0 et 1 (0,05 = 5 % des marchands recrutés partent chaque mois) */
  monthlyRate: number
}

// Les trois scénarios de départs mensuels : prudent, médian, optimiste.
// Tant que CONFIRMED est false, le simulateur n'est PAS affiché sur la page
// publique (section masquée) et aucune valeur de départs n'est rendue.
export const CHURN_SCENARIOS_CONFIRMED: boolean = false

// Valeurs publiées. [À FOURNIR par Ibuka] : tant que c'est null, jamais utilisées.
// Quand les valeurs sont fournies : les renseigner ici, puis passer
// CHURN_SCENARIOS_CONFIRMED à true (le build échoue si elles sont absentes ou invalides).
export const PUBLISHED_CHURN_SCENARIOS = null as ChurnScenario[] | null

// VALEURS DE TEST, NE PAS PUBLIER. Elles ne servent qu'au développement et aux
// aperçus (voir getSimulatorMode) et n'ont aucune valeur d'hypothèse réelle.
export const TEST_CHURN_SCENARIOS: ChurnScenario[] = [
  { key: 'prudent', label: 'Prudent', monthlyRate: 0.1 },
  { key: 'median', label: 'Médian', monthlyRate: 0.05 },
  { key: 'optimiste', label: 'Optimiste', monthlyRate: 0.02 },
]

// Part reversée sur les marchands déjà inscrits que le licencié réactive.
// DÉCISION PRISE (confirmée) : 50 %, appliqué avec la part de l'année (100 % en
// année 1, puis 80 %), soit 50 % en année 1 et 40 % en année 2. Le calcul
// applique donc 50 % x part(m) : ne pas modifier le modèle.
export const EXISTING_MERCHANTS_RATE = 0.5

export type SimulatorMode = 'published' | 'test' | 'hidden'

export interface SimulatorEnv {
  confirmed: boolean
  nodeEnv?: string
  /** process.env.VERCEL_ENV : 'production' | 'preview' | 'development' */
  vercelEnv?: string
  /** process.env.LICENCE_SIM_PREVIEW : '1' pour voir les valeurs de test hors Vercel (ex. next start local) */
  previewFlag?: string
}

/**
 * Où et comment afficher le simulateur.
 * - 'published' : valeurs confirmées, visible partout (CHURN_SCENARIOS_CONFIRMED = true)
 * - 'test'      : valeurs de TEST, visibles seulement hors production
 *                 (aperçu Vercel, serveur de développement, ou LICENCE_SIM_PREVIEW=1 en local)
 * - 'hidden'    : section masquée. Toujours le cas en production Vercel tant que
 *                 les valeurs ne sont pas confirmées, interrupteur local compris.
 */
export function getSimulatorMode(env: SimulatorEnv): SimulatorMode {
  if (env.confirmed) return 'published'
  if (env.vercelEnv === 'production') return 'hidden'
  if (env.vercelEnv === 'preview') return 'test'
  if (env.nodeEnv === 'development') return 'test'
  if (env.previewFlag === '1') return 'test'
  return 'hidden'
}

export function currentSimulatorMode(): SimulatorMode {
  return getSimulatorMode({
    confirmed: CHURN_SCENARIOS_CONFIRMED,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    previewFlag: process.env.LICENCE_SIM_PREVIEW,
  })
}

/** Scénarios à transmettre au composant client selon le mode, ou null si masqué. */
export function scenariosForMode(mode: SimulatorMode): ChurnScenario[] | null {
  if (mode === 'published') return PUBLISHED_CHURN_SCENARIOS
  if (mode === 'test') return TEST_CHURN_SCENARIOS
  return null
}

// Garde-fou du build : CONFIRMED = true exige trois taux valides publiés.
if (CHURN_SCENARIOS_CONFIRMED) {
  const ok = PUBLISHED_CHURN_SCENARIOS !== null
    && PUBLISHED_CHURN_SCENARIOS.length === 3
    && PUBLISHED_CHURN_SCENARIOS.every(s => Number.isFinite(s.monthlyRate) && s.monthlyRate >= 0 && s.monthlyRate < 1)
  if (!ok) {
    throw new Error('[licence] CHURN_SCENARIOS_CONFIRMED est true mais PUBLISHED_CHURN_SCENARIOS est absent ou invalide (3 taux entre 0 et 1 attendus).')
  }
}
