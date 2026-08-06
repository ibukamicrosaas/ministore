/**
 * Progression du quota de commandes offertes, pour affichage uniquement.
 * `free_orders_used` peut légitimement dépasser `free_orders_quota` en base
 * (une commande retenue continue d'incrémenter le compteur — voir le trigger
 * handle_free_order_quota) : ne jamais afficher le compteur brut ("4/3"),
 * toujours le borner.
 */
export function displayedQuotaProgress(used: number, quota: number): { used: number; quota: number } {
  return { used: Math.min(used, quota), quota }
}
