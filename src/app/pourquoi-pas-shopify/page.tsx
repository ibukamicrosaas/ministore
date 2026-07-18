import Link from 'next/link'
import { ArrowRight, Quote, Receipt, X, Check } from 'lucide-react'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { WhatsAppButton } from '@/components/landing/WhatsAppButton'
import { MiniFAQ } from '@/components/landing/MiniFAQ'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { Reveal } from '@/components/landing/Reveal'
import { APP_NAME } from '@/constants'

export const metadata = {
  title: `TekkiShop vs Shopify — lequel choisir pour vendre en Afrique ? — ${APP_NAME}`,
  description: "Nous avons utilisé Shopify pendant 11 ans en Afrique. Voici honnêtement ce qui lui manque ici — et quand il reste le bon choix. Comparaison complète TekkiShop vs Shopify.",
}

const CREDS = [
  { chiffre: '11 ans', label: "d'utilisation de Shopify" },
  { chiffre: '+9 000', label: 'commandes gérées en Afrique' },
  { chiffre: '+1 200', label: 'marchands déjà sur TekkiShop' },
]

const TABLE_ROWS = [
  { theme: "S'inscrire", sub: 'Le premier obstacle', sh: "Carte Visa/Mastercard exigée dès l'inscription", tk: 'Ton numéro WhatsApp suffit — sans carte bancaire' },
  { theme: 'Encaisser tes clients', sub: 'Wave, Orange Money, MTN, Moov', sh: 'Aucun paiement mobile money africain', tk: 'Intégrés selon ton pays, dès le 1er jour' },
  { theme: 'Le paiement à la livraison', sub: 'La norme ici', sh: 'Statuts à mettre à jour à la main, cash non réconcilié', tk: 'Confirmation du livreur en 1 clic, paiements comptés automatiquement' },
  { theme: 'Tes livreurs', sub: 'Livreurs indépendants', sh: "Aucun outil — appels et dictée d'adresses", tk: 'Commande envoyée sur son WhatsApp en 1 clic, avec tout' },
  { theme: 'La langue', sub: 'Toi et ton équipe', sh: 'Interface et support essentiellement en anglais', tk: '100 % en français, pensé pour les marchands africains' },
  { theme: 'Le prix', sub: 'Et la devise', sh: '≥ 29 $/mois (≈ 18 000 FCFA), facturé en dollars', tk: 'Dès 2 900 FCFA/mois — en FCFA, euros ou CAD' },
  { theme: 'WhatsApp', sub: 'Là où sont tes clients', sh: "Rien d'intégré — apps tierces payantes", tk: 'Notifications automatiques clients, vendeur et livreur incluses' },
  { theme: 'Comprendre tes chiffres', sub: 'Marges, bénéfices, tendances', sh: 'Tableaux de bord complexes, en anglais', tk: 'Assistant IA intégré : pose ta question, il répond simplement' },
  { theme: 'Le support', sub: 'Quand tu es bloqué', sh: "Pas de support francophone dédié à l'Afrique", tk: 'Des humains, en français, sur WhatsApp' },
]

const HONNETE = {
  shopify: [
    'Tes clients sont uniquement en Occident et paient tous par carte bancaire',
    "Tu as besoin d'un écosystème de milliers d'apps et de thèmes très spécifiques",
    'Tu as une équipe technique (ou un budget développeur) pour tout configurer',
  ],
  tekki: [
    "Tes clients sont en Afrique — ou entre l'Afrique et l'Europe/Canada — et paient par mobile money, carte ou à la livraison",
    'Tu veux vendre dès aujourd\'hui, depuis ton téléphone, sans configuration technique',
    'Tu travailles avec des livreurs indépendants et tu veux que le cash soit compté tout seul',
  ],
}

