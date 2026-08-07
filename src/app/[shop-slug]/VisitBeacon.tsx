'use client'

import { useEffect } from 'react'

/**
 * Signale une ouverture réelle du lien boutique — voir /api/shop-visit.
 * Monté côté client (et non dans le composant de page, en ISR) pour
 * s'exécuter à chaque visite réelle plutôt qu'à chaque régénération de cache.
 *
 * Limites connues, acceptées pour l'usage qu'on en fait (cas B du tableau de
 * bord — distinguer « jamais ouvert » de « ouvert mais sans vente ») :
 * - Une déduplication par session (sessionStorage) évite qu'un marchand qui
 *   recharge sa propre boutique plusieurs fois gonfle le compteur, mais un
 *   nouvel onglet ou un mode privé recompte une visite.
 * - Cette balise ne s'exécute pas si JavaScript est désactivé, et peut être
 *   bloquée par certains bloqueurs de publicité/traqueurs. Le chiffre est
 *   donc un plancher, pas une mesure exacte — à ne jamais réutiliser comme
 *   donnée de facturation ou de preuve.
 */
export function VisitBeacon({ shopId }: { shopId: string }) {
  useEffect(() => {
    const key = `ts_visit_counted_${shopId}`
    if (sessionStorage.getItem(key) === '1') return
    sessionStorage.setItem(key, '1')

    fetch('/api/shop-visit', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ shop_id: shopId }),
      keepalive: true,
    }).catch(() => {})
  }, [shopId])

  return null
}
