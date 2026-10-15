import Image from 'next/image'
import { BRAND, SOFT, DARKEST, ON_BRAND, CATEGORIES, PRODUCTS } from '@/lib/maison-awa-example-data'
import { U, Ic, IC_SEARCH, IC_SHARE, IC_PIN, IC_ARROW, IC_CHAT, IC_TRUCK, IC_WALLET, IC_GRID, IC_LIST, IC_PHONE, IC_IG, IC_TT, IC_FB, IC_FLAG } from './maw-shared'

// Accueil de la boutique fictive "Maison Awa" (nouveau design — point 2 du
// chantier mockups, 2026-10-23). Structure, ordre des sections, espacements
// et couleurs repris directement de Main.dc.html (fourni par l'utilisateur,
// comparé aux captures de contrôle : identique). Couleurs calculées une
// fois ici à partir de la même formule que Main.dc.html (teinte de marque
// #A8500A, valeur par défaut du fichier) plutôt que recopiées à l'œil.
//
// Remplace MaisonAwaMockup (ancienne carte de profil condensée) DANS LE
// HERO UNIQUEMENT (src/app/preview/landing-v7/page.tsx). MaisonAwaMockup.tsx
// n'est pas modifié.
//
// Contenu réel de Maison Awa (nom, Abidjan, description, catalogue, moyens
// de paiement) conforme à tekki.shop/maison-awa. Les éléments de design
// absents des données réelles de la boutique — accroche "L'élégance du wax,
// au quotidien.", "Cousu à Abidjan", "Commander, c'est simple" — sont du
// CONTENU D'EXEMPLE pour illustrer le design, jamais une fonctionnalité
// réellement proposée aux marchands aujourd'hui.
//
// Catalogue (CATEGORIES/PRODUCTS) et primitives visuelles (U/Ic/IC_*)
// déplacés le 2026-10-23 dans src/lib/maison-awa-example-data.ts et
// ./maw-shared.tsx — partagés avec ClientJourney.tsx (parcours "Côté
// client"), une seule source de vérité pour les deux mockups. Catalogue
// validé par l'utilisateur le 2026-10-23 (noms/prix définitifs).
//
// Catégories en bulles circulaires (demande explicite du 2026-10-23) :
// Main.dc.html lui-même utilise des tuiles rectangulaires pleine photo
// pour "Catégories", pas des bulles rondes — écart assumé entre le fichier
// de référence et la consigne reçue, signalé plutôt que choisi en
// silence. 4 bulles réelles, réparties sur toute la largeur
// (justify-content: space-between), sans compteur.
//
// Mise à l'échelle responsive SANS JS : toutes les dimensions du canevas
// sont exprimées en unités de container query (cqw, via U(), voir
// maw-shared.tsx) plutôt qu'en px fixes + un seul transform:scale(). Le
// composant est dessiné à l'échelle d'un canevas virtuel de CANVAS_WIDTH ;
// U(n) convertit n en pourcentage de la largeur réelle de .maw-stage (CSS,
// landing-v7.css), toujours égale à la largeur réelle de .phone-screen à
// n'importe quelle largeur d'écran.
//
// Rendu 100% HTML/CSS, sans JS, sans état. Aucun élément interactif réel :
// boutons/liens en <span>/<div>, jamais de <a>/<button> focusable — ce
// mockup est une illustration, pas une page fonctionnelle. Mention
// "Exemple de boutique" affichée en clair sur le bezel du téléphone (hors
// de la zone recadrée .phone-screen, donc toujours visible, vrai texte
// jamais aria-hidden).
//
// Découpage 2026-10-23 : MaisonAwaHomeScreen() = contenu pur (sans cadre de
// téléphone), réutilisé par ClientJourney.tsx pour son propre écran
// "Accueil" — une seule copie du contenu de la boutique, jamais deux.
// MaisonAwaHome() = MaisonAwaHomeScreen() + cadre de téléphone + badge +
// défilement animé, utilisé uniquement dans le hero.
const REASSURANCE = [
  { key: 'livraison', title: 'Livraison ou retrait', sub: 'Tu choisis à la commande' },
  { key: 'paiement', title: 'Mobile money ou espèces', sub: 'Wave, Orange Money, MTN…' },
  { key: 'question', title: 'Une question ?', sub: 'Écris-nous sur WhatsApp' },
] as const

