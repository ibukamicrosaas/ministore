import Link from 'next/link'
import Image from 'next/image'
import { Geist } from 'next/font/google'
import { LandingFooter } from '@/components/landing-v6/LandingFooter'
import { LandingV6Init } from '@/components/landing-v6/LandingV6Init'
import { RealShopsShowcase } from '@/components/landing-v6/RealShopsShowcase'
import { IC } from '@/components/landing-v6/icons'
import { PricingHome } from '@/components/landing-v7/PricingHome'
import { FAQHome } from '@/components/landing-v7/FAQHome'
import { MaisonAwaMockup } from '@/components/landing-v7/MaisonAwaMockup'
import { HeroFloatingCards } from '@/components/landing-v7/HeroFloatingCards'
import { SceneBubbles } from '@/components/landing-v7/SceneBubbles'
import { VideoPoster } from '@/components/landing-v7/VideoPoster'
import { LandingV7Nav } from '@/components/landing-v7/LandingV7Nav'
import { AnimatedCounter } from '@/components/landing-v7/AnimatedCounter'
import '@/app/landing-v6.css'
import './landing-v7.css'

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

// Logos optimisés via SVGO, copiés dans public/logo-payments-v7/ — jamais
// les fichiers de public/logo-payments/ (utilisés tels quels en production
// sur `/`, jamais écrasés). Rendu vérifié identique à l'original (voir
// réponse écrite : pixel-diff + capture comparative avant/après).
// Carte bancaire : pas de logo dédié "carte bancaire" générique — Visa et
// Mastercard affichés ensemble sous ce même badge, comme déjà fait sur `/`.
// Airtel retiré le 2026-10-09 : ne correspond à aucun moyen de paiement
// client réel (absent de PAYMENT_METHODS_BY_COUNTRY) — ajouté par erreur
// au tour précédent, sur la seule base du fichier logo déjà présent dans
// le dépôt, jamais vérifié comme moyen réellement proposé.
const PAYMENT_LOGOS: { name: string; src: string }[] = [
  { name: 'Wave', src: '/logo-payments-v7/wave_1.svg' },
  { name: 'Orange Money', src: '/logo-payments-v7/om_1.svg' },
  { name: 'Moov Money', src: '/logo-payments-v7/moov_1.svg' },
]

function PaymentBadgesV7() {
  return (
    // Défilement horizontal réservé au mobile (voir media query dans
    // landing-v7.css) : desktop inchangé, .pay-row reste centrée sur une
    // seule ligne comme avant. Le wrapper ne sert qu'à poser les fondus de
    // bord gauche/droit (::before/::after), qui ont besoin d'un conteneur
    // positionné distinct de .pay-row elle-même (qui, elle, défile).
    <div className="pay-row-wrap--v7">
      <div className="pay-row">
        {PAYMENT_LOGOS.map(p => (
          <span key={p.name} className="pay--v7">
            <Image src={p.src} alt={p.name} width={20} height={20} style={{ width: 20, height: 20, objectFit: 'contain' }} />
            {p.name}
          </span>
        ))}
        <span className="pay--v7">
          <Image src="/logo-payments-v7/visa.svg" alt="" aria-hidden width={24} height={16} style={{ width: 24, height: 16, objectFit: 'contain' }} />
          <Image src="/logo-payments-v7/Mastercard-Logo.wine.svg" alt="" aria-hidden width={20} height={16} style={{ width: 20, height: 16, objectFit: 'contain' }} />
          Carte bancaire
        </span>
        <span className="pay--v7">{IC.truck} À la livraison</span>
      </div>
    </div>
  )
}

// Route de prévisualisation du lot A (refonte landing) — n'affecte jamais
// `/`. Ne jamais lier publiquement tant que les éléments manquants (vidéos,
// image vendeuse recadrée) ne sont pas fournis.
export const metadata = {
  title: 'TEKKIShop — Prévisualisation Lot A (ne pas indexer)',
  robots: { index: false, follow: false },
}

