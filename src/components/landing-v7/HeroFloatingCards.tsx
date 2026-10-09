'use client'

import { useEffect, useState } from 'react'
import { IC } from '@/components/landing-v6/icons'

// Écart n°4 (corrigé) : cycle de 3 cartes flottantes autour du téléphone
// du Hero, en boucle. Les 3 cartes sont des DONNÉES D'EXEMPLE liées à la
// boutique fictive "Maison Awa" (mode & wax, Abidjan) utilisée dans tout
// ce lot — jamais une vraie commande, un vrai paiement ou une vraie
// boutique. Réutilise .float/.float-1/.float-2 (landing-v6.css, partagé,
// non modifié) + .float-3 (landing-v7.css, propre à cette route).
const CARDS = [
  {
    position: 'float-1',
    bg: '#fff7e6',
    color: '#b45309',
    icon: IC.shoppingBag,
    title: 'Nouvelle commande · 2 articles',
    sub: 'Aujourd’hui · 02:14',
  },
  {
    position: 'float-2',
    bg: '#e0f2fe',
    color: '#0369a1',
    icon: IC.check,
    title: 'Paiement reçu · Wave',
    sub: '18 500 FCFA',
  },
  {
    position: 'float-3',
    bg: '#e8f8ee',
    color: '#12803b',
    icon: IC.checkCircle,
    title: 'Nouvelle commande',
    sub: 'Paiement à la livraison · il y a 1 min',
  },
] as const

export function HeroFloatingCards() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [cycling, setCycling] = useState(false)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return // reste sur la carte 0, fixe, jamais de boucle

    setCycling(true)
    const interval = window.setInterval(() => {
      setActiveIndex(i => (i + 1) % CARDS.length)
    }, 3200)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <>
      {CARDS.map((card, i) => (
        <div
          key={card.position}
          aria-hidden="true"
          className={`float ${card.position} cycle-item${!cycling || i === activeIndex ? ' is-visible' : ''}`}
        >
          <i style={{ background: card.bg, color: card.color }}>{card.icon}</i>
          <div>
            <b>{card.title}</b>
            <small>{card.sub}</small>
          </div>
        </div>
      ))}
    </>
  )
}
