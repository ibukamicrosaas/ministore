import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)]">
              <ShoppingBag className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">TekkiShop</span>
          </Link>
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-900">← Retour</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        {children}
      </main>
      <footer className="border-t border-gray-100 px-4 py-6 mt-10">
        <div className="max-w-3xl mx-auto flex flex-wrap gap-4 text-xs text-gray-400">
          <Link href="/legal/cgu" className="hover:text-gray-600">CGU</Link>
          <Link href="/legal/privacy" className="hover:text-gray-600">Politique de confidentialité</Link>
          <span>© 2026 TekkiShop</span>
        </div>
      </footer>
    </div>
  )
}
