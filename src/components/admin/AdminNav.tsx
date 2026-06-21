'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Wallet,
  CreditCard,
  TrendingUp,
  Bell,
  ArrowLeft,
} from 'lucide-react'
import { signOut } from '@/lib/actions/auth'

const NAV = [
  { href: '/admin',               label: 'Vue d\'ensemble',   icon: LayoutDashboard },
  { href: '/admin/analytics',     label: 'Analytics',         icon: TrendingUp },
  { href: '/admin/shops',         label: 'Boutiques',         icon: Building2 },
  { href: '/admin/payments',      label: 'Paiements',         icon: CreditCard },
  { href: '/admin/payouts',       label: 'Reversements',      icon: Wallet },
  { href: '/admin/notifications', label: 'Notifications',     icon: Bell },
]

export function AdminNav({ variant }: { variant: 'sidebar' | 'topbar' }) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  if (variant === 'topbar') {
    return (
      <nav className="flex overflow-x-auto gap-1 px-3 py-2 scrollbar-none">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium shrink-0 transition-colors ${
                active
                  ? 'bg-white/15 text-white'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Branding */}
      <div className="px-4 py-4 border-b border-white/10">
        <p className="text-[10px] font-black tracking-[0.2em] text-sky-400 uppercase mb-0.5">
          TEKKIShop
        </p>
        <p className="text-[11px] text-gray-400 font-medium">Administration</p>
      </div>

      {/* Back to dashboard */}
      <div className="px-3 pt-3 pb-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour au dashboard
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-sky-500/20 text-sky-300 shadow-sm'
                  : 'text-gray-400 hover:bg-white/8 hover:text-gray-200'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-sky-400' : ''}`} />
              {label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-white/10">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-white/8 hover:text-gray-300 transition-colors"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </form>
      </div>
    </div>
  )
}
