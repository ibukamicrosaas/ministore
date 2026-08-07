import type { SupabaseClient } from '@supabase/supabase-js'
import { isOrderBlocked } from './redact'

export interface FreeOrdersSummary {
  heldCount:      number
  heldTotal:      number
  /** Somme des commandes "offertes" réellement passées (non retenues, non annulées) — le vrai chiffre encaissé. */
  collectedTotal: number
}

/**
 * Résumé des commandes offertes / retenues d'une boutique free_orders —
 * utilisé par le compteur de quota, la bannière commandes retenues et les
 * écrans de fin d'essai (SPEC-dashboard-fins-essai §2, §4, §5).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getFreeOrdersSummary(supabase: SupabaseClient<any>, shopId: string): Promise<FreeOrdersSummary> {
  const { data } = await supabase
    .from('orders')
    .select('total_price, status, is_held, released_at')
    .eq('shop_id', shopId)

  const orders = (data ?? []) as { total_price: number; status: string; is_held: boolean; released_at: string | null }[]

  let heldCount = 0
  let heldTotal = 0
  let collectedTotal = 0

  for (const o of orders) {
    if (isOrderBlocked(o)) {
      heldCount++
      heldTotal += o.total_price
    } else if (o.status !== 'cancelled') {
      collectedTotal += o.total_price
    }
  }

  return { heldCount, heldTotal, collectedTotal }
}
