'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingBag, Package, Sparkles, Grid2x2,
  UserCircle, Star, Wallet, BarChart2, CreditCard, Gift, Tag, Settings,
  MessageCircle, LogOut,
} from 'lucide-react'
import { clsx } from 'clsx'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { signOut } from '@/lib/actions/auth'
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
  { href: '/dashboard/products', label: 'Produits', icon: Package, exact: false },
]

// Feuille "Plus" — ordre exact section 4.1, SPEC-refonte-dashboard-marchand.md
// (Lot 2). Les mêmes routes servent à déterminer si l'onglet "Plus" doit
// s'afficher actif (page courante appartenant à ce groupe).
const MORE_ROUTES = [
  '/dashboard/clients', '/dashboard/reviews', '/dashboard/revenues', '/dashboard/rapports',
  '/dashboard/billing', '/dashboard/affiliation', '/dashboard/promo-codes', '/dashboard/settings',
]
const MORE_LINKS = [
  { href: '/dashboard/clients',     label: 'Clients',        icon: UserCircle },
  { href: '/dashboard/reviews',     label: 'Avis clients',   icon: Star },
  { href: '/dashboard/revenues',    label: 'Revenus',        icon: Wallet },
  { href: '/dashboard/rapports',    label: 'Statistiques',   icon: BarChart2 },
  { href: '/dashboard/billing',     label: 'Facturation',    icon: CreditCard },
  { href: '/dashboard/affiliation', label: 'Affiliation',    icon: Gift },
  { href: '/dashboard/promo-codes', label: 'Codes promo',    icon: Tag },
  { href: '/dashboard/settings',    label: 'Paramètres',     icon: Settings },
]

export function BottomNav({ profile: _profile, shop: _shop, onChatOpen, isChatOpen }: BottomNavProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)
  const moreActive = MORE_ROUTES.some((r) => pathname.startsWith(r))

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
    <>
      {/*
        overflow-visible est indispensable pour que le cercle central
        puisse dépasser visuellement au-dessus de la barre.
      */}
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
            {/* Cercle qui dépasse au-dessus de la barre — couleur pleine
                sombre, distincte des onglets de navigation (section 4.1). */}
            <div
              className={clsx(
                'absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all',
                'bg-[var(--db-ink,#14171F)]',
                isChatOpen
                  ? 'scale-95 shadow-md'
                  : 'hover:scale-105 hover:shadow-xl active:scale-95'
              )}
            >
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-[10px] font-semibold text-[var(--db-ink,#14171F)]">
              Assistant IA
            </span>
          </button>

          {rightTabs.map(renderTab)}

          {/* ── Plus ──────────────────────────────────────────────────── */}
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="Plus"
            className={clsx(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              moreActive ? 'text-[var(--color-primary)]' : 'text-gray-400'
            )}
          >
            <Grid2x2 className={clsx('h-5 w-5', moreActive ? 'text-[var(--color-primary)]' : 'text-gray-400')} />
            <span>Plus</span>
          </button>
        </div>
      </nav>

      <BottomSheet open={moreOpen} onOpenChange={setMoreOpen}>
        <div className="px-2 pb-4">
          {MORE_LINKS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, false)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium transition-colors',
                  active ? 'bg-sky-50 text-[var(--color-primary)]' : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className={clsx('h-5 w-5 shrink-0', active ? 'text-[var(--color-primary)]' : 'text-gray-400')} />
                {item.label}
              </Link>
            )
          })}

          <div className="my-2 border-t border-gray-100" />

          <a
            href="https://wa.me/221781362728"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium text-[#25D366] hover:bg-[#25D366]/8 transition-colors"
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            Support WhatsApp
          </a>

          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0 text-gray-400" />
              Déconnexion
            </button>
          </form>
        </div>
      </BottomSheet>
    </>
  )
}
