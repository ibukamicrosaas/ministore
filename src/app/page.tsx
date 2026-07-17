import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import Image from 'next/image'
import {
  ShoppingBag, CheckCircle2, ArrowRight,
  Package, Smartphone, BarChart3,
  TrendingUp, Zap, Users, Sparkles,
} from 'lucide-react'
import { PaymentScroll } from '@/components/landing/PaymentScroll'
import { TestimonialsCarousel } from '@/components/landing/TestimonialsCarousel'
import { AnimatedPhoneMockup } from '@/components/landing/AnimatedPhoneMockup'
import { OrderFlowPhoneMockup } from '@/components/landing/OrderFlowPhoneMockup'
import { Reveal } from '@/components/landing/Reveal'
import { FAQAccordion } from '@/components/landing/FAQAccordion'
import { HeroInput } from '@/components/landing/HeroInput'
import { PricingSection } from '@/components/landing/PricingSection'
import { StepsSection } from '@/components/landing/StepsSection'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { WhatsAppButton } from '@/components/landing/WhatsAppButton'
import { COUNTRIES, EU_CA_COUNTRIES } from '@/components/landing/countries'
import { APP_NAME } from '@/constants'

export const metadata = {
  title: `${APP_NAME} — Crée ta boutique en ligne en 5 minutes`,
  description: "Tu vends sur WhatsApp ? Crée ta boutique en ligne en 5 minutes. Tes clients commandent et paient par Wave ou Orange Money. Tu reçois l'argent directement sur ton téléphone.",
}

const JOURNEE = [
  {
    heure: '07h30',
    titre: 'Tu publies ton lien dans ton statut WhatsApp',
    texte: '« Nouveaux arrivages 🔥 commandez ici » — et tu pars au marché chercher ta marchandise.',
  },
  {
    heure: '10h15',
    titre: 'Première commande, déjà payée',
    texte: 'Aïssatou a commandé 2 robes et payé par Wave. Tu reçois la notification. Tu n’as parlé à personne.',
  },
  {
    heure: '10h17',
    titre: 'Tu envoies les livraisons en 1 clic',
    texte: 'Les 4 commandes du matin partent sur le WhatsApp de ton livreur, avec les adresses et les montants.',
  },
  {
    heure: '11h20',
    titre: 'Le livreur confirme, tout est compté',
    texte: 'Il clique « Livraison effectuée ✅ », le paiement à la livraison est enregistré. Tu sais exactement qui a payé quoi.',
  },
  {
    heure: '22h00',
    titre: 'Tu regardes tes chiffres du jour',
    texte: '7 commandes, 84 500 FCFA. Et pendant que tu dors, la boutique reste ouverte.',
  },
]

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Assistant IA intégré',
    description: "Pose des questions à ton assistant IA : \"Quels sont mes produits les plus vendus ce mois ?\", \"Combien j'ai encaissé cette semaine ?\". Il connaît ta boutique.",
    color: 'bg-violet-500',
  },
  {
    icon: Package,
    title: 'Catalogue produit complet',
    description: 'Photos, prix, variantes, stock, mise en avant — tout ce qu\'il faut pour présenter tes produits de manière professionnelle.',
    color: 'bg-pink-500',
  },
  {
    icon: Smartphone,
    title: 'Tout depuis ton téléphone',
    description: 'Confirme tes commandes, gère tes produits, vois tes revenus. Ton tableau de bord est optimisé pour mobile.',
    color: 'bg-sky-500',
  },
  {
    icon: BarChart3,
    title: 'Revenus en temps réel',
    description: "Tes ventes du jour, de la semaine, produit par produit. Télécharge le détail de tes ventes sur le plan Pro. Tu sais exactement où tu en es.",
    color: 'bg-indigo-500',
  },
]

