'use client'

import { useEffect } from 'react'

// Active le défilement doux vers les ancres de la navbar (voir
// landing-v7.css : html.lv7-smooth-scroll { scroll-behavior: smooth }),
// uniquement pendant que cette route est montée — jamais une règle CSS
// globale sur html{}, jamais landing-v6.css (partagé). Le respect de
// prefers-reduced-motion est géré en CSS (media query à côté de la règle
// ci-dessus) : ce composant se contente de poser/retirer la classe, pas de
// dupliquer la détection de préférence.
export function SmoothAnchorsInit() {
  useEffect(() => {
    document.documentElement.classList.add('lv7-smooth-scroll')
    return () => {
      document.documentElement.classList.remove('lv7-smooth-scroll')
    }
  }, [])

  return null
}
