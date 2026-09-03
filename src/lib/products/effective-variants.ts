import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ProductVariant } from '@/types'

type WithVariants = { id: string; price: number; variants?: unknown }

/**
 * Renvoie les mêmes produits, avec `variants` remplacé par les variantes
 * "effectives" pour l'affichage prix/décompte : product_variants (système B)
 * quand au moins une ligne active existe pour ce produit, sinon repli
 * inchangé sur products.variants (JSONB, système A). Lot 3 de la bascule
 * variantes — REPRISE.md §76-79. Lecture seule, n'écrit rien en base.
 */
export async function withEffectiveVariants<T extends WithVariants>(
  supabase: SupabaseClient<Database>,
  products: T[]
): Promise<T[]> {
  if (products.length === 0) return products

  const { data: rows } = await supabase
    .from('product_variants')
    .select('product_id, name, price, stock, is_active')
    .in('product_id', products.map(p => p.id))
    .eq('is_active', true)
    .order('position', { ascending: true })

  if (!rows || rows.length === 0) return products

  const byProduct = new Map<string, typeof rows>()
  for (const r of rows) {
    const list = byProduct.get(r.product_id) ?? []
    list.push(r)
    byProduct.set(r.product_id, list)
  }

  return products.map(p => {
    const rowsForProduct = byProduct.get(p.id)
    if (!rowsForProduct) return p
    const variants: ProductVariant[] = rowsForProduct.map(r => ({
      label: r.name,
      price: r.price ?? p.price, // NULL = hérite du produit
      stock_count: r.stock,
    }))
    return { ...p, variants }
  })
}
