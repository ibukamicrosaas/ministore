import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Nombre de commandes retenues (is_held=true, released_at IS NULL) contenant
 * au moins un produit physique. Une commande digitale retenue est payée et
 * son fichier délivré normalement — elle ne laisse personne en attente
 * (ADDITIF-argent-commandes-retenues.md) et ne doit compter nulle part dans
 * ce plafond. Point de comptage partagé entre la garde d'affichage
 * (commander/page.tsx) et le filet de sécurité serveur (api/orders/route.ts) :
 * deux implémentations séparées avaient fini par diverger avant ce partage.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getHeldPhysicalOrderCount(supabase: SupabaseClient<any>, shopId: string): Promise<number> {
  const { data } = await supabase
    .from('orders')
    .select('id, order_items(products(product_type))')
    .eq('shop_id', shopId)
    .eq('is_held', true)
    .is('released_at', null)

  type HeldOrderRow = { id: string; order_items: { products: { product_type: string | null } | null }[] }
  return ((data ?? []) as unknown as HeldOrderRow[])
    .filter(o => o.order_items.some(oi => oi.products?.product_type !== 'digital'))
    .length
}
