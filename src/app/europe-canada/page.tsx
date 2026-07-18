import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  CreditCard,
  Truck,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Check,
  ShoppingBasket,
  GraduationCap,
  Globe2,
} from 'lucide-react'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { WhatsAppButton } from '@/components/landing/WhatsAppButton'
import { MiniFAQ } from '@/components/landing/MiniFAQ'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { Reveal } from '@/components/landing/Reveal'
import { EU_CA_COUNTRIES } from '@/components/landing/countries'
import { APP_NAME } from '@/constants'

export const metadata = {
  title: `Vends en euros à Paris, en FCFA à Dakar — ${APP_NAME}`,
  description: "TEKKIShop est disponible en Europe francophone et au Canada. Encaisse par carte via Stripe en € ou CAD — et sers aussi tes clients en Afrique par mobile money, depuis la même boutique.",
}

const EU_PAYMENTS = [
  { name: 'Visa', logo: '/logo-payments/visa.svg' },
  { name: 'Mastercard', logo: '/logo-payments/Mastercard-Logo.wine.svg' },
]

const AF_PAYMENTS = [
  { name: 'Wave', logo: '/logo-payments/wave_1.svg' },
  { name: 'MaxIt', logo: '/logo-payments/maxit.webp' },
  { name: 'MTN Money', logo: '/logo-payments/mtn_1.svg' },
]

const ETAPES = [
  { num: '1', titre: 'Crée ta boutique', texte: 'En euros (€) ou en dollars canadiens (CAD), en quelques minutes, depuis ton téléphone ou ton ordinateur.' },
  { num: '2', titre: 'Connecte ton compte Stripe', texte: 'Stripe te guide dans la vérification de ton identité — auto-entrepreneur, indépendant ou société. Pas besoin d\'être une entreprise établie.' },
  { num: '3', titre: 'Tes clients paient par carte', texte: 'Visa ou Mastercard, directement sur ta boutique. Et tes clients en Afrique, eux, paient par mobile money.' },
  { num: '4', titre: 'L\'argent arrive sur ton compte', texte: 'Virements automatiques vers ton compte bancaire, selon le calendrier standard de Stripe pour ton pays.' },
]

const SANS_ITEMS = [
  'Un Shopify ou Wix pour tes clients en Europe (abonnement + apps + configuration Stripe à faire toi-même)',
  'Une deuxième solution — ou des DM WhatsApp sans fin — pour tes clients en Afrique',
  'Aucune plateforme européenne ne gère Wave, Orange Money ou le paiement à la livraison',
  'Deux catalogues à maintenir, deux fois le travail',
]

const AVEC_ITEMS: React.ReactNode[] = [
  <><strong className="text-white">Une seule boutique</strong>, un seul catalogue, un seul tableau de bord</>,
  <>Tes clients d&apos;Europe et du Canada paient <strong className="text-white">par carte via Stripe</strong> — l&apos;argent va directement sur ton compte</>,
  <>Tes clients d&apos;Afrique paient <strong className="text-white">par mobile money ou à la livraison</strong> — comme ils ont l&apos;habitude</>,
  <>Livreurs, WhatsApp, avis clients : <strong className="text-white">tous les outils TEKKIShop</strong> restent inclus</>,
]

const PERSONAS = [
  { Icon: ShoppingBasket, titre: 'L\'entrepreneure de la diaspora', texte: 'Wax, épicerie, cosmétiques, artisanat : tu vends les produits du pays à la communauté en Europe — et tu livres aussi la famille restée au pays, depuis la même boutique.', ex: 'Encaisse en € ET en FCFA' },
  { Icon: GraduationCap, titre: 'Le coach / créateur francophone', texte: 'Formations, guides, ebooks, accompagnements : ton audience est des deux côtés de la Méditerranée. Ton lien boutique aussi.', ex: 'Produits digitaux inclus' },
  { Icon: Globe2, titre: 'La marque africaine qui exporte', texte: 'Ta marque cartonne à Abidjan ou Dakar ? Ouvre le marché européen sans deuxième plateforme : mêmes produits, prix en euros, paiement par carte.', ex: 'Une boutique, deux continents' },
]

