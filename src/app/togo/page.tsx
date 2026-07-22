import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import Image from 'next/image'
import {
  ShoppingBag, CheckCircle2, ArrowRight,
  Smartphone, TrendingUp, Zap, Users, Sparkles,
  Link2, Wallet, Truck, Star,
} from 'lucide-react'
import { PaymentScroll, type PaymentLogo } from '@/components/landing/PaymentScroll'
import { TestimonialsCarousel } from '@/components/landing/TestimonialsCarousel'
import { AnimatedPhoneMockup } from '@/components/landing/AnimatedPhoneMockup'
import { OrderFlowPhoneMockup } from '@/components/landing/OrderFlowPhoneMockup'
import { Reveal } from '@/components/landing/Reveal'
import { FAQAccordion } from '@/components/landing/FAQAccordion'
import { HeroInput } from '@/components/landing/HeroInput'
import { PricingSection } from '@/components/landing/PricingSection'
import { StepsSection } from '@/components/landing/StepsSection'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { WhatsAppButton } from '@/components/landing/WhatsAppButton'
import type { Metadata } from 'next'

export const revalidate = 3600

const TOGO_PAYMENT_LOGOS: PaymentLogo[] = [
  { src: '/logo-payments/flooz.png',  name: 'Flooz' },
  { src: '/logo-payments/tmoney.png', name: 'T-Money' },
  { icon: '🚚', name: 'À la livraison' },
]

export const metadata: Metadata = {
  title: 'TEKKIShop Togo — Crée ta boutique en ligne à Lomé en 5 minutes',
  description:
    'Vends en ligne depuis Lomé, Kara ou Sokodé. Tes clients paient par Flooz ou T-Money. Tu reçois l\'argent sur ton téléphone. Boutique en ligne en 5 minutes, sans développeur.',
  openGraph: {
    title: 'TEKKIShop Togo — Boutique en ligne en 5 minutes',
    description: 'La façon la plus simple de vendre en ligne au Togo.',
    locale: 'fr_TG',
  },
}

const JOURNEE = [
  {
    heure: '07h30',
    titre: 'Tu publies ton lien dans ton statut WhatsApp',
    texte: '« Nouveaux arrivages 🔥 commandez ici » — et tu pars au marché de Lomé chercher ta marchandise.',
  },
  {
    heure: '10h15',
    titre: 'Première commande, déjà payée par Flooz',
    texte: 'Abla a commandé 2 pagnes wax et payé par Flooz. Tu reçois la notification. Tu n\'as parlé à personne.',
  },
  {
    heure: '10h17',
    titre: 'Tu envoies les livraisons en 1 clic',
    texte: 'Les 3 commandes du matin partent sur le WhatsApp de ton zem, avec les adresses et les montants.',
  },
  {
    heure: '11h20',
    titre: 'Le livreur confirme, tout est compté',
    texte: 'Il clique « Livraison effectuée ✅ », le paiement est enregistré. Tu sais exactement qui a payé quoi.',
  },
  {
    heure: '22h00',
    titre: 'Tu regardes tes chiffres du jour',
    texte: '6 commandes, 72 000 FCFA. Et pendant que tu dors, la boutique reste ouverte.',
  },
]

const FEATURES = [
  {
    icon: Link2,
    title: 'Ta boutique, accessible partout',
    description: 'Le lien de ta boutique permet à n\'importe qui de voir et commander tes produits. Partage-le dans ta bio TikTok, sur WhatsApp, dans les groupes Facebook au Togo.',
    color: 'bg-sky-500',
  },
  {
    icon: Sparkles,
    title: 'Un Assistant IA intégré',
    description: 'Il connaît et comprend toute ton activité. Pose-lui des questions sur tes ventes, tes produits, ta stratégie : il répond à tout et t\'aide à vendre mieux.',
    color: 'bg-violet-500',
  },
  {
    icon: Wallet,
    title: 'Flooz & T-Money intégrés',
    description: 'Les paiements mobiles togolais sont déjà disponibles. Tes clients paient par Flooz (Moov) ou T-Money (Togocel), et tu retires ton argent instantanément.',
    color: 'bg-emerald-500',
  },
  {
    icon: Truck,
    title: 'Tes livraisons, simplifiées',
    description: 'Chaque commande part sur le WhatsApp de ton zem en 1 clic, avec toutes les infos. Ton livreur confirme la livraison en 1 clic et met à jour le statut.',
    color: 'bg-amber-500',
  },
  {
    icon: Star,
    title: 'Tes avis, collectés facilement',
    description: 'Envoie en 1 clic une demande d\'avis aux clients qui ont commandé sur ta boutique, et affiche-les sur les pages de tes produits pour augmenter tes ventes.',
    color: 'bg-pink-500',
  },
  {
    icon: Smartphone,
    title: 'Tout depuis ton téléphone',
    description: 'Pas besoin d\'ordinateur ou de développeur. Tu crées et gères toute ta boutique en ligne depuis ton téléphone, même si tu débutes dans le e-commerce.',
    color: 'bg-indigo-500',
  },
]

