'use client'

import { useEffect, useRef, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { trackMetaEvent } from '@/components/pwa/MetaPixelProvider'

interface Props {
  href: string
  color: string
  productId: string
  productName: string
  price: number
  displayPrice: string
}

/** Bouton inline — observé pour piloter la visibilité du sticky */
export function ProductInlineCta({ href, color, productId, productName, price, displayPrice }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Diffuse un événement custom lu par ProductStickyCta
        window.dispatchEvent(
          new CustomEvent('inline-cta-visibility', { detail: { visible: entry.isIntersecting } })
        )
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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
      ref={ref}
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

/** Bouton sticky — n'apparaît que quand le bouton inline est hors du viewport */
export function ProductStickyCta({ href, color, productId, productName, price, displayPrice }: Props) {
  const [visible, setVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    function onVisibility(e: Event) {
      const detail = (e as CustomEvent<{ visible: boolean }>).detail
      setVisible(!detail.visible)
    }
    window.addEventListener('inline-cta-visibility', onVisibility)
    return () => window.removeEventListener('inline-cta-visibility', onVisibility)
  }, [])

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

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-gradient-to-t from-white via-white to-transparent max-w-lg mx-auto">
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-xl transition-opacity hover:opacity-90"
        style={{ backgroundColor: color }}
      >
        <ShoppingBag className="h-5 w-5" />
        Je le prends — {displayPrice}
      </button>
    </div>
  )
}
