import { createAdminClient } from '@/lib/supabase/admin'
import { canAddActiveProducts, getProductLimit } from '@/lib/plan-features'

// Gate partagé par tous les chemins qui peuvent faire grimper le nombre de
// produits actifs d'une boutique (création, réactivation, import en lot).
// Ne désactive jamais rétroactivement un produit déjà actif — additionalCount
// est le nombre de produits que l'opération candidate ajouterait aux actifs.
export async function assertProductLimit(
  shopId: string,
  additionalCount: number,
): Promise<{ error?: string }> {
  if (additionalCount <= 0) return {}

  const admin = createAdminClient()
  const { data: shop } = await admin.from('shops').select('plan').eq('id', shopId).single()
  const limit = getProductLimit(shop?.plan)
  if (limit === null) return {}

  const { count } = await admin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .eq('is_active', true)

  if (!canAddActiveProducts(shop?.plan, count ?? 0, additionalCount)) {
    return {
      error: `Ton plan actuel est limité à ${limit} produits actifs. Désactive un produit existant ou passe à un plan supérieur pour en ajouter d'autres.`,
    }
  }
  return {}
}
