import Link from 'next/link'
import Image from 'next/image'
import { Geist } from 'next/font/google'
import { APP_URL } from '@/constants'
import { LandingFooter } from '@/components/landing-v6/LandingFooter'
import { LandingV6Init } from '@/components/landing-v6/LandingV6Init'
import { RealShopsShowcaseV7 } from '@/components/landing-v7/RealShopsShowcaseV7'
import { IC } from '@/components/landing-v6/icons'
import { PricingHome } from '@/components/landing-v7/PricingHome'
import { FAQHome } from '@/components/landing-v7/FAQHome'
import { MaisonAwaHome } from '@/components/landing-v7/MaisonAwaHome'
import { ClientJourney } from '@/components/landing-v7/ClientJourney'
import { HeroFloatingCards } from '@/components/landing-v7/HeroFloatingCards'
import { SceneBubbles } from '@/components/landing-v7/SceneBubbles'
import { VideoPoster } from '@/components/landing-v7/VideoPoster'
import { LandingV7Nav } from '@/components/landing-v7/LandingV7Nav'
import { AnimatedCounter } from '@/components/landing-v7/AnimatedCounter'
import { RevealV7Init } from '@/components/landing-v7/RevealV7Init'
import { SmoothAnchorsInit } from '@/components/landing-v7/SmoothAnchorsInit'
import { getPublicOrdersCount } from '@/lib/public-stats'
import '@/app/landing-v6.css'
// Bascule du 2026-10-15 : ce fichier était /preview/landing-v7/page.tsx,
// landing-v7.css n'a pas été déplacé (reste dans son dossier d'origine,
// /preview/landing-v7/page.tsx devient un simple redirect vers /) — import
// corrigé en conséquence (était relatif './landing-v7.css', invalide
// depuis ce nouvel emplacement).
import '@/app/preview/landing-v7/landing-v7.css'

// Lot 1 finalisé — Geist retenu pour TOUT le texte de cette route (plus de
// Bricolage Grotesque, plus d'Inter), en remplaçant --display et --body
// (définies par landing-v6.css, partagé, jamais modifié) au niveau de la
// racine .lv6 de cette page uniquement — voir le style inline sur le <div
// className="lv6"> plus bas. Tous les poids réellement utilisés dans ce
// fichier/landing-v7.css/les composants landing-v7 sont chargés (400 corps
// de texte, 500/600 emphases, 700/800 titres) : en charger moins aurait
// forcé un poids unique sur tout le texte (c'est ce qui avait rendu le
// sous-titre gras par erreur au tour précédent).
const geist = Geist({ weight: ['400', '500', '600', '700', '800'], subsets: ['latin'], display: 'swap' })

// Les 7 moyens de paiement réels (un badge par id unique de PaymentMethod
// dans src/lib/payment-methods.ts, pas par pays — un même id peut
// apparaître dans plusieurs pays avec un libellé différent, ex.
// moov_money = "Moov Money" en CI/BK/BJ mais "Flooz" au Togo ; on choisit
// le libellé le plus répandu). Logos = fichiers réels de
// public/logo-payments/ (jamais modifiés, jamais copiés — next/image les
// redimensionne/optimise à l'affichage sans toucher au fichier source).
// maxit : seul logo mobile au format .webp, label "MaxIt" (PAYMENT_
// METHODS_BY_COUNTRY.SN). togocell : label "T-Money", icône tmoney.png
// (PAYMENT_METHODS_BY_COUNTRY.TG — togocell.jpg existe aussi dans le
// dossier mais n'est référencé nulle part dans payment-methods.ts,
// jamais utilisé ici). Carte bancaire et "à la livraison" restent hors
// de ce compte de 7 (cohérent avec le chiffre "7 moyens de paiement"
// affiché plus bas dans la page, qui ne les comptait déjà pas avant).
const PAYMENT_LOGOS: { name: string; src: string; w: number; h: number }[] = [
  { name: 'Wave', src: '/logo-payments/wave_1.svg', w: 20, h: 20 },
  { name: 'Orange Money', src: '/logo-payments/om_1.svg', w: 20, h: 20 },
  { name: 'MaxIt', src: '/logo-payments/maxit.webp', w: 20, h: 20 },
  { name: 'MTN Money', src: '/logo-payments/mtn_1.svg', w: 20, h: 20 },
  { name: 'Moov Money', src: '/logo-payments/moov_1.svg', w: 20, h: 20 },
  { name: 'Mobicash', src: '/logo-payments/mobicash.png', w: 20, h: 20 },
  { name: 'T-Money', src: '/logo-payments/tmoney.png', w: 20, h: 20 },
]

function PaymentBadge({ duplicate }: { duplicate?: boolean }) {
  return (
    <div className="pay-marquee-set--v7" aria-hidden={duplicate || undefined}>
      {PAYMENT_LOGOS.map(p => (
        <span key={p.name} className="pay--v7">
          <Image src={p.src} alt={p.name} width={p.w} height={p.h} style={{ width: p.w, height: p.h, objectFit: 'contain' }} />
          {p.name}
        </span>
      ))}
      <span className="pay--v7">
        <Image src="/logo-payments/visa.svg" alt="" aria-hidden width={24} height={16} style={{ width: 24, height: 16, objectFit: 'contain' }} />
        <Image src="/logo-payments/Mastercard-Logo.wine.svg" alt="" aria-hidden width={20} height={16} style={{ width: 20, height: 16, objectFit: 'contain' }} />
        Carte bancaire
      </span>
      <span className="pay--v7">{IC.truck} À la livraison</span>
    </div>
  )
}

