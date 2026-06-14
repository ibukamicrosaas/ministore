import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import {
  ShoppingBag, MessageCircle, CheckCircle2, ArrowRight,
  Package, Smartphone, CreditCard, Bell, BarChart3,
  TrendingUp, Zap, Users, Star,
} from 'lucide-react'
import { PaymentScroll } from '@/components/landing/PaymentScroll'
import { TestimonialsCarousel } from '@/components/landing/TestimonialsCarousel'
import { AnimatedPhoneMockup } from '@/components/landing/AnimatedPhoneMockup'
import { FAQAccordion } from '@/components/landing/FAQAccordion'
import { HeroInput } from '@/components/landing/HeroInput'
import { PricingSection } from '@/components/landing/PricingSection'
import { StepsSection } from '@/components/landing/StepsSection'
import { APP_NAME } from '@/constants'

export const metadata = {
  title: `${APP_NAME} — Crée le site de ton business en 5 minutes`,
  description: "Tu vends quelque chose ? Crée ton site en 5 minutes. Tes clients commandent et paient par Wave ou Orange Money. Tu reçois l'argent directement sur ton téléphone.",
}

const COUNTRIES = [
  { flag: '🇸🇳', name: 'Sénégal' },
  { flag: '🇨🇮', name: "Côte d'Ivoire" },
  { flag: '🇧🇯', name: 'Bénin' },
  { flag: '🇹🇬', name: 'Togo' },
  { flag: '🇲🇱', name: 'Mali' },
  { flag: '🇧🇫', name: 'Burkina Faso' },
]

const CATEGORIES = [
  '🍽️ Alimentation',
  '👗 Mode & Vêtements',
  '💄 Beauté & Cosmétiques',
  '🎨 Artisanat',
  '📱 Électronique',
  '🏡 Maison & Déco',
  '🛵 Livraison & Traiteur',
  '📚 Formation & Coaching',
  '🌿 Agriculture & Plants',
  '👶 Puériculture',
  '✂️ Couture & Textile',
  '💊 Pharmacie & Santé',
]

const FEATURES = [
  {
    icon: Package,
    title: 'Tes produits en ligne',
    description: 'Ajoute tes produits avec photos, prix et description. Tes clients voient tout sur ton site.',
    color: 'bg-sky-500',
  },
  {
    icon: CreditCard,
    title: 'Mobile Money',
    description: "Tes clients peuvent payer par Wave, Orange Money, ou autres moyens populaires en Afrique.",
    color: 'bg-emerald-500',
  },
  {
    icon: MessageCircle,
    title: 'Récap automatique sur WhatsApp',
    description: "Dès qu'une commande est passée, ton client reçoit un message WhatsApp automatique. Toi aussi.",
    color: 'bg-[#25D366]',
  },
  {
    icon: Smartphone,
    title: 'Tu gères depuis ton téléphone',
    description: 'Confirme tes commandes, suis tes livraisons, gère tes produits. Tout depuis ton téléphone.',
    color: 'bg-violet-500',
  },
  {
    icon: Bell,
    title: 'Paiement à la livraison',
    description: "Tes clients peuvent aussi choisir de payer quand tu livres ou en boutique. C'est toi qui décides.",
    color: 'bg-amber-500',
  },
  {
    icon: BarChart3,
    title: 'Tu suis tes revenus',
    description: "Vois ton chiffre d'affaires du jour, de la semaine. Récupère ton argent sur Wave ou Orange Money.",
    color: 'bg-indigo-500',
  },
]

