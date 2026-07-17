import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export async function SiteHeader() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center">
          <Image src="/logo.svg" alt="TekkiShop" width={140} height={32} priority />
        </Link>
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-gray-600">
          <Link href="/#comment" className="hover:text-gray-900 transition-colors">Comment ça marche</Link>
          <Link href="/produits-digitaux" className="hover:text-gray-900 transition-colors">Produits digitaux</Link>
          <Link href="/europe-canada" className="hover:text-gray-900 transition-colors">Europe & Canada</Link>
          <Link href="/#tarifs" className="hover:text-gray-900 transition-colors">Tarifs</Link>
          <Link href="/#faq" className="hover:text-gray-900 transition-colors">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Mon tableau de bord
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-2 transition-colors">
                Connexion
              </Link>
              <Link
                href="/onboarding"
                className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-3 sm:px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-sm"
              >
                <span className="sm:hidden">Commencer</span>
                <span className="hidden sm:inline">Créer ma boutique</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