// Défilement infini CSS pur, même technique que RealShopsShowcaseV7
// (liste dupliquée aria-hidden, pause au survol/focus, désactivée sous
// prefers-reduced-motion, pleine largeur hors du conteneur centré).
function PaymentBadgesV7() {
  return (
    <div className="pay-marquee-fullbleed-wrap--v7">
      <div className="pay-marquee-track--v7">
        <PaymentBadge />
        <PaymentBadge duplicate />
      </div>
    </div>
  )
}

// title.absolute (2026-10-15) : le layout racine applique un template
// `%s — TekkiShop` à tout title défini comme simple chaîne (confirmé par
// rendu réel, Playwright : un title en chaîne devient bien suffixé). Avec
// `absolute`, le titre affiché reste exactement les 56 caractères voulus,
// sans quoi le titre réel ferait 68 caractères (vérifié avec un compteur).
// og-tekkishop-2026.jpg (1200x630, 145 Ko, JPEG, confirmé ffprobe/file)
// remplace og-ministore.png ici et dans le layout racine. robots
// index/follow (retrait du noindex) : bascule du 2026-10-15, cette page
// est désormais `/`.
const LANDING_V7_DESCRIPTION = "Tu vends déjà sur WhatsApp, Instagram ou TikTok ? Passe au niveau supérieur : crée ta boutique en ligne et laisse tes clients commander sans t'écrire."

export const metadata = {
  title: { absolute: 'Crée ta boutique en ligne et vends autrement, en Afrique' },
  description: LANDING_V7_DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: APP_URL },
  openGraph: {
    title: 'TEKKIShop : crée ta boutique en ligne et vends autrement, en Afrique',
    description: LANDING_V7_DESCRIPTION,
    url: APP_URL,
    siteName: 'TEKKIShop',
    images: [{ url: '/og-tekkishop-2026.jpg', width: 1200, height: 630, alt: 'TEKKIShop : crée ta boutique en ligne et vends autrement, en Afrique', type: 'image/jpeg' }],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TEKKIShop : crée ta boutique en ligne et vends autrement, en Afrique',
    description: LANDING_V7_DESCRIPTION,
    images: ['/og-tekkishop-2026.jpg'],
  },
}

// Liste validée le 2026-10-21 après relecture sur /preview/landing-v7-
// boutiques (page de prévisualisation conservée, non indexée, non
// commitée — ne pas supprimer). Marchands tiers d'abord, boutiques du
// fondateur (viensonsconnait, ibuka — jamais présentées comme des
// témoignages ou des clientes) en fin de liste. Pour retirer une
// boutique (ex. propriétaire qui refuse) : supprimer sa seule ligne
// ci-dessous, aucun autre fichier à toucher — RealShopsShowcaseV7 retombe
// automatiquement sur la grille simple si moins de 6 lignes restent.
const SHOWCASE_SHOP_IDS = [
  'e98a25ce-8258-41f6-93c6-6fae9656d303', // abi-co
  'd0effa08-c3d5-42c2-95c3-7555c987f897', // utiles-pepites
  'af5ca60f-f48e-42e1-adb0-cb6fb2363da6', // veliashop
  '6cf8da9f-ad1d-4de4-8fc5-d7fe937e8309', // dp-confection
  'a95c1d79-68e6-46d1-8de1-2bf0dbc68bc9', // backy-business
  '92d7fcbd-3d7e-4b50-9cf8-73c75e1385fe', // mkstore (TULstore)
  '8567556d-6e80-4482-89a7-599b02be87ae', // jewado
  '62c09103-06c0-4a71-9b71-7be693d8e737', // diana-s-concept
  '12d6a93e-cf8a-41b5-aad0-4256a11725e7', // viensonsconnait — boutique du fondateur
  '4df9c0db-d1fe-4703-970a-b4b81a8a1c3a', // ibuka — boutique du fondateur
]

// Badge du Hero (écart n°2), réutilisée aussi dans la barre de stats —
// une seule constante depuis le 2026-10-12 (ORDERS_PLACED_COUNT, qui
// portait une définition légèrement différente — commandes non annulées
// hors pending >7j, mesurée le 2026-10-01 à 258 — a été retirée, les deux
// usages affichant désormais la même mesure). Remplacée le 2026-10-19 par
// getPublicOrdersCount() (src/lib/public-stats.ts) — même définition de
// statuts, calculée en direct à chaque revalidation (revalidate=3600 sur
// cette page) plutôt que figée à la main. null si la requête échoue :
// chaque emplacement se masque alors entièrement, jamais de repli chiffré.

export const revalidate = 3600

