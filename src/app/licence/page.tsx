import type { Metadata } from 'next'
import { APP_NAME, APP_URL } from '@/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import '../landing-v6.css'
import { LandingNav } from '@/components/landing-v6/LandingNav'
import { LandingFooter } from '@/components/landing-v6/LandingFooter'
import { LandingV6Init } from '@/components/landing-v6/LandingV6Init'
import { LicenceSimulator } from './LicenceSimulator'
import { AFRICA_PLANS } from '@/lib/billing/plans'
import { EXISTING_MERCHANTS_RATE, currentSimulatorMode, scenariosForMode } from './simulator-constants'
import { LicenceForm } from './LicenceForm'
import { MIN_COMMISSION_RATE, MAX_COMMISSION_RATE } from '@/lib/billing/commission'
import { FOUNDER_OBJECTIVES, FOUNDER_SHARES, LICENSE_DURATION_MONTHS, LICENSE_PRICE_FCFA, OPEN_COUNTRIES, RETURN_RATE_CONFIRMED, RETURN_RATE_PCT, formatFcfa, formatNumberFr, indicativeEquivalents, sectionForTerritory } from './prices'


// Aligné sur le rythme de la page d'accueil (compromis validé, pas une parité
// stricte : la page d'accueil est intégralement dynamique — cookies() via
// createServerClient() — sans lien avec son propre compteur de boutiques,
// qui passe par createAdminClient() comme ici). 90 s garde une fraîcheur
// commerciale utile sans recalculer à chaque requête.
export const revalidate = 90

// Métadonnées propres à la page (partage LinkedIn / WhatsApp). Next remplace
// l'objet openGraph du layout en entier (fusion superficielle) : images et
// tous les champs utiles sont donc redéclarés ici. title.absolute évite le
// gabarit « %s — TekkiShop » du layout (répétition de la marque).
// og:url : tekki.shop redirige vers www.tekki.shop (307), l'adresse finale
// est donc celle de APP_URL. Image dédiée 1200×630 : public/og-licence-fondatrice.png.
const LICENCE_URL = `${APP_URL}/licence`
const SHARE_TITLE = 'Devenez Country Manager de TEKKIShop dans votre pays'
const SHARE_DESCRIPTION = "Licence fondatrice : 24 mois d'exclusivité, 100 % des abonnements la première année. Bénin, Togo, Burkina Faso, Mali."
const SHARE_IMAGE = '/og-licence-fondatrice.png'

export const metadata: Metadata = {
  title: { absolute: 'Licence fondatrice TEKKIShop : lancez TEKKIShop dans votre pays' },
  description: SHARE_DESCRIPTION,
  alternates: { canonical: LICENCE_URL },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: APP_NAME,
    url: LICENCE_URL,
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [{ url: SHARE_IMAGE, width: 1200, height: 630, alt: 'Licence fondatrice TEKKIShop : devenez Country Manager de TEKKIShop. Bénin, Togo, Burkina Faso, Mali. 24 mois d\'exclusivité.', type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
}

const Chk = ({ size = 19, color = '#12b981' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0, marginTop: 3 }}><path d="M20 6L9 17l-5-5" /></svg>
)
const XMark = ({ size = 19 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#e0616a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0, marginTop: 3 }}><path d="M18 6L6 18M6 6l12 12" /></svg>
)
const Dash = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#697893" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0, marginTop: 3 }}><path d="M5 12h14" /></svg>
)
const CircleChk = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: 21, height: 21, flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10" /><path d="M8 12.5l2.6 2.6L16 9.7" /></svg>
)
const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, flexShrink: 0 }}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)

type TerritoryStatus = 'libre' | 'reserve' | 'attribue' | 'dukka'

interface Territory {
  country_code: string
  name: string
  status: TerritoryStatus
  position: number
}

type Section = 'disponible' | 'attente' | 'ferme'

// Emoji de drapeau — dérivé du code, jamais stocké en base (migration 095,
// colonne non demandée dans le schéma).
const FLAG_BY_CODE: Record<string, string> = {
  BJ: '🇧🇯', ML: '🇲🇱', BK: '🇧🇫', NE: '🇳🇪', GN: '🇬🇳', CM: '🇨🇲', GA: '🇬🇦',
  TG: '🇹🇬', SN: '🇸🇳', CI: '🇨🇮', DIASPORA: '🌍',
}

const STATUS_LABEL: Record<TerritoryStatus, string> = {
  libre: 'libre', reserve: 'réservé', attribue: 'attribué', dukka: 'TEKKIShop',
}

