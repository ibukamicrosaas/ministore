'use client'

import Script from 'next/script'

interface Props {
  pixelId: string
}

declare global {
  interface Window {
    fbq?: (action: string, event: string, data?: Record<string, unknown>, options?: { eventID?: string }) => void
  }
}

export function MetaPixelProvider({ pixelId }: Props) {
  return (
    <>
      {/* Script officiel Meta — initialise la queue fbq AVANT le chargement
          du fichier externe, ce qui évite que les appels fbq() soient perdus */}
      <Script id="meta-pixel-init" strategy="afterInteractive">{`
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
        n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init','${pixelId}');
        fbq('track','PageView');
      `}</Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

/**
 * Fire a Meta Pixel standard event from any client component.
 * Pass `eventId` to deduplicate against the matching server-side
 * Conversions API event (see src/lib/meta/conversions-api.ts).
 */
export function trackMetaEvent(
  eventName: 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'PageView' | 'Lead' | 'CompleteRegistration',
  data?: Record<string, unknown>,
  eventId?: string
) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, data ?? {}, eventId ? { eventID: eventId } : undefined)
  }
}
