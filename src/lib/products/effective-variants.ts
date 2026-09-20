import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ProductVariant } from '@/types'

type WithVariants = { id: string; price: number; variants?: unknown }

// 0 (champ prix de variante laissé vide dans ProductForm.tsx, qui écrit 0
// plutôt que NULL) ou NULL (jamais écrit en pratique, vérifié : 0 ligne
// product_variants.price IS NULL en production au 2026-09-20, contre 302
// lignes à price=0 sur 781 actives) doivent tous les deux hériter du prix du
// produit — ni l'un ni l'autre n'est un prix réel de 0 FCFA à facturer.
function effectivePrice(variantPrice: number | null | undefined, basePrice: number): number {
  return variantPrice && variantPrice > 0 ? variantPrice : basePrice
}

function normalizeJsonVariants(p: WithVariants): unknown {
  if (!Array.isArray(p.variants)) return p.variants
  return p.variants.map(v => {
    const variant = v as { price?: number | null }
    return { ...variant, price: effectivePrice(variant.price, p.price) }
  })
}

/**
 * Renvoie les mêmes produits, avec `variants` remplacé par les variantes
 * "effectives" pour l'affichage prix/décompte : product_variants (système B)
 * quand au moins une ligne active existe pour ce produit, sinon repli
 * sur products.variants (JSONB, système A) — dans les deux cas, un prix de
 * variante à 0/NULL hérite désormais du prix du produit (voir effectivePrice
 * ci-dessus ; avant ce correctif, seul NULL était traité ainsi, jamais 0,
 * alors que 0 est la valeur réellement écrite). Lot 3 de la bascule
 * variantes — REPRISE.md §76-79, correctif variante à 0 facturable — §140.
 * Lecture seule, n'écrit rien en base.
 */
export async function withEffectiveVariants<T extends WithVariants>(
  supabase: SupabaseClient<Database>,
  products: T[]
): Promise<T[]> {
  if (products.length === 0) return products

  const { data: rows } = await supabase
    .from('product_variants')
    .select('id, product_id, name, price, stock, is_active')
    .in('product_id', products.map(p => p.id))
    .eq('is_active', true)
    .order('position', { ascending: true })

  if (!rows || rows.length === 0) {
    return products.map(p => ({ ...p, variants: normalizeJsonVariants(p) }))
  }

  const byProduct = new Map<string, typeof rows>()
  for (const r of rows) {
    const list = byProduct.get(r.product_id) ?? []
    list.push(r)
    byProduct.set(r.product_id, list)
  }

  return products.map(p => {
    const rowsForProduct = byProduct.get(p.id)
    if (!rowsForProduct) return { ...p, variants: normalizeJsonVariants(p) }
    const variants: ProductVariant[] = rowsForProduct.map(r => ({
      id: r.id,
      label: r.name,
      price: effectivePrice(r.price, p.price),
      stock_count: r.stock,
    }))
    return { ...p, variants }
  })
}
