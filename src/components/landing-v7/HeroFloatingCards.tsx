'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

// Écart n°4 (corrigé) : cycle de 3 cartes flottantes autour du téléphone
// du Hero, en boucle. Les 3 cartes sont des DONNÉES D'EXEMPLE liées à la
// boutique fictive "Maison Awa" (mode & wax, Abidjan) utilisée dans tout
// ce lot — jamais une vraie commande, un vrai paiement ou une vraie
// boutique, jamais de nom ni de numéro réel. Montants des 2 premières
// repris des mêmes produits d'exemple que MaisonAwaMockup.tsx (Robe Adjoa
// 45 000 FCFA, Pagne WAX Hollantex 14 000 FCFA) — aucun chiffre inventé
// en plus que ceux déjà utilisés ailleurs dans ce mockup. La 3e carte
// (transfert reçu, 60 000 FCFA) est un exemple fictif distinct, jamais
// présenté comme lié à une vraie commande ni à un vrai solde.
// Cartes 1-2 : structure notification push TEKKIShop (icône app + ligne
// d'en-tête grise + titre gras + détail, 2026-10-21). Carte 3 : notification
// de transfert, jamais au nom d'une personne — "De TEKKIShop" uniquement,
// jamais un nom de fondateur ni un numéro. Icône (2026-10-23) : logo réel
// Wave (public/logo-payments-v7/wave_1.svg, existant, 24,7 Ko), traité
// comme les autres logos de paiement affichés ailleurs sur cette page —
// image simple, même gabarit que l'icône TEKKIShop des 2 autres cartes,
// jamais une reproduction de la mise en forme ou des couleurs de
// l'application Wave elle-même.
const CARDS = [
  {
    position: 'float-1',
    kind: 'order' as const,
    title: 'Nouvelle commande',
    detail: 'Payée par Wave · 14 000 FCFA',
  },
  {
    position: 'float-2',
    kind: 'order' as const,
    title: 'Nouvelle commande',
    detail: 'Payée par Orange Money · 45 000 FCFA',
  },
  {
    position: 'float-3',
    kind: 'transfer' as const,
    title: 'Transfert reçu !',
    detail: 'Vous avez reçu 60 000 F',
    sub: 'De TEKKIShop',
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
          className={`float float-push--v7 ${card.position} cycle-item${!cycling || i === activeIndex ? ' is-visible' : ''}`}
        >
          {card.kind === 'order' ? (
            <>
              <Image src="/icone-tekkishop.svg" alt="" width={34} height={34} className="float-push-icon--v7" />
              <div>
                <small>TEKKISHOP · maintenant</small>
                <b>{card.title}</b>
                <span>{card.detail}</span>
              </div>
            </>
          ) : (
            <>
              <Image src="/logo-payments-v7/wave_1.svg" alt="" width={34} height={34} className="float-push-icon--v7" />
              <div>
                <b>{card.title}</b>
                <span>{card.detail}</span>
                <span>{card.sub}</span>
              </div>
            </>
          )}
        </div>
      ))}
    </>
  )
}
