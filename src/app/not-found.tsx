import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, ArrowRight, CheckCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Header ── */}
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/icone-tekkishop.svg" alt="TEKKIShop" width={28} height={28} />
            <span className="font-bold text-gray-900 text-lg">TEKKIShop</span>
          </Link>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">

        {/* Icône */}
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-[28px] bg-sky-50 flex items-center justify-center mx-auto shadow-sm">
            <ShoppingBag className="h-14 w-14 text-sky-400" strokeWidth={1.5} />
          </div>
          <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-gray-100 text-sm font-bold text-gray-400 shadow-sm">
            404
          </span>
        </div>

        {/* Message principal */}
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3 lg:text-4xl leading-tight">
          Cette boutique n'existe pas encore.
        </h1>
        <p className="text-gray-400 text-base max-w-sm mb-10 leading-relaxed">
          L'URL que tu as cherchée ne correspond à aucune boutique active sur TEKKIShop.
        </p>

        {/* Proposition de valeur */}
        <div className="w-full max-w-sm bg-gradient-to-br from-sky-50 to-blue-50 rounded-3xl p-6 mb-8 text-left border border-sky-100">
          <p className="text-sky-900 font-bold text-lg mb-3 leading-snug">
            Et si tu créais<br />la tienne dès aujourd'hui ?
          </p>
          <ul className="space-y-2">
            {[
              'Boutique en ligne en 5 minutes',
              'Reçois tes commandes par WhatsApp',
              'Paiements Wave, Orange Money & carte',
            ].map(item => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-sky-800">
                <CheckCircle className="h-4 w-4 text-sky-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA principal */}
        <Link
          href="/start"
          className="inline-flex items-center gap-3 rounded-2xl bg-sky-500 px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-sky-600 active:scale-[0.98] transition-all mb-4"
        >
          <ShoppingBag className="h-5 w-5" />
          Créer ma boutique gratuitement
          <ArrowRight className="h-4 w-4" />
        </Link>

        {/* Lien secondaire */}
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-4">
          Retour à l'accueil
        </Link>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 px-6 py-5 text-center">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} TEKKIShop · La boutique en ligne pour l'Afrique de l'Ouest
        </p>
      </footer>

    </div>
  )
}
