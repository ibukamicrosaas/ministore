'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Package, Settings } from 'lucide-react'
import { clsx } from 'clsx'
import type { Profile, Shop } from '@/types'

interface BottomNavProps {
  profile: Profile
  shop: Shop
}

const tabs = [
  { href: '/dashboard',          label: 'Accueil',     icon: LayoutDashboard, exact: true },
  { href: '/dashboard/orders',   label: 'Commandes',   icon: ShoppingBag,     exact: false },
  { href: '/dashboard/products', label: 'Produits',    icon: Package,         exact: false },
  { href: '/dashboard/settings', label: 'Paramètres',  icon: Settings,        exact: false },
]

export function BottomNav({ profile, shop }: BottomNavProps) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white lg:hidden">
      <div className="flex h-16 items-stretch">
        {tabs.map((tab) => {
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
        })}
      </div>
    </nav>
  )
}
