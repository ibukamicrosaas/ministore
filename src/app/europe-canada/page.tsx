import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { WhatsAppButton } from '@/components/landing/WhatsAppButton'
import { MiniFAQ } from '@/components/landing/MiniFAQ'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { EU_CA_COUNTRIES } from '@/components/landing/countries'
import { APP_NAME } from '@/constants'

export const metadata = {
  title: `Vendre depuis la France ou le Canada — ${APP_NAME}`,
  description: "TEKKIShop est disponible en Europe francophone et au Canada. Crée ta boutique en euros ou en dollars canadiens, et accepte les paiements par carte bancaire via Stripe.",
}

const ETAPES = [
  { num: '1', titre: 'Crée ta boutique', texte: 'En euros (€) ou en dollars canadiens (CAD), en quelques minutes.' },
  { num: '2', titre: 'Connecte ton compte Stripe', texte: 'Stripe te guide dans la vérification de ton identité — auto-entrepreneur, indépendant ou société.' },
  { num: '3', titre: 'Tes clients paient par carte', texte: 'Visa ou Mastercard, directement sur ta boutique.' },
  { num: '4', titre: 'L\'argent arrive sur ton compte', texte: 'Automatiquement, selon le calendrier standard de Stripe pour ton pays.' },
]

const USAGES = [
  { icon: '🧺', titre: 'Diaspora', texte: 'Vends des produits africains (wax, épicerie, cosmétiques) à la communauté en Europe' },
  { icon: '🎓', titre: 'Coachs & formateurs', texte: 'Vends tes formations et accompagnements depuis la France ou le Canada' },
  { icon: '🌍', titre: 'Double marché', texte: 'Sers tes clients en Europe et en Afrique depuis la même activité' },
]

const FAQS = [
  {
    q: 'Dois-je avoir une entreprise enregistrée en France, en Belgique ou au Canada ?',
    a: 'Pas forcément. Que tu sois auto-entrepreneur, indépendant ou société, Stripe te guide dans la vérification de ton identité au moment de connecter ton compte.',
  },
  {
    q: 'Quand est-ce que je reçois l\'argent sur mon compte bancaire ?',
    a: 'Automatiquement, selon le calendrier standard de Stripe pour ton pays — tu n\'as aucune action à faire pour déclencher le virement.',
  },
  {
    q: 'Quels moyens de paiement mes clients peuvent-ils utiliser ?',
    a: 'Carte Visa ou Mastercard, via Stripe — le standard de paiement sécurisé utilisé par des millions de commerçants dans le monde.',
  },
  {
    q: 'Puis-je vendre à des clients en Afrique depuis ma boutique en Europe ?',
    a: 'Oui. Ta boutique est accessible à n\'importe qui avec ton lien — tu choisis simplement la devise d\'affichage (FCFA, € ou CAD) dans tes paramètres.',
  },
  {
    q: 'TekkiShop garde-t-il une partie de mes paiements ?',
    a: 'Non. Les paiements passent directement sur ton propre compte Stripe — TekkiShop n\'est jamais intermédiaire financier.',
  },
]

