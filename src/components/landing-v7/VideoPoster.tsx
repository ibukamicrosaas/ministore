'use client'

import { useEffect, useRef, useState } from 'react'

// Écart n°7 (2026-10-11) — vraie démonstration : vidéo locale d'aperçu,
// propre à cette route (public/landing-v7/), jamais un fichier de public/
// existant. Contient une piste audio réelle (confirmé ffprobe : AAC, 2
// canaux) — aucune lecture automatique, le son ne peut donc jamais se
// déclencher sans un geste explicite du visiteur.
// `preload="none"` : rien n'est téléchargé tant que le visiteur ne clique
// pas play (poster JPEG affiché à la place, candidat B retenu — 48 Ko,
// écran "Réponds à 5 questions. Ta boutique sera prête.", l'ancien
// poster reste dans public/landing-v7/, non supprimé).
//
// Bouton de lecture central : composant client, propre à cette route
// (jamais landing-v6.css/LandingV6Init.tsx, partagés). Masqué par défaut
// (CSS), révélé uniquement quand #top porte .js-ready — même mécanisme
// anti-FOUC que RevealV7Init.tsx (le script inline de page.tsx). Sans
// JavaScript (ou avant hydratation), #top ne reçoit jamais .js-ready :
// le bouton reste invisible en permanence, seuls le poster et les
// contrôles natifs du <video> sont utilisables — jamais un bouton mort
// qui ne répond à aucun clic.
export function VideoPoster() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showButton, setShowButton] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onPlay = () => setShowButton(false)
    const onEnded = () => setShowButton(true)
    video.addEventListener('play', onPlay)
    video.addEventListener('ended', onEnded)
    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('ended', onEnded)
    }
  }, [])

  return (
    <div className="video-poster--v7">
      <video
        ref={videoRef}
        className="video-poster-el"
        controls
        playsInline
        preload="none"
        poster="/landing-v7/video-mobile-poster-b.jpg"
        width={1080}
        height={1920}
      >
        <source src="/landing-v7/video-mobile.mp4" type="video/mp4" />
      </video>
      {showButton && (
        <button
          type="button"
          className="video-play-btn"
          aria-label="Lire la vidéo"
          onClick={() => videoRef.current?.play()}
        >
          {IC_PLAY}
        </button>
      )}
    </div>
  )
}

// Triangle de lecture, inline (cohérent avec le reste de la route : jamais
// d'emoji, icônes seules) — pas besoin d'importer tout le jeu IC pour une
// seule icône jetable, propre à ce bouton.
const IC_PLAY = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
    <path d="M8 5v14l11-7z" />
  </svg>
)
