'use server'

import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { formatPrice, type ShopCurrency } from '@/lib/utils/country-groups'
import { sendWhatsApp, buildFreeOrdersActivatedMessage } from '@/lib/notifications/whatsapp'
import { TEKKISHOP_COMMISSION_RATE } from '@/constants'

export type ShopStatus = 'draft' | 'trial' | 'expired' | 'active'

/**
 * Point d'entrée unique pour toute transition de shops.status.
 * - trial_model='legacy' : ne touche à rien de nouveau — is_active/plan restent
 *   la seule autorité, exactement comme avant cette fonctionnalité.
 * - trial_model='free_orders' : pose `status`, synchronise `is_active` en miroir
 *   (false seulement pour 'draft'). La transition vers 'active' passe par la RPC
 *   activate_free_orders_shop, qui pose le statut ET libère les commandes
 *   retenues dans une seule transaction Postgres — jamais en plusieurs appels
 *   JS séparés qui pourraient laisser une boutique active avec des commandes
 *   encore masquées si l'un d'eux échoue.
 *
 * Appelée par activatePlan (paiement) et par l'éditeur admin — un seul endroit
 * décide de la transition, jamais l'admin ou activatePlan directement.
 */
export async function setShopStatus(
  shopId: string,
  status: ShopStatus,
): Promise<{ error?: string; releasedCount?: number; releasedTotal?: number; unlockedFundsNet?: number }> {
  const admin = createAdminClient()

  const { data: shop } = await admin
    .from('shops')
    .select('trial_model, status, slug, name, phone_whatsapp, currency')
    .eq('id', shopId)
    .single()

  if (!shop) return { error: 'Boutique introuvable.' }

  // legacy : status reste inerte pour ces boutiques, comportement 100% inchangé.
  if (shop.trial_model !== 'free_orders') {
    // Garde-fou : une boutique basculée vers legacy (REPRISE.md §17) sans avoir
    // d'abord libéré ses commandes retenues les abandonne pour toujours — ce
    // chemin n'a jamais eu de mécanisme pour les retrouver. Ne répare rien,
    // rend le cas visible si la procédure n'a pas été suivie.
    const { count: stillHeldCount } = await admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .eq('is_held', true)
      .is('released_at', null)
    if ((stillHeldCount ?? 0) > 0) {
      Sentry.captureException(
        new Error('setShopStatus: boutique non-free_orders avec des commandes encore retenues'),
        { extra: { shopId, trialModel: shop.trial_model, heldCount: stillHeldCount } },
      )
    }
    return {}
  }

  if (status === 'active') {
    const { data, error } = await admin.rpc('activate_free_orders_shop', { p_shop_id: shopId })
    if (error) {
      console.error('[setShopStatus] activate_free_orders_shop', error.message)
      return { error: "Impossible d'activer la boutique." }
    }
    const result = data?.[0]
    // Fonds de commandes digitales retenues et payées, débloqués dans la même
    // transaction que la RPC — net de commission, comme partout sur la page
    // Revenus. Voir ADDITIF-argent-commandes-retenues.md.
    const fundsGross = result?.released_funds_gross ?? 0
    const fundsNet    = fundsGross - Math.floor(fundsGross * (TEKKISHOP_COMMISSION_RATE / 100))

    await admin.from('shop_events').insert({
      shop_id: shopId,
      event_name: 'plan_activated',
      metadata: { motif: shop.status, held_released: result?.released_count ?? 0, funds_unlocked_net: fundsNet },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/revenues')
    if (shop.slug) revalidatePath(`/${shop.slug}`)

    if (shop.phone_whatsapp) {
      const msg = buildFreeOrdersActivatedMessage({
        shopName: shop.name,
        releasedCount: result?.released_count ?? 0,
        releasedTotal: formatPrice(result?.released_total ?? 0, (shop.currency as ShopCurrency) ?? 'XOF'),
        unlockedFunds: fundsNet > 0 ? formatPrice(fundsNet, (shop.currency as ShopCurrency) ?? 'XOF') : null,
      })
      sendWhatsApp(shop.phone_whatsapp, msg).catch(err =>
        console.error('[setShopStatus] notification activation:', err)
      )
    }

    return { releasedCount: result?.released_count ?? 0, releasedTotal: result?.released_total ?? 0, unlockedFundsNet: fundsNet }
  }

  // draft / trial / expired : simple transition, pas d'effet de bord multi-table.
  const { error } = await admin
    .from('shops')
    .update({ status, is_active: status !== 'draft' })
    .eq('id', shopId)

  if (error) {
    console.error('[setShopStatus]', error.message)
    return { error: 'Impossible de mettre à jour le statut de la boutique.' }
  }

  revalidatePath('/dashboard')
  if (shop.slug) revalidatePath(`/${shop.slug}`)
  return {}
}
