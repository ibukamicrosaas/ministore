'use client'

import { useEffect } from 'react'
import { trackMetaEvent } from '@/components/pwa/MetaPixelProvider'

interface Props {
  orderId: string
  total:   number
  items:   { productName: string; unitPrice: number; quantity: number }[]
}

/** Déclenche l'événement Purchase Meta Pixel une fois la page de succès affichée */
export function PixelPurchase({ orderId, total, items }: Props) {
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
      currency:     'XOF',
      order_id:     orderId,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  return null
}
