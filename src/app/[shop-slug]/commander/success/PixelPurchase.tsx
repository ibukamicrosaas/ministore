'use client'

import { useEffect } from 'react'
import { trackMetaEvent } from '@/components/pwa/MetaPixelProvider'

interface Props {
  orderId:  string
  total:    number
  currency: string
  items:    { productName: string; unitPrice: number; quantity: number }[]
}

/** Déclenche l'événement Purchase Meta Pixel une fois la page de succès affichée */
export function PixelPurchase({ orderId, total, currency, items }: Props) {
  useEffect(() => {
    trackMetaEvent('Purchase', {
      content_ids: items.map(i => i.productName),
      contents:    items.map(i => ({
        id:       i.productName,
        quantity: i.quantity,
        item_price: i.unitPrice,
      })),
      content_type: 'product',
      value:        total,
      currency,
      order_id:     orderId,
    }, `purchase_${orderId}`) // même event_id que l'envoi serveur (webhooks) — déduplication Meta
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  return null
}
