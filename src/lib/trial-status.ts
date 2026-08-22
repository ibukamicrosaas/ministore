// Calcul partagé entre les Server Components qui doivent savoir si l'essai
// gratuit d'une boutique est expiré (dashboard/(protected)/layout.tsx,
// essai-expire/page.tsx). Garder ce calcul à un seul endroit évite que les
// deux finissent par diverger silencieusement.
export interface TrialShopFields {
  trial_model: string | null
  plan: string | null
  trial_ends_at: string | null
}

export function computeTrialStatus(shop: TrialShopFields) {
  // trial_model='free_orders' n'entre JAMAIS dans isTrial/trialExpired : ces
  // boutiques ont leur propre fin d'essai (§5/§6/§7 de SPEC-dashboard-fins-essai.md),
  // pilotée par shops.status, jamais par ce blocage générique.
  const isTrial = shop.trial_model !== 'free_orders' && shop.plan === 'trial'
  const trialEnd = shop.trial_ends_at ? new Date(shop.trial_ends_at) : null
  const trialLeft = trialEnd
    ? Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const trialExpired = isTrial && trialLeft !== null && trialLeft <= 0
  const trialWarning = isTrial && trialLeft !== null && trialLeft > 0 && trialLeft <= 7

  return { isTrial, trialLeft, trialExpired, trialWarning }
}