const FAQS = [
  {
    q: 'Est-ce vraiment moins cher que Shopify ?',
    a: "Oui, nettement — surtout une fois Shopify équipé des apps nécessaires pour l'Afrique (WhatsApp, livraison, suivi). Shopify Basic seul coûte environ 18 000 FCFA/mois, facturé en dollars. TekkiShop démarre à 2 900 FCFA/mois, tout inclus, payable par mobile money.",
  },
  {
    q: 'TekkiShop a-t-il autant de fonctionnalités que Shopify ?',
    a: "Non, et c'est assumé : Shopify a des milliers d'apps pour des milliers de cas d'usage. TekkiShop a exactement les fonctionnalités dont un marchand en Afrique a besoin — paiements locaux, livreurs, WhatsApp, cash à la livraison, produits digitaux — sans que tu aies à chercher, installer et payer quoi que ce soit en plus. Moins de fonctionnalités, mais les bonnes, déjà branchées.",
  },
  {
    q: 'Puis-je importer mes produits existants dans TekkiShop ?',
    a: "Oui. Depuis ton tableau de bord, importe tous tes produits en une fois via un fichier CSV — pas besoin de tout ressaisir à la main, produit par produit.",
  },
  {
    q: 'Puis-je garder ma boutique Shopify pendant que je teste TekkiShop ?',
    a: "Bien sûr. Créer ta boutique TekkiShop est gratuit, et rien ne t'oblige à fermer l'ancienne. Beaucoup de marchands font tourner les deux quelques semaines, comparent leurs ventes, puis choisissent.",
  },
  {
    q: "Et si je change d'avis ?",
    a: "Tu peux exporter tes données et arrêter ton abonnement à tout moment, sans frais ni engagement. Ta boutique t'appartient — nos marchands restent parce que ça marche, pas parce qu'ils sont bloqués.",
  },
]

