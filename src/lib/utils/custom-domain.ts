import { headers } from 'next/headers'

/**
 * Retourne le chemin de base du shop selon le contexte de rendu.
 * - Domaine personnalisé (ex: viensonsconnait.com) → '' (pas de préfixe)
 * - Domaine TEKKIShop (ex: tekki.shop/viens-on-s-connait) → '/viens-on-s-connait'
 */
export async function getShopBasePath(shopSlug: string): Promise<string> {
  const h = await headers()
  return h.get('x-custom-domain') ? '' : `/${shopSlug}`
}
