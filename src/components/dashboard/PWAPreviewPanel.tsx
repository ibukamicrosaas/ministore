'use client'

import { useState, useCallback, useEffect } from 'react'
import { RefreshCw, ExternalLink } from 'lucide-react'

interface Props {
  shopSlug: string
  appUrl: string
}

export function PWAPreviewPanel({ shopSlug, appUrl }: Props) {
  // URL relative pour l'iframe (évite les problèmes mixed-content http/https)
  // URL absolue HTTPS pour le lien "ouvrir dans un onglet"
  const iframeUrl = `/${shopSlug}`
  const externalUrl = `${appUrl.replace(/^http:\/\//, 'https://')}/${shopSlug}`
  const [iframeKey, setIframeKey] = useState(0)
  const reload = useCallback(() => setIframeKey(k => k + 1), [])

  useEffect(() => {
    const handler = () => {
      setTimeout(() => setIframeKey(k => k + 1), 800)
    }
    window.addEventListener('shop-updated', handler)
    return () => window.removeEventListener('shop-updated', handler)
  }, [])

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Label + controls */}
      <div className="flex items-center justify-between w-full">
        <p className="text-sm font-semibold text-gray-700">Aperçu client</p>
        <div className="flex items-center gap-1">
          <button
            onClick={reload}
            title="Recharger"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Ouvrir dans un nouvel onglet"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Téléphone */}
      <div
        className="relative mx-auto shrink-0"
        style={{ width: 260 }}
      >
        {/* Cadre du téléphone */}
        <div
          className="relative rounded-[38px] bg-gray-900 shadow-2xl"
          style={{
            padding: '10px',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 25px 50px -12px rgba(0,0,0,0.5)',
          }}
        >
          {/* Bouton power */}
          <div className="absolute -right-[3px] top-24 w-[3px] h-10 rounded-r-sm bg-gray-700" />
          {/* Boutons volume */}
          <div className="absolute -left-[3px] top-20 w-[3px] h-7 rounded-l-sm bg-gray-700" />
          <div className="absolute -left-[3px] top-32 w-[3px] h-7 rounded-l-sm bg-gray-700" />

          {/* Écran */}
          <div
            className="relative rounded-[30px] overflow-hidden bg-gray-50"
            style={{ height: 540 }}
          >
            {/* Dynamic island / notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10 w-20 h-5 rounded-full bg-gray-900" />

            {/* iframe scalée */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ top: 28 }}
            >
              <iframe
                key={iframeKey}
                src={iframeUrl}
                title="Aperçu PWA client"
                style={{
                  width: 375,
                  height: 680,
                  border: 'none',
                  transform: 'scale(0.64)',
                  transformOrigin: 'top left',
                  pointerEvents: 'none',
                }}
              />
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-gray-300" />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Vue en temps réel · {externalUrl.replace('https://', '')}
      </p>
    </div>
  )
}
