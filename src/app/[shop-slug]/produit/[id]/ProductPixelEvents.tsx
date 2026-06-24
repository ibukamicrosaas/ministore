'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import { trackMetaEvent } from '@/components/pwa/MetaPixelProvider'

interface ViewContentProps {
  productId: string
  productName: string
  price: number
}

/** Déclenche ViewContent au chargement de la page produit */
export function PixelViewContent({ productId, productName, price }: ViewContentProps) {
  useEffect(() => {
    trackMetaEvent('ViewContent', {
      content_ids:  [productId],
      content_name: productName,
      content_type: 'product',
      value:        price,
      currency:     'XOF',
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  return null
}

interface CtaButtonProps {
  href: string
  color: string
  productId: string
  productName: string
  price: number
  displayPrice: string
}

/** Bouton "Je le prends — X FCFA" — déclenche AddToCart puis navigue */
export function ProductCtaButton({ href, color, productId, productName, price, displayPrice }: CtaButtonProps) {
  const router = useRouter()

  function handleClick() {
    trackMetaEvent('AddToCart', {
      content_ids:  [productId],
      content_name: productName,
      content_type: 'product',
      value:        price,
      currency:     'XOF',
    })
    router.push(href)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-xl transition-opacity hover:opacity-90"
      style={{ backgroundColor: color }}
    >
      <ShoppingBag className="h-5 w-5" />
      Je le prends — {displayPrice}
    </button>
  )
}
