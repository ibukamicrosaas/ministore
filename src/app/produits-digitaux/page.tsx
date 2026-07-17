import Link from 'next/link'
import { ArrowRight, Download } from 'lucide-react'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { WhatsAppButton } from '@/components/landing/WhatsAppButton'
import { MiniFAQ } from '@/components/landing/MiniFAQ'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { APP_NAME } from '@/constants'

export const metadata = {
  title: `Vends tes produits digitaux — ${APP_NAME}`,
  description: "E-books, guides PDF, supports de formation, modèles Excel... Vends tes fichiers directement depuis ta boutique TekkiShop. Ton client paie, il reçoit son lien de téléchargement instantanément.",
}

const ETAPES = [
  {
    num: '1',
    titre: 'Ajoute ton fichier',
    texte: 'Dans la fiche produit, ajoute ton fichier — PDF, ZIP, EPUB, DOCX ou XLSX, jusqu\'à 50 Mo — à la place d\'une photo.',
  },
  {
    num: '2',
    titre: 'Ton client achète normalement',
    texte: 'Il paie comme n\'importe quel produit de ta boutique : Wave, Orange Money, carte bancaire ou à la livraison.',
  },
  {
    num: '3',
    titre: 'Il reçoit son lien automatiquement',
    texte: 'Dès le paiement confirmé, un lien de téléchargement sécurisé lui est envoyé. Toi, tu es payé — sans rien faire.',
  },
]

const USAGES = [
  { icon: '📘', titre: 'Formateurs & coachs', texte: 'Guides et supports de formation en PDF' },
  { icon: '📗', titre: 'Auteurs & créateurs', texte: 'E-books au format EPUB' },
  { icon: '📊', titre: 'Consultants', texte: 'Modèles et grilles de calcul en Excel (XLSX)' },
  { icon: '🗂️', titre: 'Plusieurs fichiers à livrer ?', texte: 'Regroupe-les dans un ZIP' },
]

const FAQS = [
  {
    q: 'Quels types de fichiers puis-je vendre ?',
    a: 'PDF, ZIP, EPUB, DOCX et XLSX, jusqu\'à 50 Mo par fichier. Si tu veux vendre plusieurs documents d\'un coup, regroupe-les dans un ZIP avant de l\'ajouter à ta boutique.',
  },
  {
    q: 'Puis-je vendre plusieurs fichiers pour un même produit ?',
    a: 'Un produit digital correspond à un seul fichier. Pour livrer plusieurs documents ensemble, mets-les dans un ZIP — ton client recevra tout en un seul téléchargement.',
  },
  {
    q: 'Le lien de téléchargement est-il sécurisé ?',
    a: 'Oui. Chaque lien est unique, généré automatiquement au moment du paiement, valable 48h et utilisable jusqu\'à 5 fois. Personne d\'autre que ton client ne peut y accéder.',
  },
  {
    q: 'Où sont stockés mes fichiers ?',
    a: 'Sur un hébergement sécurisé inclus dans TekkiShop — pas besoin d\'outil externe ni de compte cloud séparé.',
  },
  {
    q: 'Puis-je vendre des produits physiques et digitaux sur la même boutique ?',
    a: 'Oui, tu peux mélanger les deux types de produits librement dans ton catalogue — pas besoin de deux boutiques.',
  },
]

export default function ProduitsDigitauxPage() {
  return (
    <div className="landing-scope min-h-screen bg-white" style={{ fontFamily: 'var(--font-sans, DM Sans, sans-serif)' }}>
      <SiteHeader />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Texte */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700 mb-5">
                <Download className="h-3.5 w-3.5" />
                Vente automatique 24h/24
              </div>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4 leading-tight"
                style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
              >
                Vends aussi tes<br />
                <span className="text-violet-600">produits digitaux.</span>
              </h1>
              <p className="text-gray-600 leading-relaxed mb-7 max-w-md text-lg">
                E-books, guides PDF, supports de formation, modèles Excel… Ajoute ton fichier à ta boutique. Ton client paie, il reçoit son lien de téléchargement instantanément. Toi, tu encaisses — même quand tu dors.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  { icon: '📁', text: 'Fichiers jusqu\'à 50 Mo — PDF, ZIP, EPUB, DOCX, XLSX' },
                  { icon: '🔗', text: 'Lien de téléchargement envoyé automatiquement après paiement' },
                  { icon: '🔒', text: 'Lien sécurisé et à usage limité — valable 48h' },
                  { icon: '💰', text: 'Vends des produits physiques et digitaux depuis la même boutique' },
                ].map(f => (
                  <li key={f.text} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-600 text-xs">{f.icon}</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-md"
              >
                Créer ma boutique
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mockup page de téléchargement */}
            <div className="flex-shrink-0 w-full max-w-xs">
              <div className="rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100/60 overflow-hidden">
                {/* Header boutique */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4">
                  <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wide mb-1">Achat confirmé ✅</p>
                  <p className="text-white font-black text-base">Coach Aminata — Formations</p>
                  <p className="text-white/50 text-[10px]">tekki.shop/coach-aminata</p>
                </div>
                {/* Produit */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center text-xl shrink-0">📘</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">Guide business Afrique 2024</p>
                      <p className="text-[10px] text-gray-400">PDF · 8,4 Mo</p>
                    </div>
                    <span className="text-emerald-600 text-[10px] font-bold shrink-0">✓ Payé</span>
                  </div>
                  {/* Lien téléchargement */}
                  <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 space-y-2.5 text-center">
                    <p className="text-[10px] text-gray-400">Ton fichier est prêt</p>
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5">
                      <Download className="h-3.5 w-3.5 text-white" />
                      <span className="text-[11px] font-bold text-white">Télécharger mon fichier</span>
                    </div>
                    <p className="text-[9px] text-gray-400">Lien sécurisé · Valable 48h</p>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 pt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <p className="text-[10px] text-emerald-600 font-semibold">5 000 FCFA reçus par Wave ✓</p>
                  </div>
                </div>
              </div>
              <p className="text-center text-[10px] text-gray-400 mt-3">Livraison instantanée · Zéro intervention manuelle</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Comment ça marche ────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 bg-violet-50/40">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">C&apos;est simple</p>
            <h2
              className="text-2xl sm:text-3xl font-black text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Comment ça marche
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {ETAPES.map(e => (
              <div key={e.num} className="rounded-3xl border border-violet-100 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white text-sm font-black mb-4">
                  {e.num}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{e.titre}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{e.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Qui vend quoi ─────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">Exemples</p>
            <h2
              className="text-2xl sm:text-3xl font-black text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Qui vend quoi
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {USAGES.map(u => (
              <div key={u.titre} className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
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
        title="Prêt à vendre tes fichiers ?"
        subtitle="Ajoute ton premier produit digital et reçois ton premier paiement dès aujourd'hui."
      />

      <WhatsAppButton />
      <SiteFooter />
    </div>
  )
}