export default async function LandingPreviewV7() {
  const ordersCount = await getPublicOrdersCount()
  return (
    <div
      className={`lv6 ${geist.className}`}
      id="top"
      // Le script inline juste en dessous modifie classList APRÈS le rendu
      // serveur, avant l'hydratation React — un vrai avertissement
      // d'hydratation a été constaté en dev (confirmé le 2026-10-11,
      // console réelle : "A tree hydrated but some attributes..."),
      // silencieux en prod mais sans conséquence fonctionnelle (js-ready
      // survit à l'hydratation dans les deux cas, vérifié). Fix standard
      // React pour ce patron (identique à next-themes et autres scripts
      // anti-FOUC) : suppressHydrationWarning sur ce seul nœud, pas sur
      // l'arbre entier.
      suppressHydrationWarning
      style={{
        ['--display' as string]: geist.style.fontFamily,
        ['--body' as string]: geist.style.fontFamily,
        // --mono (IBM Plex Mono par défaut) également remplacée par Geist
        // sur cette route : affecte tout texte jusqu'ici en monospace —
        // le bandeau "TES CLIENTS PAIENT...", les prix du mockup (.st-fav
        // span), mais aussi les horaires de la section 24h/24 (.tl-time),
        // les petites étiquettes "label" et autres usages de var(--mono)
        // dans landing-v6.css. Signalé explicitement : "Geist partout"
        // appliqué à la lettre, pas seulement aux deux exemples cités.
        ['--mono' as string]: geist.style.fontFamily,
      }}
    >
      {/* .js-ready ne sert plus qu'au bouton de lecture vidéo personnalisé
          (.video-play-btn, landing-v7.css) — le reveal au scroll ne dépend
          plus de cette classe du tout depuis le 2026-10-13 (voir
          RevealV7Init.tsx et landing-v7.css : .reveal--v7 est toujours
          visible par défaut, seul JS peut ajouter .reveal-pending aux
          éléments sous la ligne de flottaison, jamais l'inverse). Plus
          besoin de filet de sécurité à 3s ici : si JS ne tourne jamais,
          .video-play-btn reste simplement masqué pour toujours — dégradé
          acceptable puisque les contrôles natifs <video controls> du
          lecteur restent fonctionnels sans lui. */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('top').classList.add('js-ready');
      ` }} />

      {/* ── Fond ciel : englobe le header ET le hero, pour que le dégradé
          démarre tout en haut de la page (derrière le header flottant),
          pas seulement à partir du hero. Pourcentages du dégradé relatifs
          à CETTE hauteur (header + hero), pas à la page entière — sinon
          "milieu du hero" tomberait bien plus bas que prévu. ── */}
      <div className="hero-sky-wrap">
        <LandingV7Nav />

        {/* ── Hero — Lot 1 finalisé (header/hero/boutons pilule/dégradé) ──── */}
        <section className="hero hero--v7">
        <div className="container hero-grid">
          <div className="hero-copy">
            {/* Badge masqué entièrement si le comptage échoue (ordersCount
                null) — jamais de repli chiffré. Deux variantes, une seule
                visible à la fois (display:none, donc exclue de l'arbre
                d'accessibilité automatiquement — pas de double lecture par
                un lecteur d'écran). */}
            {ordersCount !== null && (
            <div className="hero-badge-v7">
              <span className="hero-badge-v7-icon">{IC.shoppingBag}</span>
              <span className="hero-badge-v7-text hero-badge-v7-text--full">
                +<AnimatedCounter target={ordersCount} /> commandes passées sur des boutiques TEKKIShop
              </span>
              <span className="hero-badge-v7-text hero-badge-v7-text--short">
                +<AnimatedCounter target={ordersCount} /> commandes passées
              </span>
            </div>
            )}
            <h1 className="hero-v7-h1">
              <span className="hero-v7-line">Ton business grandit.</span>
              <span className="hero-v7-line grad">Ta façon de vendre</span>
              <span className="hero-v7-line">devrait suivre.</span>
            </h1>
            <p className="hero-v7-sub">
              Crée ta boutique en ligne en 5 minutes et vends tes produits physiques ou digitaux sans avoir à répondre à 10 messages.
            </p>
            <div className="hero-ctas" style={{ marginTop: 28 }}>
              <Link href="/start" className="btn btn-primary">
                Créer ma boutique gratuitement {IC.arrowRight}
              </Link>
              <a href="#comment" className="btn btn-secondary">Voir comment ça marche</a>
            </div>
            <div className="objections">
              <span>{IC.check} Pas besoin de développeur</span>
              <span>{IC.check} 14 jours d&rsquo;essai gratuits</span>
              <span>{IC.check} 3 commandes offertes</span>
            </div>
          </div>

          <div className="hero-stage">
            {/* Accueil Maison Awa (nouveau design, point 2 du chantier
                mockups) — remplace MaisonAwaMockup DANS LE HERO
                uniquement ; MaisonAwaMockup reste utilisé telle quelle
                plus bas (section "Côté client", pas encore ce lot). */}
            <MaisonAwaHome />
            {/* Écart n°4 : cycle de 3 cartes flottantes en boucle, données
                d'exemple liées à la boutique fictive Maison Awa. */}
            <HeroFloatingCards />
          </div>
        </div>
        </section>
      </div>

      {/* ── Bandeau paiements — logos (Wave, Orange Money, Moov Money,
          Airtel, Visa/Mastercard), optimisés SVGO, copies propres à cette
          route (public/logo-payments-v7/, jamais public/logo-payments/
          utilisé en production). MTN MoMo retiré : ses propres directives
          de marque interdisent cet usage hors étape de paiement. ───────── */}
      <div className="strip strip--v7">
        <div className="strip-label">Tes clients paient comme ils veulent :</div>
        <PaymentBadgesV7 />
      </div>

      {/* ── Titre choc — Bricolage Grotesque retenu (comparaison Anton
          retirée sur demande explicite, sauf si la police du header/hero
          en cours d'arbitrage (Lot 1) change ce choix). ─────────────────── */}
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="statement-option">
            <h2 className="statement">
              <span><span className="whatsapp-word--v7">WhatsApp</span> t&rsquo;a aidé à démarrer.</span>
              <span className="grad">Il ne peut pas t&rsquo;aider à grandir.</span>
            </h2>
          </div>
        </div>
      </section>

      {/* ── Problème ──────────────────────────────────────────────────── */}
      <section className="section" id="probleme" tabIndex={-1}>
        {/* Image recadrée en paysage (5/4), hauteur contenue sur la hauteur
            du texte (direction A retenue le 2026-10-10, la direction B
            empilée n'est pas conservée). Pas de petit titre "LE VRAI
            PROBLÈME" (retiré comme demandé) : le texte seul, sans .label. */}
        <div className="container problem-grid">
          <div className="reveal--v7 problem-blocks--v7">
            <div className="problem-block--v7">
              <strong>Une seule vente te demande beaucoup de messages.</strong>
              <p>Tu renvoies les mêmes photos, tu répètes les prix, tu vérifies le stock, tu notes l&rsquo;adresse, tu confirmes le paiement, tu appelles le livreur…</p>
            </div>
            <div className="problem-block--v7">
              <strong>Difficile de répondre à tous les messages</strong>
              <p>Les messages s&rsquo;accumulent, les clients attendent, et ceux qui attendent trop achètent ailleurs.</p>
            </div>
            <div className="problem-block--v7">
              <strong>Recruter quelqu&rsquo;un pour répondre, c&rsquo;est un coût en plus.</strong>
              <p>Cette personne ne pourra jamais être disponible 24h/24, alors que tes clients t&rsquo;écrivent à toute heure.</p>
            </div>
            <p className="problem-conclusion--v7"><strong>La solution est de <span className="grad">changer ta façon de vendre</span>.</strong></p>
          </div>
          {/* Image vendeuse : recadrage confirmé le 2026-10-02 (laptop retiré).
              border/radius/overflow portés par scene--v7 (landing-v7.css),
              pas en style inline — cohérent avec le reste des overrides
              additifs de cette route (.pay--v7, .scene--v7-img, etc.). */}
          <div className="scene reveal--v7 scene--v7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/vendeuse-debordee.jpg"
              alt="Vendeuse débordée par les messages WhatsApp de ses clientes"
              className="scene--v7-img"
            />
            {/* Écart n°5 : bulles de messages flottantes */}
            <SceneBubbles />
          </div>
        </div>

        {/* Comparatif — décisions du 2026-10-11 : fond ciel continu (voir
            .compare-section--v7 dans landing-v7.css), cartes plus vivantes
            (grand rayon, ombre douce, fond translucide uni — 0
            backdrop-filter, le fond de section est une couleur plate, pas
            une photo). Mini-visuel "commandes" retiré le 2026-10-11 :
            les deux cartes ne contiennent plus que leurs 5 points, en plus
            grand (voir .cmp--v7 ul li dans landing-v7.css), hauteur
            naturelle égale des deux côtés sans ce bloc en plus. */}
        <div className="compare-section--v7">
        {/* Taille et largeur alignées sur les autres titres de section
            (h2 par défaut + .container center, même structure que la
            section vidéo juste en dessous) — .transition-heading (plus
            petite, clamp 22-32px, non contenue en largeur) retirée de cet
            usage le 2026-10-11, elle ne sert plus nulle part sur cette
            route. */}
        <div className="container center" style={{ marginTop: 132 }}>
          <h2>Ce qui change <span className="grad">dans ta façon de vendre.</span></h2>
        </div>

        <div className="container">
          <div className="compare reveal--v7 compare--v7">
            <div className="cmp cmp-bad cmp--v7">
              <span className="cmp-tag">Vendre comme à tes débuts</span>
              <h3>Tes ventes dépendent de ta disponibilité</h3>
              <ul>
                <li><b>✕</b> Les photos de tes produits et leurs prix sont éparpillés dans tes statuts et tes discussions.</li>
                <li><b>✕</b> Tu répètes la même chose à chaque client.</li>
                <li><b>✕</b> Une commande se perd vite entre deux conversations.</li>
                <li><b>✕</b> Tu vérifies chaque paiement toi-même.</li>
                <li><b>✕</b> Plus tu as de clients, plus tu en fais attendre.</li>
              </ul>
            </div>
            <div className="cmp cmp-good cmp--v7">
              <span className="cmp-tag">Vendre avec une vraie boutique en ligne</span>
              <h3>Tes clients achètent sans t&rsquo;attendre</h3>
              <ul>
                <li><b>✓</b> Tous tes produits sont dans ta boutique en ligne, avec un seul lien à partager.</li>
                <li><b>✓</b> Le client voit le prix, la description, le stock et la livraison.</li>
                <li><b>✓</b> Les commandes arrivent au même endroit, bien rangées.</li>
                <li><b>✓</b> Le client paie par mobile money ou à la livraison, et tu es notifié.</li>
                <li><b>✓</b> Tes clients peuvent commander même quand tu n&rsquo;es pas en ligne.</li>
              </ul>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* ── Vidéo — emplacements prévus, aucun fichier intégré (lot C).
          Fond ambre très clair (voir .video-sec--v7, landing-v7.css) :
          casse la continuité blanche entre le comparatif et cette section,
          dégradé continu vers les sections voisines de part et d'autre —
          réutilise --amber, déjà la couleur d'accent du 24h/24 et du CTA
          final sur cette route, plutôt qu'une teinte nouvelle. ──────────── */}
      <section className="section video-sec--v7" id="comment" tabIndex={-1}>
        <div className="container center">
          <span className="label">Aussi simple que ça</span>
          <h2 style={{ textWrap: 'balance' }}>Ta boutique en moins de 5&nbsp;minutes, <span className="grad">depuis ton téléphone.</span></h2>
          <p className="lead">Pas besoin d&rsquo;ordinateur, ni de développeur. Tu gères tout depuis ton téléphone.</p>
          <VideoPoster />
          <div className="steps-line steps-line--v7" style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 34, flexWrap: 'wrap' }}>
            <span>① Ajoute tes produits</span>
            <span>② Mets ton lien en bio</span>
            <span>③ Reçois tes commandes</span>
          </div>
        </div>
      </section>

      {/* ── Côté client — TEMPS 1/2 (2026-10-23) : ClientJourney (5 écrans,
          navigation manuelle + lecture automatique). Titre et texte
          d'accompagnement RESTAURÉS le 2026-10-24 à la demande explicite
          de l'utilisateur — exactement le texte de HEAD au moment où ce
          lot a commencé (git show HEAD:src/app/preview/landing-v7/
          page.tsx, confirmé identique, pas réécrit de mémoire). Les deux
          tentatives intermédiaires ("Tes clients commandent seuls, toi tu
          es libre" puis "...depuis leur téléphone, sans que tu
          répondes.") sont abandonnées, pas gardées en commentaire cette
          fois (l'utilisateur n'a pas demandé à les conserver). ── */}
      <section className="section">
        <div className="container split">
          <div className="split-media reveal--v7">
            {/* width:100% en ligne (cette instance seulement, .db-wrap
                partagé non touché) : corrige une ambiguïté de taille CSS
                mesurée via Playwright — .phone a "width:100%" à cette
                largeur d'écran (landing-v6.css), mais .db-wrap/.split-media
                ne lui donnaient aucune largeur déterminée (grid/flex en
                "auto" shrink-to-fit), donc ce 100% retombait sur le
                min-content de .phone-notch (92px) au lieu de la largeur
                réelle disponible. Sans effet sur l'autre usage de
                .db-wrap (mockup tableau de bord, plus bas sur cette page,
                non touché par ce style en ligne). */}
            <div className="db-wrap" style={{ width: '100%' }}><ClientJourney /></div>
          </div>
          <div>
            <span className="label">Côté client</span>
            <h2>Plus besoin de <span className="grad">t&rsquo;écrire pour commander.</span></h2>
            <p className="lead" style={{ marginTop: 20 }}>Ton client ouvre ton lien et trouve tout : tes produits, tes prix, ce qu&rsquo;il reste en stock, tes délais de livraison. Il choisit, remplit son adresse et paie comme il veut.</p>
            <ul className="checks">
              <li>{IC.checkCircle}<div><b>Tout ce qu&rsquo;il veut savoir, avant même de demander</b><p>Prix, stock, délai de livraison si tu l&rsquo;as renseigné : fini les 10 photos envoyées une par une.</p></div></li>
              <li>{IC.checkCircle}<div><b>Il choisit, commande et paie sans avoir à t&rsquo;écrire</b><p>Wave, Orange Money ou à la livraison, selon ton pays et tes réglages.</p></div></li>
              <li>{IC.checkCircle}<div><b>Ton WhatsApp reste là</b><p>Ceux qui préfèrent te parler avant d&rsquo;acheter peuvent toujours le faire.</p></div></li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 24h/24 — étiquetée comme exemple illustratif ─────────────────── */}
      <section className="timeline-sec">
        <div className="container">
          <div className="section-head center reveal--v7">
            <span className="label label--dark">Pendant que tu vis ta vie</span>
            <h2>Tes ventes ne s&rsquo;arrêtent plus quand tu <span style={{ color: 'var(--amber)' }}>poses ton téléphone.</span></h2>
            <p className="lead">Une journée type, à titre d&rsquo;exemple illustratif d&rsquo;un vendeur TEKKIShop.</p>
          </div>
          <div className="tl-grid">
            <div className="tl reveal--v7">
              {[
                { time: '07:12', bold: 'Tu mets ton lien dans ton statut', text: 'Une seule adresse à partager, au lieu de dix photos envoyées une par une.' },
                { time: '09:40', bold: 'Déjà 4 commandes, toutes payées', text: 'Tes clients ont choisi, commandé et payé par Wave. Tu n’as répondu à aucun message.' },
                { time: '16:30', bold: 'Tu prépares les commandes du jour d’un coup', text: 'Tout est dans un seul écran, avec les adresses et les paiements.' },
                { time: '21:18', bold: 'Le livreur valide chaque livraison en 1 clic', text: 'Le statut de la commande se met à jour automatiquement.' },
                { time: '02:47', bold: 'Tu dors. Une cliente commande depuis Abidjan.', text: 'Elle paie par Orange Money et reçoit son reçu. Tu découvriras la commande au réveil.', night: true, badge: 'Ça, tu ne peux pas le faire toi-même' },
                { time: '08:00', bold: 'Tu retires ton argent', text: 'Ton argent arrive dans ta page Revenus, et tu le retires sur ton mobile money.' },
              ].map((row) => (
                <div key={row.time} className={`tl-row${row.night ? ' night' : ''}`}>
                  <div className="tl-time">{row.time}</div>
                  <div className="tl-body">
                    <b>{row.bold}</b>
                    <p>{row.text}</p>
                    {row.badge && <span className="tl-badge">{row.badge}</span>}
                  </div>
                </div>
              ))}
            </div>
            {/* "1 commande sur 3" — mesuré le 2026-09-30 : commandes passées
                sur des boutiques TEKKIShop (orders.status != 'cancelled'),
                jamais des commandes WhatsApp — entre 20h et 8h, heure UTC.
                Résultat exact ce jour-là : 34,4 % sur 355 commandes non
                annulées. Requête d'origine non retrouvée dans ce fichier
                (aucun commentaire ne la documentait à l'époque, contrairement
                à getPublicOrdersCount ci-dessus) — à remesurer avant mise
                à jour ou mise en ligne réelle. */}
            <aside className="tl-aside reveal--v7">
              <div className="tl-card">
                <div className="tl-stat">1 commande sur 3</div>
                <p>est passée entre 20h et 8h. Ta boutique en ligne prend ces commandes, même quand tu ne peux pas répondre.</p>
                <hr />
                <div className="tl-mini"><i>{IC.moon}</i> Ta boutique reste ouverte la nuit</div>
                <div className="tl-mini"><i>{IC.globe}</i> Tes clients commandent même quand tu dors</div>
                <div className="tl-mini"><i>{IC.bolt}</i> Les paiements mobile money arrivent sans toi</div>
                <div className="tl-mini"><i>{IC.inbox}</i> La commande t&rsquo;attend au réveil</div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── Tableau de bord — données Maison Awa, pas d'animation ────────── */}
      <section className="section">
        <div className="container split split--activity-v7">
          <div className="split-media reveal--v7">
            {/* width:100% en ligne (2026-10-15) — même bug que l'autre usage
                de .db-wrap plus haut sur cette page (ligne ~420, déjà
                corrigé) : mesuré via Playwright, ce mockup restait à 259px
                de large pour 624px de haut (cadre visiblement écrasé) au
                lieu des 300px de large des deux autres mockups téléphone
                (Hero, Côté client) à la même largeur d'écran — même cause,
                .db-wrap/.split-media en grid/flex "auto" ne donnaient
                aucune largeur déterminée à .phone (width:100% retombant sur
                le min-content de .phone-notch, 92px, avant d'être repris
                par d'autres contraintes). */}
            <div className="db-wrap" style={{ width: '100%' }}>
              <div className="phone">
                <div className="phone-notch" />
                <div className="phone-screen">
                  <div className="db-screen">
                    <div className="db-body">
                      <div className="db-date">Lundi 3 Août</div>
                      <div className="db-hello">Bonsoir, Maison Awa</div>
                      {/* Carte de ventes + onglets Aujourd'hui/Semaine/Mois
                          — reprend RevenueCard.tsx (src/components/
                          dashboard/RevenueCard.tsx:11-15,61-75), réellement
                          présente sur l'accueil (page.tsx:322). "Aujourd'hui"
                          seul actif ici, statique (pas d'interaction dans ce
                          mockup). */}
                      <div className="db-sales db-sales-v7">
                        <div className="db-sales-head">Ventes — Auj. · 11 ventes<i>{IC.dollarSign}</i></div>
                        <div className="db-amount">154 000 <small>F</small></div>
                        <div className="db-sales-tabs">
                          <span className="db-sales-tab on">Aujourd&rsquo;hui</span>
                          <span className="db-sales-tab">Semaine</span>
                          <span className="db-sales-tab">Mois</span>
                        </div>
                      </div>
                      <div className="db-two">
                        <div className="db-mini"><small>Produits</small><b>24</b><span>actifs</span><i>{IC.box}</i></div>
                        <div className="db-mini"><small>En attente</small><b>1</b><span>commande</span><i>{IC.shoppingCart}</i></div>
                      </div>
                      {/* "Commandes en cours" — aligné sur la vraie ligne de
                          commande de l'accueil (src/app/dashboard/
                          (protected)/page.tsx:407-441, relu le 2026-10-12) :
                          pastille de statut (mêmes couleurs : amber=pending,
                          bleu=confirmed/preparing, vert=ready), nom + référence
                          courte, produits, montant, puis un badge de statut
                          réel (ORDER_STATUS_LABELS) OU "Xh en attente" si
                          pending depuis ≥1h — jamais les deux. Mode de
                          paiement retiré (absent de la vraie ligne, rejeté
                          le 2026-10-12). Catalogue aligné sur la vraie
                          boutique tekki.shop/maison-awa (captures du
                          2026-10-12) : Pagne WAX Hollantex 14 000 FCFA,
                          Robe Adjoa à partir de 45 000 FCFA — montants =
                          quantité × prix réel. Prénoms fictifs, aucun vrai
                          client, aucune référence réelle. */}
                      <div className="db-orders-head">Commandes en cours</div>
                      <div className="db-order-row">
                        <span className="db-order-dot" style={{ background: 'var(--db-amber,#B4740E)' }} />
                        <div className="db-order-info"><b>Aïcha K. <i>#4F2A91</i></b><small>Pagne WAX Hollantex ×2</small></div>
                        <div className="db-order-right"><b>28 000 F</b><span className="db-order-urgent">2h en attente</span></div>
                      </div>
                      <div className="db-order-row">
                        <span className="db-order-dot" style={{ background: 'var(--db-primary,#155EEF)' }} />
                        <div className="db-order-info"><b>Moussa D. <i>#7C118E</i></b><small>Robe Adjoa</small></div>
                        <div className="db-order-right"><b>45 000 F</b><span className="db-order-badge db-order-badge--confirmed">Confirmée</span></div>
                      </div>
                      <div className="db-order-row">
                        <span className="db-order-dot" style={{ background: 'var(--db-primary,#155EEF)' }} />
                        <div className="db-order-info"><b>Fatou S. <i>#A93D06</i></b><small>Pagne WAX Hollantex</small></div>
                        <div className="db-order-right"><b>14 000 F</b><span className="db-order-badge db-order-badge--preparing">En préparation</span></div>
                      </div>
                    </div>
                    <div className="db-nav">
                      <div className="on"><i>{IC.home}</i>Accueil</div>
                      <div><i>{IC.shoppingCart}</i>Commandes</div>
                      <div className="db-ia db-ia-v7"><i>{IC.sparkle}</i></div>
                      <div><i>{IC.box}</i>Produits</div>
                      <div><i>{IC.gear}</i>Paramètres</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <span className="label">Ton activité dans ta poche</span>
            <h2>Gère 100 commandes <span className="grad">comme tu en gérais 10.</span></h2>
            <p className="lead" style={{ marginTop: 20 }}>Tes ventes, tes commandes, tes clients, tes revenus : tout est dans une seule appli, sur le téléphone que tu as déjà dans la main.</p>
            {/* 4 cartes — écrites et vérifiées le 2026-10-16 (push/e-mail,
                Assistant IA disponible sur tous les plans avec plafond par
                plan, enregistrement client systématique via
                upsert_client_from_order — voir tours précédents). Jamais
                "SMS" (canal réel mais jamais nommé ainsi dans la copie),
                jamais "tu es toujours notifié" (dépend de l'e-mail/push
                configurés par le marchand, pas automatique). */}
            <div className="cards-3 activity-cards--v7 reveal--v7">
              <article className="card activity-card--v7">
                <span className="activity-card-num--v7">01</span>
                <div className="card-ico">{IC.dollarSign}</div>
                <h3>Tes ventes du jour</h3>
                {/* 2e phrase vérifiée (2026-10-17) : RevenueCard.tsx (dashboard
                    réel) ne pousse rien en direct — les chiffres viennent de
                    props serveur recalculées à chaque chargement de page,
                    jamais d'un polling/websocket pendant que l'écran reste
                    ouvert. "Actualisés à chaque fois que tu ouvres ton
                    tableau de bord" est vrai ; "mis à jour à chaque
                    commande" ne l'est pas, retiré. */}
                <p>Aujourd&rsquo;hui, la semaine, le mois : tu sais toujours où tu en es. Ton chiffre d&rsquo;affaires et tes ventes, actualisés à chaque fois que tu ouvres ton tableau de bord.</p>
              </article>
              <article className="card activity-card--v7">
                <span className="activity-card-num--v7">02</span>
                <div className="card-ico">{IC.bell}</div>
                <h3>Une notification à chaque commande</h3>
                <p>Active les notifications et renseigne ton e-mail : tu es alerté dès qu&rsquo;un client commande, et tu ne rates plus une vente.</p>
              </article>
              <article className="card activity-card--v7">
                <span className="activity-card-num--v7">03</span>
                <div className="card-ico">{IC.shoppingCart}</div>
                <h3>Tes commandes en cours</h3>
                <p>Qui a commandé, quel produit, et si c&rsquo;est payé ou à la livraison. Chaque acheteur est enregistré.</p>
              </article>
              <article className="card activity-card--v7">
                <span className="activity-card-num--v7">04</span>
                <div className="card-ico">{IC.sparkle}</div>
                <h3>Ton Assistant IA</h3>
                <p>Il t&rsquo;explique ce que tu ne comprends pas et te guide pas à pas.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ── Physique ou digital ──────────────────────────────────────────── */}
      <section className="section digital-section--v7">
        <div className="container center">
          <span className="label">Physique ou digital</span>
          <h2>Vends des produits <span className="grad">physiques ou digitaux.</span></h2>
          {/* gridTemplateColumns inline retiré (2026-10-15) : il écrasait la
              règle responsive partagée .cards-3 (landing-v6.css, repasse à 1
              colonne sous 760px) par spécificité, cassant déjà le mobile
              avant ce lot (repéré sur capture). Le 2-colonnes/1-colonne
              nécessaire pour 2 cartes exactement est maintenant géré par
              .digital-section--v7 .cards-3, scopé à cette section dans
              landing-v7.css, jamais par un style inline ni par le défaut
              partagé à 3 colonnes (pensé pour 3 cartes ailleurs). */}
          <div className="cards-3 reveal--v7" style={{ maxWidth: 760, margin: '40px auto 0' }}>
            <article className="card">
              {/* Illustration SVG en code (2026-10-16) — sac à main générique,
                  teintes orange clair de la carte (déjà utilisées ici avant),
                  aucun logo, aucune marque, aucun produit réel reconnaissable. */}
              <svg className="card-illustration--v7" viewBox="0 0 120 100" width="96" height="80" fill="none" aria-hidden="true">
                <path d="M40 40 Q40 18 60 18 Q80 18 80 40" stroke="#e4572e" strokeWidth="5" strokeLinecap="round" />
                <rect x="26" y="40" width="68" height="50" rx="11" fill="#ffeee3" />
                <rect x="26" y="40" width="68" height="50" rx="11" stroke="#e4572e" strokeWidth="2.5" />
                <circle cx="60" cy="58" r="5.5" fill="#e4572e" opacity=".3" />
                <rect x="44" y="70" width="32" height="5.5" rx="2.75" fill="#e4572e" opacity=".22" />
              </svg>
              <h3>Produits à livrer</h3>
              <p>Mode, beauté, alimentation, décoration, accessoires, électronique.</p>
              <p className="card-detail--v7">Ton client commande et paie, tu reçois la commande complète, tu livres.</p>
            </article>
            <article className="card card--featured-v7">
              <span className="card-badge--v7">Zéro livraison</span>
              {/* Couverture d'ebook générique, teintes bleu clair déjà
                  utilisées ici — coin corné + blocs abstraits (jamais du
                  texte lisible), aucun titre, aucune marque. */}
              <svg className="card-illustration--v7" viewBox="0 0 120 100" width="96" height="80" fill="none" aria-hidden="true">
                <rect x="28" y="10" width="64" height="80" rx="6" fill="#e9ecff" />
                <rect x="28" y="10" width="64" height="80" rx="6" stroke="#4039c9" strokeWidth="2.5" />
                <path d="M92 76 L92 90 L78 90 Z" fill="#c7cdfb" />
                <rect x="40" y="28" width="40" height="5" rx="2.5" fill="#4039c9" opacity=".3" />
                <rect x="40" y="40" width="40" height="5" rx="2.5" fill="#4039c9" opacity=".3" />
                <rect x="40" y="52" width="24" height="5" rx="2.5" fill="#4039c9" opacity=".3" />
                <circle cx="60" cy="70" r="10" fill="#4039c9" opacity=".12" />
                <path d="M55 70 l4 4 l8 -9" stroke="#4039c9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3>Produits digitaux</h3>
              <p>Ebooks, formations, guides, modèles.</p>
              {/* "Tu n'as rien à envoyer" : vrai sans promettre un délai —
                  le client reçoit son fichier via la page de confirmation
                  (sondage automatique, token lié à sa commande, pas besoin
                  d'e-mail) et par e-mail s'il en a donné un à la commande.
                  Vérifié dans webhooks/bictorys/route.ts et webhooks/stripe/
                  route.ts : les deux créent le download_token puis l'e-mail
                  seulement après confirmation réelle du paiement — jamais
                  "immédiatement" ni "même à 3h du matin" affirmé ici, aucun
                  délai n'est garanti par le code. */}
              <p className="card-detail--v7">Ton client paie et télécharge son fichier. Tu n&rsquo;as rien à envoyer.</p>
              <Link href="/produits-digitaux" className="btn btn-secondary" style={{ marginTop: 14 }}>En savoir plus</Link>
            </article>
          </div>
        </div>
      </section>

      {/* ── Preuve sociale — boutiques réelles, pas des "témoignages" ──────
          2026-10-17 : RealShopsShowcase (partagé avec `src/app/page.tsx` et
          CountryLandingV6.tsx) remplacé par RealShopsShowcaseV7, variante
          locale à ce fichier — le titre/lead est donc écrit ici directement
          plutôt que via les props eyebrow/headline du composant partagé,
          qui n'existent plus dans la variante locale. Aucun fichier partagé
          touché. */}
      <section className="section testi-sec">
        <div className="container">
          <div className="section-head center reveal--v7">
            <span className="label">Ils l&rsquo;ont fait avant toi</span>
            <h2>Aujourd&rsquo;hui, leur boutique <span className="grad">prend les commandes pour eux.</span></h2>
            <p className="lead">Des boutiques qui reçoivent des commandes pendant que leur propriétaire s&rsquo;occupe d&rsquo;autre chose.</p>
          </div>
          <RealShopsShowcaseV7 shopIds={SHOWCASE_SHOP_IDS} />
          {/* Ligne diaspora remise le 2026-10-17, libellé "couverts" (on peut
              y créer sa boutique, pas que des marchands y vendent déjà) —
              vérifié : les 5 pays (FR/BE/LU/CH/CA) sont bien dans
              EU_CA_PHONE_COUNTRIES (country-groups.ts:47-53), utilisé
              directement par /start via DIASPORA_QUIZ_COUNTRIES
              (app/start/data.ts:168), et isEuCaCountry (même fichier:20-21)
              route bien ces 5 vers EUR/CAD + Stripe (stripe/subscription/
              create/route.ts:58, plans.ts EU_CA_PRO_PLAN_EUR/CAD). 4ᵉ
              donnée : nombre de moyens de paiement réels, dédupliqués par
              id sur les 6 pays Bictorys (payment-methods.ts) — 7 au total
              (wave, maxit, orange_money, mtn_money, moov_money, mobicash,
              togocell). Paiement à la livraison volontairement exclu de ce
              chiffre (décision explicite du 2026-10-19 — c'est un
              payment_type de commande, pas une entrée de ce fichier).
              1ʳᵉ case masquée entièrement si getPublicOrdersCount() échoue
              (ordersCount null), jamais les 3 autres : elles ne dépendent
              pas du comptage. */}
          <div className="stats-bar reveal--v7" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', maxWidth: 820, margin: '40px auto 0' }}>
            {ordersCount !== null && <div className="stat"><b>+{ordersCount}</b><small>commandes passées</small></div>}
            <div className="stat"><b>6</b><small>pays d&rsquo;Afrique couverts</small></div>
            <div className="stat"><b>5</b><small>pays de la diaspora couverts</small></div>
            <div className="stat"><b>7</b><small>moyens de paiement</small></div>
          </div>
        </div>
      </section>

      <PricingHome />

      {/* ── Fondateur — citation seule (2026-10-20) ─────────────────────────
          Remplace l'ancienne carte sombre "IN" + paragraphe "TEKKIShop est
          né de..." par une citation centrée + photo ronde + nom. Classes
          neuves, scopées à cette page : .founder, .founder-card,
          .founder-ava (landing-v6.css:656-661) restent intactes, utilisées
          telles quelles par les pages pays (CountryLandingV6.tsx:576),
          jamais touchées ici. Étiquette de section conservée (reste
          cohérente : une citation du fondateur est justement "conçue à
          partir du terrain") — à retirer si tu préfères, dis-le. */}
      <section className="section founder-quote-sec--v7">
        <div className="container center founder-quote-section--v7 reveal--v7">
          <span className="label">Conçu à partir du terrain</span>
          <p className="founder-quote--v7">« Vendre en ligne depuis l&rsquo;Afrique ne devrait pas être une galère. Notre mission&nbsp;: simplifier la vente pour les marchands, et l&rsquo;achat pour les clients. »</p>
          <div className="founder-quote-attribution--v7">
            <Image
              src="/avatars/ibuka.jpg"
              alt="Ibuka Ndjoli"
              width={88}
              height={88}
              className="founder-quote-photo--v7"
            />
            <p>
              Ibuka Ndjoli&nbsp;&#8211; Fondateur de TEKKIShop
              <br />
              <span className="founder-quote-sub--v7">11&nbsp;ans d&rsquo;expérience en e&#8209;commerce</span>
            </p>
          </div>
        </div>
      </section>

      <FAQHome />

      {/* ── CTA final ─────────────────────────────────────────────────────── */}
      <section className="cta-sec">
        <div className="container">
          <div className="cta-card reveal--v7">
            <h2>Ta prochaine vidéo virale mérite une boutique <span style={{ color: 'var(--amber)' }}>prête à encaisser.</span></h2>
            <p>Crée ta boutique en 5 minutes, ajoute tes produits, partage ton lien, et laisse tes clients commander à toute heure.</p>
            <div className="cta-actions">
              <Link href="/start" className="btn btn-light">Créer ma boutique gratuitement</Link>
            </div>
            <p className="cta-micro">14 jours gratuits · Tes 3 premières commandes offertes</p>
          </div>
        </div>
      </section>

      <LandingFooter />
      <LandingV6Init />
      <RevealV7Init />
      <SmoothAnchorsInit />
    </div>
  )
}
