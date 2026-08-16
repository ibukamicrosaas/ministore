'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export function LandingNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="nav-wrap">
      <div className="container">
        <nav className="nav" aria-label="Navigation principale">
          <Link href="/" aria-label="TEKKIShop — Accueil">
            <Image src="/logo.svg" alt="TEKKIShop" width={140} height={40} style={{ height: 40, width: 'auto' }} />
          </Link>

          <div className="nav-links">
            <Link href="/#probleme">Pourquoi TEKKIShop</Link>
            <Link href="/#etapes">Comment ça marche</Link>
            <Link href="/#tarifs">Tarifs</Link>
            <Link href="/#faq">FAQ</Link>
          </div>

          <div className="nav-actions">
            <Link href="/login" className="nav-login">Connexion</Link>
            <Link href="/start" className="btn btn-primary">Créer ma boutique</Link>
            <button
              className="menu-toggle"
              aria-expanded={open}
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              onClick={() => setOpen(v => !v)}
            >
              {open ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                  <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </button>
          </div>
        </nav>
      </div>

      {open && (
        <div className="container">
          <div className="mobile-menu open">
            <Link href="/#probleme" onClick={() => setOpen(false)}>Pourquoi TEKKIShop</Link>
            <Link href="/#etapes"   onClick={() => setOpen(false)}>Comment ça marche</Link>
            <Link href="/#tarifs"   onClick={() => setOpen(false)}>Tarifs</Link>
            <Link href="/#faq"      onClick={() => setOpen(false)}>FAQ</Link>
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
