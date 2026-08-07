'use client'

import { useEffect } from 'react'

/**
 * Signale une ouverture réelle du lien boutique — voir /api/shop-visit.
 * Monté côté client (et non dans le composant de page, en ISR) pour
 * s'exécuter à chaque visite réelle plutôt qu'à chaque régénération de cache.
 */
export function VisitBeacon({ shopId }: { shopId: string }) {
  useEffect(() => {
    fetch('/api/shop-visit', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ shop_id: shopId }),
      keepalive: true,
    }).catch(() => {})
  }, [shopId])

  return null
}
