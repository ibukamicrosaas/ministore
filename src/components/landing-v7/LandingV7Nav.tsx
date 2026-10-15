'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// Header propre à /preview/landing-v7 (Lot 2 — direction "socle visuel").
// LandingNav.tsx (landing-v6, partagé avec / et les pages pays) n'est pas
// modifié — même contenu/liens, nouvelle présentation uniquement.

// Déplace le focus clavier vers la section ciblée après le saut d'ancre
// (2026-10-24). Ne fait PAS preventDefault() : le saut natif du navigateur
// (scroll + mise à jour de l'URL) reste intact et fonctionne sans aucun
// JavaScript — ce handler ne fait qu'ajouter, en plus, un .focus()
// déterministe sur la cible (tabIndex={-1} posé sur les 4 sections, voir
// page.tsx/PricingHome.tsx/FAQHome.tsx), plutôt que de compter sur le
// comportement natif de focus au changement de fragment, qui varie selon
// les navigateurs. preventScroll:true : le scroll est déjà géré par le
// saut natif + scroll-behavior:smooth (landing-v7.css), focus() ne doit
// pas en déclencher un second.
function focusAnchorTarget(e: React.MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute('href') ?? ''
  if (!href.startsWith('#')) return
  const id = href.slice(1)
  window.setTimeout(() => {
    document.getElementById(id)?.focus({ preventScroll: true })
  }, 50)
}

export function LandingV7Nav() {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Échap referme le menu et rend le focus au bouton qui l'a ouvert — sans
  // ça, un utilisateur clavier perdrait le focus dans le vide à la
  // fermeture (ajouté 2026-10-10, jamais présent avant).
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className="nav-v7-wrap">
      <div className="container nav-v7-bar">
        <nav className="nav-v7" aria-label="Navigation principale">
          <Link href="/" aria-label="TEKKIShop — Accueil">
            <Image src="/logo.svg" alt="TEKKIShop" width={140} height={40} style={{ height: 36, width: 'auto' }} />
          </Link>

          <div className="nav-v7-links">
            <a href="#probleme" onClick={focusAnchorTarget}>Pourquoi TEKKIShop</a>
            <a href="#comment" onClick={focusAnchorTarget}>Comment ça marche</a>
            <a href="#tarifs" onClick={focusAnchorTarget}>Tarifs</a>
            <a href="#faq" onClick={focusAnchorTarget}>FAQ</a>
          </div>

          <div className="nav-v7-actions">
            <Link href="/login" className="nav-v7-login">Connexion</Link>
            <Link href="/start" className="btn btn-primary">Créer ma boutique</Link>
            <button
              ref={toggleRef}
              className="nav-v7-toggle"
              aria-expanded={open}
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              onClick={() => setOpen(v => !v)}
            >
              {open ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                  <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </div>

      {open && (
        <div className="container">
          <div className="nav-v7-mobile">
            <a href="#probleme" onClick={(e) => { focusAnchorTarget(e); setOpen(false) }}>Pourquoi TEKKIShop</a>
            <a href="#comment" onClick={(e) => { focusAnchorTarget(e); setOpen(false) }}>Comment ça marche</a>
            <a href="#tarifs" onClick={(e) => { focusAnchorTarget(e); setOpen(false) }}>Tarifs</a>
            <a href="#faq" onClick={(e) => { focusAnchorTarget(e); setOpen(false) }}>FAQ</a>
            <Link href="/login" onClick={() => setOpen(false)}>Connexion</Link>
            <Link href="/start" className="btn btn-primary btn-full" onClick={() => setOpen(false)}>
              Créer ma boutique
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
