'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Package, Settings, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import type { Profile, Shop } from '@/types'

interface BottomNavProps {
  profile: Profile
  shop: Shop
  onChatOpen: () => void
  isChatOpen: boolean
}

const leftTabs = [
  { href: '/dashboard',        label: 'Accueil',   icon: LayoutDashboard, exact: true },
  { href: '/dashboard/orders', label: 'Commandes', icon: ShoppingBag,     exact: false },
]

const rightTabs = [
  { href: '/dashboard/products',  label: 'Produits',    icon: Package,  exact: false },
  { href: '/dashboard/settings',  label: 'Paramètres',  icon: Settings, exact: false },
]

export function BottomNav({ profile: _profile, shop: _shop, onChatOpen, isChatOpen }: BottomNavProps) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const renderTab = (tab: { href: string; label: string; icon: React.ElementType; exact: boolean }) => {
    const active = isActive(tab.href, tab.exact)
    const Icon = tab.icon
    return (
      <Link
        key={tab.href}
        href={tab.href}
        className={clsx(
          'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
          active ? 'text-[var(--color-primary)]' : 'text-gray-400'
        )}
      >
        <Icon className={clsx('h-5 w-5', active ? 'text-[var(--color-primary)]' : 'text-gray-400')} />
        <span>{tab.label}</span>
      </Link>
    )
  }

  return (
    /*
      overflow-visible est indispensable pour que le cercle central
      puisse dépasser visuellement au-dessus de la barre.
    */
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white lg:hidden overflow-visible">
      <div className="flex h-16 items-stretch overflow-visible">

        {leftTabs.map(renderTab)}

        {/* ── Bouton central IA ─────────────────────────────────────── */}
        <button
          onClick={onChatOpen}
          aria-label="Ouvrir l'assistant IA"
          /*
            justify-end + pb-[13px] aligne "Assistant IA" à la même
            hauteur de baseline que les labels des autres onglets.
          */
          className="relative flex flex-1 flex-col items-center justify-end pb-[13px] transition-colors"
        >
          {/* Cercle qui dépasse au-dessus de la barre */}
          <div
            className={clsx(
              'absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all',
              'bg-[var(--color-primary)]',
              isChatOpen
                ? 'scale-95 shadow-md'
                : 'hover:scale-105 hover:shadow-xl active:scale-95'
            )}
          >
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className="text-[10px] font-semibold text-[var(--color-primary)]">
            Assistant IA
          </span>
        </button>

        {rightTabs.map(renderTab)}
      </div>
    </nav>
  )
}
