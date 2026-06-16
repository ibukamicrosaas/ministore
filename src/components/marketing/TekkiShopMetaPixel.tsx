'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { MetaPixelProvider, trackMetaEvent } from '@/components/pwa/MetaPixelProvider'

// Segments racine appartenant au site marketing TEKKIShop (pas aux mini-sites
// marchands ni au dashboard, qui ont leur propre logique de tracking).
const MARKETING_SEGMENTS = new Set(['', 'login', 'onboarding', 'legal'])

interface Props {
  pixelId: string
}

export function TekkiShopMetaPixel({ pixelId }: Props) {
  const pathname = usePathname()
  const firstSegment = pathname.split('/')[1] ?? ''
  const isMarketingPage = MARKETING_SEGMENTS.has(firstSegment)
  const hasMounted = useRef(false)

  useEffect(() => {
    if (!isMarketingPage) return
    // Le script d'init fait déjà un premier 'PageView' ; on ne ré-émet que sur
    // les navigations client suivantes (App Router ne recharge pas la page).
    if (!hasMounted.current) { hasMounted.current = true; return }
    trackMetaEvent('PageView')
  }, [pathname, isMarketingPage])

  if (!isMarketingPage) return null
  return <MetaPixelProvider pixelId={pixelId} />
}
