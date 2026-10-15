'use client'

import { useEffect } from 'react'

// Apparitions animées au scroll, propres à /preview/landing-v7 (revu le
// 2026-10-13, écart n°8) — jamais landing-v6.css ni LandingV6Init.tsx
// (partagés), qui gèrent .reveal (sans suffixe) pour /, les pages pays,
// etc. .reveal--v7 est TOUJOURS visible par défaut (landing-v7.css) : ce
// composant ne cache JAMAIS ce qui est déjà à l'écran au chargement — il
// ne marque "à révéler" (.reveal-pending, donc caché puis réanimé) que ce
// qui est encore sous la ligne de flottaison au moment où ce code tourne.
// Sur réseau lent où ce composant ne monterait jamais : rien n'a jamais
// été cheché, donc rien à rattraper — plus besoin de filet de sécurité.
export function RevealV7Init() {
  useEffect(() => {
    const reveals = document.querySelectorAll('.lv6 .reveal--v7')
    if (reveals.length === 0) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || !('IntersectionObserver' in window)) return

    const belowFold = Array.from(reveals).filter(
      el => el.getBoundingClientRect().top > window.innerHeight
    )
    if (belowFold.length === 0) return
    belowFold.forEach(el => el.classList.add('reveal-pending'))

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          io.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })

    belowFold.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return null
}
