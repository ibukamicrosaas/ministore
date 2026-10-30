// Aides sur les commandes digitales : sans dépendance applicative (pas d'alias
// '@/'), pour être testables avec `node --test` — voir tests/orders/.

/** Vrai si la commande ne contient que des produits digitaux. */
export function isFullyDigitalOrder(
  items: { products: { product_type: string | null } | null }[],
): boolean {
  return items.length > 0 && items.every(i => i.products?.product_type === 'digital')
}

/**
 * Mode affiché dans le SMS de confirmation au client. Un achat digital n'a ni
 * livraison ni retrait : son mode est le téléchargement. Sans accent, comme les
 * autres libellés de ce SMS (1 segment GSM-7).
 */
export function confirmationDeliveryLabel(
  deliveryType: 'home_delivery' | 'store_pickup',
  isDigitalOrder: boolean | undefined,
): string {
  if (isDigitalOrder) return 'Telechargement numerique'
  return deliveryType === 'home_delivery' ? 'Livraison' : 'Retrait boutique'
}

/**
 * Mode affiché dans le SMS « Nouvelle commande » envoyé à la vendeuse : même
 * règle que pour la cliente, mais avec le vocabulaire court de ce SMS
 * (« Livraison » / « Retrait »).
 */
export function merchantAlertDeliveryLabel(
  deliveryType: 'home_delivery' | 'store_pickup',
  isDigitalOrder: boolean | undefined,
): string {
  if (isDigitalOrder) return 'Numerique'
  return deliveryType === 'home_delivery' ? 'Livraison' : 'Retrait'
}

/** Message renvoyé à la cliente quand un panier digital arrive sans e-mail. */
export const DIGITAL_EMAIL_REQUIRED_MESSAGE =
  "Une adresse e-mail est obligatoire pour un achat numérique : c'est là que ton lien de téléchargement est envoyé."

/**
 * Un panier qui contient au moins un produit digital doit avoir une adresse
 * e-mail (panier mixte compris). Seul le formulaire l'exigeait, et seulement
 * pour un panier 100 % digital : un appel direct à l'API contournait la règle.
 */
export function digitalOrderEmailError(hasDigitalItem: boolean, email: string | null | undefined): string | null {
  if (!hasDigitalItem) return null
  return typeof email === 'string' && email.trim() !== '' ? null : DIGITAL_EMAIL_REQUIRED_MESSAGE
}

export type ExistingToken = {
  product_id: string
  token: string
  expires_at: string
  download_count: number
  max_downloads: number
}

/**
 * Décide, pour chaque produit digital d'une commande, s'il faut réutiliser un
 * lien encore valide (non expiré, non épuisé) ou en créer un. Le bouton de la
 * vendeuse créait un lien neuf à chaque clic, même si un lien valide existait :
 * plusieurs clics = plusieurs liens actifs pour la même commande.
 */
export function planDownloadTokens(
  productIds: string[],
  existing: ExistingToken[],
  now: number,
): { reuse: { product_id: string; token: string; expires_at: string }[]; create: string[] } {
  const reuse: { product_id: string; token: string; expires_at: string }[] = []
  const create: string[] = []
  for (const productId of new Set(productIds)) {
    const valid = existing
      .filter(t => t.product_id === productId && new Date(t.expires_at).getTime() > now && t.download_count < t.max_downloads)
      .sort((a, b) => new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime())[0]
    if (valid) reuse.push({ product_id: productId, token: valid.token, expires_at: valid.expires_at })
    else create.push(productId)
  }
  return { reuse, create }
}

export type MerchantDownloadToken = {
  id: string
  token: string
  expires_at: string
  download_count: number
  max_downloads: number
  downloaded_at: string | null
  products: { name: string; digital_file_name: string | null } | null
}

// Le client Supabase typé n'expose pas download_tokens (table hors types
// générés) : même contournement que dans le reste du code.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AdminLike = { from: (table: string) => any }

/**
 * Liens de téléchargement d'une commande, pour l'écran du marchand.
 *
 * download_tokens a la RLS activée et aucune policy : la session du marchand ne
 * peut donc rien y lire, d'où une lecture avec le client admin. Ce client
 * contourne la RLS — la seule barrière est le filtre sur la boutique, jamais
 * omis. Commande retenue : aucune lecture. Ne sélectionne jamais
 * digital_file_path (chemin Storage interne).
 */
export async function loadDownloadTokensForMerchantOrder(
  admin: AdminLike,
  params: { orderId: string; shopId: string; blocked: boolean },
): Promise<MerchantDownloadToken[]> {
  if (params.blocked) return []

  const { data, error } = await admin
    .from('download_tokens')
    .select('id, token, expires_at, download_count, max_downloads, downloaded_at, products(name, digital_file_name)')
    .eq('order_id', params.orderId)
    .eq('shop_id', params.shopId)

  if (error) {
    console.error('[orders] lecture download_tokens', error.message)
    return []
  }
  return (data ?? []) as MerchantDownloadToken[]
}
