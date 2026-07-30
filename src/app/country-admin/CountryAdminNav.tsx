'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Wallet } from 'lucide-react'

const NAV = [
  { href: '/country-admin',          label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { href: '/country-admin/boutiques', label: 'Boutiques',       icon: Building2 },
  { href: '/country-admin/revenus',   label: 'Mes revenus',     icon: Wallet },
]

export function CountryAdminNav({ variant, country: _country }: { variant: 'sidebar' | 'topbar'; country: string }) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/country-admin' ? pathname === '/country-admin' : pathname.startsWith(href)

  if (variant === 'topbar') {
    return (
      <nav className="flex overflow-x-auto gap-1 px-3 py-2 scrollbar-none">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium shrink-0 transition-colors ${
              isActive(href)
                ? 'bg-white/15 text-white'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    )
  }

  return (
    <nav className="flex flex-col gap-1 p-3 flex-1">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
            isActive(href)
              ? 'bg-sky-500/20 text-sky-300'
              : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
