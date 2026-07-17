import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { WhatsAppButton } from '@/components/landing/WhatsAppButton'
import { MiniFAQ } from '@/components/landing/MiniFAQ'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { Reveal } from '@/components/landing/Reveal'
import { DigitalProductPhoneMockup } from '@/components/landing/DigitalProductPhoneMockup'
import { DecouverteIllustration, PaiementIllustration, ReceptionIllustration, AvisIllustration } from '@/components/landing/DigitalParcoursIllustrations'
import { APP_NAME } from '@/constants'

export const metadata = {
  title: `Vends tes produits digitaux, on s'occupe du reste — ${APP_NAME}`,
  description: "Ebooks, guides, templates, musique : ajoute ton fichier, partage ton lien. TekkiShop encaisse par mobile money, livre ton fichier automatiquement et collecte les avis. Toi, tu retires ton argent instantanément.",
}

const VENDEURS = ['✍️ Auteurs', '🎓 Coachs & formateurs', '🎨 Designers', '🎵 Beatmakers', '📊 Consultants', '📱 Créateurs de contenu']

const PARCOURS = [
  {
    num: '1',
    titre: 'Il découvre ton produit',
    texte: 'Page pro avec ta couverture, ton prix, tes points forts et les avis de tes clients précédents.',
    Illustration: DecouverteIllustration,
  },
  {
    num: '2',
    titre: 'Il paie comme il a l\'habitude',
    texte: 'Mobile money de ton pays, en quelques secondes. Pas de carte bancaire exigée, pas de compte à créer.',
    Illustration: PaiementIllustration,
  },
  {
    num: '3',
    titre: 'Il reçoit son fichier immédiatement',
    texte: 'Page de téléchargement + lien par e-mail et SMS. Sécurisé : 48h, 5 téléchargements. Zéro action de ta part.',
    Illustration: ReceptionIllustration,
  },
  {
    num: '4',
    titre: 'Il laisse un avis',
    texte: 'La demande d\'avis part automatiquement 3 jours après l\'achat. Tu peux aussi l\'envoyer toi-même en 1 clic depuis la page de commande du client.',
    Illustration: AvisIllustration,
  },
]

const PERSONAS = [
  { emo: '✍️', titre: 'L\'auteur·e', texte: 'Ton roman, ton recueil, ton essai — en EPUB ou PDF, vendu directement à ta communauté, sans maison d\'édition.', ex: 'Ex : ebook à 4 500 FCFA' },
  { emo: '🎓', titre: 'Le coach / formateur', texte: 'Ton guide pratique, ton workbook, tes fiches méthode — ce que tu répètes en accompagnement, transformé en revenu qui tourne seul.', ex: 'Ex : guide à 10 000 FCFA' },
  { emo: '🎨', titre: 'Le designer / créateur', texte: 'Tes templates Canva, tes presets, tes maquettes de site — crée une fois, vends cent fois.', ex: 'Ex : pack templates à 7 500 FCFA' },
  { emo: '🎵', titre: 'Le beatmaker / musicien', texte: 'Tes instrus, tes packs de sons, tes projets — livrés en ZIP, payés par mobile money, sans intermédiaire.', ex: 'Ex : beat à 15 000 FCFA' },
  { emo: '📊', titre: 'Le consultant', texte: 'Tes modèles Excel, business plans types, grilles de calcul — l\'outil que tes clients te réclament, enfin monétisé.', ex: 'Ex : modèle XLSX à 5 000 FCFA' },
  { emo: '📱', titre: 'Le créateur de contenu', texte: 'Ton audience te suit déjà. Ton guide « comment je fais » est le produit le plus simple à lui vendre — le lien est déjà dans ta bio.', ex: 'Ex : guide à 3 000 FCFA' },
]

