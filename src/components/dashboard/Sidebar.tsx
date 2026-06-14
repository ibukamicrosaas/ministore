'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  UserCircle,
  Settings,
  LogOut,
  X,
  Wallet,
  AlertCircle,
  MessageCircle,
  BarChart2,
  Gift,
  Tag,
  CreditCard,
} from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import { Avatar } from '@/components/ui/Avatar'
import type { Shop, Profile } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: '/dashboard',               label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/orders',        label: 'Commandes',       icon: ShoppingBag },
  { href: '/dashboard/products',      label: 'Produits',        icon: Package },
  { href: '/dashboard/clients',       label: 'Clients',         icon: UserCircle },
  { href: '/dashboard/revenues',      label: 'Revenus',         icon: Wallet },
  { href: '/dashboard/billing',       label: 'Facturation',     icon: CreditCard },
  { href: '/dashboard/rapports',      label: 'Statistiques',    icon: BarChart2 },
  { href: '/dashboard/affiliation',   label: 'Affiliation',     icon: Gift },
  { href: '/dashboard/promo-codes',   label: 'Codes promo',     icon: Tag },
  { href: '/dashboard/settings',      label: 'Paramètres',      icon: Settings },
]

interface SidebarProps {
  shop: Shop
  profile: Profile
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ shop, profile, open, onClose }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
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
        {/* Header boutique */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            {shop.logo_url ? (
              <Avatar src={shop.logo_url} name={shop.name} size="sm" />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-sm font-bold"
                style={{ backgroundColor: shop.primary_color ?? 'var(--color-primary)' }}
              >
                {shop.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{shop.name}</p>
              <PlanBadge plan={shop.plan} />
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
                    ? 'bg-sky-50 text-[var(--color-primary)]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={clsx('h-4 w-4 shrink-0', active ? 'text-[var(--color-primary)]' : 'text-gray-400')} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer profil + support + déconnexion */}
        <div className="border-t border-gray-100 px-3 py-3 space-y-1">
          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Avatar
              src={shop.logo_url ?? undefined}
              name={[profile.first_name, profile.last_name].filter(Boolean).join(' ') || shop.name}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || shop.name}
              </p>
              <p className="text-xs text-gray-500">Propriétaire</p>
            </div>
          </Link>

          {/* Support WhatsApp */}
          <a
            href="https://wa.me/221781362728"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#25D366] hover:bg-[#25D366]/8 transition-colors"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            Support WhatsApp
          </a>

          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
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

function PlanBadge({ plan }: { plan: string }) {
  if (plan === 'trial') {
    return (
      <Link
        href="/dashboard/upgrade"
        className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
      >
        <AlertCircle className="h-3 w-3 shrink-0" />
        Non activé
      </Link>
    )
  }
  const label = plan === 'starter' ? 'Starter'
    : plan === 'decouverte' ? 'Découverte'
    : plan === 'business' ? 'Business'
    : plan === 'pro' ? 'Pro'
    : plan
  return (
    <Link
      href="/dashboard/upgrade"
      className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
      title="Changer de plan"
    >
      Plan {label}
      <span className="text-gray-400">·</span>
      <span className="text-gray-400 hover:text-gray-600 text-[10px]">changer</span>
    </Link>
  )
}
