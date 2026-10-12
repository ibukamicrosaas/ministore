'use client'

import { useEffect } from 'react'

// Apparitions animées au scroll, propres à /preview/landing-v7 (écart n°8,
// 2026-10-11) — jamais landing-v6.css ni LandingV6Init.tsx (partagés),
// qui gèrent .reveal (sans suffixe) pour /, les pages pays, etc. .reveal--v7
// est visible par défaut (voir landing-v7.css) : ce composant ne fait
// qu'ajouter .visible au bon moment quand JS tourne, il ne cache jamais
// rien lui-même (c'est #top.js-ready, posé par le script inline dans
// page.tsx, qui active le masquage côté CSS).
export function RevealV7Init() {
  useEffect(() => {
    // Signale au script inline (page.tsx) que ce composant a bien monté —
    // désarme son filet de sécurité à 3s (sinon, sur une connexion très
    // lente où React/ce composant ne monterait jamais, .js-ready resterait
    // posée indéfiniment et le contenu resterait caché). Posé avant tout
    // "return" ci-dessous, y compris le cas "aucun .reveal--v7 trouvé".
    ;(window as unknown as { __v7RevealReady?: boolean }).__v7RevealReady = true

    const reveals = document.querySelectorAll('.lv6 .reveal--v7')
    if (reveals.length === 0) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      reveals.forEach(el => el.classList.add('visible'))
      return
    }

    if (!('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('visible'))
      return
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          io.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })

    reveals.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return null
}
