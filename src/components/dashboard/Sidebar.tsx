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
  Wallet,
  AlertCircle,
  MessageCircle,
  BarChart2,
  Gift,
  Tag,
  CreditCard,
  Shield,
  Star,
  Sparkles,
} from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import { Avatar } from '@/components/ui/Avatar'
import type { Shop, Profile } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

// Hiérarchie à 3 niveaux — section 4.2, SPEC-refonte-dashboard-marchand.md
// (Lot 2). Les libellés de groupe sont volontairement ceux du mockup.
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Aujourd'hui",
    items: [
      { href: '/dashboard',          label: 'Tableau de bord', icon: LayoutDashboard },
      { href: '/dashboard/orders',   label: 'Commandes',       icon: ShoppingBag },
      { href: '/dashboard/products', label: 'Produits',        icon: Package },
    ],
  },
  {
    label: 'Ma boutique',
    items: [
      { href: '/dashboard/clients',  label: 'Clients',       icon: UserCircle },
      { href: '/dashboard/reviews',  label: 'Avis clients',  icon: Star },
      { href: '/dashboard/revenues', label: 'Revenus',       icon: Wallet },
      { href: '/dashboard/rapports', label: 'Statistiques',  icon: BarChart2 },
    ],
  },
  {
    label: 'Compte',
    items: [
      { href: '/dashboard/billing',      label: 'Facturation', icon: CreditCard },
      { href: '/dashboard/affiliation',  label: 'Affiliation', icon: Gift },
      { href: '/dashboard/promo-codes',  label: 'Codes promo', icon: Tag },
      { href: '/dashboard/settings',     label: 'Paramètres',  icon: Settings },
    ],
  },
]

interface SidebarProps {
  shop: Shop
  profile: Profile
  isAdmin?: boolean
  onChatOpen?: () => void
}

export function Sidebar({ shop, profile: _profile, isAdmin = false, onChatOpen }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Identité boutique */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
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
          <PlanBadge plan={shop.plan} trialModel={shop.trial_model} status={shop.status} />
        </div>
      </div>

      {/* Navigation groupée */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
            {/* Espace Admin — même condition qu'avant (whitelist ADMIN_USER_IDS,
                calculée dans dashboard/layout.tsx), placé en dernier item du
                groupe Compte : c'est une page comme les autres, contrairement
                à Assistant IA/Support/Déconnexion ci-dessous qui sont des
                actions, pas des pages. La spec ne précise pas cet
                emplacement — choix fait faute d'indication. */}
            {group.label === 'Compte' && isAdmin && (
              <Link
                href="/admin"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
              >
                <Shield className="h-4 w-4 shrink-0" />
                Espace Admin
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Actions — Assistant IA / Support / Déconnexion, section 4.2 */}
      <div className="border-t border-gray-100 px-3 py-3 space-y-1">
        {onChatOpen && (
          <button
            onClick={onChatOpen}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-gray-400" />
            Assistant IA
          </button>
        )}

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
  )
}

function PlanBadge({ plan, trialModel, status }: { plan: string; trialModel?: string; status?: string }) {
  // free_orders : plan reste 'trial' tout au long de l'essai (14 jours), y
  // compris après passage en 'expired' — le badge "Non activé" hérité de
  // legacy y serait donc soit trompeur (contredit le bandeau "X/3 · N jours
  // restants" pendant l'essai), soit muet au moment où il faudrait vraiment
  // alerter (expired). C'est status qui fait foi pour ce modèle, jamais plan.
  if (trialModel === 'free_orders') {
    if (status === 'expired') {
      return (
        <Link
          href="/dashboard/upgrade"
          className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
        >
          <AlertCircle className="h-3 w-3 shrink-0" />
          Plan requis
        </Link>
      )
    }
    if (plan === 'trial') return null
  }

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
