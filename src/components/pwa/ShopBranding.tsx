'use client'

import { usePathname } from 'next/navigation'

const HIDDEN_ON = ['/commander', '/avis/']

export function ShopBranding() {
  const pathname = usePathname()
  if (HIDDEN_ON.some(segment => pathname.includes(segment))) return null

  return (
    <footer className="max-w-lg mx-auto px-4 py-6 text-center">
      <a
        href="/"
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        Toi aussi, ouvre ta boutique en 5 min avec{' '}
        <span className="font-semibold text-gray-500">TekkiShop</span>{' '}
        <span aria-hidden>→</span>
      </a>
    </footer>
  )
}
