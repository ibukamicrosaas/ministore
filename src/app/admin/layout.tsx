import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'

export const metadata: Metadata = { robots: { index: false, follow: false } }
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Building2, Wallet, LogOut, CreditCard, TrendingUp, Bell } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

const navLinks = [
  { href: '/admin',                 label: 'Vue d\'ensemble',    icon: LayoutDashboard },
  { href: '/admin/analytics',       label: 'Analytics',         icon: TrendingUp },
  { href: '/admin/shops',           label: 'Boutiques',          icon: Building2 },
  { href: '/admin/payments',        label: 'Paiements Bictorys', icon: CreditCard },
  { href: '/admin/payouts',         label: 'Reversements',       icon: Wallet },
  { href: '/admin/notifications',   label: 'Notifications',      icon: Bell },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Navigation mobile (top bar) ── */}
      <header className="lg:hidden bg-gray-900 text-white">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <p className="text-xs font-bold tracking-widest text-sky-400 uppercase">TekkiShop Admin</p>
          <form action={signOut}>
            <button type="submit" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white">
              <LogOut className="h-3.5 w-3.5" />
              Déco
            </button>
          </form>
        </div>
        <nav className="flex overflow-x-auto gap-1 px-3 py-2">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors shrink-0"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="lg:flex lg:min-h-screen">
        {/* ── Sidebar desktop ── */}
        <aside className="hidden lg:flex w-56 shrink-0 bg-gray-900 text-white flex-col min-h-screen">
          <div className="px-5 py-4 border-b border-white/10">
            <p className="text-xs font-bold tracking-widest text-sky-400 uppercase">TekkiShop Admin</p>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="px-3 py-3 border-t border-white/10">
            <form action={signOut}>
              <button type="submit" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </form>
          </div>
        </aside>

        {/* ── Contenu ── */}
        <main className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