// Boutiques vérifiées en base le 2026-10-02 : viensonsconnait et ibuka sont
// des exemples de boutiques TEKKIShop, jamais présentées comme des
// témoignages ou des clientes (ce sont des boutiques du fondateur).
// mkstore retirée : 0 commande sur les 30 derniers jours, donnerait une
// fausse impression d'activité.
const SHOWCASE_SHOP_IDS = [
  'e98a25ce-8258-41f6-93c6-6fae9656d303', // abi-co
  '12d6a93e-cf8a-41b5-aad0-4256a11725e7', // viensonsconnait — exemple de boutique TEKKIShop, pas un témoignage client
  '4df9c0db-d1fe-4703-970a-b4b81a8a1c3a', // ibuka — exemple de boutique TEKKIShop, pas un témoignage client
]

// Mesuré le 2026-10-01 : commandes non annulées (orders.status != 'cancelled'),
// hors commandes 'pending' vieilles de plus de 7 jours (jamais confirmées/payées).
// Résultat exact ce jour-là : 258. Arrondi prudent à la baisse. À remesurer
// avant mise à jour ou mise en ligne réelle.
const ORDERS_PLACED_COUNT = 250

// Badge du Hero (écart n°2), chiffre distinct de ORDERS_PLACED_COUNT
// ci-dessus (utilisé plus bas dans la barre de stats, non touché dans ce
// lot). Mesuré le 2026-10-08 : 276 commandes réelles (confirmed, preparing,
// ready, delivered, completed, aucune boutique exclue, décision du
// fondateur le 2026-10-09). Arrondi à la dizaine inférieure. Valeur fixe
// pour cette version — à remesurer avant
// toute mise en ligne réelle.
const HERO_BADGE_ORDERS_COUNT = 270

