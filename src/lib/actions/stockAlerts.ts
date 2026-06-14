'use server'

import { createServerClient } from '@/lib/supabase/server'

export async function subscribeStockAlert(
  productId: string,
  name: string,
  phone: string,
): Promise<{ error?: string; success?: boolean }> {
  const trimName  = name.trim()
  const trimPhone = phone.replace(/\s+/g, '')

  if (!trimName || trimName.length < 2)  return { error: 'Prénom invalide.' }
  if (!trimPhone || trimPhone.length < 8) return { error: 'Numéro invalide.' }
  if (!/^[+]?\d{7,15}$/.test(trimPhone)) return { error: 'Numéro invalide.' }

  const supabase = await createServerClient()

  // Récupérer shop_id et vérifier que le produit est bien en rupture
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product } = await (supabase as any).from('products')
    .select('id, shop_id, stock_count, is_active')
    .eq('id', productId)
    .eq('is_active', true)
    .single()

  if (!product) return { error: 'Produit introuvable.' }
  if (product.stock_count !== 0) return { error: 'Ce produit est déjà disponible.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('stock_alerts').insert({
    product_id: productId,
    shop_id:    product.shop_id,
    name:       trimName,
    phone:      trimPhone,
  })

  if (error) {
    if (error.code === '23505') return { success: true } // unique → déjà inscrit, on ne le dit pas
    console.error('[subscribeStockAlert]', error.message)
    return { error: 'Inscription impossible. Réessaie plus tard.' }
  }

  return { success: true }
}
