import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminNav } from '@/components/admin/AdminNav'
import { signOut } from '@/lib/actions/auth'
import { LogOut } from 'lucide-react'

export const metadata: Metadata = { robots: { index: false, follow: false } }

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex">

      {/* ── Sidebar desktop ── */}
      <aside className="hidden lg:flex w-56 xl:w-60 shrink-0 bg-[#161b27] border-r border-white/[0.06] flex-col">
        <AdminNav variant="sidebar" />
      </aside>

      {/* ── Zone principale ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar mobile */}
        <header className="lg:hidden bg-[#161b27] border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-[10px] font-black tracking-[0.2em] text-sky-400 uppercase">
              TEKKIShop Admin
            </p>
            <form action={signOut}>
              <button type="submit" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
          <AdminNav variant="topbar" />
        </header>

        {/* Contenu — full width, pas de max-w */}
        <main className="flex-1 min-w-0 bg-[#f8f9fc] overflow-auto">
          <div className="p-5 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