const TOGO_TESTIMONIALS = [
  {
    quote: 'Avant TEKKIShop, je prenais les commandes sur WhatsApp et je perdais la moitié. Maintenant mes clients commandent sur mon lien et je vois tout en temps réel.',
    name: 'Abla K.',
    role: 'Mode & Pagnes wax, Lomé',
    initial: 'A',
    color: '#0EA5E9',
  },
  {
    quote: 'J\'ai partagé mon lien dans mon groupe WhatsApp à Kara. En 2 jours j\'avais 8 commandes. TEKKIShop a changé ma façon de vendre.',
    name: 'Koffi A.',
    role: 'Épicerie Koffi, Kara',
    initial: 'K',
    color: '#D97706',
  },
  {
    quote: 'Le paiement Flooz à la commande, c\'est révolutionnaire. Fini les retards et les impayés. Mes clients paient avant même que je prépare leur colis.',
    name: 'Mawuli D.',
    role: 'Cosmétiques naturels, Lomé',
    initial: 'M',
    color: '#7C3AED',
  },
  {
    quote: 'Je vends mes pagnes depuis Sokodé. Mes clientes commandent la veille et je prépare les colis le matin. Simple, efficace, et tout depuis mon téléphone.',
    name: 'Afi M.',
    role: 'Tissu & Pagne, Sokodé',
    initial: 'A',
    color: '#059669',
  },
  {
    quote: 'J\'ai configuré ma boutique en 10 minutes. Mes clients me disent que c\'est beau et professionnel — ils ont confiance pour commander et payer en ligne.',
    name: 'Koami B.',
    role: 'Artisanat Togo, Lomé',
    initial: 'K',
    color: '#DB2777',
  },
  {
    quote: 'Les notifications WhatsApp automatiques, c\'est la meilleure fonctionnalité. Mes clients reçoivent leur récap de commande et ça évite 100 questions.',
    name: 'Yawa E.',
    role: 'Pâtisserie maison, Lomé',
    initial: 'Y',
    color: '#2563EB',
  },
]

