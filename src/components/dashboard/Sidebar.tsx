'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Users,
  Scissors,
  UserCircle,
  BarChart3,
  Settings,
  LogOut,
  X,
  Banknote,
  CalendarCheck,
  AlertCircle,
  Wallet,
} from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import { Avatar } from '@/components/ui/Avatar'
import type { Salon, Profile } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  ownerOnly?: boolean
  staffOnly?: boolean
  salonOnly?: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard',               label: 'Tableau de bord', icon: LayoutDashboard, ownerOnly: true },
  { href: '/dashboard/my-schedule',   label: 'Mon planning',    icon: CalendarCheck,  staffOnly: true },
  { href: '/dashboard/calendar',      label: 'Calendrier',      icon: CalendarRange,  ownerOnly: true },
  { href: '/dashboard/services',      label: 'Prestations',     icon: Scissors,       ownerOnly: true },
  { href: '/dashboard/staff',         label: 'Employées',       icon: Users,          ownerOnly: true, salonOnly: true },
  { href: '/dashboard/bookings',      label: 'Réservations',    icon: CalendarDays,   ownerOnly: true },
  { href: '/dashboard/commissions',   label: 'Commissions',     icon: Banknote,       ownerOnly: true, salonOnly: true },
  { href: '/dashboard/clients',       label: 'Clientes',        icon: UserCircle,     ownerOnly: true },
  { href: '/dashboard/reports',       label: 'Rapports',        icon: BarChart3,      ownerOnly: true },
  { href: '/dashboard/revenues',      label: 'Revenus',         icon: Wallet,         ownerOnly: true },
  { href: '/dashboard/settings',      label: 'Paramètres',      icon: Settings,       ownerOnly: true },
]

interface SidebarProps {
  salon: Salon
  profile: Profile
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ salon, profile, open, onClose }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 z-40 flex h-full w-64 flex-col bg-white border-r border-gray-200',
          'transition-transform duration-200 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            {salon.logo_url ? (
              <Avatar src={salon.logo_url} name={salon.name} size="sm" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E85D04] text-white text-sm font-bold">
                {salon.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{salon.name}</p>
              <TrialBadge plan={salon.plan} trialEndsAt={salon.trial_ends_at} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isOwner = profile.role === 'owner'
            const isSalon = salon.business_type === 'salon'
            if (item.ownerOnly && !isOwner) return null
            if (item.staffOnly && isOwner) return null
            if (item.salonOnly && !isSalon) return null

            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-orange-50 text-[#E85D04]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={clsx('h-4 w-4 shrink-0', active ? 'text-[#E85D04]' : 'text-gray-400')} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer profil + déconnexion */}
        <div className="border-t border-gray-100 px-3 py-3">
          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Avatar
              name={[profile.first_name, profile.last_name].filter(Boolean).join(' ') || salon.name}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || salon.name}
              </p>
              <p className="text-xs text-gray-500">{profile.role === 'owner' ? 'Propriétaire' : 'Employée'}</p>
            </div>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-4 w-4 text-gray-400" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}

function TrialBadge({ plan, trialEndsAt }: { plan: string; trialEndsAt: string }) {
  if (plan !== 'trial') {
    return <p className="text-xs text-gray-500 capitalize">{plan}</p>
  }

  const daysLeft = Math.max(0, Math.ceil(
    (new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ))
  const urgent = daysLeft <= 5

  return (
    <Link
      href={urgent ? '/dashboard/upgrade' : '/dashboard/settings'}
      className={clsx(
        'flex items-center gap-1 text-xs font-medium transition-colors',
        urgent ? 'text-red-500 hover:text-red-600' : 'text-orange-500 hover:text-orange-600'
      )}
    >
      {urgent && <AlertCircle className="h-3 w-3 shrink-0" />}
      {daysLeft > 0
        ? `Essai · ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`
        : 'Essai expiré'}
    </Link>
  )
}
