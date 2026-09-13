'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimitAction } from '@/lib/rate-limit'

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

  // Rate limit anti-volume (5/heure/IP) — audit sécurité §109, finding
  // moyen #11. La policy RLS d'INSERT public a été retirée (migration 104) :
  // cette Server Action, avec le client admin ci-dessous, est désormais le
  // SEUL chemin d'écriture possible sur stock_alerts.
  const limited = await checkRateLimitAction({ key: 'stock-alert', maxRequests: 5, windowMs: 60 * 60 * 1000 })
  if (limited) return limited

  const admin = createAdminClient()

  // Récupérer shop_id et vérifier que le produit est bien en rupture
  const { data: product } = await admin.from('products')
    .select('id, shop_id, stock_count, is_active')
    .eq('id', productId)
    .eq('is_active', true)
    .single()

  if (!product) return { error: 'Produit introuvable.' }
  if (product.stock_count !== 0) return { error: 'Ce produit est déjà disponible.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from('stock_alerts').insert({
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
