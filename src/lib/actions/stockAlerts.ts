'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimitAction } from '@/lib/rate-limit'
import { ALL_PHONE_COUNTRIES } from '@/lib/utils/country-groups'

// Indicatifs dont la numérotation nationale commence par un 0 "de tronc" à
// retirer en format international (France, Belgique, Luxembourg, Suisse). Pas
// pour l'Afrique couverte : au Bénin le "01" des numéros à 10 chiffres FAIT
// partie du numéro, le retirer le rendrait faux.
const TRUNK_ZERO_DIALS = new Set(['+33', '+32', '+352', '+41'])

// Construit un numéro E.164 (+ indicatif + chiffres) à partir de l'indicatif
// choisi dans le formulaire et du numéro saisi. Un numéro saisi déjà au format
// international (+…) est pris tel quel. Sans indicatif, un numéro local ne peut
// pas être envoyé correctement : la normalisation d'envoi préfixe seulement un
// "+" (REPRISE.md §152), d'où cette validation à l'inscription.
function toE164(dial: string, rawPhone: string): string | null {
  const compact = rawPhone.replace(/[\s.\-()]/g, '')
  if (compact.startsWith('+')) {
    return /^\+\d{8,15}$/.test(compact) ? compact : null
  }
  if (!/^\d{6,12}$/.test(compact)) return null
  if (!ALL_PHONE_COUNTRIES.some(c => c.dial === dial)) return null
  const national = TRUNK_ZERO_DIALS.has(dial) ? compact.replace(/^0+/, '') : compact
  const e164 = `${dial}${national}`
  return /^\+\d{8,15}$/.test(e164) ? e164 : null
}

export async function subscribeStockAlert(
  productId: string,
  name: string,
  dial: string,
  phone: string,
): Promise<{ error?: string; success?: boolean }> {
  const trimName = name.trim()

  if (!trimName || trimName.length < 2) return { error: 'Prénom invalide.' }
  const e164 = toE164(dial, phone)
  if (!e164) return { error: 'Numéro invalide. Vérifie l\'indicatif pays et le numéro.' }

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
    phone:      e164,
  })

  if (error) {
    if (error.code === '23505') return { success: true } // unique → déjà inscrit, on ne le dit pas
    console.error('[subscribeStockAlert]', error.message)
    return { error: 'Inscription impossible. Réessaie plus tard.' }
  }

  return { success: true }
}