export default async function LandingPage() {
  const supabase = await createServerClient()

  // createAdminClient pour bypasser le RLS et obtenir le vrai total (790 vs 717)
  const admin = createAdminClient()
  const { count: totalShopsCount } = await admin
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
    { value: `+${shopsCount}`, label: 'boutiques créées',  icon: Users },
    { value: '11',             label: 'pays couverts',      icon: ShoppingBag },
    { value: 'IA',             label: 'assistant intégré',  icon: Sparkles },
  ]

  return (
    <div className="landing-scope min-h-screen bg-white" style={{ fontFamily: 'var(--font-sans, DM Sans, sans-serif)' }}>

      <SiteHeader />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(180deg, #F5F9FF 0%, #ffffff 100%)' }}>
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-16 lg:pt-16 grid lg:grid-cols-[1.15fr_1fr] items-center gap-12 lg:gap-14">

          {/* Texte gauche */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/8 px-4 py-2 text-sm font-bold text-[var(--color-primary-dark)] mb-6">
              <Zap className="h-3.5 w-3.5" />
              Déjà +{shopsCount} boutiques créées en Afrique
            </div>

            <h1
              className="text-[clamp(2.2rem,5.2vw,3.6rem)] font-bold text-gray-900 leading-[1.14] tracking-tight mb-5"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Crée ta boutique en ligne <span className="text-[var(--color-primary)]">en 5 minutes</span>, avec ton téléphone.
            </h1>

            <p className="text-lg text-gray-500 mb-6 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Ajoute tes produits, partage ton lien, et c&apos;est tout. <strong className="text-gray-700">Tes clients commandent seuls</strong>,
              même quand tu dors, paient à la livraison ou par mobile money, et <strong className="text-gray-700">tu retires ton argent instantanément sur ton téléphone.</strong>
            </p>

            {/* Pays disponibles */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 mb-7">
              <span className="text-xs text-gray-400 font-medium mr-1">Disponible dans 11 pays :</span>
              {[...COUNTRIES, ...EU_CA_COUNTRIES].map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-100 bg-white text-sm shadow-sm"
                >
                  {c.flag}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-6">
              <Link
                href="/onboarding"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] px-7 py-4 text-base font-bold text-white shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 8px 24px rgba(46,144,250,.35)' }}
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
              {['Pas besoin de développeur', 'Pas besoin d\'ordinateur', 'Pas besoin de CB'].map(r => (
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
                <strong className="text-gray-900">4,9★</strong> — noté par des marchands au Sénégal, en Côte d&apos;Ivoire, au Bénin, au Togo, au Mali et au Burkina Faso
              </p>
            </div>

            {/* Stats réelles */}
            <div className="flex items-center justify-center lg:justify-start gap-6 flex-wrap">
              {STATS.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
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

            {/* Badge — Paiement Wave reçu */}
            <div
              className="hidden sm:flex absolute top-1/2 -translate-y-1/2 -right-4 lg:-right-10 items-center gap-2.5 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-lg shadow-gray-200/60 max-w-[200px]"
              style={{ animation: 'tekki-float 6s ease-in-out 1s infinite' }}
            >
              <div className="h-8 w-8 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center text-base">💰</div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">Paiement Wave reçu</p>
                <p className="text-[11px] text-gray-400 leading-tight">15 000 FCFA — Awa D.</p>
              </div>
            </div>

            {/* Badge — Commande envoyée au livreur */}
            <div
              className="hidden sm:flex absolute bottom-8 -left-2 lg:-left-8 items-center gap-2.5 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-lg shadow-gray-200/60 max-w-[210px]"
              style={{ animation: 'tekki-float 5.5s ease-in-out .5s infinite' }}
            >
              <div className="h-8 w-8 shrink-0 rounded-xl bg-amber-50 flex items-center justify-center text-base">🛵</div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">Commande envoyée au livreur</p>
                <p className="text-[11px] text-gray-400 leading-tight">en 1 clic, sur WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Paiements ─────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 py-8 bg-gray-50/60">
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5">
          Tes clients paient comme ils veulent :
        </p>
        <PaymentScroll />
      </section>

      {/* ── Avant / Après ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center mb-14 max-w-[60ch] mx-auto">
            <h2
              className="text-[clamp(1.8rem,4vw,2.7rem)] font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Ta journée de vendeur, <span className="text-[var(--color-primary)]">avant et après</span> TEKKIShop.
            </h2>
            <p className="text-gray-500 text-lg mt-3.5">
              Si tu vends déjà sur WhatsApp ou Instagram, tu connais la colonne de gauche par cœur.
            </p>
          </Reveal>
          <Reveal delay={100} className="grid sm:grid-cols-2 gap-[22px] max-w-[980px] mx-auto">
            {/* Sans TekkiShop */}
            <div className="rounded-[20px] border border-red-100 bg-red-50/60 px-[30px] py-[34px]">
              <h3 className="text-xl font-bold text-red-600 mb-5">😮‍💨 Aujourd&apos;hui, sans TEKKIShop</h3>
              {[
                'Tu réponds aux mêmes questions toute la journée : « C\'est combien ? Il reste quelle taille ? C\'est où ? »',
                'Tu envoies les photos produit une par une, à chaque client',
                'Tu perds des ventes quand tu dors, quand tu pries, quand tu es occupé·e',
                'Tu notes les commandes dans un cahier ou dans ta tête',
                'Tu appelles le livreur, tu lui dictes l\'adresse, tu attends',
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
                'Tu partages un seul lien sur WhatsApp, Instagram, TikTok ou Facebook',
                'Les clients commandent et paient à toute heure, même à 3h du matin',
                'Chaque commande est enregistrée automatiquement, avec l\'adresse du client',
                'Tu envoies la commande à ton livreur en 1 clic, sur son WhatsApp',
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

      {/* ── Comment ça marche — StepsSection ──────────────────────────────── */}
      <StepsSection />

      {/* ── Ils font confiance à TekkiShop ────────────────────────────────── */}
      {shops && shops.length > 0 && (
        <section className="py-20 px-4" style={{ background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 60%, #f0f9ff 100%)' }}>
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3">Nos succès</p>
              <h2
                className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3"
                style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
              >
                Ils font confiance à TekkiShop
              </h2>
              <p className="text-gray-500 max-w-sm mx-auto text-sm">
                Découvre les boutiques qui vendent avec succès via TekkiShop
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

      {/* ── Section "Journée type" — Dark ─────────────────────────────────── */}
      <section className="bg-[#0B1B32] py-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #22D3EE 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        <div className="mx-auto max-w-6xl relative">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <span
              className="inline-block rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest mb-5"
              style={{ backgroundColor: 'rgba(46,144,250,.15)', color: '#7DB8FC' }}
            >
              Pendant que tu vis ta vie
            </span>
            <h2
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white leading-tight mb-4"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Ta boutique travaille pour toi, 24h/24.
            </h2>
            <p className="text-gray-400 text-lg">
              Voici une vraie journée avec TekkiShop.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <Reveal>
              <div>
                {JOURNEE.map((m, i) => (
                  <div key={m.heure} className={`flex gap-5 py-5 ${i !== 0 ? 'border-t border-white/10' : ''}`}>
                    <span className="shrink-0 font-bold text-sm w-14 pt-0.5" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
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

            {/* Téléphone animé — flux de commande */}
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
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3">Tout est inclus</p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Tout ce dont tu as besoin
            </h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">Simple. Rapide. Fait pour l&apos;Afrique.</p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
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
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-primary)' }}>Ils utilisent TekkiShop</p>
            <h2
              className="text-3xl font-bold text-white"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Ils ont changé leur façon de vendre
            </h2>
          </Reveal>
          <TestimonialsCarousel />
        </div>
      </section>

      {/* ── Tarifs ───────────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="bg-gray-50/60 py-20 px-4">
        <div className="mx-auto max-w-2xl">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3">Tu as des questions ?</p>
            <h2
              className="text-3xl font-bold text-gray-900"
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
          style={{ background: 'radial-gradient(ellipse at center, var(--color-primary) 0%, transparent 60%)' }} />

        <Reveal className="relative text-center mx-auto max-w-2xl">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--color-primary)] shadow-2xl mb-6 mx-auto">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
          >
            Prêt à avoir ta boutique ?
          </h2>
          <p className="text-gray-400 text-lg mb-4 max-w-md mx-auto leading-relaxed">
            Ta boutique prête en 5 minutes. Tes clients commandent et paient directement en ligne.
          </p>
          <p className="font-bold text-base mb-8" style={{ color: 'var(--color-primary)' }}>
            🎁 Plan Business : 1 mois offert sur la facturation annuelle
          </p>

          {/* Pays disponibles - footer CTA */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-500">Afrique :</span>
              {COUNTRIES.map(c => (
                <span key={c.name} title={c.name} className="text-lg" aria-label={c.name}>{c.flag}</span>
              ))}
            </div>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-500">Europe & Canada :</span>
              {['🇫🇷', '🇧🇪', '🇱🇺', '🇨🇭', '🇨🇦'].map(flag => (
                <span key={flag} className="text-lg" aria-label={flag}>{flag}</span>
              ))}
            </div>
          </div>

          <div className="max-w-md mx-auto mb-6">
            <HeroInput />
          </div>

          <p className="text-xs text-gray-500">
            ✓ Essai gratuit 30 jours &nbsp;·&nbsp; ✓ Pas besoin d&apos;ordinateur &nbsp;·&nbsp; ✓ Annulation à tout moment
          </p>
        </Reveal>
      </section>

      <WhatsAppButton />
      <SiteFooter />
    </div>
  )
}
