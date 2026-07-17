import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle } from 'lucide-react'
import { COUNTRIES } from './countries'

export function SiteFooter() {
  return (
    <footer className="bg-[#0B1B32] border-t border-white/5 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-6">
          <div className="flex items-center opacity-70">
            <Image src="/logo_white.svg" alt="TekkiShop" width={120} height={28} />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/40">
            <Link href="/produits-digitaux" className="hover:text-white/70 transition-colors">Produits digitaux</Link>
            <Link href="/europe-canada" className="hover:text-white/70 transition-colors">Europe & Canada</Link>
            <Link href="/pourquoi-pas-shopify" className="hover:text-white/70 transition-colors">Pourquoi pas Shopify ?</Link>
            <Link href="/legal/cgu" className="hover:text-white/70 transition-colors">Conditions</Link>
            <Link href="/legal/privacy" className="hover:text-white/70 transition-colors">Confidentialité</Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white/70 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Support
            </a>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/20">© {new Date().getFullYear()} TekkiShop. Tous droits réservés.</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/20">Disponible au</span>
            {COUNTRIES.map(c => (
              <span key={c.name} title={c.name} className="text-sm opacity-60">{c.flag}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