export default async function TogoPage() {
  const admin = createAdminClient()

  const [
    { count: togoShopsCount },
    { data: togoShops },
  ] = await Promise.all([
    admin
      .from('shops')
      .select('id', { count: 'exact', head: true })
      .eq('country', 'TG'),
    admin
      .from('shops')
      .select('id, name, slug, plan, city, logo_url, is_active, created_at')
      .eq('country', 'TG')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const shopsCount = togoShopsCount ?? 0
  const shops = togoShops ?? []

  const STATS = [
    { value: shopsCount > 0 ? `+${shopsCount}` : '🇹🇬', label: 'boutiques au Togo',  icon: Users },
    { value: '3',                                          label: 'modes de paiement',  icon: Wallet },
    { value: 'IA',                                         label: 'assistant intégré',  icon: Sparkles },
  ]

  return (
    <div className="landing-scope min-h-screen bg-white" style={{ fontFamily: 'var(--font-sans, DM Sans, sans-serif)' }}>

      {/* ── Header Togo ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/togo" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="TEKKIShop" width={130} height={30} priority />
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 uppercase tracking-wide">
              Togo
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-gray-600">
            <a href="#comment" className="hover:text-gray-900 transition-colors">Comment ça marche</a>
            <a href="#tarifs" className="hover:text-gray-900 transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
            <Link href="/" className="hover:text-gray-900 transition-colors">Site principal</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-2 transition-colors">
              Connexion
            </Link>
            <Link
              href="/start"
              className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3 sm:px-4 py-2 text-sm font-bold text-white hover:bg-sky-600 transition-colors shadow-sm"
            >
              <span className="sm:hidden">Commencer</span>
              <span className="hidden sm:inline">Créer ma boutique</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(180deg, #F5F9FF 0%, #ffffff 100%)' }}>
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-16 lg:pt-16 grid lg:grid-cols-[1.15fr_1fr] items-center gap-12 lg:gap-14">

          {/* Texte gauche */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/60 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 mb-6">
              <Zap className="h-3.5 w-3.5" />
              {shopsCount > 0
                ? `Déjà +${shopsCount} boutiques créées au Togo`
                : 'La solution e-commerce pensée pour le Togo'}
            </div>

            <h1
              className="text-[clamp(2.2rem,5.2vw,3.6rem)] font-bold text-gray-900 leading-[1.14] tracking-tight mb-5"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Crée ta boutique en ligne{' '}
              <span className="text-sky-500">au Togo</span>{' '}
              en 5 minutes, avec ton téléphone.
            </h1>

            <p className="text-lg text-gray-500 mb-6 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Tu vends à Lomé, Kara, Sokodé ou ailleurs ?{' '}
              <strong className="text-gray-700">Tes clients commandent seuls</strong>,
              même quand tu dors, paient par{' '}
              <strong className="text-gray-700">Flooz ou T-Money</strong>, et{' '}
              <strong className="text-gray-700">tu retires ton argent directement sur ton téléphone.</strong>
            </p>

            {/* Drapeau Togo + pays couverts */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 mb-7">
              <span className="text-xs text-gray-400 font-medium mr-1">Disponible au Togo et dans 10 autres pays :</span>
              {['🇹🇬', '🇸🇳', '🇨🇮', '🇧🇯', '🇲🇱', '🇧🇫', '🇨🇲', '🇫🇷', '🇧🇪', '🇨🇭', '🇨🇦'].map((flag) => (
                <span
                  key={flag}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-100 bg-white text-sm shadow-sm"
                >
                  {flag}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-6">
              <Link
                href="/start"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] px-7 py-4 text-base font-bold text-white shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-transform bg-sky-500"
                style={{ boxShadow: '0 8px 24px rgba(14,165,233,.35)' }}
              >
                Créer ma boutique gratuitement
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#comment"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border border-gray-200 bg-white px-7 py-4 text-base font-bold text-gray-700 hover:-translate-y-0.5 active:translate-y-0 transition-transform"
              >
                Voir comment ça marche
              </a>
            </div>

            {/* Réassurance */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-1.5 mb-7 text-sm text-gray-600">
              {['Pas besoin de développeur', 'Pas besoin d\'ordinateur', 'Commence gratuitement'].map(r => (
                <span key={r}><span className="text-emerald-500 font-bold">✓</span> {r}</span>
              ))}
            </div>

            {/* Avatars + note */}
            <div className="flex items-center justify-center lg:justify-start gap-3.5 mb-7">
              <div className="flex -space-x-2.5 shrink-0">
                {['1', '2', '3'].map((n, i) => (
                  <div
                    key={n}
                    className="relative h-9 w-9 rounded-full border-2 border-white shadow-sm overflow-hidden"
                    style={{ zIndex: 3 - i }}
                  >
                    <Image src={`/avatars/${n}.jpg`} alt="" fill className="object-cover" sizes="36px" />
                  </div>
                ))}
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[11px] font-bold text-gray-500 shadow-sm">+</span>
              </div>
              <p className="text-sm text-gray-500 text-left">
                <strong className="text-gray-900">4,9★</strong> — noté par des marchands à Lomé, Kara, Sokodé et partout au Togo
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center lg:justify-start gap-6 flex-wrap">
              {STATS.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-sky-500" />
                    <div>
                      <span className="text-sm font-black text-gray-900">{s.value}</span>
                      <span className="text-xs text-gray-400 ml-1">{s.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Phone mockup + badges flottants */}
          <div className="relative flex justify-center lg:justify-end">
            <style>{`
              @keyframes tekki-float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
              }
            `}</style>
            <AnimatedPhoneMockup />

            {/* Badge — Nouvelle commande */}
            <div
              className="hidden sm:flex absolute top-6 -left-4 lg:-left-10 items-center gap-2.5 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-lg shadow-gray-200/60 max-w-[210px]"
              style={{ animation: 'tekki-float 5s ease-in-out infinite' }}
            >
              <div className="h-8 w-8 shrink-0 rounded-xl bg-sky-50 flex items-center justify-center text-base">🛍️</div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">Nouvelle commande</p>
                <p className="text-[11px] text-gray-400 leading-tight">2 articles — il y a 1 min</p>
              </div>
            </div>

            {/* Badge — Paiement Flooz reçu */}
            <div
              className="hidden sm:flex absolute top-1/2 -translate-y-1/2 -right-4 lg:-right-10 items-center gap-2.5 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-lg shadow-gray-200/60 max-w-[200px]"
              style={{ animation: 'tekki-float 6s ease-in-out 1s infinite' }}
            >
              <div className="h-8 w-8 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center text-base">💰</div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">Paiement Flooz reçu</p>
                <p className="text-[11px] text-gray-400 leading-tight">12 500 FCFA — Abla K.</p>
              </div>
            </div>

            {/* Badge — Commande envoyée au zem */}
            <div
              className="hidden sm:flex absolute bottom-8 -left-2 lg:-left-8 items-center gap-2.5 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-lg shadow-gray-200/60 max-w-[210px]"
              style={{ animation: 'tekki-float 5.5s ease-in-out .5s infinite' }}
            >
              <div className="h-8 w-8 shrink-0 rounded-xl bg-amber-50 flex items-center justify-center text-base">🛵</div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">Commande envoyée au zem</p>
                <p className="text-[11px] text-gray-400 leading-tight">en 1 clic, sur WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Paiements ─────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 py-8 bg-gray-50/60">
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5">
          Tes clients paient comme ils veulent — Flooz, T-Money, paiement à la livraison :
        </p>
        <PaymentScroll logos={TOGO_PAYMENT_LOGOS} />
      </section>

      {/* ── Avant / Après ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center mb-14 max-w-[60ch] mx-auto">
            <h2
              className="text-[clamp(1.8rem,4vw,2.7rem)] font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Ta journée de vendeur au Togo, <span className="text-sky-500">avant et après</span> TEKKIShop.
            </h2>
            <p className="text-gray-500 text-lg mt-3.5">
              Si tu vends déjà sur WhatsApp ou au marché à Lomé, tu connais la colonne de gauche par cœur.
            </p>
          </Reveal>
          <Reveal delay={100} className="grid sm:grid-cols-2 gap-[22px] max-w-[980px] mx-auto">
            {/* Sans TekkiShop */}
            <div className="rounded-[20px] border border-red-100 bg-red-50/60 px-[30px] py-[34px]">
              <h3 className="text-xl font-bold text-red-600 mb-5">😮‍💨 Aujourd&apos;hui, sans TEKKIShop</h3>
              {[
                'Tu réponds aux mêmes questions toute la journée : « C\'est combien ? Il reste quelle couleur ? C\'est où ? »',
                'Tu envoies les photos produit une par une, à chaque client sur WhatsApp',
                'Tu perds des ventes quand tu dors, quand tu pries, quand tu es occupé·e',
                'Tu notes les commandes dans un cahier ou dans ta tête',
                'Tu appelles le zem, tu lui dictes l\'adresse, tu attends sa réponse',
                'À la fin du mois, impossible de savoir combien tu as vraiment gagné',
              ].map((t, i) => (
                <div key={t} className={`flex items-start gap-3 py-2.5 ${i !== 0 ? 'border-t border-dashed border-black/10' : ''}`}>
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <p className="text-base text-red-700 leading-snug">{t}</p>
                </div>
              ))}
            </div>
            {/* Avec TekkiShop */}
            <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/60 px-[30px] py-[34px]">
              <h3 className="text-xl font-bold text-emerald-700 mb-5">😌 Demain, avec TEKKIShop</h3>
              {[
                'Tes produits, prix et photos sont sur ta boutique : le client regarde tout seul',
                'Tu partages un seul lien sur WhatsApp, TikTok, Facebook ou dans les groupes',
                'Les clients commandent et paient à toute heure, même à 3h du matin',
                'Chaque commande est enregistrée automatiquement, avec l\'adresse du client',
                'Tu envoies la commande à ton zem en 1 clic, sur son WhatsApp',
                'Tu vois tes ventes du jour, de la semaine et du mois en un coup d\'œil',
              ].map((t, i) => (
                <div key={t} className={`flex items-start gap-3 py-2.5 ${i !== 0 ? 'border-t border-dashed border-black/10' : ''}`}>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
                  <p className="text-base text-emerald-700 leading-snug">{t}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Comment ça marche ─────────────────────────────────────────────── */}
      <section id="comment">
        <StepsSection />
      </section>

      {/* ── Boutiques togolaises ───────────────────────────────────────────── */}
      {shops.length > 0 && (
        <section className="py-20 px-4" style={{ background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 60%, #f0f9ff 100%)' }}>
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-sky-500 mb-3">Ils vendent déjà avec TEKKIShop Togo</p>
              <h2
                className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 mb-4"
                style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
              >
                Des marchands togolais comme toi.
              </h2>
              <p className="text-gray-500 max-w-md mx-auto text-lg">
                Découvre les boutiques qui vendent avec succès via TEKKIShop au Togo
              </p>
            </Reveal>

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
                  <p className="text-[10px] text-gray-400 mt-1 capitalize">{shop.city || 'Togo'}</p>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-gray-600 mb-4">
                <strong className="text-gray-900">{shopsCount}+ boutiques</strong> vendent déjà avec TEKKIShop au Togo
              </p>
              <Link
                href="/start"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 font-bold text-white hover:bg-sky-600 transition-colors shadow-md"
              >
                Rejoins-les maintenant
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Section "Journée type" — Dark ─────────────────────────────────── */}
      <section className="bg-[#0B1B32] py-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #0EA5E9 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #22D3EE 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        <div className="mx-auto max-w-6xl relative">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <span
              className="inline-block rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest mb-5"
              style={{ backgroundColor: 'rgba(14,165,233,.15)', color: '#7DB8FC' }}
            >
              Pendant que tu vis ta vie à Lomé
            </span>
            <h2
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white leading-tight mb-4"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Ta boutique travaille pour toi, 24h/24.
            </h2>
            <p className="text-gray-400 text-lg">
              Voici une vraie journée avec TEKKIShop au Togo.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <Reveal>
              <div>
                {JOURNEE.map((m, i) => (
                  <div key={m.heure} className={`flex gap-5 py-5 ${i !== 0 ? 'border-t border-white/10' : ''}`}>
                    <span className="shrink-0 font-bold text-sm w-14 pt-0.5 text-sky-400"
                      style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
                      {m.heure}
                    </span>
                    <div>
                      <p className="text-white font-bold text-base mb-1.5">{m.titre}</p>
                      <p className="text-gray-400 text-sm leading-relaxed">{m.texte}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={150} className="flex justify-center lg:justify-end">
              <OrderFlowPhoneMockup />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50/70">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-500 mb-3">Tout est inclus</p>
            <h2
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 mb-4"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Tout ce qu&apos;il te faut. <span className="text-sky-500">Rien de compliqué.</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-md mx-auto">
              Chaque fonctionnalité de TEKKIShop existe pour te faire gagner du temps ou de l&apos;argent. Sinon, on ne la construit pas.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
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
      <section className="py-16 bg-[#0B1B32] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #0EA5E9 0%, transparent 50%), radial-gradient(circle at 80% 50%, #22D3EE 0%, transparent 50%)' }} />
        <div className="relative">
          <Reveal className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-sky-400">Les marchands togolais en parlent mieux</p>
            <h2
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Vendre en ligne au Togo n&apos;a jamais été aussi simple
            </h2>
          </Reveal>
          <TestimonialsCarousel testimonials={TOGO_TESTIMONIALS} />

          <Reveal delay={100} className="mt-14 flex flex-wrap items-center justify-center gap-x-14 gap-y-8 text-center px-4">
            <div>
              <p className="text-3xl font-black text-white">🇹🇬 Togo</p>
              <p className="text-sm text-gray-400 mt-1">Lomé, Kara, Sokodé et partout</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white">Flooz · T-Money</p>
              <p className="text-sm text-gray-400 mt-1 max-w-[280px]">Wave · Paiement à la livraison</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white">5 minutes</p>
              <p className="text-sm text-gray-400 mt-1 max-w-[280px]">Pour lancer ta boutique en ligne</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Tarifs ───────────────────────────────────────────────────────── */}
      <section id="tarifs">
        <PricingSection />
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="bg-gray-50/60 py-20 px-4">
        <div className="mx-auto max-w-2xl">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-500 mb-3">Tu as des questions ?</p>
            <h2
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              On répond à tout
            </h2>
          </Reveal>
          <FAQAccordion />
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────────────────── */}
      <section className="bg-[#0B1B32] py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, #0EA5E9 0%, transparent 60%)' }} />

        <Reveal className="relative text-center mx-auto max-w-2xl">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-500 shadow-2xl mb-6 mx-auto">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <h2
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
          >
            Prêt à vendre tes produits en ligne au Togo ?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto leading-relaxed">
            Ta boutique prête en 5 minutes. Tes clients commandent et paient par Flooz ou T-Money.
          </p>

          {/* Pays Togo + drapeaux */}
          <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
            <span className="text-xs text-gray-500">Disponible au Togo et dans 10 autres pays</span>
            {['🇹🇬', '🇸🇳', '🇨🇮', '🇧🇯', '🇲🇱', '🇧🇫'].map(flag => (
              <span key={flag} className="text-lg" aria-label={flag}>{flag}</span>
            ))}
          </div>

          <div className="max-w-md mx-auto mb-6">
            <HeroInput redirectTo="/start" />
          </div>

          <p className="text-xs text-gray-500">
            ✓ Boutique gratuite à créer &nbsp;·&nbsp; ✓ Pas besoin d&apos;ordinateur &nbsp;·&nbsp; ✓ Annulation à tout moment
          </p>
        </Reveal>
      </section>

      <WhatsAppButton />
      <SiteFooter />
    </div>
  )
}
