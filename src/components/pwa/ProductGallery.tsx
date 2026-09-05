'use client'

import { useState } from 'react'
import Image from 'next/image'
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
  // Un maxHeight fixe combiné à w-full neutralise aspect-ratio sur un écran
  // large : la largeur suit le conteneur (ex. 534px), l'aspect-ratio voudrait
  // ~712px de haut, mais le plafond de hauteur l'en empêchait — le rendu
  // n'était plus du tout 3:4 (mesuré : ratio 1.11 au lieu de 0.75 attendu).
  // Plafonner la largeur plutôt que la hauteur laisse aspect-ratio calculer
  // la hauteur correctement à partir d'une largeur déjà contrainte — jamais
  // en conflit. 360px de large en portrait donne 480px de haut (3:4), la
  // même limite visuelle qu'avant pour le mode carré.
  const heroMaxWidth = isPortrait ? 360 : 480

  return (
    <>
      {/* Hero photo */}
      <div className="relative">
        {activePhoto ? (
          <div className={`relative w-full mx-auto ${aspectClass}`} style={{ maxWidth: heroMaxWidth }}>
            <Image
              src={activePhoto.url}
              alt={`${productName} ${activeIndex + 1}`}
              fill
              sizes="(max-width: 512px) 100vw, 512px"
              className="object-cover"
              priority={activeIndex === 0}
              quality={85}
            />
          </div>
        ) : (
          <div className={`flex w-full mx-auto ${aspectClass} items-center justify-center bg-gray-100`} style={{ maxWidth: heroMaxWidth }}>
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
                // Hauteur fixe pour aligner toute la bande, largeur dérivée
                // du ratio choisi (3:4 en portrait) — jamais carré en dur,
                // même correctif que ProductCardGrid/ProductCardList.
                width: isPortrait ? 42 : 56, height: 56,
                outline: i === activeIndex ? `2px solid ${primaryColor}` : '2px solid transparent',
                outlineOffset: 2,
              }}
            >
              <div className="relative h-full w-full">
                <Image
                  src={photo.url}
                  alt={`${productName} ${i + 1}`}
                  fill
                  sizes="56px"
                  className="object-cover"
                  quality={70}
                />
              </div>
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
