'use client'

import { useEffect, useRef, useState } from 'react'

// Écart n°5 : bulles de messages flottantes sur la photo de la vendeuse,
// fidèles au mockup (initiales + heure, jamais de nom complet ni de vrai
// numéro — cohérent avec la convention de masquage déjà utilisée ailleurs
// dans ce dépôt). Apparition échelonnée quand la scène entre dans le
// viewport, jamais via window.addEventListener('scroll').
type Bubble = {
  id: string
  initials: string
  color: string
  text: string
  time: string
  style: { top: string; left?: string; right?: string }
  lost?: boolean
}

const BUBBLES: Bubble[] = [
  { id: 'b1', initials: 'AK', color: '#be123c', text: 'C’est combien ?', time: '10:24', style: { top: '6%', left: '5%' } },
  { id: 'b2', initials: 'MT', color: '#1d4ed8', text: 'Dispo en taille L ?', time: '10:28', style: { top: '19%', left: '14%' } },
  { id: 'b3', initials: 'FD', color: '#0f766e', text: 'Vous livrez à Angré ?', time: '10:32', style: { top: '12%', right: '4%' } },
  { id: 'b4', initials: 'SB', color: '#7c3aed', text: 'Toujours dispo ??', time: '10:35', style: { top: '30%', right: '3%' } },
  { id: 'b5', initials: 'OA', color: '#c2410c', text: 'Vous êtes là ??', time: '10:37', style: { top: '44%', right: '5%' } },
  { id: 'b6', initials: 'AK', color: '#94a3b8', text: 'Bon, laissez tomber.', time: '10:41', style: { top: '57%', right: '7%' }, lost: true },
]

export function SceneBubbles() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState<Set<string>>(new Set())
  const [unreadVisible, setUnreadVisible] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      // Toutes visibles d'emblée, sans séquence ni animation (géré aussi
      // par le CSS, doublé ici pour ne pas dépendre uniquement du média-query).
      setVisible(new Set(BUBBLES.map(b => b.id)))
      setUnreadVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        BUBBLES.forEach((b, i) => {
          const isLast = i === BUBBLES.length - 1
          window.setTimeout(() => {
            setVisible(prev => new Set(prev).add(b.id))
            if (isLast) setUnreadVisible(true)
          }, 300 + i * (isLast ? 1400 : 900))
        })
        observer.disconnect()
      },
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {BUBBLES.map(b => (
        <div
          key={b.id}
          className={`scene-bubble${b.lost ? ' lost' : ''}${visible.has(b.id) ? ' show' : ''}`}
          style={b.style}
        >
          <span className="sb-av" style={{ background: b.color }}>{b.initials}</span>
          <div>
            <p>{b.text}</p>
            <small>{b.time}</small>
          </div>
        </div>
      ))}
      <span className={`scene-unread${unreadVisible ? ' show' : ''}`}>99+</span>
    </div>
  )
}