export default function EuropeCanadaPage() {
  return (
    <div className="landing-scope min-h-screen bg-white" style={{ fontFamily: 'var(--font-sans, DM Sans, sans-serif)' }}>
      <SiteHeader />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%)' }}>
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                {EU_CA_COUNTRIES.map(c => (
                  <span key={c.name} className="text-3xl">{c.flag}</span>
                ))}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Nouveau · Europe & Canada</p>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4 leading-tight"
                style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
              >
                Tu vends depuis<br />
                <span className="text-indigo-600">la France ou le Canada ?</span>
              </h1>
              <p className="text-gray-600 leading-relaxed mb-7 max-w-md text-lg">
                TEKKIShop est désormais disponible en Europe francophone et au Canada. Crée ta boutique en euros ou en dollars canadiens, et accepte les paiements par carte bancaire via Stripe.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  { icon: '💳', text: 'Paiements sécurisés par carte Visa / Mastercard via Stripe' },
                  { icon: '🏦', text: 'Virements vers ton compte bancaire — automatiques' },
                  { icon: '€', text: 'Boutique en euros (€) ou en dollars canadiens (CAD)' },
                  { icon: '🌍', text: 'Vends aussi bien en Afrique qu\'en Europe depuis la même boutique' },
                ].map(f => (
                  <li key={f.text} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">{f.icon}</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-md"
              >
                Créer ma boutique en Europe
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mockup carte bancaire + boutique EUR */}
            <div className="flex-shrink-0 w-full max-w-xs">
              <div className="rounded-3xl border border-indigo-100 bg-white shadow-xl shadow-indigo-100 overflow-hidden">
                {/* Header boutique */}
                <div className="bg-gradient-to-r from-indigo-600 to-sky-600 px-5 py-4">
                  <p className="text-white/80 text-[10px] font-semibold uppercase tracking-wide mb-1">Boutique en ligne</p>
                  <p className="text-white font-black text-base">Créations Amina Paris</p>
                  <p className="text-white/60 text-[10px]">tekki.shop/amina-paris</p>
                </div>
                {/* Produit */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-lg shrink-0">👗</div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-900">Robe wax premium</p>
                      <p className="text-[11px] text-indigo-600 font-bold">89,00 €</p>
                    </div>
                    <button className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white">Ajouter</button>
                  </div>
                  {/* Paiement Stripe */}
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Paiement sécurisé</p>
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                      <span className="text-sm">💳</span>
                      <span className="text-[11px] text-gray-400">4242 4242 4242 4242</span>
                    </div>
                    <button className="w-full rounded-lg bg-indigo-600 py-2 text-[11px] font-bold text-white">
                      Payer 89,00 € par carte
                    </button>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-[9px] text-gray-400">🔒 Sécurisé par</span>
                      <span className="text-[10px] font-bold text-indigo-500">Stripe</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">C&apos;est simple</p>
            <h2
              className="text-2xl sm:text-3xl font-black text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Comment ça marche
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ETAPES.map(e => (
              <div key={e.num} className="rounded-3xl border border-indigo-100 bg-indigo-50/30 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white text-sm font-black mb-4">
                  {e.num}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{e.titre}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{e.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pourquoi Stripe ──────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 bg-indigo-50/40">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 mb-5">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h2
            className="text-2xl sm:text-3xl font-black text-gray-900 mb-4"
            style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
          >
            TekkiShop ne touche jamais à ton argent.
          </h2>
          <p className="text-gray-600 leading-relaxed max-w-xl mx-auto">
            Tu connectes ton propre compte Stripe — le standard de paiement utilisé par des millions de commerçants dans le monde. Les paiements de tes clients vont directement dessus. TekkiShop n&apos;est jamais intermédiaire financier : ton argent t&apos;appartient, à chaque instant.
          </p>
        </div>
      </section>

      {/* ── Exemples ─────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Exemples</p>
            <h2
              className="text-2xl sm:text-3xl font-black text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Qui vend depuis l&apos;Europe et le Canada
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {USAGES.map(u => (
              <div key={u.titre} className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
                <div className="text-3xl mb-3">{u.icon}</div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{u.titre}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{u.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50/60 py-16 sm:py-20 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <h2
              className="text-2xl sm:text-3xl font-black text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Questions fréquentes
            </h2>
          </div>
          <MiniFAQ items={FAQS} />
        </div>
      </section>

      <FinalCTA
        title="Prêt à vendre depuis l'Europe ou le Canada ?"
        subtitle="Crée ta boutique en euros ou en dollars canadiens et connecte ton compte Stripe en quelques minutes."
      />

      <WhatsAppButton />
      <SiteFooter />
    </div>
  )
}