export default async function LandingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { count: totalShopsCount } = await supabase
    .from('shops')
    .select('id', { count: 'exact', head: true })

  const { data: allShops } = await supabase
    .from('shops')
    .select('id, name, slug, plan, city, logo_url, is_active, created_at')
    .eq('is_active', true)
    .in('plan', ['pro', 'business'])
    .order('plan', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(8)

  const shops = allShops || []
  const shopsCount = totalShopsCount ?? 0

  const STATS = [
    { value: `+${shopsCount}`, label: 'sites actifs', icon: Users },
    { value: '847', label: 'commandes traitées', icon: ShoppingBag },
    { value: '4.9 ★', label: 'satisfaction', icon: Star },
  ]

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-sans, DM Sans, sans-serif)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <Image src="/logo.svg" alt="TekkiShop" width={140} height={32} priority />
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <a href="#comment" className="hover:text-gray-900 transition-colors">Comment ça marche</a>
            <a href="#tarifs" className="hover:text-gray-900 transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
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
                  <span className="hidden sm:inline">Créer mon site</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-16 lg:pt-24">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Texte gauche */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-600 mb-7">
              <Zap className="h-3.5 w-3.5" />
              Tout se passe sur ton téléphone
            </div>

            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.02] tracking-tight mb-6"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Crée le site de<br />
              ton business<br />
              <span className="text-[var(--color-primary)]">en 5 minutes.</span>
            </h1>

            <p className="text-xl text-gray-500 mb-7 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Partage le lien à tes clients. Ils commandent, paient par Wave ou Orange Money.
              L&apos;argent arrive <strong className="text-gray-700">directement sur ton téléphone</strong>.
              Pas besoin de développeur.
            </p>

            {/* Pays disponibles */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 mb-7">
              <span className="text-xs text-gray-400 font-medium mr-1">Disponible au</span>
              {COUNTRIES.map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-white px-2.5 py-1 text-xs text-gray-600 shadow-sm hover:border-gray-200 transition-colors"
                >
                  <span className="text-sm">{c.flag}</span>
                  <span className="hidden sm:inline font-medium">{c.name}</span>
                </span>
              ))}
            </div>

            {/* Champ de saisie du nom de business */}
            <div className="mb-8">
              <HeroInput />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center lg:justify-start gap-3 lg:gap-8 pt-4 pb-4 px-4 sm:px-0 flex-wrap">
              {STATS.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="flex items-center gap-1 lg:gap-2.5">
                    <Icon className="h-3 w-3 lg:h-5 lg:w-5 shrink-0 text-[var(--color-primary)]" />
                    <div>
                      <span className="text-[11px] lg:text-lg font-black text-gray-900">{s.value}</span>
                      <span className="text-[10px] lg:text-sm text-gray-400 ml-0.5 lg:ml-1">{s.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Phone mockup droite */}
          <div className="relative flex-shrink-0 flex flex-col items-center">
            <AnimatedPhoneMockup />
          </div>
        </div>

        {/* Catégories — scroll horizontal sur mobile */}
        <div className="mt-14">
          <p className="text-center text-xs text-gray-400 mb-3 font-medium">Idéal pour :</p>
          <div className="flex gap-2 overflow-x-auto pb-2 px-1 sm:flex-wrap sm:justify-center scrollbar-hide">
            {CATEGORIES.map(cat => (
              <span
                key={cat}
                className="inline-flex shrink-0 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-500 shadow-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors cursor-default"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Paiements ─────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 py-8 bg-gray-50/60">
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5">
          Tes clients peuvent payer par
        </p>
        <PaymentScroll />
      </section>

      {/* ── Comment ça marche — StepsSection ──────────────────────────────── */}
      <StepsSection />

      {/* ── Ils font confiance à TekkiShop ────────────────────────────────── */}
      {shops && shops.length > 0 && (
        <section className="py-20 px-4" style={{ background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 60%, #f0f9ff 100%)' }}>
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3">Nos succès</p>
              <h2
                className="text-3xl sm:text-4xl font-black text-gray-900 mb-3"
                style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
              >
                Ils font confiance à TekkiShop
              </h2>
              <p className="text-gray-500 max-w-sm mx-auto text-sm">
                Découvre les boutiques qui vendent avec succès via TekkiShop
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {shops.map((shop) => (
                <Link
                  key={shop.id}
                  href={`/${shop.slug}`}
                  target="_blank"
                  className="rounded-2xl border border-white/80 bg-white/70 backdrop-blur p-3 sm:p-4 text-center hover:shadow-md hover:border-sky-300 hover:bg-white transition-all group"
                >
                  <div className="flex items-center justify-center h-12 sm:h-14 mb-2 group-hover:scale-110 transition-transform">
                    {shop.logo_url ? (
                      <Image
                        src={shop.logo_url}
                        alt={shop.name}
                        width={56}
                        height={56}
                        className="h-12 sm:h-14 w-auto max-w-[90%] object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-2xl sm:text-3xl">🏪</div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-sky-600">{shop.name}</p>
                  <p className="text-[10px] text-gray-400 mt-1 capitalize">
                    {shop.city || 'Localité inconnue'}
                  </p>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-gray-600 mb-4">
                <strong className="text-gray-900">{shopsCount}+ boutiques</strong> vendent déjà avec TekkiShop
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 font-bold text-white hover:opacity-90 transition-opacity shadow-md"
              >
                Rejoins-les maintenant
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Section "Le moment magique" — Dark ──────────────────────────── */}
      <section className="bg-[#0F1729] py-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #0EA5E9 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #22D3EE 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        <div className="mx-auto max-w-6xl relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-4">Le moment qui change tout</p>
              <h2
                className="text-3xl sm:text-4xl font-black text-white leading-tight mb-6"
                style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
              >
                Dès ta 1ère commande,<br />
                <span className="text-sky-400">ton client reçoit ça.</span>
              </h2>
              <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-md">
                Plus de prises de commandes à la main sur WhatsApp. Plus de confusion, plus d&apos;erreurs, plus de non-paiements.
                Chaque commande est documentée, confirmée, et l&apos;argent arrive directement sur ton téléphone.
              </p>
              <div className="flex flex-wrap gap-4">
                {['Confirmation automatique', 'Paiement Wave sécurisé', 'Récap complet'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <div className="h-5 w-5 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-sky-400" />
                    </div>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp notification mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-sm">
                <div className="rounded-[2.5rem] bg-gray-900 p-3 shadow-2xl ring-1 ring-white/10">
                  <div className="rounded-[2rem] bg-[#1a1a2e] overflow-hidden">
                    <div className="flex items-center justify-between px-5 pt-3 pb-2">
                      <span className="text-[10px] text-white/60 font-semibold">9:41</span>
                      <div className="flex gap-1 items-center">
                        <div className="h-1.5 w-4 rounded-full bg-white/40" />
                        <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
                        <div className="h-1.5 w-3 rounded-sm bg-white/40" />
                      </div>
                    </div>
                    <div className="bg-[#1f6b4a] px-4 py-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">K</div>
                      <div>
                        <p className="text-white text-sm font-semibold">Keur Cuisine Dakar</p>
                        <p className="text-white/60 text-[10px]">en ligne</p>
                      </div>
                    </div>
                    <div className="px-3 py-4 space-y-3" style={{ background: 'linear-gradient(180deg, #0d1117 0%, #111827 100%)' }}>
                      <div className="ml-auto max-w-[85%] rounded-tl-2xl rounded-tr-sm rounded-bl-2xl rounded-br-2xl bg-[#025C4C] p-3.5">
                        <p className="text-white text-[11px] font-semibold mb-2">✅ Commande confirmée !</p>
                        <div className="space-y-1 text-[10px] text-white/80">
                          <p>🛒 Thiéboudienne spécial × 2</p>
                          <p>🥗 Salade composée × 1</p>
                          <div className="border-t border-white/20 my-1.5" />
                          <p className="text-white font-bold">💰 Total : 9 800 FCFA</p>
                          <p>📦 Livraison : lundi 5 mai</p>
                          <p>✅ Wave payé · Reçu !</p>
                        </div>
                        <p className="text-right text-[9px] text-white/40 mt-2">09:41 ✓✓</p>
                      </div>
                      <div className="mr-auto max-w-[85%] rounded-tr-2xl rounded-tl-sm rounded-br-2xl rounded-bl-2xl bg-[#1e293b] p-3 ring-1 ring-white/5">
                        <p className="text-sky-400 text-[10px] font-bold mb-1.5">🔔 Nouvelle commande reçue !</p>
                        <p className="text-white/70 text-[10px]">
                          Client : Fatou Diallo<br />
                          Montant : <span className="text-sky-300 font-bold">9 800 FCFA</span><br />
                          Statut : <span className="text-emerald-400">Wave encaissé ✓</span>
                        </p>
                        <p className="text-right text-[9px] text-white/30 mt-1.5">09:41</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 mx-auto w-fit flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-emerald-400 text-xs font-semibold">+9 800 FCFA reçus sur Wave</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50/70">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3">Tout est inclus</p>
            <h2
              className="text-3xl sm:text-4xl font-black text-gray-900 mb-3"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Tout ce dont tu as besoin
            </h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">Simple. Rapide. Fait pour l&apos;Afrique.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={i}
                  className="group relative rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at top right, rgba(14,165,233,0.04) 0%, transparent 60%)' }} />
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${f.color} mb-4 shadow-sm`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Témoignages ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-[#0F1729] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #0EA5E9 0%, transparent 50%), radial-gradient(circle at 80% 50%, #22D3EE 0%, transparent 50%)' }} />
        <div className="relative">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-3">Ils utilisent TekkiShop</p>
            <h2
              className="text-3xl font-black text-white"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Ils ont changé leur façon de vendre
            </h2>
          </div>
          <TestimonialsCarousel />
        </div>
      </section>

      {/* ── Tarifs ───────────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="bg-gray-50/60 py-20 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3">Tu as des questions ?</p>
            <h2
              className="text-3xl font-black text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              On répond à tout
            </h2>
          </div>
          <FAQAccordion />
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────────────────── */}
      <section className="bg-[#0F1729] py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, #0EA5E9 0%, transparent 60%)' }} />

        <div className="relative text-center mx-auto max-w-2xl">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--color-primary)] shadow-2xl mb-6 mx-auto">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
          >
            Prêt à avoir ton site ?
          </h2>
          <p className="text-gray-400 text-lg mb-4 max-w-md mx-auto leading-relaxed">
            Tape le nom de ton business dans le champ ci-dessous. Et crée ton site en 5 minutes.
          </p>
          <p className="text-sky-400 font-bold text-base mb-10">
            🎁 Offre de lancement : 2 mois pour le prix d&apos;un — 4 900 FCFA
          </p>

          {/* Pays disponibles - footer CTA */}
          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            <span className="text-xs text-gray-500">Disponible au</span>
            {COUNTRIES.map(c => (
              <span key={c.name} title={c.name} className="text-lg" aria-label={c.name}>{c.flag}</span>
            ))}
          </div>

          <div className="max-w-md mx-auto mb-6">
            <HeroInput />
          </div>

          <p className="text-sm text-gray-500">Paiement par Wave ou Orange Money · Annulation à tout moment</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#0a1020] border-t border-white/5 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center opacity-70">
              <Image src="/logo_white.svg" alt="TekkiShop" width={120} height={28} />
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
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

    </div>
  )
}