const FAQS = [
  {
    q: 'Quels types de fichiers puis-je vendre ?',
    a: 'PDF, EPUB, ZIP, DOCX et XLSX, jusqu\'à 50 Mo par fichier. Pour vendre plusieurs documents d\'un coup (un pack), regroupe-les dans un ZIP avant de l\'ajouter à ta boutique.',
  },
  {
    q: 'Comment mon client reçoit-il son fichier ?',
    a: 'De trois façons, automatiquement : une page de téléchargement s\'affiche juste après le paiement, et le lien lui est aussi envoyé par e-mail et par SMS. Tu n\'as rien à envoyer, jamais.',
  },
  {
    q: 'Mon fichier est-il protégé contre le partage ?',
    a: 'Chaque lien de téléchargement est personnel, valable 48h et limité à 5 téléchargements. Ton fichier ne peut pas circuler librement via un lien public.',
  },
  {
    q: 'Et si mon client perd son fichier ou rate le délai ?',
    a: 'Pas de panique : il peut te contacter en un clic depuis sa page de commande (bouton « Contacter la boutique »), et tu peux lui renvoyer un accès depuis ton tableau de bord. Personne ne reste bloqué.',
  },
  {
    q: 'Combien ça me coûte ?',
    a: 'Ton abonnement boutique (à partir de 2 900 FCFA/mois) + 3 % de commission sur les paiements en ligne, qui couvrent les frais de l\'agrégateur mobile money et du transfert. Exemple : une vente à 4 500 FCFA te rapporte 4 365 FCFA, retirables instantanément. C\'est tout.',
  },
  {
    q: 'Puis-je vendre des produits physiques ET digitaux sur la même boutique ?',
    a: 'Oui. Tes produits physiques et ton ebook peuvent vivre sur la même boutique : au moment d\'ajouter un produit, tu choisis simplement « Physique » ou « Digital ». Le reste s\'adapte automatiquement.',
  },
  {
    q: 'Je veux vendre une formation vidéo, c\'est possible ?',
    a: 'Les fichiers vidéo dépassent généralement 50 Mo, donc pas encore ici. Mais c\'est exactement le rôle de TEKKI Classes, notre solution dédiée aux formations en ligne (modules, chapitres, progression des apprenants), bientôt disponible.',
  },
]