const FAQS = [
  {
    q: 'Dois-je avoir une entreprise enregistrée en France, en Belgique ou au Canada ?',
    a: 'Pas forcément. Que tu sois auto-entrepreneur, indépendant ou société, Stripe te guide dans la vérification de ton identité au moment de connecter ton compte. C\'est lui qui valide ton statut, selon les règles de ton pays.',
  },
  {
    q: 'Quand est-ce que je reçois l\'argent sur mon compte bancaire ?',
    a: 'Les paiements arrivent d\'abord sur ton compte Stripe, puis sont virés automatiquement vers ton compte bancaire selon le calendrier standard de Stripe pour ton pays (généralement quelques jours ouvrés après chaque vente).',
  },
  {
    q: 'Quels moyens de paiement mes clients peuvent-ils utiliser ?',
    a: 'En Europe et au Canada : carte bancaire Visa ou Mastercard, via Stripe, avec 3D Secure. En Afrique : les moyens de paiement mobile money du pays de tes clients (Wave, Orange Money, MTN, Moov…) et le paiement à la livraison.',
  },
  {
    q: 'Puis-je vendre à des clients en Afrique depuis ma boutique en Europe ?',
    a: 'Oui — c\'est même toute la force de TEKKIShop. Ta boutique sert tes deux marchés : tes clients d\'Europe paient par carte, tes clients d\'Afrique par mobile money ou à la livraison. Un seul catalogue, un seul tableau de bord.',
  },
  {
    q: 'TekkiShop garde-t-il une partie de mes paiements par carte ?',
    a: 'Non. Tes paiements Stripe vont directement sur ton compte Stripe — TekkiShop ne prélève aucune commission dessus. Tu paies ton abonnement TekkiShop et les frais standards de Stripe, rien d\'autre.',
  },
  {
    q: 'Pourquoi TekkiShop plutôt que Shopify pour vendre en Europe ?',
    a: 'Si ton marché est uniquement européen, Shopify est un excellent outil. Mais si ton business vit entre l\'Europe et l\'Afrique, TekkiShop est la seule plateforme qui gère vraiment les deux mondes à la fois : cartes bancaires via Stripe d\'un côté, mobile money et paiement à la livraison de l\'autre — sans apps à empiler ni configuration technique.',
  },
]

function PaymentLogo({ src, alt, size = 20 }: { src: string; alt: string; size?: number }) {
  return (
    <span className="relative shrink-0" style={{ height: size * 0.6, width: size }}>
      <Image src={src} alt={alt} fill className="object-contain" sizes={`${size}px`} />
    </span>
  )
}

