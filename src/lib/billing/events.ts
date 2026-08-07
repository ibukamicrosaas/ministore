import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/types/database'

/**
 * Insertion dans shop_events (voir 075_shop_events.sql) — fire-and-forget,
 * ne doit jamais faire échouer le rendu ou l'action qui l'appelle.
 */
export function logShopEvent(shopId: string, eventName: string, metadata: Record<string, unknown> = {}): void {
  const admin = createAdminClient()
  void admin.from('shop_events').insert({ shop_id: shopId, event_name: eventName, metadata: metadata as Json }).then(({ error }) => {
    if (error) console.error('[logShopEvent]', eventName, error.message)
  })
}