export default function LandingPreviewV7() {
  return (
    <div
      className={`lv6 ${geist.className}`}
      id="top"
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
            <div className="hero-badge-v7">
              <span className="hero-badge-v7-icon">{IC.shoppingBag}</span>
              {/* Deux variantes, une seule visible à la fois (display:none,
                  donc exclue de l'arbre d'accessibilité automatiquement —
                  pas de double lecture par un lecteur d'écran). Texte
                  raccourci en mobile pour tenir sur une ligne (point
                  2026-10-09) : le sens reste vrai (ce sont bien les
                  commandes de l'ensemble des boutiques TEKKIShop), seule la
                  précision "sur les boutiques TEKKIShop" est sous-entendue
                  par le contexte de la page plutôt qu'écrite. */}
              <span className="hero-badge-v7-text hero-badge-v7-text--full">
                +<AnimatedCounter target={HERO_BADGE_ORDERS_COUNT} /> commandes passées sur les boutiques TEKKIShop
              </span>
              <span className="hero-badge-v7-text hero-badge-v7-text--short">
                +<AnimatedCounter target={HERO_BADGE_ORDERS_COUNT} /> commandes passées
              </span>
            </div>
            <h1 className="hero-v7-h1">
              <span className="nowrap-lg">Ton business grandit.</span> <span className="grad">Ta façon de vendre</span> devrait suivre.
            </h1>
            <p className="hero-v7-sub">
              Crée ta boutique en ligne en 5 minutes et vends sans avoir à répondre à 10 messages.
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
            <MaisonAwaMockup />
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
              <span>WhatsApp t&rsquo;a aidé à démarrer.</span>
              <span className="grad">Il ne peut pas t&rsquo;aider à grandir.</span>
            </h2>
          </div>
        </div>
      </section>

      {/* ── Problème ──────────────────────────────────────────────────── */}
      <section className="section" id="probleme">
        {/* Image recadrée en paysage (5/4), hauteur contenue sur la hauteur
            du texte (direction A retenue le 2026-10-10, la direction B
            empilée n'est pas conservée). Pas de petit titre "LE VRAI
            PROBLÈME" (retiré comme demandé) : le texte seul, sans .label. */}
        <div className="container problem-grid">
          <div className="reveal">
            <p className="lead" style={{ marginTop: 0 }}>
              Renvoyer les mêmes photos, répéter les prix, vérifier le stock, noter l&rsquo;adresse, confirmer le paiement, appeler le livreur… <strong>Chaque vente te coûte une demi-heure de messages.</strong>
            </p>
            <p className="lead">
              Avec 10 clients par jour, ça passe. Avec 100, c&rsquo;est impossible : les messages s&rsquo;accumulent, les clients attendent, et ceux qui attendent trop achètent ailleurs.
            </p>
            <p className="lead">
              Recruter quelqu&rsquo;un pour répondre ? C&rsquo;est un salaire de plus, pour une personne qui ne sera jamais disponible 24h/24.
            </p>
          </div>
          {/* Image vendeuse : recadrage confirmé le 2026-10-02 (laptop retiré).
              border/radius/overflow portés par scene--v7 (landing-v7.css),
              pas en style inline — cohérent avec le reste des overrides
              additifs de cette route (.pay--v7, .scene--v7-img, etc.). */}
          <div className="scene reveal scene--v7">
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

        <h2 className="transition-heading" style={{ textAlign: 'center', marginTop: 56 }}>
          Mêmes produits, mêmes clients. <span className="grad">Une autre façon de vendre.</span>
        </h2>

        <div className="container">
          <div className="compare reveal">
            <div className="cmp cmp-bad">
              <span className="cmp-tag">Vendre comme à tes débuts</span>
              <h3>Tes ventes dépendent de ta disponibilité</h3>
              <ul>
                <li><b>✕</b> Tes photos et tes prix sont éparpillés dans les statuts et les discussions.</li>
                <li><b>✕</b> Tu répètes la même chose à chaque client.</li>
                <li><b>✕</b> Une commande se perd vite entre deux conversations.</li>
                <li><b>✕</b> Tu vérifies chaque paiement toi-même.</li>
                <li><b>✕</b> Plus tu as de clients, plus tu en fais attendre.</li>
              </ul>
            </div>
            <div className="cmp cmp-good">
              <span className="cmp-tag">Vendre au niveau de ton business</span>
              <h3>Tes clients achètent sans t&rsquo;attendre</h3>
              <ul>
                <li><b>✓</b> Tous tes produits sont dans un seul lien.</li>
                <li><b>✓</b> Le client voit le prix, la description, le stock et la livraison.</li>
                <li><b>✓</b> Les commandes arrivent au même endroit, bien rangées.</li>
                <li><b>✓</b> Le client paie par mobile money, par carte ou à la livraison, et tu es notifié.</li>
                <li><b>✓</b> Que tu aies 10 ou 100 clients, chacun peut commander, même quand tu n&rsquo;es pas en ligne.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Vidéo — emplacements prévus, aucun fichier intégré (lot C) ──── */}
      <section className="section soft" id="comment">
        <div className="container center">
          <span className="label">Aussi simple que ça</span>
          <h2>Ta nouvelle façon de vendre, <span className="grad">prête en 5 minutes.</span></h2>
          <p className="lead">Pas besoin d&rsquo;ordinateur, ni de développeur. Tu gères tout depuis ton téléphone.</p>
          <VideoPoster />
          <div className="steps-line" style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 34, flexWrap: 'wrap' }}>
            <span>① Ajoute tes produits</span>
            <span>② Mets ton lien en bio</span>
            <span>③ Reçois tes commandes</span>
          </div>
        </div>
      </section>

      {/* ── Côté client — état statique (écran produit), animation = lot B ── */}
      <section className="section">
        <div className="container split">
          <div className="split-media reveal">
            <div className="db-wrap"><MaisonAwaMockup /></div>
          </div>
          <div>
            <span className="label">Côté client</span>
            <h2>Pour tes clients, tu n&rsquo;es plus un numéro WhatsApp. <span className="grad">Tu es une marque.</span></h2>
            <p className="lead" style={{ marginTop: 20 }}>Ton client ouvre ton lien et trouve tout : tes produits, tes prix, ce qu&rsquo;il reste en stock, tes délais de livraison. Il choisit, remplit son adresse et paie comme il veut.</p>
            <ul className="checks">
              <li>{IC.checkCircle}<div><b>Tout ce qu&rsquo;il veut savoir, avant même de demander</b><p>Prix, stock, livraison : fini les 10 photos envoyées une par une.</p></div></li>
              <li>{IC.checkCircle}<div><b>Du produit au paiement, sans quitter la page</b><p>Wave, Orange Money, carte ou paiement à la livraison.</p></div></li>
              <li>{IC.checkCircle}<div><b>Ton WhatsApp reste là</b><p>Ceux qui préfèrent te parler avant d&rsquo;acheter peuvent toujours le faire.</p></div></li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 24h/24 — étiquetée comme exemple illustratif ─────────────────── */}
      <section className="timeline-sec">
        <div className="container">
          <div className="section-head center reveal">
            <span className="label label--dark">Pendant que tu vis ta vie</span>
            <h2>Tes ventes ne s&rsquo;arrêtent plus quand tu <span style={{ color: 'var(--amber)' }}>poses ton téléphone.</span></h2>
            <p className="lead">Une journée type, à titre d&rsquo;exemple illustratif d&rsquo;un vendeur TEKKIShop.</p>
          </div>
          <div className="tl-grid">
            <div className="tl reveal">
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
            <aside className="tl-aside reveal">
              <div className="tl-card">
                <div className="tl-stat">1 commande sur 3</div>
                <p>est passée entre 20h et 8h (heure UTC) — mesuré le 2026-09-30, 34,4% sur 355 commandes non annulées.</p>
                <hr />
                <div className="tl-mini"><i>{IC.moon}</i> Ta boutique reste ouverte la nuit</div>
                <div className="tl-mini"><i>{IC.globe}</i> Tes clients commandent même quand tu dors</div>
                <div className="tl-mini"><i>{IC.bolt}</i> Le paiement se fait sans toi</div>
                <div className="tl-mini"><i>{IC.inbox}</i> La commande t&rsquo;attend au réveil</div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── Tableau de bord — données Maison Awa, pas d'animation ────────── */}
      <section className="section">
        <div className="container split">
          <div className="split-media reveal">
            <div className="db-wrap">
              <div className="phone">
                <div className="phone-notch" />
                <div className="phone-screen">
                  <div className="db-screen">
                    <div className="db-body">
                      <div className="db-date">Lundi 3 Août</div>
                      <div className="db-hello">Bonsoir, Maison Awa</div>
                      <div className="db-sales">
                        <div className="db-sales-head">Ventes — Auj. · 11 ventes</div>
                        <div className="db-amount">154 000 <small>F</small></div>
                      </div>
                      <div className="db-two">
                        <div className="db-mini"><small>Produits</small><b>24</b><span>actifs</span><i>{IC.box}</i></div>
                        <div className="db-mini"><small>En attente</small><b>3</b><span>commandes</span><i>{IC.shoppingCart}</i></div>
                      </div>
                    </div>
                    <div className="db-nav">
                      <div className="on"><i>{IC.home}</i>Accueil</div>
                      <div><i>{IC.shoppingCart}</i>Commandes</div>
                      <div className="db-ia"><i>{IC.sparkle}</i></div>
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
            <p className="lead" style={{ marginTop: 20 }}>Tes ventes, tes commandes, tes clients, tes revenus : tout tient dans un écran, sur le téléphone que tu as déjà dans la main.</p>
          </div>
        </div>
      </section>

      {/* ── Physique ou digital ──────────────────────────────────────────── */}
      <section className="section soft">
        <div className="container center">
          <span className="label">Physique ou digital</span>
          <h2>Colis ou fichiers, <span className="grad">tes clients commandent seuls.</span></h2>
          <div className="cards-3 reveal" style={{ gridTemplateColumns: '1fr 1fr', maxWidth: 760, margin: '40px auto 0' }}>
            <article className="card">
              <div className="card-ico" style={{ background: '#ffeee3', color: '#e4572e' }}>{IC.shoppingBag}</div>
              <h3>Produits à livrer</h3>
              <p>Mode, beauté, alimentation, décoration, accessoires, électronique.</p>
            </article>
            <article className="card">
              <div className="card-ico" style={{ background: '#e9ecff', color: '#4039c9' }}>{IC.smartphone}</div>
              <h3>Produits digitaux</h3>
              <p>Ebooks, formations, guides, modèles. Ton client télécharge dès qu&rsquo;il a payé.</p>
              <Link href="/produits-digitaux" className="btn btn-secondary" style={{ marginTop: 14 }}>En savoir plus</Link>
            </article>
          </div>
        </div>
      </section>

      {/* ── Preuve sociale — boutiques réelles, pas des "témoignages" ──────
          Un seul titre : RealShopsShowcase rend déjà son propre
          section-head (eyebrow + h2 + lead) en interne — un second
          section-head ici produisait un doublon visuel (desktop et
          mobile, confirmé par capture). Composant partagé avec
          `src/app/page.tsx` et `CountryLandingV6.tsx`, non modifié. */}
      <section className="section testi-sec">
        <div className="container">
          <RealShopsShowcase
            shopIds={SHOWCASE_SHOP_IDS}
            eyebrow="Des boutiques TEKKIShop, en ligne aujourd'hui"
            headline={<>Voici à quoi ça ressemble, <span className="grad">concrètement.</span></>}
          />
          <div className="stats-bar reveal" style={{ gridTemplateColumns: '1fr 1fr 1fr', maxWidth: 640, margin: '40px auto 0' }}>
            <div className="stat"><b>{ORDERS_PLACED_COUNT}+</b><small>commandes passées</small></div>
            <div className="stat"><b>6</b><small>pays d&rsquo;Afrique</small></div>
            <div className="stat"><b>5</b><small>pays de la diaspora</small></div>
          </div>
        </div>
      </section>

      <PricingHome />

      {/* ── Fondateur ─────────────────────────────────────────────────────── */}
      <section className="section soft">
        <div className="container founder">
          <div className="founder-card reveal">
            <div className="founder-ava" style={{ background: 'var(--navy)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 28 }}>IN</div>
            <b>Ibuka Ndjoli</b>
            <small>Fondateur de TEKKIShop</small>
            <p style={{ marginTop: 14, fontSize: 13.5, opacity: .85 }}>Vend ses livres et ses jeux sur TEKKIShop.</p>
          </div>
          <div className="reveal">
            <span className="label">Conçu à partir du terrain</span>
            <h2>Fait par des gens qui ont vendu en ligne ici, avant toi.</h2>
            <p className="quote">« Quand les ventes de mes jeux ont décollé, j&rsquo;ai compris que le problème n&rsquo;était plus de trouver des clients. C&rsquo;était de pouvoir tous les servir. »</p>
            <p className="lead">TEKKIShop est né de plusieurs années passées à vendre en ligne et à accompagner des marques africaines. Notre travail, c&rsquo;est de te donner les outils pour vendre plus, sans travailler plus.</p>
          </div>
        </div>
      </section>

      <FAQHome />

      {/* ── CTA final ─────────────────────────────────────────────────────── */}
      <section className="cta-sec">
        <div className="container">
          <div className="cta-card reveal">
            <h2>Ta prochaine vidéo virale mérite une boutique <span style={{ color: 'var(--amber)' }}>prête à encaisser.</span></h2>
            <p>Crée ta boutique en 5 minutes, mets ton lien en bio, et tes clients commandent à toute heure.</p>
            <div className="cta-actions">
              <Link href="/start" className="btn btn-light">Créer ma boutique gratuitement</Link>
            </div>
            <p className="cta-micro">14 jours gratuits · Tes 3 premières commandes offertes</p>
          </div>
        </div>
      </section>

      <LandingFooter />
      <LandingV6Init />
    </div>
  )
}