export default function ProduitsDigitauxPage() {
  return (
    <div className="landing-scope min-h-screen bg-white" style={{ fontFamily: 'var(--font-sans, DM Sans, sans-serif)' }}>
      <SiteHeader />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(180deg, #F4F1FF 0%, #ffffff 100%)' }}>
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-16">
          <div className="grid lg:grid-cols-[1.15fr_1fr] items-center gap-12 lg:gap-14">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-violet-700 mb-6">
                💾 Produits digitaux
              </div>
              <h1
                className="text-[clamp(2.1rem,5vw,3.3rem)] font-bold text-gray-900 leading-[1.14] tracking-tight mb-5"
                style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
              >
                Tu as un savoir, un talent, un vécu ? <span className="text-violet-600">Vends-le en fichier.</span>
              </h1>
              <p className="text-lg text-gray-500 mb-7 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Ebook, guide, template, musique, modèle Excel… Ajoute ton fichier à ta boutique et partage ton lien.{' '}
                <strong className="text-gray-700">Ton client paie par mobile money, reçoit son fichier automatiquement</strong> — et toi, tu encaisses. Même à 3h du matin.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-6">
                <Link
                  href="/onboarding"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] bg-violet-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-violet-200 hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                >
                  Vendre mon premier fichier
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#argent"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border border-gray-200 bg-white px-7 py-4 text-base font-bold text-gray-700 hover:-translate-y-0.5 active:translate-y-0 transition-transform"
                >
                  Combien je gagne ?
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-1.5 mb-6 text-sm text-gray-600">
                {['Boutique créée en 5 min', 'Depuis ton téléphone', 'Zéro livraison à gérer'].map(r => (
                  <span key={r}><span className="text-emerald-500 font-bold">✓</span> {r}</span>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                {['PDF', 'EPUB', 'ZIP', 'DOCX', 'XLSX', 'Jusqu\'à 50 Mo'].map(f => (
                  <span key={f} className="text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1.5">{f}</span>
                ))}
              </div>
            </div>

            {/* Téléphone animé + badges flottants */}
            <div className="relative flex justify-center lg:justify-end">
              <style>{`
                @keyframes tekki-float-digital {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-8px); }
                }
              `}</style>
              <DigitalProductPhoneMockup />

              <div
                className="hidden sm:flex absolute top-2 -right-2 lg:-right-6 z-40 items-center gap-2 rounded-2xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-lg shadow-gray-200/60"
                style={{ animation: 'tekki-float-digital 5s ease-in-out infinite' }}
              >
                <span className="text-emerald-500 text-sm">✓</span>
                <p className="text-xs font-bold text-gray-900">Livré automatiquement</p>
              </div>

              <div
                className="hidden sm:flex absolute bottom-16 -left-4 lg:-left-8 z-40 items-center gap-2 rounded-2xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-lg shadow-gray-200/60"
                style={{ animation: 'tekki-float-digital 6s ease-in-out 1s infinite' }}
              >
                <span className="text-amber-400 text-sm">⭐</span>
                <p className="text-xs font-bold text-gray-900">Avis collecté après l&apos;achat</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bande vendeurs ────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 py-5 bg-white">
        <div className="mx-auto max-w-5xl px-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-gray-500">
          {VENDEURS.map(v => <span key={v}>{v}</span>)}
        </div>
      </section>

      {/* ── Le contrat ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gray-50/70">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center mb-14 max-w-[62ch] mx-auto">
            <h2
              className="text-[clamp(1.7rem,3.8vw,2.5rem)] font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Toi, tu crées. <span className="text-violet-600">Nous, on gère le reste.</span>
            </h2>
            <p className="text-gray-500 text-lg mt-3">
              Vendre un produit digital, c&apos;est 10 % de création et 90 % de logistique invisible. On a automatisé les 90 %.
            </p>
          </Reveal>

          <Reveal delay={100} className="grid lg:grid-cols-[1fr_1.4fr] gap-5 max-w-4xl mx-auto">
            <div className="rounded-[20px] border border-gray-200 bg-white p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-1.5">🫵 Ce que tu fais</h3>
              <p className="text-sm text-gray-500 mb-4">Une seule fois, en quelques minutes.</p>
              {[
                'Tu crées ta boutique depuis ton téléphone',
                'Tu ajoutes ton fichier, ton prix, ta description',
                'Tu partages ton lien en statut, Story, bio et dans les groupes',
              ].map((t, i) => (
                <div key={t} className={`flex items-start gap-3 py-2.5 ${i !== 0 ? 'border-t border-dashed border-black/10' : ''}`}>
                  <span className="shrink-0">👉</span>
                  <p className="text-base text-gray-700 leading-snug">{t}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[20px] p-8 text-white shadow-2xl" style={{ backgroundColor: '#0B1B32' }}>
              <h3 className="text-xl font-bold mb-1.5">🤝 Ce que TekkiShop gère pour toi</h3>
              <p className="text-sm text-gray-400 mb-4">À chaque vente, automatiquement, 24h/24.</p>
              {[
                { b: 'On encaisse', t: ' — Wave, Orange Money, MTN, Moov… selon ton pays, sans rien configurer' },
                { b: 'On livre ton fichier', t: ' — page de téléchargement + lien envoyé par e-mail et SMS, instantanément' },
                { b: 'On sécurise', t: ' — lien valable 48h, 5 téléchargements max : ton fichier ne circule pas librement' },
                { b: 'On collecte les avis clients', t: ' — et on les affiche sur ta page produit pour convertir les suivants' },
                { b: 'On te paie', t: ' — retrait instantané de ton argent sur ton mobile money' },
              ].map((item, i) => (
                <div key={item.b} className={`flex items-start gap-3 py-2.5 ${i !== 0 ? 'border-t border-dashed border-white/15' : ''}`}>
                  <span className="shrink-0">✅</span>
                  <p className="text-base text-gray-200 leading-snug"><strong className="text-white">{item.b}</strong>{item.t}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150} className="text-center mt-9">
            <p className="text-lg font-semibold text-gray-900 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
              Pas de colis. Pas de livreur. Pas de stock.{' '}
              <span className="text-violet-600">Le produit digital est le business le plus simple d&apos;Afrique</span> — quand quelqu&apos;un gère la technique pour toi.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Parcours client ──────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center mb-14 max-w-[62ch] mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">Ce que vivent tes clients</p>
            <h2
              className="text-[clamp(1.7rem,3.8vw,2.5rem)] font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Une expérience d&apos;achat <span className="text-violet-600">irréprochable.</span>
            </h2>
            <p className="text-gray-500 text-lg mt-3">
              Voici exactement ce qui se passe quand quelqu&apos;un clique sur ton lien. Chaque étape travaille pour ta crédibilité.
            </p>
          </Reveal>

          <Reveal delay={100} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PARCOURS.map(p => (
              <div key={p.num} className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-3">
                <div className="h-8 w-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-bold" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>
                  {p.num}
                </div>
                <h3 className="text-base font-bold text-gray-900">{p.titre}</h3>
                <p className="text-sm text-gray-500">{p.texte}</p>
                <p.Illustration />
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Combien tu gagnes ────────────────────────────────────────────── */}
      <section id="argent" className="py-24 px-4 bg-gray-50/70">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center mb-14 max-w-[62ch] mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">Transparence totale</p>
            <h2
              className="text-[clamp(1.7rem,3.8vw,2.5rem)] font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Combien tu gagnes, <span className="text-violet-600">exactement.</span>
            </h2>
            <p className="text-gray-500 text-lg mt-3">
              Pas de frais cachés, pas de surprise. Voici une vente réelle, chiffre par chiffre.
            </p>
          </Reveal>

          <Reveal delay={100} className="grid lg:grid-cols-[1.2fr_1fr] gap-5 max-w-3xl mx-auto items-stretch">
            <div className="rounded-[20px] border border-gray-200 bg-white p-8">
              <div className="flex justify-between py-3.5 border-b border-dashed border-gray-200">
                <span className="text-gray-700">Ton client achète ton ebook</span>
                <strong className="text-gray-900">4 500 FCFA</strong>
              </div>
              <div className="flex justify-between py-3.5 border-b border-dashed border-gray-200">
                <div>
                  <span className="text-gray-700">Commission TekkiShop — 3 %</span>
                  <p className="text-xs text-gray-400 mt-0.5">Elle couvre les frais de paiement mobile money et de transfert. C&apos;est tout.</p>
                </div>
                <strong className="text-gray-900 shrink-0 ml-3">− 135 FCFA</strong>
              </div>
              <div className="flex justify-between py-3.5">
                <span className="font-bold text-emerald-600 text-lg" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>Tu reçois</span>
                <strong className="font-bold text-emerald-600 text-xl" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>4 365 FCFA</strong>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold text-center py-3 mt-2">
                ⚡ Retrait instantané sur ton mobile money (Wave, OM, MTN…) — pas dans 24 ou 48h
              </div>
            </div>

            <div className="rounded-[20px] p-8 text-white flex flex-col" style={{ backgroundColor: '#0B1B32' }}>
              <h3 className="text-lg font-bold mb-4">Ton abonnement boutique</h3>
              {[
                { plan: 'Découverte', prix: '2 900' },
                { plan: 'Business', prix: '4 900' },
                { plan: 'Pro', prix: '9 900' },
              ].map(p => (
                <div key={p.plan} className="flex justify-between items-baseline py-2.5 border-b border-white/10 text-sm">
                  <span>{p.plan}</span>
                  <span><strong className="text-base" style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}>{p.prix}</strong> <span className="text-gray-400 text-xs">FCFA/mois</span></span>
                </div>
              ))}
              <p className="text-sm text-gray-400 mt-auto pt-4">
                Crée ta boutique et ajoute tes produits <strong className="text-white">gratuitement</strong>. Tu ne paies que pour activer les ventes — et <strong className="text-white">2 ebooks vendus par mois remboursent déjà ton abonnement</strong>.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Personas ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center mb-14 max-w-[62ch] mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">Qui vend quoi</p>
            <h2
              className="text-[clamp(1.7rem,3.8vw,2.5rem)] font-bold text-gray-900"
              style={{ fontFamily: 'var(--font-display, Outfit, sans-serif)' }}
            >
              Ton savoir vaut de l&apos;argent. <span className="text-violet-600">Lequel vas-tu vendre ?</span>
            </h2>
          </Reveal>

          <Reveal delay={100} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PERSONAS.map(p => (
              <div key={p.titre} className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <span className="text-3xl">{p.emo}</span>
                <h3 className="text-base font-bold text-gray-900 mt-3 mb-1.5">{p.titre}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.texte}</p>
                <span className="inline-block mt-3 text-xs font-bold text-violet-700 bg-violet-100 rounded-full px-3 py-1.5">{p.ex}</span>
              </div>
            ))}
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
              Tes questions, nos réponses.
            </h2>
          </Reveal>
          <MiniFAQ items={FAQS} />
        </div>
      </section>

      <FinalCTA
        title="Ton fichier peut se vendre ce soir, pendant que tu dors."
        subtitle="Crée ta boutique en 5 minutes, ajoute ton premier produit digital, partage ton lien. On s'occupe du reste."
        ctaLabel="Vendre mon premier fichier"
        reassurance={['Boutique gratuite à créer', 'Sans carte bancaire', 'Depuis ton téléphone']}
      />

      <WhatsAppButton />
      <SiteFooter />
    </div>
  )
}
