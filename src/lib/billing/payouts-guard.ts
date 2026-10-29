// Garde « production seulement » pour tout ce qui peut déclencher ou enregistrer un retrait.
// Un aperçu Vercel ou un serveur local peut partager la base de production : une ligne de
// retrait créée hors production serait payée par le cron de production avec la vraie clé.
// Seul VERCEL_ENV === 'production' autorise le retrait ; toute autre valeur, y compris
// l'absence de la variable (serveur local), refuse.

export const PAYOUTS_DISABLED_MESSAGE = 'Retraits désactivés hors production'
export const PAYOUTS_DISABLED_CODE = 'payouts_disabled'

export function arePayoutsEnabled(vercelEnv: string | undefined = process.env.VERCEL_ENV): boolean {
  return vercelEnv === 'production'
}