export default function PourquoiPasShopifyPage() {
  return (
    <div className="landing-scope min-h-screen bg-white" style={{ fontFamily: 'var(--font-sans, DM Sans, sans-serif)' }}>
      <SiteHeader />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(180deg, #F5F9FF 0%, #ffffff 100%)' }}>
        <div className="mx-auto max-w-3xl px-4 pt-14 pb-12 text-center">
          <div className="inline-flex items-center rounded-full bg-[var(--color-primary)]/10 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[var(--color-primary-dark)] mb-5">
            TekkiShop vs Shopify
          </div>
          <h1
            className="text-[clamp(2rem,5vw,3.2rem)] font-bold text-gray-900 leading-[1.14] tracking-tight mb-5"
            style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
          >
            Shopify est un excellent outil. <span className="text-[var(--color-primary)]">On l&apos;a utilisé pendant 11 ans.</span>
          </h1>
          <p className="text-lg text-gray-500 mb-2 max-w-2xl mx-auto leading-relaxed">
            C&apos;est justement pour ça qu&apos;on sait exactement ce qui lui manque en Afrique.{' '}
            <strong className="text-gray-700">TekkiShop n&apos;a pas été construit contre Shopify — il a été construit à partir de tout ce que Shopify nous a fait vivre ici.</strong>{' '}
            Voici la comparaison honnête.
          </p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mt-9">
            {CREDS.map(c => (
              <div key={c.label} className="text-center">
                <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>{c.chiffre}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Histoire ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <Reveal className="mx-auto max-w-3xl">
          <div className="relative rounded-[24px] p-9 sm:p-11 text-white shadow-2xl" style={{ backgroundColor: '#0B1B32' }}>
            <Quote className="h-10 w-10 text-[var(--color-primary)] opacity-60 mb-3" fill="currentColor" />
            <div className="space-y-4 text-base sm:text-lg leading-relaxed">
              <p>
                Pendant des années, chaque soir, je faisais la même chose : ouvrir Shopify et{' '}
                <strong className="text-sky-300">mettre à jour à la main le statut de toutes les commandes payées à la livraison</strong>.
                Une par une. Parce que Shopify ne sait pas qu&apos;ici, le client paie le livreur en cash, et que ce cash doit être compté quelque part.
              </p>
              <p>
                J&apos;appelais mes livreurs pour leur dicter les adresses. Je recopiais les numéros. Je perdais des ventes Wave parce qu&apos;il n&apos;existait aucun moyen de l&apos;intégrer proprement.{' '}
                <strong className="text-sky-300">Shopify n&apos;était pas mauvais — il était juste pensé pour un monde qui n&apos;est pas le nôtre.</strong>
              </p>
              <p>Chaque fonctionnalité de TekkiShop est née d&apos;une de ces soirées-là.</p>
            </div>
            <div className="flex items-center gap-3.5 mt-7 pt-6 border-t border-white/10">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
                IK
              </div>
              <div>
                <p className="font-bold">Ibuka Kinkela</p>
                <p className="text-xs text-gray-400">Fondateur de TekkiShop · 11 ans d&apos;e-commerce entre l&apos;Europe et l&apos;Afrique</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Tableau comparatif ───────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-[#F5F9FF]">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center mb-12 max-w-[62ch] mx-auto">
            <h2
              className="text-[clamp(1.7rem,3.8vw,2.4rem)] font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Les différences qui comptent <span className="text-[var(--color-primary)]">vraiment ici.</span>
            </h2>
            <p className="text-gray-500 text-lg mt-3">
              Pas une liste de 200 fonctionnalités — juste ce qui change ta vie de marchand en Afrique ou dans la diaspora.
            </p>
          </Reveal>

          <Reveal delay={100} className="rounded-[20px] border border-gray-200 bg-white shadow-xl shadow-gray-200/40 overflow-hidden max-w-4xl mx-auto">
            <div className="hidden sm:grid grid-cols-[1.15fr_1fr_1fr] text-sm font-bold text-white" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
              <div className="px-5 py-4" style={{ backgroundColor: '#0B1B32' }}>Ce qui compte pour toi</div>
              <div className="px-5 py-4" style={{ backgroundColor: '#0B1B32' }}>Shopify</div>
              <div className="px-5 py-4 bg-[var(--color-primary)]">TekkiShop</div>
            </div>
            {TABLE_ROWS.map(r => (
              <div key={r.theme} className="grid grid-cols-1 sm:grid-cols-[1.15fr_1fr_1fr] border-t border-gray-100 text-sm">
                <div className="px-5 py-4 font-bold text-gray-900 bg-[#F5F9FF]">
                  {r.theme}
                  <span className="block font-medium text-gray-400 text-xs mt-0.5">{r.sub}</span>
                </div>
                <div className="px-5 py-4 text-gray-500 flex items-start gap-2">
                  <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{r.sh} <span className="sm:hidden text-[11px] font-bold text-gray-400">— Shopify</span></span>
                </div>
                <div className="px-5 py-4 font-semibold text-gray-800 bg-[var(--color-primary)]/10 flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{r.tk} <span className="sm:hidden text-[11px] font-bold text-[var(--color-primary-dark)]">— TekkiShop</span></span>
                </div>
              </div>
            ))}
          </Reveal>
          <p className="text-center text-xs text-gray-400 max-w-[60ch] mx-auto mt-5">
            Comparaison établie en juillet 2026 sur la base des offres publiques de Shopify. Les tarifs Shopify varient selon les plans et promotions en cours.
          </p>
        </div>
      </section>

      {/* ── Le vrai coût ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center mb-14 max-w-[62ch] mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary-dark)] mb-3">Le calcul que personne ne fait</p>
            <h2
              className="text-[clamp(1.7rem,3.8vw,2.4rem)] font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Le prix affiché n&apos;est pas <span className="text-[var(--color-primary)]">le prix réel.</span>
            </h2>
            <p className="text-gray-500 text-lg mt-3">
              Pour faire fonctionner Shopify en Afrique, il faut empiler des applications tierces. Voici la facture complète, pour un marchand qui vend avec livreurs et paiement à la livraison.
            </p>
          </Reveal>

          <Reveal delay={100} className="grid lg:grid-cols-2 gap-5 max-w-3xl mx-auto items-stretch">
            <div className="rounded-[20px] border border-red-100 bg-red-50/60 p-8 flex flex-col">
              <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
                <Receipt className="h-5 w-5 text-red-500" /> Shopify, équipé pour l&apos;Afrique
              </h3>
              {[
                { l: 'Abonnement Basic', s: 'Facturé en dollars', v: '≈ 18 000 FCFA' },
                { l: 'App notifications WhatsApp', s: 'Application tierce payante', v: '≈ 6 000 FCFA' },
                { l: 'App paiement à la livraison / suivi', s: 'Application tierce payante', v: '≈ 5 000 FCFA' },
                { l: 'Paiements Wave / Orange Money', s: 'Toujours pas disponibles', v: '—' },
              ].map(item => (
                <div key={item.l} className="flex justify-between gap-3 py-2.5 border-b border-dashed border-black/10 text-sm">
                  <span className="text-gray-700">{item.l}<span className="block text-xs text-gray-400">{item.s}</span></span>
                  <strong className="text-gray-900 shrink-0">{item.v}</strong>
                </div>
              ))}
              <div className="flex justify-between mt-auto pt-4 font-bold text-lg text-red-600" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
                <span>Par mois</span><span>≈ 29 000 FCFA</span>
              </div>
            </div>

            <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/60 p-8 flex flex-col">
              <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
                <Receipt className="h-5 w-5 text-emerald-600" /> TekkiShop, tout inclus
              </h3>
              {[
                { l: 'Abonnement Découverte', s: 'En FCFA, payable par mobile money', v: '2 900 FCFA' },
                { l: 'Notifications WhatsApp', s: 'Clients, vendeur et livreur', v: 'Inclus' },
                { l: 'Livreurs + paiement à la livraison', s: 'Avec réconciliation automatique', v: 'Inclus' },
                { l: 'Wave, Orange Money, MTN, Moov', s: 'Selon ton pays', v: 'Inclus' },
              ].map(item => (
                <div key={item.l} className="flex justify-between gap-3 py-2.5 border-b border-dashed border-black/10 text-sm">
                  <span className="text-gray-700">{item.l}<span className="block text-xs text-gray-400">{item.s}</span></span>
                  <strong className="text-gray-900 shrink-0">{item.v}</strong>
                </div>
              ))}
              <div className="flex justify-between mt-auto pt-4 font-bold text-lg text-emerald-700" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
                <span>Par mois</span><span>Dès 2 900 FCFA</span>
              </div>
            </div>
          </Reveal>
          <p className="text-center text-xs text-gray-400 max-w-[62ch] mx-auto mt-5">
            Montants indicatifs convertis en FCFA pour comparaison. Sur TekkiShop, une commission de 3 % s&apos;applique aux paiements en ligne par mobile money — elle couvre les frais de l&apos;agrégateur et du transfert, et ton argent est retirable instantanément.
          </p>
        </div>
      </section>

      {/* ── Honnêteté ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-[#F5F9FF]">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center mb-14 max-w-[62ch] mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary-dark)] mb-3">En toute honnêteté</p>
            <h2
              className="text-[clamp(1.7rem,3.8vw,2.4rem)] font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Parfois, Shopify est <span className="text-[var(--color-primary)]">le bon choix.</span>
            </h2>
            <p className="text-gray-500 text-lg mt-3">
              On ne va pas te mentir pour te convaincre. Voici comment choisir, selon ta situation réelle.
            </p>
          </Reveal>

          <Reveal delay={100} className="grid lg:grid-cols-2 gap-5 max-w-3xl mx-auto">
            <div className="rounded-[20px] border border-gray-200 bg-white p-7">
              <h3 className="text-base font-bold text-gray-900 mb-3">Choisis Shopify si…</h3>
              {HONNETE.shopify.map((t, i) => (
                <div key={t} className={`flex items-start gap-2.5 py-2.5 text-sm text-gray-600 leading-snug ${i !== 0 ? 'border-t border-dashed border-gray-200' : ''}`}>
                  <ArrowRight className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  {t}
                </div>
              ))}
            </div>
            <div className="rounded-[20px] border-2 border-[var(--color-primary)] bg-white p-7">
              <h3 className="text-base font-bold text-gray-900 mb-3">Choisis TekkiShop si…</h3>
              {HONNETE.tekki.map((t, i) => (
                <div key={t} className={`flex items-start gap-2.5 py-2.5 text-sm text-gray-600 leading-snug ${i !== 0 ? 'border-t border-dashed border-gray-200' : ''}`}>
                  <ArrowRight className="h-4 w-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                  {t}
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150} className="text-center mt-9">
            <p className="text-lg font-semibold text-gray-900 max-w-xl mx-auto" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
              La question n&apos;est pas « quel outil est le meilleur ? » mais{' '}
              <span className="text-[var(--color-primary)]">« quel outil a été construit pour ton marché ? »</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Migration ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <Reveal className="mx-auto max-w-3xl text-center rounded-[24px] border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary)]/5 p-10 sm:p-12">
          <h2
            className="text-[clamp(1.5rem,3.2vw,2.1rem)] font-bold text-gray-900"
            style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
          >
            Déjà sur Shopify (ou ailleurs) ?
          </h2>
          <p className="text-gray-500 mt-3.5 max-w-xl mx-auto leading-relaxed">
            Pas besoin de tout ressaisir à la main. <strong className="text-gray-700">Importe tous tes produits en une fois avec un simple fichier CSV</strong> — noms, prix, descriptions — et compare les deux boutiques par toi-même. Ta boutique TekkiShop est gratuite à créer : tu ne risques rien à essayer.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 mt-6">
            {['1 · Exporte ton CSV depuis Shopify', '2 · Importe-le dans TekkiShop', '3 · Compare, puis décide'].map(s => (
              <span key={s} className="text-sm font-bold bg-white border border-gray-200 rounded-full px-4 py-2.5">{s}</span>
            ))}
          </div>
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] bg-[var(--color-primary)] px-7 py-4 text-base font-bold text-white shadow-lg shadow-sky-200 hover:-translate-y-0.5 active:translate-y-0 transition-transform mt-7"
          >
            Importer ma boutique et comparer
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
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
        title="Ne nous crois pas sur parole. Compare par toi-même."
        subtitle="Crée ta boutique gratuitement en 5 minutes, importe tes produits, et regarde laquelle des deux te fait vendre le plus simplement."
        reassurance={['Boutique gratuite à créer', 'Sans carte bancaire', 'Import CSV en 1 fois']}
        background="linear-gradient(135deg, #175CD3, #2E90FA)"
        maxWidth="max-w-xl"
      />

      <WhatsAppButton />
      <SiteFooter />
    </div>
  )
}
