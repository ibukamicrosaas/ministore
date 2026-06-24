'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Bell, BellRing, Eye } from 'lucide-react'
import { PWAInstallButton } from './PWAInstallButton'
import { PushEnableButton } from './PushEnableButton'

interface TopBarProps {
  onMenuClick: () => void
  title?: string
  unreadCount?: number
  shopSlug?: string
}

export function TopBar({ onMenuClick, title, unreadCount = 0, shopSlug }: TopBarProps) {
  const pathname = usePathname()
  const notifActive = pathname === '/dashboard/notifications'

  return (
    <header className="fixed left-0 right-0 top-0 z-20 lg:relative flex h-14 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1">
        {title && (
          <h1 className="text-sm font-semibold text-gray-900 lg:text-base">{title}</h1>
        )}
      </div>

      <PWAInstallButton />
      <PushEnableButton />

      {shopSlug && (
        <Link
          href={`/preview/${shopSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Prévisualiser mon site"
          title="Prévisualiser mon site"
        >
          <Eye className="h-5 w-5" />
        </Link>
      )}

      <Link
        href="/dashboard/notifications"
        className={`relative rounded-lg p-2 transition-colors ${notifActive ? 'bg-sky-50 text-[var(--color-primary)]' : 'text-gray-500 hover:bg-gray-100'}`}
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-amber-500" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
            <span className="relative">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </span>
        )}
      </Link>
    </header>
  )
}
