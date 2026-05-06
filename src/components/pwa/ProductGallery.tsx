'use client'

import { useState } from 'react'
import { Package, Play, X } from 'lucide-react'

interface Photo {
  url: string
  is_primary: boolean
}

interface Props {
  photos: Photo[]
  videoEmbedUrl: string | null
  productName: string
  primaryColor: string
  isPortrait: boolean
}

export function ProductGallery({ photos, videoEmbedUrl, productName, primaryColor, isPortrait }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [videoOpen, setVideoOpen]     = useState(false)

  const activePhoto = photos[activeIndex]
  const aspectClass = isPortrait ? 'aspect-[3/4]' : 'aspect-square'

  return (
    <>
      {/* Hero photo */}
      <div className="relative">
        {activePhoto ? (
          <img
            src={activePhoto.url}
            alt={`${productName} ${activeIndex + 1}`}
            className={`w-full object-cover ${aspectClass}`}
            style={{ maxHeight: 480 }}
          />
        ) : (
          <div className={`flex w-full ${aspectClass} items-center justify-center bg-gray-100`} style={{ maxHeight: 480 }}>
            <Package className="h-20 w-20 text-gray-300" />
          </div>
        )}

        {/* Bouton vidéo flottant */}
        {videoEmbedUrl && (
          <button
            onClick={() => setVideoOpen(true)}
            className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white hover:bg-black/80 transition-colors"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            Voir la vidéo
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide bg-white">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="shrink-0 rounded-xl overflow-hidden transition-all"
              style={{
                width: 56, height: 56,
                outline: i === activeIndex ? `2px solid ${primaryColor}` : '2px solid transparent',
                outlineOffset: 2,
              }}
            >
              <img src={photo.url} alt={`${productName} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Modal vidéo */}
      {videoOpen && videoEmbedUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setVideoOpen(false)}
        >
          <div
            className="relative w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute -top-10 right-0 flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium"
            >
              <X className="h-5 w-5" /> Fermer
            </button>
            <div className="relative w-full overflow-hidden rounded-2xl bg-black" style={{ paddingBottom: '177.78%' }}>
              <iframe
                src={videoEmbedUrl}
                className="absolute inset-0 h-full w-full"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                title={`Vidéo — ${productName}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
