'use client'

import { usePathname } from 'next/navigation'

const HIDDEN_ON = ['/commander', '/avis/']

export function ShopBranding() {
  const pathname = usePathname()
  if (HIDDEN_ON.some(segment => pathname.includes(segment))) return null

  // Page d'accueil boutique (/{slug}, aucun segment après) : ce footer est le
  // dernier élément réel de la page (rendu après ShopHomeLayout dans
  // layout.tsx) — sans marge supplémentaire, il passe sous la barre collante
  // mobile (Commander + WhatsApp) une fois scrollé tout en bas. L'espaceur
  // interne à ShopHomeLayout ne le protège pas : il vient avant ce footer
  // dans le DOM, donc sans effet sur ce qui suit.
  const isShopHome = pathname.split('/').filter(Boolean).length === 1

  return (
    <footer className={`max-w-lg mx-auto px-4 py-6 text-center ${isShopHome ? 'pb-[calc(89px+env(safe-area-inset-bottom))] lg:pb-6' : ''}`}>
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
