'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Store, ShoppingCart, Palette, User } from 'lucide-react'

// Libellés complets — section 10, SPEC-refonte-dashboard-marchand.md (Lot 8).
// Les id restent inchangés (clé interne section={tab}/?tab=..., jamais
// affichée) — seul le libellé visible change, aucune réorganisation de champs.
const TABS = [
  { id: 'boutique', label: 'Boutique',            icon: Store },
  { id: 'ventes',   label: 'Paiement & livraison', icon: ShoppingCart },
  { id: 'contenu',  label: 'Apparence',            icon: Palette },
  { id: 'compte',   label: 'Mon compte',           icon: User },
]

interface Props {
  activeTab: string
}

export function SettingsTabNav({ activeTab }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Signal de scroll — ni la spec ni la maquette n'en prévoient (le mockup
  // masque la scrollbar sans autre indice), ajouté sur demande explicite
  // après relecture du Lot 8 : dégradé de bord tant qu'il reste des onglets
  // hors écran, des deux côtés selon la position de défilement.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      setCanScrollLeft(el.scrollLeft > 4)
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)

    return () => {
      el.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="relative mb-6">
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto rounded-2xl bg-gray-100 p-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {TABS.map(tab => {
          const Icon    = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Link
              key={tab.id}
              href={`/dashboard/settings?tab=${tab.id}`}
              scroll={false}
              prefetch={false}
              className={`flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {tab.label}
            </Link>
          )
        })}
      </div>

      {canScrollLeft && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-1 bottom-1 w-6 rounded-l-2xl bg-gradient-to-r from-gray-100 to-transparent"
        />
      )}
      {canScrollRight && (
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-1 bottom-1 w-6 rounded-r-2xl bg-gradient-to-l from-gray-100 to-transparent"
        />
      )}
    </div>
  )
}
