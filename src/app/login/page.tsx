import Link from 'next/link'
import Image from 'next/image'
import { LoginForm } from './LoginForm'
import { APP_NAME } from '@/constants'

export const metadata = {
  title: `Connexion — ${APP_NAME}`,
}

const COUNTRIES = [
  { flag: '🇸🇳', name: 'Sénégal' },
  { flag: '🇨🇮', name: "Côte d'Ivoire" },
  { flag: '🇧🇯', name: 'Bénin' },
  { flag: '🇹🇬', name: 'Togo' },
  { flag: '🇲🇱', name: 'Mali' },
  { flag: '🇧🇫', name: 'Burkina Faso' },
]

const BENEFITS = [
  { emoji: '⚡', text: 'Ton site en ligne en 5 minutes' },
  { emoji: '💳', text: 'Wave, Orange Money, paiement à la livraison' },
  { emoji: '📲', text: 'Gère tout depuis ton téléphone' },
  { emoji: '🔔', text: 'Confirmations automatiques pour tes clients' },
]

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ fontFamily: 'var(--font-sans, DM Sans, sans-serif)' }}>

      {/* ── Panneau gauche (desktop uniquement) ─────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between flex-1 bg-[#0F1729] px-12 py-10 relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #0EA5E9 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #22D3EE 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        {/* Logo */}
        <div className="relative">
          <Link href="/">
            <Image src="/logo_white.svg" alt={APP_NAME} width={130} height={30} />
          </Link>
        </div>

        {/* Central content */}
        <div className="relative max-w-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-5">
            +500 marchands nous font confiance
          </p>
          <h2
            className="text-3xl font-black text-white leading-tight mb-6"
            style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
          >
            La façon la plus simple<br />
            de <span className="text-sky-400">vendre en ligne</span><br />
            en Afrique de l&apos;Ouest.
          </h2>

          <ul className="space-y-4 mb-10">
            {BENEFITS.map((b) => (
              <li key={b.text} className="flex items-center gap-3 text-gray-300 text-sm">
                <span className="text-xl w-7 shrink-0">{b.emoji}</span>
                <span>{b.text}</span>
              </li>
            ))}
          </ul>

          {/* Pays */}
          <div>
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-medium">Disponible dans 6 pays</p>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((c) => (
                <span
                  key={c.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300"
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Témoignage */}
        <div className="relative border-t border-white/10 pt-6">
          <div className="flex gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-amber-400 text-sm">★</span>
            ))}
          </div>
          <p className="text-gray-400 text-sm italic leading-relaxed mb-3">
            &ldquo;Avant je perdais mes commandes sur WhatsApp. Maintenant tout est organisé et mes clients sont satisfaits.&rdquo;
          </p>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-sm">F</div>
            <div>
              <p className="text-white text-xs font-semibold">Fatou D.</p>
              <p className="text-gray-500 text-[10px]">Boutique mode · Dakar, Sénégal</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panneau droit — Formulaire ───────────────────────────────────── */}
      <div className="flex flex-col flex-1 lg:flex-none lg:w-[45%] bg-gray-50 lg:bg-white">

        {/* Header mobile uniquement */}
        <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-white">
          <Link href="/">
            <Image src="/logo.svg" alt={APP_NAME} width={110} height={26} />
          </Link>
          <Link href="/onboarding" className="text-xs font-semibold text-[var(--color-primary)]">
            Créer mon site →
          </Link>
        </div>

        {/* Proof bar mobile */}
        <div className="lg:hidden bg-sky-50 border-b border-sky-100 px-4 py-2.5">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-[10px] text-sky-700 font-medium">Disponible au</span>
            {COUNTRIES.map(c => (
              <span key={c.name} title={c.name} className="text-base">{c.flag}</span>
            ))}
            <span className="text-[10px] text-sky-600">· +500 marchands actifs</span>
          </div>
        </div>

        {/* Form area */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 lg:py-16">
          <div className="w-full max-w-sm">

            {/* Logo desktop dans le form panel */}
            <div className="hidden lg:flex flex-col items-center mb-8 text-center">
              <Image
                src="/icone-tekkishop.svg"
                alt={APP_NAME}
                width={52}
                height={52}
                className="rounded-2xl mb-4"
              />
              <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
              <p className="mt-1 text-sm text-gray-500">Ton site marchand en quelques minutes</p>
            </div>

            {/* Titre mobile */}
            <div className="lg:hidden mb-7 text-center">
              <Image
                src="/icone-tekkishop.svg"
                alt={APP_NAME}
                width={48}
                height={48}
                className="rounded-2xl mx-auto mb-3"
              />
              <h1 className="text-xl font-bold text-gray-900">{APP_NAME}</h1>
              <p className="mt-1 text-sm text-gray-500">Ton site marchand en quelques minutes</p>
            </div>

            <LoginForm />

            <p className="mt-5 text-center text-xs text-gray-400">
              En te connectant, tu acceptes nos{' '}
              <Link href="/legal/cgu" className="underline hover:text-gray-600">CGU</Link>
              {' '}et notre{' '}
              <Link href="/legal/privacy" className="underline hover:text-gray-600">politique de confidentialité</Link>.
            </p>

            {/* Back to home */}
            <div className="mt-6 text-center">
              <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                ← Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
