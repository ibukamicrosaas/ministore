import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import { CheckCircle2, ArrowRight, ShoppingBag, Smartphone, Zap, Star } from 'lucide-react'
import { SiteFooter } from '@/components/landing/SiteFooter'
import type { Metadata } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'TEKKIShop Togo — Crée ta boutique en ligne à Lomé en 5 minutes',
  description:
    'Vends en ligne depuis Lomé, Kara ou Sokodé. Tes clients paient par Flooz, T-Money ou Wave. Tu reçois l\'argent sur ton téléphone. Boutique en ligne en 5 minutes, sans développeur.',
  openGraph: {
    title: 'TEKKIShop Togo — Boutique en ligne en 5 minutes',
    description: 'La façon la plus simple de vendre en ligne au Togo.',
    locale: 'fr_TG',
  },
}

const STEPS = [
  {
    num: '1',
    title: 'Crée ton compte en 2 minutes',
    text: 'Ton numéro de téléphone suffit. Pas besoin de carte bancaire.',
  },
  {
    num: '2',
    title: 'Ajoute tes produits',
    text: 'Photo, nom, prix. Tes produits sont en ligne en quelques secondes.',
  },
  {
    num: '3',
    title: 'Partage ton lien & vends',
    text: 'Envoie ton lien sur WhatsApp ou TikTok. Tes clients commandent et paient. Tu reçois l\'argent.',
  },
]

const FEATURES = [
  { icon: Smartphone, title: 'Tout depuis ton téléphone', text: 'Crée ta boutique, gère tes commandes et reçois les paiements — sans ordinateur.' },
  { icon: Zap,        title: 'En ligne en 5 minutes',     text: 'Pas besoin de développeur. Pas de frais d\'installation. Tu commences gratuitement.' },
  { icon: ShoppingBag, title: 'Commandes sur WhatsApp',   text: 'Chaque commande t\'arrive directement sur WhatsApp avec les détails du client.' },
]

const TESTIMONIALS = [
  {
    name: 'Mawuli A.',
    city: 'Lomé',
    text: 'Avant je perdais des commandes sur WhatsApp. Maintenant tout est organisé et mes clients sont satisfaits.',
    stars: 5,
  },
  {
    name: 'Kossi D.',
    city: 'Kara',
    text: 'J\'ai créé ma boutique en moins de 10 minutes. Le lendemain j\'avais déjà ma première commande.',
    stars: 5,
  },
  {
    name: 'Akosua M.',
    city: 'Lomé',
    text: 'Je vends des pagnes wax en ligne. Les paiements par Flooz facilitent tout pour mes clients.',
    stars: 5,
  },
]

export default async function TogoPage() {
  const admin = createAdminClient()
  const { count: togoShopsCount } = await admin
    .from('shops')
    .select('id', { count: 'exact', head: true })
    .eq('country', 'TG')

  const shopsCount = togoShopsCount ?? 0

  return (
    <div className="min-h-screen bg-white" style={{ '--color-primary': '#0EA5E9' } as React.CSSProperties}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/togo" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="TEKKIShop" width={130} height={30} priority />
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 uppercase tracking-wide">Togo</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 transition-colors">
              Connexion
            </Link>
            <Link
              href="/start"
              className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white hover:bg-sky-600 transition-colors shadow-sm"
            >
              Créer ma boutique
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 to-white px-4 pt-16 pb-20 text-center">
        <div className="mx-auto max-w-3xl">
          {shopsCount > 0 && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-medium text-sky-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              Déjà {shopsCount} boutique{shopsCount > 1 ? 's' : ''} créée{shopsCount > 1 ? 's' : ''} au Togo
            </div>
          )}

          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl leading-tight">
            Crée ta boutique en ligne{' '}
            <span className="text-sky-500">au Togo</span>
            <br />
            en 5 minutes.
          </h1>

          <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Tu vends à Lomé, Kara, Sokodé ou ailleurs ?
            Tes clients commandent depuis leur téléphone et paient par{' '}
            <strong className="text-gray-700">Flooz, T-Money ou Wave</strong>.
            Tu reçois l'argent directement.
          </p>

          {/* Méthodes de paiement */}
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            {[
              { src: '/logo-payments/moov_1.svg',   alt: 'Flooz (Moov)',    label: 'Flooz' },
              { src: '/logo-payments/togocell.jpg',  alt: 'T-Money',         label: 'T-Money' },
              { src: '/logo-payments/wave_1.svg',    alt: 'Wave',            label: 'Wave' },
            ].map(m => (
              <div key={m.alt} className="flex flex-col items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.src} alt={m.alt} className="h-8 w-auto object-contain rounded" />
                <span className="text-[10px] text-gray-400 font-medium">{m.label}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1">
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-base">💵</div>
              <span className="text-[10px] text-gray-400 font-medium">Livraison</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-sky-600 active:scale-[0.98] transition-all"
            >
              <ShoppingBag className="h-5 w-5" />
              Créer ma boutique gratuitement
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              J'ai déjà un compte
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            ✓ Pas besoin de développeur &nbsp;·&nbsp; ✓ Pas besoin d'ordinateur &nbsp;·&nbsp; ✓ Commence gratuitement
          </p>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section id="comment" className="px-4 py-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            3 étapes pour vendre en ligne
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map(step => (
              <div key={step.num} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-xl font-black text-sky-500">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-4 py-16 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
                  <f.icon className="h-5 w-5 text-sky-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Témoignages ── */}
      <section className="px-4 py-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            Ce qu'ils disent
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 stroke-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.city}, Togo</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tarifs ── */}
      <section id="tarifs" className="px-4 py-20 bg-sky-50">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Des tarifs pensés pour les entrepreneurs togolais
          </h2>
          <p className="text-gray-500 mb-10">
            Commence gratuitement. Passe au plan payant quand tu veux, sans engagement.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 max-w-xl mx-auto">
            {[
              {
                name: 'Découverte',
                price: 'Gratuit',
                sub: 'pour commencer',
                features: ['Boutique en ligne', 'Commandes WhatsApp', 'Jusqu\'à 10 produits'],
                cta: 'Commencer gratuitement',
                highlight: false,
              },
              {
                name: 'Business',
                price: '7 500 FCFA',
                sub: '/ mois',
                features: ['Produits illimités', 'Paiements en ligne', 'Statistiques avancées'],
                cta: 'Essai gratuit 14 jours',
                highlight: true,
              },
            ].map(plan => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 text-left ${plan.highlight ? 'bg-sky-500 text-white shadow-lg' : 'bg-white border border-gray-200'}`}
              >
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${plan.highlight ? 'text-sky-100' : 'text-gray-400'}`}>{plan.name}</p>
                <p className={`text-2xl font-black mb-0.5 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}</p>
                <p className={`text-xs mb-4 ${plan.highlight ? 'text-sky-200' : 'text-gray-400'}`}>{plan.sub}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-sky-50' : 'text-gray-600'}`}>
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.highlight ? 'text-white' : 'text-sky-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/start"
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-colors ${
                    plan.highlight
                      ? 'bg-white text-sky-500 hover:bg-sky-50'
                      : 'bg-sky-500 text-white hover:bg-sky-600'
                  }`}
                >
                  {plan.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="px-4 py-20 bg-gray-900 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Prêt à vendre en ligne au Togo ?
          </h2>
          <p className="text-gray-400 mb-8">
            Rejoins les marchands qui ont déjà leur boutique en ligne avec TEKKIShop.
          </p>
          <Link
            href="/start"
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-sky-600 active:scale-[0.98] transition-all"
          >
            <ShoppingBag className="h-5 w-5" />
            Créer ma boutique gratuitement
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