export default async function LicencePage() {
  const admin = createAdminClient()
  const { count: shopCount } = await admin
    .from('shops')
    .select('id', { count: 'exact', head: true })
  // « Plus de N boutiques créées » : comptage brut de toute la table shops,
  // arrondi à la centaine inférieure (strictement). Si le comptage échoue (ou si N serait 0),
  // le chiffre et les phrases qui le contiennent sont masqués (aucun repli).
  // Strictement inférieur au total : « plus de N » reste vrai même quand le total
  // tombe exactement sur une centaine (ex. 2 000 → « plus de 1 900 »).
  const shopsFloor = shopCount ? Math.floor((shopCount - 1) / 100) * 100 : 0
  const shopsLabel = shopsFloor > 0 ? formatNumberFr(shopsFloor) : null

  // Inscrits par pays ouvert : comptage brut de toutes les boutiques du pays
  // (brouillons compris), mêmes règles que le chiffre du hero. Burkina Faso
  // unifié sur le code 'BK' (migration 093, REPRISE.md §4). Si le comptage d'un
  // pays échoue, sa ligne de chiffre est masquée (aucun repli).
  const registeredByCode: Record<string, number | null> = Object.fromEntries(
    await Promise.all(OPEN_COUNTRIES.map(async c => {
      const { count, error } = await admin
        .from('shops')
        .select('id', { count: 'exact', head: true })
        .eq('country', c.code)
      return [c.code, error || count === null ? null : count] as const
    })),
  )

  // Simulateur : visible seulement si les valeurs de départs sont confirmées, ou
  // (valeurs de TEST) hors production : aperçu Vercel, développement, ou
  // LICENCE_SIM_PREVIEW=1 en local. Voir simulator-constants.ts. En production,
  // tant que non confirmées, ni la section ni le bouton du hero ne sont rendus
  // et aucune valeur de départs n'est transmise au navigateur.
  const simMode = currentSimulatorMode()
  const simScenarios = scenariosForMode(simMode)
  const simulatorVisible = simMode !== 'hidden' && simScenarios !== null
  // Prix des abonnements : catalogue produit (AFRICA_PLANS), jamais en dur ici.
  const simPlans = (['business', 'pro'] as const).map(key => {
    const plan = AFRICA_PLANS.find(p => p.key === key)
    if (!plan) throw new Error(`[licence] Plan « ${key} » introuvable dans AFRICA_PLANS (lib/billing/plans.ts) : le simulateur ne peut pas lire son prix.`)
    return { key, label: plan.name, price: plan.priceInt }
  })
  // « 3, 6 et 12 mois » : échéances des objectifs, lues depuis FOUNDER_OBJECTIVES.
  const objectiveMonths = `${FOUNDER_OBJECTIVES.slice(0, -1).map(o => o.months).join(', ')} et ${FOUNDER_OBJECTIVES[FOUNDER_OBJECTIVES.length - 1].months} mois`

  // Total des inscrits des 4 pays ouverts : somme des quatre comptages. Si l'un
  // d'eux a échoué, le total est masqué.
  const registeredValues = OPEN_COUNTRIES.map(c => registeredByCode[c.code])
  const registeredTotal = registeredValues.every((v): v is number => v != null)
    ? registeredValues.reduce((sum, v) => sum + v, 0)
    : null

  // Statuts de territoire — modifiables sans redéploiement (migration 095).
  const { data: territoriesRaw } = await admin
    .from('licence_territories' as never)
    .select('country_code, name, status, position')
    .eq('is_visible', true)
    .order('position')

  const territories = (territoriesRaw ?? []) as unknown as Territory[]

  const bySection: Record<Section, Territory[]> = { disponible: [], attente: [], ferme: [] }
  for (const t of territories) {
    const section = sectionForTerritory(t)
    if (section !== 'masque') bySection[section].push(t)
  }

  // Pays éligibles à une candidature : ouverts, ou en liste d'attente.
  const formTerritories = [
    ...bySection.disponible.map(t => ({ name: t.name, group: 'open' as const })),
    ...bySection.attente.map(t => ({ name: t.name, group: 'waitlist' as const })),
  ]

  return (
    <>
      <style>{`
        /* ── Layout ────────────────────────────────────────── */
        .lic-wrap{max-width:1180px;margin:0 auto;padding:0 24px}
        .lic-section{padding:100px 0;position:relative}
        .lic-section-sky{background:#f5f9ff}
        .lic-section-navy{
          background:radial-gradient(circle at 84% 10%,rgba(255,176,32,.13),transparent 34%),
            radial-gradient(circle at 8% 84%,rgba(23,107,255,.2),transparent 38%),
            linear-gradient(170deg,#071a35,#040d1e);
          color:#fff;padding:100px 0
        }
        .lic-center{text-align:center}
        .lic-head{max-width:830px;margin:0 auto 52px}
        .lic-head .lic-lead{max-width:720px;margin-left:auto;margin-right:auto}

        /* ── Typography ────────────────────────────────────── */
        .lic-kicker,.lic-label{display:inline-flex;align-items:center;gap:11px;font-size:11px;
          text-transform:uppercase;letter-spacing:.15em;color:#0d54d8;font-weight:700;margin-bottom:16px}
        .lic-kicker::before,.lic-label::before{content:"";width:26px;height:2px;background:#176bff;border-radius:2px;flex:none}
        .lic-center .lic-label,.lic-center .lic-kicker{justify-content:center}
        .lic-label-dark{color:#8fb4ff !important}
        .lic-label-dark::before{background:#ffb020 !important}
        .lic-h1{font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);font-size:clamp(38px,5.2vw,68px);
          line-height:1.04;letter-spacing:-.035em;margin:0 0 20px;font-weight:800;color:#0b1830}
        .lic-h2{font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);font-size:clamp(30px,3.9vw,52px);
          line-height:1.08;letter-spacing:-.035em;margin:0 0 18px;font-weight:800;color:#0b1830}
        .lic-h3{font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);font-size:20px;
          line-height:1.28;letter-spacing:-.02em;margin:0 0 8px;font-weight:700;color:#0b1830}
        .lic-lead{font-size:clamp(16.5px,1.6vw,20px);line-height:1.6;color:#26385a;margin:0 0 24px}
        .lic-grad{color:#0d54d8;background-image:linear-gradient(to top,rgba(23,107,255,.15) 0 .30em,transparent 0);
          background-repeat:no-repeat;padding:0 .04em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
        .lic-section-navy .lic-h2,.lic-expect .lic-h2{color:#fff}
        .lic-section-navy .lic-lead,.lic-expect .lic-lead{color:#c0d5ed}

        /* ── Buttons ───────────────────────────────────────── */
        .lic-btn{border:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;
          gap:9px;min-height:52px;padding:0 26px;border-radius:14px;font-weight:700;font-size:15.5px;
          transition:transform .22s ease,box-shadow .22s ease;text-align:center;text-decoration:none;font-family:inherit}
        .lic-btn-primary{color:#fff;background:linear-gradient(135deg,#1870ff,#0b57dd);box-shadow:0 14px 34px rgba(23,107,255,.28)}
        .lic-btn-primary:hover{transform:translateY(-2px);box-shadow:0 18px 44px rgba(23,107,255,.36)}
        .lic-btn-secondary{color:#0b1830;background:#fff;border:1px solid #dfe7f3;box-shadow:0 8px 28px rgba(9,40,92,.08)}
        .lic-btn-secondary:hover{transform:translateY(-2px);border-color:#adc5eb}
        .lic-btn-full{width:100%;justify-content:center}

        /* ── Hero ──────────────────────────────────────────── */
        .lic-hero{padding:70px 0 72px;position:relative;overflow:hidden;
          background:radial-gradient(circle at 82% 12%,rgba(23,107,255,.13),transparent 32%),
            radial-gradient(circle at 10% 26%,rgba(23,107,255,.09),transparent 28%),
            linear-gradient(180deg,#fbfdff,#f4f9ff)}
        .lic-hero::before{content:"";position:absolute;inset:0;opacity:.32;pointer-events:none;
          background-image:linear-gradient(rgba(24,80,160,.075) 1px,transparent 1px),
            linear-gradient(90deg,rgba(24,80,160,.075) 1px,transparent 1px);
          background-size:38px 38px;
          -webkit-mask-image:linear-gradient(to bottom,#000,transparent 92%);
          mask-image:linear-gradient(to bottom,#000,transparent 92%)}
        .lic-hero-grid{display:grid;grid-template-columns:1.08fr .92fr;gap:52px;align-items:center;position:relative;z-index:2}
        .lic-hero-copy .lic-lead{max-width:600px;margin-bottom:26px}
        .lic-ctas{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px}
        .lic-hero-note{font-size:13.5px;color:#697893;display:flex;flex-wrap:wrap;gap:8px 18px}
        .lic-hero-note span{display:inline-flex;align-items:center;gap:7px;font-weight:600}
        .lic-hero-note svg{color:#12b981;flex:none}

        /* Offer card */
        .lic-offer-card{background:#fff;border:1px solid #dfe7f3;border-radius:24px;padding:30px 28px;box-shadow:0 24px 70px rgba(9,40,92,.13)}
        .lic-offer-card h4{font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:#697893;margin:0 0 18px;font-weight:700}
        .lic-offer-line{display:flex;align-items:flex-start;gap:12px;padding:13px 0;border-bottom:1px solid #eef2f8;font-size:14.5px}
        .lic-offer-line:last-of-type{border-bottom:0}
        .lic-offer-line b{display:block;font-size:14.5px;margin-bottom:2px}
        .lic-offer-line small{color:#697893;font-size:13px;display:block}
        .lic-offer-price{margin-top:18px;padding-top:20px;border-top:2px solid #0b1830;display:flex;
          align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap}
        .lic-offer-price b{font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);font-size:32px;font-weight:800;letter-spacing:-.04em;line-height:1}
        .lic-offer-price small{font-size:13px;color:#697893}

        /* ── Stats strip ───────────────────────────────────── */
        .lic-strip{border-top:1px solid #dfe7f3;border-bottom:1px solid #dfe7f3;background:#fff;padding:34px 0}
        .lic-strip-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}
        .lic-stat{text-align:center}
        .lic-stat b{display:block;font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);
          font-size:clamp(28px,3.2vw,40px);font-weight:800;letter-spacing:-.04em;line-height:1;color:#0d54d8}
        .lic-stat small{display:block;margin-top:7px;font-size:13.5px;color:#697893}

        /* ── Two panels ────────────────────────────────────── */
        .lic-two-col{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:44px}
        .lic-panel{border-radius:20px;padding:28px 26px;border:1px solid}
        .lic-panel-a{background:#f5f9ff;border-color:#d6e5fb}
        .lic-panel-b{background:#e6fbf2;border-color:#c4f0dd}
        .lic-panel-tag{font-size:10.5px;text-transform:uppercase;letter-spacing:.12em;font-weight:700;margin-bottom:10px;display:block}
        .lic-panel-a .lic-panel-tag{color:#0d54d8}
        .lic-panel-b .lic-panel-tag{color:#0a875c}
        .lic-panel p{margin:0;font-size:15px;color:#26385a;line-height:1.6}
        .lic-arrow-join{text-align:center;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#697893;margin:26px 0 0}
        /* La règle partagée « .lv6 p { margin-top: 0 } » (landing-v6.css) annule les marges hautes des
           classes ci-dessous : on les réaffirme avec une spécificité supérieure, sans toucher à la règle globale. */
        .lv6 .lic-arrow-join{margin-top:26px}
        .lv6 .lic-hbox-note{margin-top:18px}
        .lv6 .lic-price-note{margin-top:20px}

        /* ── 6 cards ───────────────────────────────────────── */
        /* 5 cartes : 3 sur la première ligne, 2 plus larges sur la seconde (grille de 6 colonnes) */
        .lic-cards{display:grid;grid-template-columns:repeat(6,1fr);gap:20px;margin-top:44px}
        .lic-card{grid-column:span 2}
        .lic-card:nth-child(n+4){grid-column:span 3}
        .lic-card{background:#fff;border:1px solid #dfe7f3;border-radius:20px;padding:26px 24px;
          box-shadow:0 8px 28px rgba(9,40,92,.08);transition:transform .25s ease,box-shadow .25s ease}
        .lic-card:hover{transform:translateY(-4px);box-shadow:0 24px 70px rgba(9,40,92,.13)}
        .lic-card-ico{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;
          font-size:19px;margin-bottom:15px;background:#eaf2ff}
        .lic-card p{margin:0;font-size:14.5px;color:#697893;line-height:1.6}

        /* ── Honest ────────────────────────────────────────── */
        .lic-honest{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:44px}
        .lic-hbox{border-radius:20px;padding:28px 26px;border:1px solid}
        .lic-hbox-in{background:#fff;border-color:#dfe7f3;box-shadow:0 8px 28px rgba(9,40,92,.08)}
        .lic-hbox-out{background:#fbfcfe;border-color:#dfe7f3}
        .lic-hbox ul{list-style:none;margin:0;padding:0;display:grid;gap:12px}
        .lic-hbox li{display:flex;gap:11px;font-size:14.5px;line-height:1.5;color:#26385a}
        .lic-hbox-in li svg{color:#12b981}
        .lic-hbox-out li svg{color:#e0616a}
        .lic-hbox-note{margin:18px 0 0;font-size:13.5px;color:#697893;font-style:italic;line-height:1.55}

        /* ── Simulator ─────────────────────────────────────── */
        .lic-sim{display:grid;grid-template-columns:.92fr 1.08fr;gap:44px;align-items:start;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:34px;margin-top:44px}
        .lic-sim-lbl{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.12em;
          color:#8fa9d0;margin-bottom:9px;font-weight:700}
        .lic-sim-val{font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);font-size:44px;
          font-weight:800;letter-spacing:-.045em;line-height:1;margin-bottom:14px;color:#fff}
        .lic-sim-val span{font-size:15px;font-weight:600;color:#8fa9d0;letter-spacing:0}
        .lic-range{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:4px;
          background:rgba(255,255,255,.16);outline:none;margin:0 0 8px;display:block}
        .lic-range::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;
          background:#fff;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35);border:4px solid #176bff}
        .lic-range::-moz-range-thumb{width:26px;height:26px;border-radius:50%;background:#fff;
          cursor:pointer;border:4px solid #176bff}
        .lic-sim-scale{display:flex;justify-content:space-between;font-size:10px;color:#7f96bb;margin-bottom:26px}
        .lic-plan-pick{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:8px}
        .lic-plan-pick button{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);
          color:#cbd9ef;border-radius:12px;padding:12px 6px;cursor:pointer;font-size:13px;font-weight:600;
          transition:.2s;min-height:60px;font-family:inherit}
        .lic-plan-pick button small{display:block;font-size:10px;color:#8fa9d0;margin-top:3px}
        .lic-plan-pick button.on{background:#fff;color:#071a35;border-color:#fff}
        .lic-plan-pick button.on small{color:#4a5c7e}
        .lic-sim-hint{font-size:12.5px;color:#7f96bb;line-height:1.55;margin:14px 0 0}
        .lic-sim-out{display:grid;gap:12px}
        .lic-sim-row{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;
          padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .lic-sim-row small{display:block;font-size:13px;color:#9fb3d4;margin-top:3px}
        .lic-sim-row b{font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);font-size:26px;
          font-weight:800;letter-spacing:-.035em;white-space:nowrap;color:#fff}
        .lic-sim-rlabel{font-size:14.5px;font-weight:600;color:#fff}
        .lic-sim-hi{background:rgba(255,176,32,.1);border-color:rgba(255,176,32,.35)}
        .lic-sim-hi b{color:#ffb020 !important}
        .lic-sim-legal{margin:20px 0 0;font-size:12px;color:#7f96bb;line-height:1.6}
        .lv6 .lic-sim-hint{margin-top:14px}
        .lv6 .lic-sim-legal{margin-top:20px}
        .lic-sim-val-sm{font-size:30px;margin-bottom:10px}
        .lic-plan-pick-3{grid-template-columns:repeat(3,1fr)}
        .lic-testflag{margin:0 0 20px;padding:9px 12px;border-radius:10px;background:rgba(255,176,32,.14);border:1px dashed rgba(255,176,32,.6);color:#ffd27a;font-size:12.5px;font-weight:700;letter-spacing:.02em}
        .lic-sim-block{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:18px 20px}
        .lic-goals{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
        .lic-goal{border-radius:12px;padding:12px 8px;text-align:center;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04)}
        .lic-goal b{display:block;margin:4px 0;font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);font-size:21px;font-weight:800;letter-spacing:-.03em;color:#fff;white-space:nowrap}
        .lic-goal small{display:block;font-size:11.5px;color:#9fb3d4}
        .lic-goal .lic-goal-state{font-weight:700}
        .lic-goal.ok{border-color:rgba(75,220,168,.55);background:rgba(75,220,168,.1)}
        .lic-goal.ok .lic-goal-state{color:#4bdca8}
        .lic-goal.ko{border-color:rgba(224,97,106,.55);background:rgba(224,97,106,.1)}
        .lic-goal.ko .lic-goal-state{color:#ff9aa1}
        .lic-sim-chart{margin:0;padding:14px 16px 10px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}
        .lic-sim-chart svg{display:block;width:100%;height:auto}
        .lic-sim-chart figcaption{margin-top:8px;font-size:12px;color:#7f96bb;line-height:1.5}

        /* ── Markets ───────────────────────────────────────── */
        .lic-markets{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-top:44px}
        .lic-mk{border-radius:20px;padding:24px 22px;border:1px solid;background:#fff}
        .lic-mk-open{border-color:#c4f0dd;background:#e6fbf2}
        .lic-mk-soon{border-color:#dfe7f3}
        .lic-mk-reserved{border-color:#f7dfae;background:#fff8ec}
        .lic-mk-closed{border-color:#dfe7f3;background:#f8fafd}
        .lic-mk-tag{font-size:10px;text-transform:uppercase;letter-spacing:.12em;font-weight:700;
          display:inline-block;padding:5px 10px;border-radius:999px;margin-bottom:14px}
        .lic-mk-open .lic-mk-tag{background:#c9f2df;color:#0a704d}
        .lic-mk-soon .lic-mk-tag{background:#eaf2ff;color:#0d54d8}
        .lic-mk-reserved .lic-mk-tag{background:#fff1cf;color:#8a5b00}
        .lic-mk-closed .lic-mk-tag{background:#e9edf4;color:#6b7a93}
        .lic-mk > p{font-size:13.5px;color:#697893;margin:0 0 15px;line-height:1.55}
        .lic-mk ul{list-style:none;margin:0;padding:0;display:grid;gap:9px}
        .lic-mk li{display:flex;align-items:center;gap:9px;font-size:14.5px;font-weight:600}
        .lic-mk li i{font-style:normal;font-size:17px;line-height:1}
        .lic-mk-closed li{color:#8b98ad;font-weight:500}
        .lic-mk li em{font-style:normal;font-size:10px;letter-spacing:.06em;color:#697893;margin-left:auto;text-transform:uppercase}
        .lic-mk-foot{margin:16px 0 0;padding-top:14px;border-top:1px solid rgba(0,0,0,.07);font-size:12.5px;color:#697893}

        /* ── Parcours ──────────────────────────────────────── */
        .lic-path{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-top:44px}
        .lic-pstep{background:#fff;border:1px solid #dfe7f3;border-radius:20px;padding:22px 20px;
          box-shadow:0 8px 28px rgba(9,40,92,.08);position:relative;overflow:hidden}
        .lic-pstep::before{content:"";position:absolute;inset:0 0 auto;height:3px;background:#176bff;border-radius:20px 20px 0 0}
        .lic-pstep-n{font-size:12px;font-weight:700;color:#fff;background:#0b1830;width:30px;height:30px;
          border-radius:9px;display:grid;place-items:center;margin-bottom:14px}
        .lic-pstep h3{font-size:16px;margin-bottom:6px}
        .lic-pstep p{font-size:13.5px;color:#697893;margin:0}
        .lic-pstep-time{display:block;margin-top:12px;font-size:10.5px;letter-spacing:.08em;
          text-transform:uppercase;color:#0d54d8;font-weight:700}

        /* ── Attentes ──────────────────────────────────────── */
        .lic-expect{background:#071a35;color:#fff;border-radius:24px;padding:44px 40px}
        .lic-expect-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:30px}
        .lic-ebox{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:22px 20px}
        .lic-ebox b{display:block;font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);
          font-size:30px;font-weight:800;letter-spacing:-.04em;margin-bottom:8px;color:#fff}
        .lic-ebox p{margin:0;font-size:14px;color:#9fb3d4;line-height:1.55}
        .lic-expect .lic-expect-note{margin:26px 0 0;padding:18px 20px;border-left:3px solid #ffb020;
          background:rgba(255,176,32,.08);border-radius:0 14px 14px 0;font-size:14.5px;color:#e3ecfa;line-height:1.6}
        .lic-expect-note strong{color:#fff}

        /* ── Fit ───────────────────────────────────────────── */
        .lic-fit{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:44px}
        .lic-fitbox{border-radius:20px;padding:28px 26px;border:1px solid}
        .lic-fit-yes{background:#e6fbf2;border-color:#c4f0dd}
        .lic-fit-no{background:#fff1f2;border-color:#ffd6d9}
        .lic-fitbox ul{list-style:none;margin:0;padding:0;display:grid;gap:11px}
        .lic-fitbox li{display:flex;gap:10px;font-size:14.5px;line-height:1.5;color:#26385a}
        .lic-fitbox li b{flex:none;font-weight:800;font-size:15px;margin-top:1px}
        .lic-fit-yes li b{color:#12b981}
        .lic-fit-no li b{color:#e0616a}

        /* ── Price from label ─────────────────────────────── */
        .lic-price-from{font-family:monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#697893;display:block;margin-bottom:5px}

        /* ── Vary grid ─────────────────────────────────────── */
        .lic-vary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:22px}

        /* ── Investissement ────────────────────────────────── */
        .lic-invest{display:grid;grid-template-columns:1.05fr .95fr;gap:26px;align-items:start;margin-top:44px}
        .lic-price-card{background:#fff;border:2px solid #176bff;border-radius:24px;padding:34px 30px;
          box-shadow:0 30px 76px rgba(23,107,255,.18)}
        .lic-price-top{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:6px}
        .lic-price-top b{font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);
          font-size:clamp(38px,4.4vw,52px);font-weight:800;letter-spacing:-.045em;line-height:1;color:#0b1830}
        .lic-price-top span{font-size:15px;font-weight:600;color:#697893}
        .lic-price-sub{font-size:14px;color:#697893;margin:0 0 22px}
        .lic-pay-split{display:grid;gap:11px;margin-bottom:22px}
        .lic-pay-item{display:flex;align-items:center;gap:13px;background:#f5f9ff;border:1px solid #e3ecfa;border-radius:14px;padding:14px 16px}
        .lic-pay-item i{width:32px;height:32px;border-radius:10px;background:#176bff;color:#fff;
          display:grid;place-items:center;font-size:12px;font-style:normal;font-weight:700;flex:none}
        .lic-pay-item b{display:block;font-size:15px}
        .lic-pay-item small{display:block;font-size:13px;color:#697893}
        .lic-renew{background:#fff6e3;border:1px solid #f7dfae;border-radius:14px;padding:15px 17px;font-size:14px;color:#6a4a09;line-height:1.55}
        .lic-renew b{color:#4a3406}
        .lic-price-note{margin:20px 0 0;font-size:13.5px;color:#697893;line-height:1.6}
        .lic-side-list{display:grid;gap:16px}
        .lic-side-box{background:#fff;border:1px solid #dfe7f3;border-radius:20px;padding:24px 22px;box-shadow:0 8px 28px rgba(9,40,92,.08)}
        .lic-side-box ul{list-style:none;margin:0;padding:0;display:grid;gap:9px}
        .lic-side-box li{display:flex;gap:10px;font-size:14px;color:#26385a;line-height:1.5}
        .lic-side-box li svg{color:#12b981}
        .lic-side-box li.no svg{color:#697893}

        /* ── FAQ ───────────────────────────────────────────── */
        .lic-faq-grid{display:grid;grid-template-columns:.78fr 1.22fr;gap:50px;align-items:start;margin-top:44px}
        .lic-faq-side{position:sticky;top:96px}
        .lic-faq-list{display:grid;gap:10px}
        .lic-faq-item{border:1px solid #dfe7f3;border-radius:15px;background:#fff;overflow:hidden}
        .lic-faq-item summary{padding:17px 20px;font-weight:600;font-size:15px;cursor:pointer;
          list-style:none;display:flex;align-items:center;justify-content:space-between;
          gap:14px;color:#0b1830;line-height:1.4;min-height:56px}
        .lic-faq-item summary::-webkit-details-marker{display:none}
        .lic-faq-item summary::after{content:"+";font-size:22px;color:#176bff;flex:none;line-height:1}
        .lic-faq-item[open] summary::after{content:"−"}
        .lic-faq-item[open]{border-color:#b9d0ff;box-shadow:0 8px 28px rgba(9,40,92,.08)}
        .lic-faq-a{padding:0 20px 18px;color:#697893;font-size:14.5px;line-height:1.7}

        /* ── Candidature ───────────────────────────────────── */
        .lic-apply{display:grid;grid-template-columns:.85fr 1.15fr;gap:48px;align-items:start}
        .lic-apply-points{display:grid;gap:18px;margin-top:24px}
        .lic-apoint{display:flex;gap:13px;color:#12b981}
        .lic-apoint b{display:block;font-size:15.5px;margin-bottom:3px;color:#0b1830}
        .lic-apoint p{margin:0;font-size:14px;color:#697893;line-height:1.55}
        .lic-form-card{background:#fff;border:1px solid #dfe7f3;border-radius:24px;padding:32px 30px;box-shadow:0 24px 70px rgba(9,40,92,.13)}
        .lic-form-success{text-align:center;padding:52px 40px}
        .lic-field{margin-bottom:16px}
        .lic-field label{display:block;font-size:13.5px;font-weight:600;margin-bottom:7px;color:#0b1830}
        .lic-field input,.lic-field select,.lic-field textarea{width:100%;border:1px solid #dfe7f3;border-radius:12px;
          padding:13px 14px;font-size:15px;color:#0b1830;background:#fff;min-height:50px;
          transition:border-color .2s ease,box-shadow .2s ease;font-family:inherit}
        .lic-field textarea{min-height:110px;resize:vertical;line-height:1.5}
        .lic-field input:focus,.lic-field select:focus,.lic-field textarea:focus{
          border-color:#176bff;box-shadow:0 0 0 3px rgba(23,107,255,.13);outline:none}
        .lic-field small{display:block;font-size:12.5px;color:#697893;margin-top:6px}
        .lic-frow{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .lic-form-legal{font-size:12.5px;color:#697893;line-height:1.6;margin:14px 0 0}

        /* ── Prose / apprentissages / objectifs ────────────── */
        .lic-prose{max-width:720px;margin:0 auto}
        .lic-prose p{font-size:17px;line-height:1.7;color:#26385a;margin:0 0 18px}
        .lic-prose p:last-child{margin-bottom:0}
        .lic-learn-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;max-width:860px;margin:0 auto 36px}
        .lic-learn-card{background:#fff;border:1px solid #dfe7f3;border-radius:20px;padding:24px 22px;text-align:center;box-shadow:0 8px 28px rgba(9,40,92,.08)}
        .lic-learn-card b{display:block;font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);font-size:clamp(32px,3.6vw,44px);font-weight:800;letter-spacing:-.04em;line-height:1;color:#0d54d8}
        .lic-learn-card small{display:block;margin-top:9px;font-size:14px;color:#697893;line-height:1.45}
        .lic-expect .lic-expect-cap{margin:30px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:.12em;font-weight:700;color:#9fb3d4}
        .lic-expect-grid-2{margin-top:18px}
        .lic-expect .lic-expect-def{margin:22px 0 0;font-size:15px;color:#c0d5ed;line-height:1.65}

        /* ── Responsive ────────────────────────────────────── */
        @media(max-width:1060px){
          .lic-hero-grid,.lic-invest,.lic-faq-grid,.lic-apply{grid-template-columns:1fr;gap:40px}
          .lic-sim{grid-template-columns:1fr;gap:32px}
          .lic-path{grid-template-columns:1fr 1fr 1fr}
          .lic-cards,.lic-markets{grid-template-columns:1fr 1fr}
          .lic-card,.lic-card:nth-child(n+4){grid-column:auto}
          .lic-card:last-child:nth-child(odd){grid-column:1/-1}
          .lic-faq-side{position:static}
        }
        @media(max-width:900px){
          .lic-strip-grid{grid-template-columns:1fr 1fr;gap:26px}
          .lic-expect-grid{grid-template-columns:1fr}
        }
        @media(max-width:760px){
          .lic-section{padding:64px 0}
          .lic-section-navy{padding:64px 0}
          .lic-two-col,.lic-honest,.lic-fit,.lic-cards,.lic-markets,.lic-frow,.lic-vary-grid{grid-template-columns:1fr}
          .lic-card:last-child:nth-child(odd){grid-column:auto}
          .lic-path{grid-template-columns:1fr}
          .lic-expect{padding:32px 22px}
          .lic-price-card,.lic-form-card{padding:26px 20px}
          .lic-sim{padding:22px 18px}
          .lic-sim-row{flex-direction:column;align-items:flex-start;gap:6px}
          .lic-sim-row b{font-size:22px}
        }
        @media(max-width:520px){
          .lic-strip-grid{grid-template-columns:1fr;gap:22px}
          .lic-plan-pick{grid-template-columns:1fr}
        }
      `}</style>

      <div className="lv6">
        <LandingNav />
        <LandingV6Init />

        {/* ── HERO ─────────────────────────────────────────────── */}
        <header className="lic-hero">
          <div className="lic-wrap lic-hero-grid">
            <div className="lic-hero-copy">
              <span className="lic-kicker">Licence fondatrice · Première vague · 4 pays</span>
              <h1 className="lic-h1">
                Lancez TEKKIShop <span className="lic-grad">dans votre pays.</span>
              </h1>
              <p className="lic-lead">
                Un SaaS e-commerce déjà construit{shopsLabel && <>, avec plus de {shopsLabel} boutiques créées</>}.{' '}
                Vous devenez le Country Manager exclusif de votre pays pendant {LICENSE_DURATION_MONTHS} mois,
                vous gardez 100&nbsp;% des abonnements la première année, et vous n&apos;écrivez pas une ligne de code.
              </p>
              <div className="lic-ctas">
                <a href="#candidature" className="lic-btn lic-btn-primary" style={{ color: '#fff' }}>
                  Candidater pour mon pays <Arrow />
                </a>
                {simulatorVisible && <a href="#revenus" className="lic-btn lic-btn-secondary">Simuler mes revenus</a>}
              </div>
              <div className="lic-hero-note">
                <span><Chk size={16} /> Exclusivité nationale</span>
                <span><Chk size={16} /> Produit déjà en production</span>
              </div>
            </div>

            <aside className="lic-offer-card reveal">
              <h4>La licence en un coup d&apos;œil</h4>
              <div className="lic-offer-line">
                <Chk />
                <div><b>Exclusivité sur tout votre pays</b><small>Pendant {LICENSE_DURATION_MONTHS} mois, sous réserve des objectifs</small></div>
              </div>
              <div className="lic-offer-line">
                <Chk />
                <div><b>Année 1&nbsp;: 100&nbsp;% des abonnements. Année 2&nbsp;: 80&nbsp;%.</b><small>Hors frais d&apos;encaissement et de retrait</small></div>
              </div>
              <div className="lic-offer-line">
                <Chk />
                <div><b>Technique entièrement prise en charge</b><small>Hébergement, maintenance et évolutions</small></div>
              </div>
              <div className="lic-offer-line">
                <Chk />
                <div><b>4 semaines d&apos;accompagnement</b><small>Puis une réponse sous 48 heures ouvrées</small></div>
              </div>
              <div className="lic-offer-price">
                <div>
                  <b>{formatFcfa(LICENSE_PRICE_FCFA)}</b>
                  <small>CFA une fois, {LICENSE_DURATION_MONTHS}&nbsp;mois d&apos;exclusivité</small>
                </div>
                <a href="#investissement" style={{ fontSize: 13.5, fontWeight: 600, color: '#0d54d8' }}>Détail →</a>
              </div>
            </aside>
          </div>
        </header>

        {/* ── STATS STRIP ─────────────────────────────────────── */}
        <section className="lic-strip">
          <div className="lic-wrap lic-strip-grid">
            {shopsLabel && <div className="lic-stat"><b>{shopsLabel}+</b><small>boutiques créées</small></div>}
            <div className="lic-stat"><b>4</b><small>pays ouverts à la licence</small></div>
            {registeredTotal != null && <div className="lic-stat"><b>{formatNumberFr(registeredTotal)}</b><small>déjà inscrits dans ces 4 pays</small></div>}
            <div className="lic-stat"><b>0</b><small>ligne de code à écrire</small></div>
          </div>
        </section>

        {/* ── L'OPPORTUNITÉ ────────────────────────────────────── */}
        <section className="lic-section">
          <div className="lic-wrap">
            <div className="lic-head lic-center reveal">
              <span className="lic-label">L&apos;opportunité</span>
              <h2 className="lic-h2">Deux problèmes. <span className="lic-grad">Une seule réponse.</span></h2>
              <p className="lic-lead">La licence TEKKIShop existe parce que deux besoins se répondent, et que TEKKIShop les met en face l&apos;un de l&apos;autre.</p>
            </div>
            <div className="lic-two-col reveal">
              <div className="lic-panel lic-panel-a">
                <span className="lic-panel-tag">D&apos;un côté</span>
                <h3 className="lic-h3">Des commerçants qui vendent sans boutique en ligne</h3>
                <p>Dans chaque pays d&apos;Afrique de l&apos;Ouest, des vendeurs travaillent depuis WhatsApp, Instagram et TikTok. Ils renvoient les mêmes photos, répètent les mêmes prix, perdent des commandes dans leurs conversations. Peu d&apos;outils sont vraiment pensés pour eux, dans leur langue, à leur prix, avec leurs moyens de paiement. TEKKIShop s&apos;adresse à ceux qui vendent déjà et sont submergés de messages, pas aux débutants qui veulent se lancer.</p>
              </div>
              <div className="lic-panel lic-panel-b">
                <span className="lic-panel-tag">De l&apos;autre</span>
                <h3 className="lic-h3">Des entrepreneurs qui veulent lancer un SaaS</h3>
                <p>Construire et fiabiliser une plateforme de ce type prend du temps et demande un budget conséquent.</p>
              </div>
            </div>
            <p className="lic-arrow-join reveal">La licence branche les deux ↓</p>
          </div>
        </section>

        {/* ── POURQUOI FONDATRICE ──────────────────────────────── */}
        <section id="fondatrice" className="lic-section lic-section-sky">
          <div className="lic-wrap">
            <div className="lic-head lic-center reveal">
              <span className="lic-label">Licence fondatrice</span>
              <h2 className="lic-h2">Pourquoi <span className="lic-grad">« fondatrice »&nbsp;?</span></h2>
            </div>
            <div className="lic-prose reveal">
              <p>Vous faites partie de la première vague de licenciés TEKKIShop. Vous bénéficiez de conditions pensées pour des pionniers&nbsp;: {LICENSE_DURATION_MONTHS} mois d&apos;exclusivité et 100&nbsp;% des abonnements la première année.</p>
              <p>En échange, nous attendons de vous des retours réguliers&nbsp;: ce que disent les marchands, ce qui marche, ce qui bloque. Ce sont ces retours qui construiront le programme.</p>
              <p>Ce sont les conditions de la première vague.</p>
            </div>
          </div>
        </section>

        {/* ── CE QUE NOUS AVONS APPRIS ─────────────────────────── */}
        <section id="apprentissages" className="lic-section">
          <div className="lic-wrap">
            <div className="lic-head lic-center reveal">
              <span className="lic-label">Ce que nous avons appris</span>
              <h2 className="lic-h2">Ce que nous avons appris <span className="lic-grad">cette année.</span></h2>
            </div>
            <div className="lic-learn-grid reveal">
              <div className="lic-learn-card"><b>789</b><small>boutiques payantes en un mois</small></div>
              <div className="lic-learn-card"><b>53&nbsp;%</b><small>n&apos;ont pas renouvelé</small></div>
              {RETURN_RATE_CONFIRMED && <div className="lic-learn-card"><b>{RETURN_RATE_PCT}&nbsp;%</b><small>reviennent payer</small></div>}
            </div>
            <div className="lic-prose reveal">
              <p>En juillet, une seule vidéo TikTok nous a amené 789 boutiques payantes en Côte d&apos;Ivoire et au Sénégal, alors qu&apos;aucune version gratuite n&apos;existait.</p>
              <p>En août, 53&nbsp;% d&apos;entre elles n&apos;ont pas renouvelé leur abonnement. Beaucoup étaient des débutants, pas des vendeurs.</p>
              <p>Nous avons passé le mois à comprendre pourquoi.{RETURN_RATE_CONFIRMED && <> Parmi les marchands partis, {RETURN_RATE_PCT}&nbsp;% ont repris un abonnement payant.</>}</p>
              <p>Depuis, nous avons changé de cible&nbsp;: TEKKIShop s&apos;adresse uniquement à ceux qui vendent déjà. Nous poussons aussi les abonnements semestriels et annuels, plus simples pour les marchands que de penser à payer chaque mois.</p>
              <p>Ces leçons, vous en profitez dès le premier jour.</p>
            </div>
          </div>
        </section>

        {/* ── CE QUE VOUS RECEVEZ ──────────────────────────────── */}
        <section id="offre" className="lic-section lic-section-sky">
          <div className="lic-wrap">
            <div className="lic-head lic-center reveal">
              <span className="lic-label">Ce que contient la licence</span>
              <h2 className="lic-h2">Vous récupérez un produit fini. <span className="lic-grad">Pas un projet à construire.</span></h2>
              <p className="lic-lead">TEKKIShop tourne aujourd&apos;hui en production, avec de vrais marchands et de vraies transactions. Vous démarrez avec un produit déjà en production, pas avec une idée.</p>
            </div>
            <div className="lic-cards reveal">
              {[
                { ico: '🗺️', h: "L'exclusivité de votre pays", p: `Pendant ${LICENSE_DURATION_MONTHS} mois, aucune autre licence TEKKIShop ne sera accordée sur votre territoire, tant que vous atteignez les objectifs prévus. Vous êtes le seul interlocuteur de la marque dans votre pays.` },
                { ico: '🛠️', h: 'Votre déclinaison nationale', p: "Votre plateforme s'appelle « TEKKIShop <votre pays> ». Nous configurons votre adresse locale, vos coordonnées, vos moyens de paiement et vos tarifs convertis dans votre devise. Le nom et l'identité de la marque restent ceux de TEKKIShop." },
                { ico: '⚙️', h: 'Toute la technique, à notre charge', p: "Hébergement, sécurité, maintenance, corrections et nouvelles fonctionnalités : TEKKIShop s'en occupe pendant toute la durée de la licence. Vous n'avez aucune dette technique." },
                { ico: '🎓', h: "4 semaines d'accompagnement", p: "Configuration initiale, prise en main, support technique et conseils de positionnement, avec une réponse garantie sous 48 heures ouvrées." },
                { ico: '🏷️', h: 'La marque et sa preuve', p: `Vous exploitez sous « TEKKIShop <votre pays> »${shopsLabel ? ` et vous bénéficiez d'un produit déjà en production, qui compte déjà plus de ${shopsLabel} boutiques créées, ce qui montre l'intérêt pour le produit` : ''}. Votre licence démarre avec les nouveaux marchands de votre pays. Vous n'avez pas de marque à inventer.` },
              ].map(c => (
                <article key={c.h} className="lic-card">
                  <div className="lic-card-ico">{c.ico}</div>
                  <h3 className="lic-h3">{c.h}</h3>
                  <p>{c.p}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRANSPARENCE ─────────────────────────────────────── */}
        <section className="lic-section">
          <div className="lic-wrap">
            <div className="lic-head lic-center reveal">
              <span className="lic-label">Transparence</span>
              <h2 className="lic-h2">Ce que la licence n&apos;est <span className="lic-grad">pas.</span></h2>
              <p className="lic-lead">Autant le dire avant que vous ne le découvriez dans le contrat. Si un point ci-dessous est rédhibitoire pour vous, mieux vaut le savoir maintenant.</p>
            </div>
            <div className="lic-honest reveal">
              <div className="lic-hbox lic-hbox-in">
                <h3 className="lic-h3">Ce que vous obtenez</h3>
                <ul>
                  <li><Chk /> Le droit d&apos;exploiter commercialement TEKKIShop dans votre pays</li>
                  <li><Chk /> L&apos;exclusivité nationale pendant {LICENSE_DURATION_MONTHS} mois, sous réserve des objectifs</li>
                  <li><Chk /> 100&nbsp;% des abonnements rattachés à votre licence la première année (80&nbsp;% la deuxième), moins les frais d&apos;encaissement et de retrait.</li>
                  <li><Chk /> Une part des abonnements des marchands déjà inscrits que vous réactivez ou faites passer au paiement&nbsp;: 50&nbsp;% la première année, 40&nbsp;% la deuxième, selon les modalités du contrat</li>
                </ul>
                <p className="lic-hbox-note">Vous développez votre propre activité commerciale, dans le cadre des conditions du contrat.</p>
              </div>
              <div className="lic-hbox lic-hbox-out">
                <h3 className="lic-h3">Ce que vous n&apos;obtenez pas</h3>
                <ul>
                  <li><XMark /> Le code source du logiciel</li>
                  <li><XMark /> La propriété de la marque TEKKIShop</li>
                  <li><XMark /> Le droit de revendre le logiciel ou d&apos;accorder des sous-licences</li>
                  <li><XMark /> Un accès aux serveurs ou à la base de données</li>
                  <li><XMark /> La liberté de fixer vos propres tarifs d&apos;abonnement</li>
                </ul>
                <p className="lic-hbox-note">C&apos;est une licence d&apos;exploitation, pas une cession. Les tarifs sont définis par TEKKIShop et adaptés à votre devise locale.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SIMULATEUR (masqué en production tant que les valeurs de départs ne sont pas confirmées) ── */}
        {simulatorVisible && simScenarios && (
          <section id="revenus" className="lic-section-navy">
            <div className="lic-wrap">
              <div className="lic-head lic-center reveal">
                <span className="lic-label lic-label-dark">Votre modèle économique</span>
                <h2 className="lic-h2">Les marchands que vous recrutez s&apos;abonnent. <span style={{ color: '#ffb020' }}>Vous encaissez, selon les conditions du contrat.</span></h2>
                <p className="lic-lead">Chaque marchand rattaché à votre licence paie un abonnement pour garder sa boutique active. La première année, vous touchez 100&nbsp;% de ces abonnements. La deuxième année, 80&nbsp;%. Ces montants s&apos;entendent avant les frais d&apos;encaissement et de retrait, selon les conditions du contrat.</p>
              </div>
              <div className="reveal">
                <LicenceSimulator
                  testNotice={simMode === 'test' ? 'Valeurs de test, ne pas publier' : undefined}
                  scenarios={simScenarios}
                  plans={simPlans}
                  licencePrice={LICENSE_PRICE_FCFA}
                  objectives={FOUNDER_OBJECTIVES}
                  existingRate={EXISTING_MERCHANTS_RATE}
                  shares={FOUNDER_SHARES}
                  durationMonths={LICENSE_DURATION_MONTHS}
                />
              </div>
            </div>
          </section>
        )}

        {/* ── PAYS DISPONIBLES ─────────────────────────────────── */}
        <section id="pays" className="lic-section">
          <div className="lic-wrap">
            <div className="lic-head lic-center reveal">
              <span className="lic-label">Territoires</span>
              <h2 className="lic-h2">Un pays, <span className="lic-grad">un seul licencié.</span></h2>
              <p className="lic-lead">Une licence par pays, et pas davantage. Lorsqu&apos;un territoire est attribué, il sort de la liste jusqu&apos;à la fin de l&apos;accord.</p>
            </div>
            <div className="lic-markets reveal">
              {bySection.disponible.length > 0 && (
                <article className="lic-mk lic-mk-open">
                  <span className="lic-mk-tag">Disponible maintenant</span>
                  <h3 className="lic-h3">Pays ouverts</h3>
                  <p>TEKKIShop compte déjà des inscrits dans ces pays. Les paiements en ligne des marchands passent par notre partenaire Bictorys.</p>
                  <ul style={{ gap: 14 }}>
                    {bySection.disponible.map(t => {
                      const registered = registeredByCode[t.country_code]
                      return (
                        <li key={t.country_code} style={{ flexWrap: 'wrap' }}>
                          <i>{FLAG_BY_CODE[t.country_code] ?? '🌍'}</i> {t.name} <em>{STATUS_LABEL[t.status]}</em>
                          {registered != null && (
                            <span style={{ flexBasis: '100%', fontWeight: 500, fontSize: 13, color: '#26385a' }}>
                              {formatNumberFr(registered)} inscrits
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  <p className="lic-mk-foot">
                    Ces marchands se sont inscrits sans que nous soyons présents sur place. Ils restent rattachés à TEKKIShop, mais vous devenez leur interlocuteur local&nbsp;: pour chacun d&apos;entre eux que vous réactivez ou faites passer au paiement, vous touchez 50&nbsp;% de son abonnement la première année, 40&nbsp;% la deuxième, selon les modalités du contrat.
                  </p>
                  <p className="lic-mk-foot" style={{ borderTop: 0, paddingTop: 0, marginTop: 8 }}>
                    Les marchands qui s&apos;inscrivent dans votre pays après le début de votre licence vous sont rattachés à 100&nbsp;% (80&nbsp;% en année 2), selon les modalités du contrat. Celles qui arrivent par la publicité financée par TEKKIShop sont traitées comme les marchands déjà inscrits.
                  </p>
                </article>
              )}
              {bySection.attente.length > 0 && (
                <article className="lic-mk lic-mk-soon">
                  <span className="lic-mk-tag">Liste d&apos;attente</span>
                  <h3 className="lic-h3">Pays en liste d&apos;attente</h3>
                  <p>Le paiement mobile money n&apos;y est pas encore intégré. Rejoignez la liste d&apos;attente&nbsp;: nous vous prévenons dès l&apos;ouverture.</p>
                  <ul>
                    {bySection.attente.map(t => (
                      <li key={t.country_code}>
                        <i>{FLAG_BY_CODE[t.country_code] ?? '🌍'}</i> {t.name} <em>Liste d&apos;attente</em>
                      </li>
                    ))}
                  </ul>
                  <p className="lic-mk-foot">Un autre pays vous intéresse ? Indiquez-le dans votre candidature.</p>
                </article>
              )}
              {bySection.ferme.length > 0 && (
                <article className="lic-mk lic-mk-closed">
                  <span className="lic-mk-tag">Non disponible</span>
                  <h3 className="lic-h3">Territoires fermés</h3>
                  <p>Déjà attribués, ou exploités directement par TEKKIShop.</p>
                  <ul>
                    {bySection.ferme.map(t => (
                      <li key={t.country_code}>
                        <i>{FLAG_BY_CODE[t.country_code] ?? '🌍'}</i> {t.name} <em>{STATUS_LABEL[t.status]}</em>
                      </li>
                    ))}
                  </ul>
                  <p className="lic-mk-foot">Le Sénégal, la Côte d&apos;Ivoire et les marchés de la diaspora restent exploités directement par TEKKIShop.</p>
                </article>
              )}
            </div>
          </div>
        </section>

        {/* ── PARCOURS ─────────────────────────────────────────── */}
        <section className="lic-section lic-section-sky">
          <div className="lic-wrap">
            <div className="lic-head lic-center reveal">
              <span className="lic-label">Comment ça se passe</span>
              <h2 className="lic-h2">De la candidature au lancement, <span className="lic-grad">en 5 étapes.</span></h2>
              <p className="lic-lead">Entretien sous 5 jours, signature en 1 à 3 jours, solde jusqu&apos;à 30 jours après la signature, puis 1 à 2 semaines de configuration.</p>
            </div>
            <div className="lic-path reveal">
              {[
                { n: '01', h: 'Candidature', p: 'Vous indiquez le pays visé, votre parcours et votre plan pour vos cent premiers marchands.', t: '10 minutes' },
                { n: '02', h: 'Entretien', p: 'Un échange d\'une heure pour valider votre projet, votre marché et répondre à vos questions.', t: 'Sous 5 jours' },
                { n: '03', h: 'Accord et acompte', p: 'Signature du contrat et versement de 50 %. Votre pays est réservé pendant 30 jours. Sans le solde au 30e jour, il redevient libre et l\'acompte est perdu.', t: '1 à 3 jours' },
                { n: '04', h: 'Configuration', p: 'Dès réception du solde, nous préparons votre plateforme : domaine, moyens de paiement, visuels, et votre code de parrainage.', t: '1 à 2 semaines' },
                { n: '05', h: 'Lancement', p: 'Vous ouvrez, vous recrutez vos marchands, et nous vous accompagnons pendant 4 semaines.', t: 'Jour J' },
              ].map(s => (
                <article key={s.n} className="lic-pstep">
                  <div className="lic-pstep-n">{s.n}</div>
                  <h3 className="lic-h3">{s.h}</h3>
                  <p>{s.p}</p>
                  <span className="lic-pstep-time">{s.t}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── ATTENTES ─────────────────────────────────────────── */}
        <section className="lic-section">
          <div className="lic-wrap">
            <div className="lic-expect reveal">
              <span className="lic-label lic-label-dark">Ce que nous attendons de vous</span>
              <h2 className="lic-h2">Une exclusivité nationale se mérite.</h2>
              <p className="lic-lead">Bloquer un pays entier engage TEKKIShop autant que vous. L&apos;accord prévoit donc trois étapes, connues dès le départ.</p>
              <p className="lic-expect-cap">Boutiques payantes actives, recrutées via votre code de parrainage</p>
              <div className="lic-expect-grid">
                {FOUNDER_OBJECTIVES.map(o => (
                  <div key={o.months} className="lic-ebox">
                    <b>{o.count}</b>
                    <p>à {o.months} mois</p>
                  </div>
                ))}
              </div>
              <p className="lic-expect-def">
                Seules comptent les boutiques recrutées grâce à votre code de parrainage, qui sont actives et paient leur abonnement à la date de chaque objectif ({objectiveMonths}), et non le nombre total de boutiques recrutées depuis le début. Les inscriptions organiques vous sont rattachées, mais elles ne comptent pas dans les objectifs.
              </p>
              <div className="lic-expect-grid lic-expect-grid-2">
                <div className="lic-ebox">
                  <b>4 sem.</b>
                  <p>d&apos;accompagnement intensif de notre part pour vous aider à démarrer sur de bonnes bases.</p>
                </div>
                <div className="lic-ebox">
                  <b>48 h</b>
                  <p>de délai de réponse garanti sur vos sollicitations techniques, pendant toute la licence.</p>
                </div>
                <div className="lic-ebox">
                  <b>1 / mois</b>
                  <p>un rapport d&apos;activité et un appel avec l&apos;équipe TEKKIShop.</p>
                </div>
              </div>
              <p className="lic-expect-note">
                <strong>Si une étape n&apos;est pas atteinte</strong>, TEKKIShop peut rendre votre licence non exclusive pour la durée restante, après notification écrite. Vous gardez votre licence, qui devient non exclusive. Votre pays peut alors être ouvert à d&apos;autres acteurs. Aucun remboursement n&apos;est dû.
              </p>
            </div>
          </div>
        </section>

        {/* ── PROFIL ───────────────────────────────────────────── */}
        <section className="lic-section lic-section-sky">
          <div className="lic-wrap">
            <div className="lic-head lic-center reveal">
              <span className="lic-label">Est-ce pour vous</span>
              <h2 className="lic-h2">Cette licence ne convient <span className="lic-grad">pas à tout le monde.</span></h2>
              <p className="lic-lead">Nous n&apos;accordons pas une licence à chaque demande. Voici, honnêtement, à qui elle s&apos;adresse.</p>
            </div>
            <div className="lic-fit reveal">
              <div className="lic-fitbox lic-fit-yes">
                <h3 className="lic-h3">Elle est faite pour vous si…</h3>
                <ul>
                  <li><b>✓</b> Vous voulez lancer un SaaS mais ne voulez pas le construire vous-même.</li>
                  <li><b>✓</b> Vous connaissez votre marché local et savez comment atteindre les commerçants.</li>
                  <li><b>✓</b> Vous êtes à l&apos;aise avec la vente, le terrain et la relation client.</li>
                  <li><b>✓</b> Vous pouvez consacrer à ce projet du temps et un budget d&apos;acquisition.</li>
                  <li><b>✓</b> Vous acceptez de porter une marque existante plutôt que d&apos;en créer une.</li>
                  <li><b>✓</b> Vous visez des marchands qui vendent déjà sur WhatsApp, Instagram, TikTok ou Facebook et qui ont besoin de changer de façon de vendre, pas des débutants qui veulent se lancer.</li>
                  <li><b>✓</b> <span>Vous pouvez financer la licence <strong>et</strong> vos six premiers mois d&apos;activité (prospection, communication, déplacements).</span></li>
                  <li><b>✓</b> Vous acceptez de partager chaque mois ce que vous apprenez sur le terrain.</li>
                </ul>
              </div>
              <div className="lic-fitbox lic-fit-no">
                <h3 className="lic-h3">Elle n&apos;est pas faite pour vous si…</h3>
                <ul>
                  <li><b>✕</b> Vous cherchez un revenu passif sans effort commercial.</li>
                  <li><b>✕</b> Vous voulez posséder le code source ou revendre la technologie.</li>
                  <li><b>✕</b> Vous attendez une garantie de résultats ou de chiffre d&apos;affaires.</li>
                  <li><b>✕</b> Vous comptez traiter ce projet comme une activité secondaire occasionnelle.</li>
                  <li><b>✕</b> Vous voulez fixer vos propres tarifs d&apos;abonnement.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── INVESTISSEMENT ───────────────────────────────────── */}
        <section id="investissement" className="lic-section">
          <div className="lic-wrap">
            <div className="lic-head lic-center reveal">
              <span className="lic-label">Investissement</span>
              <h2 className="lic-h2">Un prix unique, <span className="lic-grad">le même dans les quatre pays ouverts.</span></h2>
              <p className="lic-lead">La licence coûte {formatFcfa(LICENSE_PRICE_FCFA)} CFA, payés une seule fois et valables {LICENSE_DURATION_MONTHS} mois, quel que soit le pays ouvert que vous choisissez.</p>
            </div>
            <div className="lic-invest reveal">
              <div className="lic-price-card">
                <div className="lic-price-top"><b>{formatFcfa(LICENSE_PRICE_FCFA)}</b><span>CFA, payés une seule fois. Valable {LICENSE_DURATION_MONTHS}&nbsp;mois.</span></div>
                <p className="lic-price-sub">{indicativeEquivalents(LICENSE_PRICE_FCFA)[0]} indicatif, parité fixe du franc CFA. Réglé en deux fois&nbsp;: 50&nbsp;% à la signature, 50&nbsp;% sous 30 jours.</p>
                <div className="lic-pay-split">
                  <div className="lic-pay-item">
                    <i>50%</i>
                    <div><b>À la signature</b><small>Votre pays est réservé 30 jours</small></div>
                  </div>
                  <div className="lic-pay-item">
                    <i>50%</i>
                    <div><b>Sous 30 jours</b><small>Sans le solde au 30e jour, le pays redevient libre et l&apos;acompte est perdu</small></div>
                  </div>
                </div>
                <div className="lic-renew">
                  <b>Un seul paiement de licence.</b> Année 1&nbsp;: vous gardez 100&nbsp;% des abonnements. Année 2&nbsp;: vous gardez 80&nbsp;%, et 20&nbsp;% reviennent à TEKKIShop. Hors frais d&apos;encaissement et de retrait.
                </div>
                <p className="lic-price-note">
                  Paiement par mobile money ou par carte bancaire via Stripe. Contrat soumis au droit OHADA, arbitrage CCJA à Abidjan.
                </p>
              </div>
              <div className="lic-side-list">
                <div className="lic-side-box">
                  <h3 className="lic-h3">Compris dans le prix</h3>
                  <ul>
                    <li><Chk size={16} /> L&apos;exclusivité de votre pays pendant {LICENSE_DURATION_MONTHS} mois, sous réserve des objectifs</li>
                    <li><Chk size={16} /> La configuration complète de votre plateforme</li>
                    <li><Chk size={16} /> L&apos;hébergement, la maintenance et toutes les évolutions</li>
                    <li><Chk size={16} /> 4 semaines d&apos;accompagnement, puis le support technique</li>
                    <li><Chk size={16} /> L&apos;usage de la marque TEKKIShop dans votre pays</li>
                    <li><Chk size={16} /> Votre code de parrainage et un relevé mensuel de vos marchands et de vos reversements</li>
                  </ul>
                </div>
                <div className="lic-side-box">
                  <h3 className="lic-h3">À votre charge</h3>
                  <ul>
                    <li className="no"><Dash size={16} /> Nom de domaine local et frais associés</li>
                    <li className="no"><Dash size={16} /> SMS, WhatsApp Business et emailing</li>
                    <li className="no"><Dash size={16} /> Frais d&apos;encaissement et de retrait sur vos abonnements</li>
                    <li className="no"><Dash size={16} /> Budget publicitaire et prospection</li>
                    <li className="no"><Dash size={16} /> <span><b>Le licencié&nbsp;:</b> prise en main des marchands, questions d&apos;usage, relances, recouvrement des abonnements.</span></li>
                  </ul>
                  <p style={{ margin: '14px 0 0', fontSize: 14, lineHeight: 1.5, color: '#26385a' }}><b>TEKKIShop&nbsp;:</b> bugs, paiements, fonctionnement de la plateforme, avec une réponse sous 48 heures ouvrées.</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section id="faq" className="lic-section lic-section-sky">
          <div className="lic-wrap">
            <div className="lic-faq-grid">
              <div className="lic-faq-side reveal">
                <span className="lic-label">Questions fréquentes</span>
                <h2 className="lic-h2">Ce que les candidats nous demandent.</h2>
                <p className="lic-lead">Une question qui n&apos;est pas traitée ici&nbsp;? Posez-la dans votre candidature, nous y répondrons pendant l&apos;entretien.</p>
                <a href="#candidature" className="lic-btn lic-btn-primary" style={{ marginTop: 10, color: '#fff' }}>
                  Candidater pour mon pays
                </a>
              </div>
              <div className="lic-faq-list reveal">
                {[
                  { q: 'Est-ce que je garde vraiment 100 % des abonnements ?', a: 'Oui, la première année, sur les marchands rattachés à votre licence, moins les frais d\'encaissement et de retrait. La deuxième année, vous en gardez 80 %. Sur les marchands déjà inscrits que vous réactivez, vous touchez 50 % la première année, 40 % la deuxième, selon les modalités du contrat. Le prix de la licence est votre seul paiement fixe envers nous. En année 2, 20 % des abonnements reviennent à TEKKIShop, et les frais d\'encaissement et de retrait sont déduits.' },
                  { q: 'Comment fonctionnent les abonnements semestriels et annuels ?', a: 'Nous les encaissons et vous reversons chaque mois la part correspondante (1/6 ou 1/12). Ainsi, si la licence s\'arrête, les marchands qui ont payé d\'avance continuent d\'être servis.' },
                  { q: 'Et les marchands déjà inscrits dans mon pays ?', a: 'Ils restent rattachés à TEKKIShop. Vous devenez leur interlocuteur local, et vous touchez une part de l\'abonnement de chacun de ceux que vous réactivez ou faites passer au paiement : 50 % la première année, 40 % la deuxième, selon les modalités du contrat.' },
                  { q: 'Sous quelle marque est-ce que j\'exploite ?', a: `Sous la marque TEKKIShop, déclinée à votre pays. C'est un avantage : vous exploitez un produit déjà en production${shopsLabel ? `, qui compte déjà plus de ${shopsLabel} boutiques créées, ce qui montre l'intérêt pour le produit` : ''}, plutôt que de construire une notoriété à partir de zéro. Votre licence démarre avec les nouveaux marchands de votre pays.` },
                  { q: 'Faut-il des compétences techniques ?', a: 'Non. TEKKIShop assure l\'hébergement, la maintenance, la sécurité et les évolutions du logiciel. Vous n\'avez ni serveur à gérer, ni code à écrire, ni développeur à recruter. Votre travail est commercial : trouver et accompagner des marchands.' },
                  { q: 'Qui s\'occupe du support des marchands ?', a: 'Vous accompagnez vos marchands au quotidien : prise en main, questions d\'usage, relances. Nous traitons tout ce qui est technique : bugs, paiements, fonctionnement de la plateforme, avec une réponse sous 48 heures ouvrées.' },
                  { q: 'Puis-je fixer mes propres tarifs d\'abonnement ?', a: 'Non. Les tarifs sont définis par TEKKIShop afin de garder une cohérence entre les pays. Ils sont en revanche adaptés à votre devise et au pouvoir d\'achat de votre marché : un même plan n\'affiche pas le même montant partout.' },
                  { q: 'Que se passe-t-il après la première année ?', a: 'La licence continue jusqu\'au 24e mois, sans nouveau paiement de licence. Le partage passe à 80 % pour vous et 20 % pour TEKKIShop. Au terme des 24 mois, une nouvelle licence peut être conclue par accord écrit, aux conditions alors en vigueur.' },
                  { q: 'Et si je n\'atteins pas un objectif ?', a: 'Les objectifs sont de 10 boutiques payantes actives à 3 mois, 30 à 6 mois et 60 à 12 mois, comptées sur les marchands recrutés via votre parrainage. Si une étape est manquée, TEKKIShop peut rendre votre licence non exclusive après notification écrite. Vous gardez votre licence, qui devient non exclusive. Votre pays peut alors être ouvert à d\'autres acteurs. Aucun remboursement n\'est dû.' },
                  { q: 'Pourquoi un rapport mensuel ?', a: 'Parce que vous connaissez votre marché mieux que nous. Ce que vous observez (objections, départs, besoins) nous aide à améliorer le produit pour vos marchands.' },
                  { q: 'Est-ce que je peux revendre ou céder ma licence ?', a: 'Pas sans notre accord écrit préalable. La licence est accordée à une personne ou une structure identifiée, en considération de son projet. Toute cession, sous-licence ou revente du logiciel est exclue.' },
                  { q: 'Qu\'en est-il de la commission sur les paiements en ligne des marchands ?', a: `TEKKIShop prélève une commission de ${MIN_COMMISSION_RATE} % à ${MAX_COMMISSION_RATE} % selon le pays sur les paiements en ligne des marchands, et supporte notamment les frais du processeur de paiement et des opérateurs. Elle n'est pas partagée avec le licencié : vous percevez les abonnements des marchands rattachés à votre licence, selon les conditions du contrat.` },
                  { q: 'Combien de temps avant de pouvoir lancer ?', a: 'Entretien sous 5 jours, signature en 1 à 3 jours, puis le solde jusqu\'à 30 jours après la signature. La configuration de votre plateforme (1 à 2 semaines) démarre après le paiement complet.' },
                  { q: 'Comment se fait le paiement depuis l\'étranger ?', a: 'Par mobile money ou par carte bancaire via Stripe. Nous confirmons par écrit la réception de chaque versement.' },
                  { q: 'Est-ce que je concurrence TEKKIShop ?', a: 'Non, vous le représentez. Votre territoire vous est réservé, et nous nous engageons à ne pas accorder d\'autre licence sur votre pays pendant la durée de l\'accord. En contrepartie, vous vous engagez à ne pas lancer d\'activité directement concurrente sur ce même territoire pendant la licence et les douze mois qui suivent.' },
                ].map((item, i) => (
                  <details key={i} className="lic-faq-item">
                    <summary>{item.q}</summary>
                    <p className="lic-faq-a">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CANDIDATURE ──────────────────────────────────────── */}
        <section id="candidature" className="lic-section lic-section-sky">
          <div className="lic-wrap lic-apply">
            <div className="reveal">
              <span className="lic-label">Candidature</span>
              <h2 className="lic-h2">Dites-nous quel pays vous voulez ouvrir.</h2>
              <p className="lic-lead">Nous étudions chaque candidature individuellement. Si votre projet nous paraît solide, nous vous proposons un entretien sous cinq jours.</p>
              <div className="lic-apply-points">
                <div className="lic-apoint">
                  <CircleChk />
                  <div>
                    <b>Aucun engagement à ce stade</b>
                    <p>Candidater ne vous engage à rien. Vous décidez après l&apos;entretien.</p>
                  </div>
                </div>
                <div className="lic-apoint">
                  <CircleChk />
                  <div>
                    <b>Réponse sous 5 jours ouvrés</b>
                    <p>Positive ou négative, vous aurez une réponse motivée.</p>
                  </div>
                </div>
                <div className="lic-apoint">
                  <CircleChk />
                  <div>
                    <b>Un pays est réservé 30 jours après la signature</b>
                    <p>Deux candidatures sur un même pays&nbsp;? La première signature suivie du paiement complet l&apos;emporte.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="reveal">
              <LicenceForm
                territories={formTerritories}
              />
            </div>
          </div>
        </section>

        <LandingFooter />
      </div>
    </>
  )
}
