'use client'

import { useEffect, useRef, useState } from 'react'

// Compteur 0 → cible, déclenché quand le badge entre dans le viewport —
// même mécanique que LandingV6Init (IntersectionObserver, easeOutCubic,
// ~950ms, jamais window.addEventListener('scroll')). Composant dédié car
// LandingV6Init.tsx (partagé) ne déclenche son propre data-count que sur
// `.lv6 .step-media .app`, pas sur un badge de hero arbitraire.
//
// État initial = target (jamais 0) : le HTML rendu côté serveur, lu sans
// JavaScript, ou affiché avant le déclenchement au scroll, montre toujours
// la valeur finale correcte.
//
// Corrigé le 2026-10-09 : un badge déjà visible à l'écran au chargement
// (cas réel le plus fréquent, le hero étant au-dessus de la ligne de
// flottaison) voyait l'effet se rejouer immédiatement après l'hydratation
// — "270" affiché par le HTML serveur, puis un plongeon quasi jusqu'à 0,
// puis remontée. Confirmé par un échantillonnage réel (toutes les 16ms) :
// la valeur descendait à "3" avant de remonter. Corrigé en vérifiant, de
// façon synchrone au montage (avant tout rendu suivant), si l'élément est
// déjà dans le viewport — si oui, aucune animation, jamais : seul un
// passage de « hors viewport » à « dans le viewport » par un vrai scroll
// déclenche l'effet.
export function AnimatedCounter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(target)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return // reste à `target`, déjà la valeur initiale

    const rect = el.getBoundingClientRect()
    const alreadyVisible =
      rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.bottom > 0
    if (alreadyVisible) return // déjà à l'écran au montage : jamais de rejeu, reste à `target`

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        const duration = 950
        const start = performance.now()
        const frame = (now: number) => {
          const k = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - k, 3)
          setValue(Math.round(target * eased))
          if (k < 1) requestAnimationFrame(frame)
        }
        requestAnimationFrame(frame)
        observer.disconnect()
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{value}</span>
}
