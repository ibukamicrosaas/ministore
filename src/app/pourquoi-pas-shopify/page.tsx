import { CheckCircle2, X, Upload } from 'lucide-react'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { WhatsAppButton } from '@/components/landing/WhatsAppButton'
import { MiniFAQ } from '@/components/landing/MiniFAQ'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { APP_NAME } from '@/constants'

export const metadata = {
  title: `${APP_NAME} vs Shopify — pourquoi pas Shopify pour vendre en Afrique ?`,
  description: "Shopify est conçu pour les marchés occidentaux. TEKKIShop est pensé pour les marchands africains : Wave, Orange Money, WhatsApp, livraison, sans carte bancaire.",
}

const FAQS = [
  {
    q: 'Puis-je importer mes produits existants dans TekkiShop ?',
    a: 'Oui. Depuis ton tableau de bord, tu peux importer tous tes produits en une fois via un fichier CSV — pas besoin de tout ressaisir à la main, produit par produit.',
  },
  {
    q: 'Est-ce vraiment moins cher que Shopify ?',
    a: 'Oui : nos plans démarrent à 2 900 FCFA/mois (environ 4,50 €), contre au moins 29 $/mois pour Shopify (≈ 18 000 FCFA) — sans compter les frais de conversion de devise sur tes paiements.',
  },
  {
    q: 'TekkiShop a-t-il autant de fonctionnalités que Shopify ?',
    a: 'TekkiShop n\'essaie pas d\'être un petit Shopify. On se concentre sur ce qui compte vraiment pour un marchand africain qui vend sur WhatsApp : paiements Mobile Money, gestion de livraison, notifications automatiques — pas des centaines de modules dont tu n\'as pas besoin.',
  },
  {
    q: 'Et si je change d\'avis ?',
    a: 'Aucun engagement. Tu peux arrêter à tout moment, sans frais ni justification.',
  },
]

export default function PourquoiPasShopifyPage() {
  return (
    <div className="landing-scope min-h-screen bg-white" style={{ fontFamily: 'var(--font-sans, DM Sans, sans-serif)' }}>
      <SiteHeader />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">Fait pour l&apos;Afrique</p>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Pourquoi pas Shopify ?
            </h1>
            <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
              Tu compares les solutions avant de te lancer, c&apos;est normal. Shopify est une excellente plateforme —
              pour les marchés occidentaux. Il ne tient pas compte des réalités africaines : Mobile Money, livraison
              du dernier kilomètre, WhatsApp. TEKKIShop, si. Voici les vraies différences.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mb-8">
            {/* Shopify */}
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 shrink-0">
                  <X className="h-3.5 w-3.5 text-gray-500" />
                </div>
                <p className="text-sm font-bold text-gray-500">Shopify</p>
              </div>
              <div className="space-y-3">
                {[
                  'Nécessite une carte Visa ou Mastercard pour s\'inscrire',
                  'Aucun paiement Wave, Orange Money, Moov',
                  'Tout en anglais — compliqué si tu ne lis pas bien l\'anglais',
                  'Tarifs en dollars (≥ 29 $/mois ≈ 18 000 FCFA)',
                  'Aucun outil pour organiser tes livraisons',
                  'Aucune notification WhatsApp automatique',
                  'Pas d\'assistant IA pour t\'aider à gérer ta boutique',
                  'Pas de support francophone dédié à l\'Afrique',
                ].map(t => (
                  <div key={t} className="flex items-start gap-2.5">
                    <span className="text-gray-300 text-xs mt-1 shrink-0">✕</span>
                    <p className="text-sm text-gray-500 leading-snug">{t}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* TEKKIShop */}
            <div className="rounded-3xl bg-[var(--color-primary)] p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="text-sm font-bold text-white">TEKKIShop</p>
              </div>
              <div className="space-y-3">
                {[
                  'Inscription avec ton numéro WhatsApp — sans carte bancaire',
                  'Wave, Orange Money, Moov intégrés directement',
                  '100 % en français, pensé pour les marchands africains',
                  'Dès 2 900 FCFA/mois — tarifs en FCFA, euros ou CAD',
                  'Suivi livraison + message WhatsApp automatique au livreur',
                  'Notifications WhatsApp automatiques clients & vendeur',
                  'Assistant IA intégré pour analyser et piloter ta boutique',
                  'Vente de produits digitaux — stockage + livraison automatique',
                  'Support WhatsApp en français, par des humains',
                ].map(t => (
                  <div key={t} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-sky-200 mt-0.5 shrink-0" />
                    <p className="text-sm text-sky-50 leading-snug">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Migration ────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 bg-orange-50/40">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 mb-5">
            <Upload className="h-6 w-6 text-white" />
          </div>
          <h2
            className="text-2xl sm:text-3xl font-black text-gray-900 mb-4"
            style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
          >
            Tu as déjà des produits ailleurs ?
          </h2>
          <p className="text-gray-600 leading-relaxed max-w-xl mx-auto">
            Pas besoin de tout ressaisir à la main. Depuis ton tableau de bord TekkiShop, importe tous tes produits
            existants en une fois avec un simple fichier CSV — noms, prix, descriptions.
          </p>
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
        title="Prêt à essayer TekkiShop ?"
        subtitle="Crée ta boutique gratuitement, aucune carte bancaire requise. Compare par toi-même."
      />

      <WhatsAppButton />
      <SiteFooter />
    </div>
  )
}
