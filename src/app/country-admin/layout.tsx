import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CountryAdminNav } from './CountryAdminNav'
import { signOut } from '@/lib/actions/auth'
import { LogOut } from 'lucide-react'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function CountryAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: cm } = await (admin
    .from('country_managers' as never)
    .select('country, name')
    .eq('user_id' as never, user.id)
    .single() as unknown as Promise<{ data: { country: string; name: string } | null }>)

  if (!cm) redirect('/dashboard')

  const countryLabel = cm.country === 'TG' ? '🇹🇬 Togo' :
                       cm.country === 'SN' ? '🇸🇳 Sénégal' :
                       cm.country === 'CI' ? '🇨🇮 Côte d\'Ivoire' :
                       `🌍 ${cm.country}`

  return (
    <div className="min-h-screen bg-[#0f1117] flex">

      {/* ── Sidebar desktop ── */}
      <aside className="hidden lg:flex w-56 xl:w-60 shrink-0 bg-[#161b27] border-r border-white/[0.06] flex-col">
        <div className="px-4 py-5 border-b border-white/[0.06]">
          <p className="text-[10px] font-black tracking-[0.2em] text-sky-400 uppercase mb-1">
            TEKKIShop
          </p>
          <p className="text-xs font-semibold text-white">{countryLabel}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{cm.name}</p>
        </div>
        <CountryAdminNav variant="sidebar" country={cm.country} />
        <div className="mt-auto p-4 border-t border-white/[0.06]">
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* ── Zone principale ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar mobile */}
        <header className="lg:hidden bg-[#161b27] border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-[10px] font-black tracking-[0.2em] text-sky-400 uppercase">
                TEKKIShop {countryLabel}
              </p>
              <p className="text-[10px] text-gray-500">{cm.name}</p>
            </div>
            <form action={signOut}>
              <button type="submit" className="text-gray-400 hover:text-white transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
          <CountryAdminNav variant="topbar" country={cm.country} />
        </header>

        <main className="flex-1 min-w-0 bg-[#f8f9fc] overflow-auto">
          <div className="p-5 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
