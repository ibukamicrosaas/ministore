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
