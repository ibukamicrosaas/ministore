import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function FinalCTA({
  title,
  subtitle,
  ctaLabel = 'Créer ma boutique gratuitement',
  reassurance = ['Boutique gratuite à créer', 'Pas besoin de carte bancaire'],
  background = '#0B1B32',
  maxWidth = 'max-w-lg',
}: {
  title: string
  subtitle: string
  ctaLabel?: string
  reassurance?: string[]
  background?: string
  maxWidth?: string
}) {
  return (
    <section className="py-20 px-4 relative overflow-hidden" style={{ background }}>
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, #0EA5E9 0%, transparent 60%)' }} />
      <div className={`relative text-center mx-auto ${maxWidth}`}>
        <h2
          className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white mb-4 leading-tight"
          style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
        >
          {title}
        </h2>
        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
          {subtitle}
        </p>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-7 py-4 text-base font-bold text-white shadow-lg shadow-sky-900/30 hover:opacity-90 active:scale-95 transition-all"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="text-xs text-gray-500 mt-4">
          {reassurance.map((r, i) => (
            <span key={r}>{i > 0 && <>&nbsp;·&nbsp;</>}✓ {r}</span>
          ))}
        </p>
      </div>
    </section>
  )
}