export default function EuropeCanadaPage() {
  return (
    <div className="landing-scope min-h-screen bg-white" style={{ fontFamily: 'var(--font-sans, DM Sans, sans-serif)' }}>
      <SiteHeader />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(180deg, #EEF0FF 0%, #ffffff 100%)' }}>
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-16">
          <div className="grid lg:grid-cols-[1.1fr_1fr] items-center gap-12 lg:gap-14">
            <div>
              <div className="flex items-center gap-1.5 mb-4 text-2xl">
                {EU_CA_COUNTRIES.map(c => (
                  <span key={c.name}>{c.flag}</span>
                ))}
              </div>
              <div className="inline-flex items-center rounded-full bg-indigo-100 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-widest text-indigo-700 mb-5">
                Nouveau · Europe & Canada
              </div>
              <h1
                className="text-[clamp(2rem,4.8vw,3.2rem)] font-bold text-gray-900 leading-[1.14] tracking-tight mb-5"
                style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
              >
                Vends <span className="text-indigo-600">en euros à Paris</span>, <span className="text-amber-600">et en FCFA à Dakar,</span> depuis la même boutique.
              </h1>
              <p className="text-lg text-gray-500 mb-7 max-w-lg leading-relaxed">
                TEKKIShop est en Europe francophone et au Canada.{' '}
                <strong className="text-gray-700">Encaisse par carte bancaire via Stripe</strong> auprès de tes clients d&apos;ici — et continue de{' '}
                <strong className="text-gray-700">servir tes clients en Afrique par mobile money</strong>. Une seule boutique, deux mondes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] bg-indigo-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                >
                  Créer ma boutique en Europe
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#double"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border border-gray-200 bg-white px-7 py-4 text-base font-bold text-gray-800 hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                >
                  Voir le double marché
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-600">
                {['Boutique en € ou en $ CAD', 'Paiements sécurisés par Stripe'].map(r => (
                  <span key={r}><span className="text-emerald-500 font-bold">✓</span> {r}</span>
                ))}
              </div>
            </div>

            {/* Double carte de paiement — visuel signature */}
            <div>
              <div className="flex justify-center mb-3.5">
                <span className="rounded-full bg-[#0B1B32] text-white text-xs font-extrabold px-4 py-2 shadow-lg whitespace-nowrap">
                  1 seule boutique TEKKIShop
                </span>
              </div>
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="rounded-2xl border border-gray-100 bg-white shadow-xl shadow-indigo-100/60 p-4">
                    <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-gray-400 mb-2.5">
                      🇫🇷 Ta cliente à Paris
                    </p>
                    <p className="text-sm font-bold text-gray-900">Robe wax premium</p>
                    <p className="text-xl font-bold text-indigo-600 my-1" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>89,00 €</p>
                    <div className="rounded-lg bg-indigo-600 text-white text-xs font-bold text-center py-2.5 flex items-center justify-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" /> Payer par carte
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[11px] text-gray-400">
                      <PaymentLogo src="/logo-payments/visa.svg" alt="Visa" />
                      <PaymentLogo src="/logo-payments/Mastercard-Logo.wine.svg" alt="Mastercard" />
                      <span>· via Stripe</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white shadow-xl shadow-amber-100/60 p-4">
                    <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-gray-400 mb-2.5">
                      🇸🇳 Ta cliente à Dakar
                    </p>
                    <p className="text-sm font-bold text-gray-900">Robe wax premium</p>
                    <p className="text-xl font-bold text-amber-600 my-1" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>45 000 FCFA</p>
                    <div className="rounded-lg bg-amber-600 text-white text-xs font-bold text-center py-2.5 flex items-center justify-center gap-1.5">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white p-0.5 shrink-0">
                        <Image src="/logo-payments/wave_1.svg" alt="Wave" width={12} height={12} className="object-contain" />
                      </span>
                      Payer par Wave
                    </div>
                    <div className="flex items-center justify-center flex-wrap gap-x-1.5 gap-y-1 mt-2.5 text-[11px] text-gray-400">
                      <PaymentLogo src="/logo-payments/wave_1.svg" alt="Wave" /> Wave ·
                      <PaymentLogo src="/logo-payments/om_1.svg" alt="OM" /> OM ·
                      <Truck className="h-3 w-3" /> à la livraison
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">
                Deux clientes, deux continents, deux moyens de paiement — <strong className="text-gray-700">zéro complication pour toi.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bande paiements ──────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 py-5 bg-white">
        <div className="mx-auto max-w-4xl px-4 flex flex-wrap items-center justify-center gap-2.5">
          {EU_PAYMENTS.map(p => (
            <span key={p.name} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3.5 py-2 text-sm font-bold text-gray-700">
              <PaymentLogo src={p.logo} alt={p.name} size={28} />
              {p.name}
            </span>
          ))}
          <span className="text-indigo-600 font-extrabold text-lg px-1">+</span>
          {AF_PAYMENTS.map(p => (
            <span key={p.name} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3.5 py-2 text-sm font-bold text-gray-700">
              <PaymentLogo src={p.logo} alt={p.name} size={28} />
              {p.name}
            </span>
          ))}
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3.5 py-2 text-sm font-bold text-gray-700">
            <Truck className="h-4 w-4 text-emerald-600" /> À la livraison
          </span>
        </div>
      </section>

      {/* ── Double marché ────────────────────────────────────────────────── */}
      <section id="double" className="py-24 px-4 bg-[#F7F8FF]">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center mb-14 max-w-[62ch] mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">Ce que personne d&apos;autre ne fait</p>
            <h2
              className="text-[clamp(1.7rem,3.8vw,2.5rem)] font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Un pied ici, un pied là-bas ? <span className="text-indigo-600">Ta boutique aussi.</span>
            </h2>
            <p className="text-gray-500 text-lg mt-3">
              Si tu vis entre deux mondes — la France et le Sénégal, la Belgique et la Côte d&apos;Ivoire, le Canada et le Mali — ton business aussi. Voici ce que ça demandait jusqu&apos;ici.
            </p>
          </Reveal>

          <Reveal delay={100} className="grid lg:grid-cols-[1fr_1.3fr] gap-5 max-w-4xl mx-auto">
            <div className="rounded-[20px] border border-gray-200 bg-white p-7">
              <div className="flex items-center gap-2.5 mb-4">
                <XCircle className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-bold text-gray-900">Sans TEKKIShop</h3>
              </div>
              {SANS_ITEMS.map((t, i) => (
                <div key={t} className={`flex items-start gap-3 py-2.5 ${i !== 0 ? 'border-t border-dashed border-black/10' : ''}`}>
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600 leading-snug">{t}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[20px] p-7 text-white shadow-2xl" style={{ backgroundColor: '#0B1B32' }}>
              <div className="flex items-center gap-2.5 mb-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <h3 className="text-lg font-bold">Avec TEKKIShop</h3>
              </div>
              {AVEC_ITEMS.map((node, i) => (
                <div key={i} className={`flex items-start gap-3 py-2.5 ${i !== 0 ? 'border-t border-dashed border-white/15' : ''}`}>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-200 leading-snug">{node}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150} className="text-center mt-9">
            <p className="text-lg font-semibold text-gray-900 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
              Les plateformes occidentales connaissent l&apos;Europe.{' '}
              <span className="text-indigo-600">Nous, on connaît les deux rives.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Comment ça marche ────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center mb-14 max-w-[62ch] mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">C&apos;est simple</p>
            <h2
              className="text-[clamp(1.7rem,3.8vw,2.5rem)] font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              4 étapes, et tu encaisses en euros.
            </h2>
          </Reveal>
          <Reveal delay={100} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ETAPES.map(e => (
              <div key={e.num} className="rounded-3xl border border-indigo-100 bg-indigo-50/30 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white text-sm font-black mb-4">
                  {e.num}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{e.titre}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{e.texte}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Confiance / Stripe ───────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-[#F7F8FF]">
        <div className="mx-auto max-w-3xl">
          <Reveal className="text-center rounded-3xl border border-gray-200 bg-white p-10 sm:p-14 shadow-sm">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 mb-5">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h2
              className="text-[clamp(1.6rem,3.4vw,2.2rem)] font-bold text-gray-900 mb-4"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              TEKKIShop ne touche jamais à ton argent.
            </h2>
            <p className="text-gray-500 leading-relaxed max-w-xl mx-auto">
              Tu connectes <strong className="text-gray-700">ton propre compte Stripe</strong> — le standard de paiement utilisé par des millions de commerçants dans le monde. Les paiements de tes clients vont <strong className="text-gray-700">directement dessus</strong>. TEKKIShop n&apos;est jamais intermédiaire financier : ton argent t&apos;appartient, à chaque instant.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 mt-7">
              {['Ton compte Stripe, ton argent', 'Virements automatiques', 'Paiements sécurisés 3D Secure'].map(p => (
                <span key={p} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> {p}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Personas ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center mb-14 max-w-[62ch] mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">Qui vend depuis l&apos;Europe et le Canada</p>
            <h2
              className="text-[clamp(1.7rem,3.8vw,2.5rem)] font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Des entrepreneurs entre deux mondes. <span className="text-indigo-600">Comme toi.</span>
            </h2>
          </Reveal>
          <Reveal delay={100} className="grid sm:grid-cols-3 gap-5">
            {PERSONAS.map(p => (
              <div key={p.titre} className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <p.Icon className="h-8 w-8 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900 mt-3 mb-1.5">{p.titre}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.texte}</p>
                <span className="inline-block mt-3 text-xs font-bold text-indigo-700 bg-indigo-100 rounded-full px-3 py-1.5">{p.ex}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Ce que ça coûte ──────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-[#F7F8FF]">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center mb-14 max-w-[62ch] mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">Transparence totale</p>
            <h2
              className="text-[clamp(1.7rem,3.8vw,2.5rem)] font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Ce que ça te coûte. <span className="text-indigo-600">Et rien de plus.</span>
            </h2>
          </Reveal>
          <Reveal delay={100} className="grid lg:grid-cols-2 gap-5 max-w-3xl mx-auto">
            <div className="rounded-[20px] border border-gray-200 bg-white p-8">
              <h3 className="text-base font-bold text-gray-900 mb-3">Commission TEKKIShop sur tes ventes Stripe</h3>
              <p className="text-4xl font-bold text-emerald-600" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>0 %</p>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Tes paiements par carte vont sur ton compte Stripe. Tu paies uniquement les frais standards de Stripe (comme sur n&apos;importe quelle plateforme) et ton abonnement TEKKIShop. C&apos;est tout.
              </p>
            </div>
            <div className="rounded-[20px] border border-gray-200 bg-white p-8">
              <h3 className="text-base font-bold text-gray-900 mb-3">Ton abonnement inclut tout</h3>
              {[
                'Ta boutique en € ou CAD, format mobile',
                'Produits physiques et digitaux illimités selon ton plan',
                'Collecte automatique des avis clients',
                'Ton marché Afrique inclus, sans supplément',
                'Support en français, sur WhatsApp',
              ].map((t, i) => (
                <div key={t} className={`flex items-start gap-2.5 py-2 ${i !== 0 ? 'border-t border-dashed border-gray-200' : ''}`}>
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600 leading-snug">{t}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50/60 py-24 px-4">
        <div className="mx-auto max-w-2xl">
          <Reveal className="text-center mb-10">
            <h2
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Questions fréquentes
            </h2>
          </Reveal>
          <MiniFAQ items={FAQS} />
        </div>
      </section>

      <FinalCTA
        title="Ton business vit entre deux mondes. Ta boutique est prête à faire pareil."
        subtitle="Crée ta boutique en euros ou en dollars canadiens, connecte ton compte Stripe, et vends des deux côtés dès aujourd'hui."
        reassurance={['Boutique gratuite à créer', 'Pas besoin de carte bancaire', 'Support en français']}
        background="linear-gradient(135deg, #4338CA, #5B5BD6)"
        maxWidth="max-w-xl"
      />

      <WhatsAppButton />
      <SiteFooter />
    </div>
  )
}