const STEPS = [
  { n: 1, title: 'Choisis ton article', text: 'Sélectionne la quantité puis appuie sur Commander.' },
  { n: 2, title: 'Dis-nous où te joindre', text: 'Ton nom, ton numéro et ton quartier. Une minute suffit.' },
  { n: 3, title: 'Paie comme tu préfères', text: 'En mobile money tout de suite, ou en espèces à la livraison.' },
] as const

const PAYMENT_PILLS = ['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Maxit', 'T-Money', 'Mobicash', 'Espèces à la livraison']

const pillCircle = { width: U(46), height: U(46), borderRadius: '50%', background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as const

export function MaisonAwaHomeScreen() {
  return (
    <>
      {/* Barre haute */}
      <div style={{ height: U(64), padding: `0 ${U(12)} 0 ${U(16)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,.96)', borderBottom: '1px solid #EFE9E2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: U(10) }}>
          <span style={{ width: U(38), height: U(38), borderRadius: '50%', overflow: 'hidden', position: 'relative', background: '#fff', flex: 'none' }}>
            <Image src="/landing-v7/maison-awa/optimized/logo.webp" alt="Logo Maison Awa" fill sizes="38px" style={{ objectFit: 'cover', objectPosition: '50% 32%' }} />
          </span>
          <span style={{ fontSize: U(17), fontWeight: 700, letterSpacing: '-.01em' }}>Maison Awa</span>
        </div>
        <div style={{ display: 'flex', gap: U(4) }}>
          <span style={{ width: U(44), height: U(44), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic size={22}>{IC_SEARCH}</Ic></span>
          <span style={{ width: U(44), height: U(44), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic size={21}>{IC_SHARE}</Ic></span>
        </div>
      </div>

      {/* Bandeau — cover.webp (droits confirmés 2026-10-23), voile dégradé
          pour la lisibilité du texte par-dessus. */}
      <div style={{ margin: `${U(12)} ${U(16)} 0`, height: U(392), borderRadius: U(28), overflow: 'hidden', position: 'relative' }}>
        <Image
          src="/landing-v7/maison-awa/optimized/cover.webp"
          alt="Exemple de photo de couverture pour une boutique de mode wax"
          fill
          priority
          sizes="(max-width: 600px) 100vw, 390px"
          style={{ objectFit: 'cover', objectPosition: '50% 20%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,0) 28%, ${DARKEST} 100%)`, opacity: .94 }} />
        <div style={{ position: 'absolute', left: U(20), right: U(20), bottom: U(20), display: 'flex', flexDirection: 'column', gap: U(12), color: '#fff' }}>
          <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: U(6), padding: `${U(6)} ${U(12)}`, borderRadius: 999, background: 'rgba(255,255,255,.18)', fontSize: U(12.5), fontWeight: 600 }}><Ic size={13}>{IC_PIN}</Ic>Cousu à Abidjan</span>
          <h3 style={{ margin: 0, fontSize: U(31), lineHeight: 1.08, fontWeight: 800, letterSpacing: '-.025em' }}>L&rsquo;élégance du wax, au quotidien.</h3>
          <p style={{ margin: 0, fontSize: U(15), lineHeight: 1.45, opacity: .92 }}>Robes, ensembles et accessoires en wax.</p>
          <div style={{ display: 'flex', gap: U(10), marginTop: U(2) }}>
            <span style={{ flex: 1, height: U(50), borderRadius: U(14), background: BRAND, color: ON_BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: U(8), fontSize: U(15.5), fontWeight: 700 }}>Voir les produits <Ic size={18}>{IC_ARROW}</Ic></span>
            <span style={{ width: U(50), height: U(50), borderRadius: U(14), background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.45)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic size={22}>{IC_CHAT}</Ic></span>
          </div>
        </div>
      </div>

      {/* Réassurance */}
      <div className="maw-noscroll" style={{ marginTop: U(16), padding: `0 ${U(16)}`, display: 'flex', gap: U(10), overflowX: 'auto' }}>
        {REASSURANCE.map((r, i) => (
          <div key={r.key} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: U(10), padding: `${U(10)} ${U(14)} ${U(10)} ${U(10)}`, border: '1px solid #EFE9E2', borderRadius: U(16) }}>
            <span style={{ width: U(36), height: U(36), borderRadius: '50%', background: SOFT, color: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic size={19}>{i === 0 ? IC_TRUCK : i === 1 ? IC_WALLET : IC_CHAT}</Ic>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 1, whiteSpace: 'nowrap' }}>
              <b style={{ fontSize: U(13.5), fontWeight: 600 }}>{r.title}</b>
              <span style={{ fontSize: U(12), color: '#6A625B' }}>{r.sub}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Catégories — bulles circulaires (voir commentaire en tête de
          fichier). 4 bulles réelles, réparties sur toute la largeur. */}
      <div style={{ padding: `${U(30)} 0 0` }}>
        <h4 style={{ margin: `0 0 ${U(14)}`, padding: `0 ${U(16)}`, fontSize: U(20), fontWeight: 700, letterSpacing: '-.015em' }}>Catégories</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: `0 ${U(16)}` }}>
          {CATEGORIES.map(c => (
            <div key={c.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: U(8), width: U(78) }}>
              <div style={{ width: U(78), height: U(78), borderRadius: '50%', overflow: 'hidden', position: 'relative', background: SOFT, flex: 'none' }}>
                <Image src={c.src} alt={c.alt} fill priority sizes="78px" style={{ objectFit: 'cover' }} />
              </div>
              <b style={{ fontSize: U(13), fontWeight: 600, textAlign: 'center' }}>{c.name}</b>
            </div>
          ))}
        </div>
      </div>

      {/* Catalogue */}
      <div style={{ padding: `${U(34)} ${U(16)} 0` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: U(14) }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: U(10) }}>
            <h4 style={{ margin: 0, fontSize: U(20), fontWeight: 700, letterSpacing: '-.015em' }}>Nos produits</h4>
            <span style={{ fontSize: U(13.5), color: '#6A625B' }}>6 produits</span>
          </div>
          <div style={{ display: 'flex', padding: U(3), borderRadius: U(12), background: '#F4EFE9' }}>
            <span style={{ width: U(40), height: U(34), borderRadius: U(9), background: '#fff', color: BRAND, boxShadow: '0 1px 3px rgba(31,27,24,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic size={18}>{IC_GRID}</Ic></span>
            <span style={{ width: U(40), height: U(34), borderRadius: U(9), color: '#6A625B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic size={18}>{IC_LIST}</Ic></span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: `${U(20)} ${U(12)}` }}>
          {PRODUCTS.map(p => (
            <div key={p.key} style={{ display: 'flex', flexDirection: 'column', gap: U(10) }}>
              <div style={{ aspectRatio: '4/5', borderRadius: U(18), overflow: 'hidden', position: 'relative', background: p.bg }}>
                {/* loading="lazy" : seules la barre haute, la cover et les
                    bulles de catégories sont dans le premier écran du
                    mockup — toute la grille produits est sous la ligne de
                    flottaison, jamais en priority. */}
                <Image src={p.src} alt={p.alt} fill loading="lazy" sizes="(max-width: 600px) 50vw, 195px" style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: U(11.5), fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6A625B' }}>{p.cat}</span>
                <b style={{ fontSize: U(15), fontWeight: 600, lineHeight: 1.3 }}>{p.name}</b>
                <span style={{ fontSize: U(15), fontWeight: 700, color: BRAND }}>{p.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commander, c'est simple */}
      <div style={{ marginTop: U(42), padding: `${U(32)} ${U(16)} ${U(34)}`, background: SOFT }}>
        <h4 style={{ margin: `0 0 ${U(20)}`, fontSize: U(20), fontWeight: 700, letterSpacing: '-.015em' }}>Commander, c&rsquo;est simple</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: U(18) }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ display: 'flex', gap: U(14), alignItems: 'flex-start' }}>
              <span style={{ flex: `0 0 ${U(34)}`, width: U(34), height: U(34), borderRadius: '50%', background: BRAND, color: ON_BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: U(15) }}>{s.n}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <b style={{ fontSize: U(16), fontWeight: 600 }}>{s.title}</b>
                <span style={{ fontSize: U(14), lineHeight: 1.45, color: '#6A625B' }}>{s.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pied de page */}
      <div style={{ background: DARKEST, color: '#fff', padding: `${U(34)} ${U(20)} ${U(28)}`, display: 'flex', flexDirection: 'column', gap: U(24) }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: U(14) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: U(12) }}>
            <span style={{ width: U(52), height: U(52), borderRadius: '50%', overflow: 'hidden', position: 'relative', background: '#fff', flex: 'none' }}>
              <Image src="/landing-v7/maison-awa/optimized/logo.webp" alt="Logo Maison Awa" fill sizes="52px" style={{ objectFit: 'cover', objectPosition: '50% 32%' }} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <b style={{ fontSize: U(20), fontWeight: 700, letterSpacing: '-.01em' }}>Maison Awa</b>
              <span style={{ display: 'flex', alignItems: 'center', gap: U(5), fontSize: U(13.5), opacity: .75 }}><Ic size={14}>{IC_PIN}</Ic>Abidjan</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: U(15), lineHeight: 1.55, opacity: .85 }}>Robes, ensembles et accessoires en wax, cousus à Abidjan.</p>
        </div>
        <div style={{ display: 'flex', gap: U(10) }}>
          <span style={{ flex: 1, height: U(48), borderRadius: U(14), border: '1px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: U(8), fontSize: U(15), fontWeight: 600 }}><Ic size={18}>{IC_PHONE}</Ic>Appeler</span>
          <span style={{ flex: 1, height: U(48), borderRadius: U(14), background: '#fff', color: '#1F1B18', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: U(8), fontSize: U(15), fontWeight: 700 }}><Ic size={18}>{IC_CHAT}</Ic>Écrire</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: U(10) }}>
          <span style={{ fontSize: U(12), fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .6 }}>Suis-nous</span>
          <div style={{ display: 'flex', gap: U(10) }}>
            <span style={pillCircle}><Ic size={21}>{IC_IG}</Ic></span>
            <span style={pillCircle}><Ic size={21}>{IC_TT}</Ic></span>
            <span style={pillCircle}><Ic size={21}>{IC_FB}</Ic></span>
            <span style={pillCircle}><Ic size={21}>{IC_CHAT}</Ic></span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: U(10) }}>
          <span style={{ fontSize: U(12), fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .6 }}>Moyens de paiement acceptés</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: U(8) }}>
            {PAYMENT_PILLS.map(p => (
              <span key={p} style={{ padding: `${U(7)} ${U(12)}`, borderRadius: 999, border: '1px solid rgba(255,255,255,.25)', fontSize: U(13) }}>{p}</span>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.16)', paddingTop: U(18), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: U(12), textAlign: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: U(7), fontSize: U(13), opacity: .7 }}><Ic size={14}>{IC_FLAG}</Ic>Signaler cette boutique</span>
          <span style={{ fontSize: U(14), opacity: .95 }}>Créée avec <b style={{ fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>TEKKIShop</b> ↗</span>
          <span style={{ fontSize: U(12.5), opacity: .6 }}>Toi aussi, ouvre ta boutique en 5 min</span>
        </div>
      </div>
    </>
  )
}

export function MaisonAwaHome() {
  return (
    <div className="phone">
      {/* Texte réel, hors de .phone-screen (overflow:hidden) donc jamais
          recadré. Taille fixe en px (hors canevas, sur le bezel). */}
      <span
        style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          padding: '5px 14px', borderRadius: 999, background: DARKEST, color: '#fff',
          fontSize: 11.5, fontWeight: 700, letterSpacing: '.04em', whiteSpace: 'nowrap',
          boxShadow: '0 6px 16px -6px rgba(0,0,0,.4)', zIndex: 6,
        }}
      >
        Exemple de boutique
      </span>
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="maw-stage">
          {/* Défilement vertical en boucle : translateY pur CSS sur ce
              conteneur — le clip réel vient de .phone-screen
              (overflow:hidden, landing-v6.css, partagé, jamais modifié).
              Distances mesurées via Playwright (getBoundingClientRect, pas
              estimées) : voir .maw-scroll dans landing-v7.css. */}
          <div
            aria-hidden="true"
            className="maw-scroll"
            style={{ width: '100cqw', background: '#fff', color: '#1F1B18', fontFamily: 'var(--display)' }}
          >
            <MaisonAwaHomeScreen />
          </div>
        </div>
      </div>
    </div>
  )
}
