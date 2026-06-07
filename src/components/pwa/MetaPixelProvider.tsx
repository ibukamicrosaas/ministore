'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface Props {
  pixelId: string
}

declare global {
  interface Window {
    fbq?: (
      action: string,
      event: string,
      data?: Record<string, unknown>
    ) => void
  }
}

export function MetaPixelProvider({ pixelId }: Props) {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Injecter le script Meta Pixel
    const script = document.createElement('script')
    script.async = true
    script.src = `https://connect.facebook.net/en_US/fbevents.js`
    document.head.appendChild(script)

    script.onload = () => {
      // Initialiser le pixel
      if (window.fbq) {
        window.fbq('init', pixelId)
        // Track PageView automatiquement
        window.fbq('track', 'PageView')
      }
    }
  }, [pixelId])

  // Track ViewContent quand un produit est consulté
  useEffect(() => {
    const productId = searchParams?.get('product_id')
    const productName = searchParams?.get('product_name')
    const productPrice = searchParams?.get('product_price')

    if (productId && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [productId],
        content_name: productName || 'Product',
        content_type: 'product',
        value: productPrice ? parseFloat(productPrice) / 100 : 0,
        currency: 'XOF',
      })
    }
  }, [searchParams])

  return (
    <>
      {/* noscript fallback image */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt="Facebook Pixel"
        />
      </noscript>
    </>
  )
}

/**
 * Utilitaire pour tracker les événements Meta Pixel depuis les composants
 */
export function trackMetaEvent(
  eventName: 'AddToCart' | 'Purchase' | 'InitiateCheckout' | 'ViewContent',
  data?: Record<string, unknown>
) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, data || {})
  }
}
