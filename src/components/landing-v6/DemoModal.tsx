'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

const WA_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.15c-.24.68-1.4 1.3-1.94 1.34-.5.04-.98.22-3.3-.69-2.77-1.09-4.53-3.92-4.67-4.1-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27.25-.27.54-.34.72-.34l.52.01c.17 0 .39-.06.61.47.24.55.8 1.9.87 2.04.07.14.12.3.02.48-.1.18-.15.29-.29.45-.14.16-.3.35-.43.47-.14.14-.29.29-.13.57.17.27.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.29 1.41.28.14.45.12.61-.07.17-.2.7-.82.89-1.1.18-.27.37-.23.61-.14.25.09 1.58.75 1.85.88.27.14.45.2.52.32.07.11.07.66-.17 1.34Z" />
  </svg>
)

const WA_HREF = `https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, '') || ''}?text=${encodeURIComponent('Bonjour, j\'ai une question sur TEKKIShop 👋')}`

export function DemoModal() {
  const [open, setOpen]     = useState(false)
  const [barShow, setBarShow] = useState(false)
  const lastFocusRef = useRef<Element | null>(null)
  const closeRef     = useRef<HTMLButtonElement>(null)

  const openModal  = useCallback(() => {
    lastFocusRef.current = document.activeElement
    setOpen(true)
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => closeRef.current?.focus())
  }, [])

  const closeModal = useCallback(() => {
    setOpen(false)
    document.body.style.overflow = ''
    ;(lastFocusRef.current as HTMLElement | null)?.focus()
  }, [])

  // Mobile bar — visible after hero, hidden at CTA section
  useEffect(() => {
    function updateBar() {
      if (window.innerWidth > 760) { setBarShow(false); return }
      const hero   = document.querySelector('.hero') as HTMLElement | null
      const ctaSec = document.querySelector('.cta-sec') as HTMLElement | null
      if (!hero || !ctaSec) return
      const passedHero = window.scrollY > hero.offsetHeight * 0.85
      const atCta      = ctaSec.getBoundingClientRect().top < window.innerHeight * 0.9
      setBarShow(passedHero && !atCta)
    }
    window.addEventListener('scroll', updateBar, { passive: true })
    window.addEventListener('resize', updateBar)
    updateBar()
    return () => {
      window.removeEventListener('scroll', updateBar)
      window.removeEventListener('resize', updateBar)
    }
  }, [])

  // Global [data-open-demo] click delegation
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if ((e.target as Element | null)?.closest('[data-open-demo]')) openModal()
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [openModal])

  // Keyboard handling inside modal
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { closeModal(); return }
      if (e.key === 'Tab') {
        const modal = document.getElementById('demoModal')
        if (!modal) return
        const focusable = modal.querySelectorAll<HTMLElement>('a[href], button, [tabindex]:not([tabindex="-1"])')
        if (!focusable.length) return
        const first = focusable[0], last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, closeModal])

  return (
    <>
      {/* WhatsApp floating button (desktop) */}
      <a className="whatsapp" href={WA_HREF} aria-label="Contacter TEKKIShop sur WhatsApp">
        {WA_SVG}
      </a>

      {/* Mobile action bar */}
      <div className={`mobile-bar${barShow ? ' show' : ''}`} aria-hidden={!barShow}>
        <Link href="/start" className="btn btn-primary">Créer ma boutique gratuitement</Link>
        <a className="wa-btn" href={WA_HREF} aria-label="Nous écrire sur WhatsApp">
          {WA_SVG}
        </a>
      </div>

      {/* Demo modal */}
      <div
        className={`modal${open ? ' open' : ''}`}
        id="demoModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demoTitle"
        onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
      >
        <div className="modal-card">
          <div className="modal-head">
            <b id="demoTitle">Une vraie boutique TEKKIShop</b>
            <button
              ref={closeRef}
              className="modal-close"
              aria-label="Fermer"
              onClick={closeModal}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <div style={{ display: 'grid', placeItems: 'center', padding: '6px 0' }}>
              <div className="phone">
                <div className="phone-notch" />
                <div className="phone-screen">
                  <div className="st-cover">
                    <div className="st-cover-logo">♡ Viens on s&apos;connaît</div>
                    <div className="st-cover-txt">Des jeux de cartes pour tisser des liens plus forts avec vos proches.</div>
                    <div className="st-boxes" aria-hidden="true">
                      <i /><i /><i /><i /><i />
                    </div>
                    <div className="st-share">↗</div>
                  </div>
                  <div className="st-ava">Viens on<br />s&apos;connaît</div>
                  <div className="st-body">
                    <div className="st-name">
                      Viens on s&apos;connaît
                      <span className="st-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                    </div>
                    <div className="st-cat">Jeux de société</div>
                    <p className="st-desc">Les jeux de cartes qui vous rapprochent de vos proches | Couples – Amis – Famille</p>
                    <div className="st-pills">
                      <span className="st-pill">✓ +8000 jeux vendus</span>
                      <span className="st-pill">✓ Livraison gratuite à Dakar</span>
                    </div>
                    <div className="st-social">
                      <span className="st-ig">Instagram</span>
                      <span className="st-tt">TikTok</span>
                      <span className="st-fb">Facebook</span>
                    </div>
                    <button className="st-order" type="button" tabIndex={-1}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                        Commander
                      </span>
                    </button>
                    <div className="st-sec">
                      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ width: 9, height: 9, color: '#ffb020' }}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      Coups de cœur
                    </div>
                    <div className="st-favs">
                      <div className="st-fav">
                        <i />
                        <div><b>Pour Les Amoureux</b><span>14 000 FCFA</span></div>
                      </div>
                      <div className="st-fav">
                        <i />
                        <div><b>Et pourtant, on s&apos;aimait</b><span>4 500 FCFA</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p style={{ margin: '16px auto 0', fontSize: 14, color: 'var(--muted)', textAlign: 'center', maxWidth: 420 }}>
              Boutique réelle créée avec TEKKIShop —{' '}
              <a href="https://tekki.shop/viensonsconnait" style={{ color: 'var(--blue-2)', fontWeight: 600 }}>
                tekki.shop/viensonsconnait
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
