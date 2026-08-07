import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME } from '@/constants'
import '../landing-v6.css'
import { LandingNav } from '@/components/landing-v6/LandingNav'
import { LandingFooter } from '@/components/landing-v6/LandingFooter'
import { LandingV6Init } from '@/components/landing-v6/LandingV6Init'

export const metadata = {
  title: `TEKKIShop vs Shopify — lequel choisir pour vendre en Afrique ? — ${APP_NAME}`,
  description: "Nous avons utilisé Shopify pendant 11 ans en Afrique. Voici honnêtement ce qui lui manque ici — et quand il reste le bon choix. Comparaison complète TEKKIShop vs Shopify.",
}

const CREDS = [
  { chiffre: '11 ans', label: "d'utilisation de Shopify" },
  { chiffre: '+9 000', label: 'commandes gérées en Afrique' },
  { chiffre: '+1 200', label: 'marchands sur TEKKIShop' },
]

const TABLE_ROWS = [
  { theme: "S'inscrire", sub: 'Le premier obstacle', sh: 'E-mail et mot de passe — carte bancaire demandée ensuite pour activer les paiements', tk: 'Ton numéro WhatsApp suffit — sans carte bancaire' },
  { theme: 'Encaisser tes clients', sub: 'Wave, Orange Money, MTN, Moov', sh: 'Aucun paiement mobile money africain', tk: 'Intégrés selon ton pays, dès le 1er jour' },
  { theme: 'Le paiement à la livraison', sub: 'La norme ici', sh: 'Statuts à mettre à jour à la main, cash non réconcilié', tk: 'Confirmation du livreur en 1 clic, paiements comptés automatiquement' },
  { theme: 'Tes livreurs', sub: 'Livreurs indépendants', sh: "Aucun outil — appels et dictée d'adresses", tk: 'Commande envoyée au livreur en 1 clic sur WhatsApp' },
  { theme: 'La langue', sub: 'Toi et ton équipe', sh: 'Interface et support essentiellement en anglais', tk: '100 % en français, pensé pour les marchands africains' },
  { theme: 'Le prix', sub: 'Et la devise', sh: '27 $/mois (≈ 17 000 FCFA), facturé en dollars', tk: 'Dès 2 900 FCFA/mois — en FCFA, euros ou CAD' },
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
    "Tu veux vendre dès aujourd'hui, depuis ton téléphone, sans configuration technique",
    'Tu travailles avec des livreurs indépendants et tu veux que le cash soit compté tout seul',
  ],
}

const FAQS = [
  {
    q: 'Est-ce vraiment moins cher que Shopify ?',
    a: "Oui, nettement — surtout une fois Shopify équipé des apps nécessaires pour l'Afrique (WhatsApp, livraison, suivi). Shopify Basic seul coûte environ 17 000 FCFA/mois, facturé en dollars. TEKKIShop démarre à 2 900 FCFA/mois, tout inclus, payable par mobile money.",
  },
  {
    q: 'TEKKIShop a-t-il autant de fonctionnalités que Shopify ?',
    a: "Non, et c'est assumé : Shopify a des milliers d'apps pour des milliers de cas d'usage. TEKKIShop a exactement les fonctionnalités dont un marchand en Afrique a besoin — paiements locaux, livreurs, WhatsApp, cash à la livraison, produits digitaux — sans que tu aies à chercher, installer et payer quoi que ce soit en plus.",
  },
  {
    q: 'Puis-je importer mes produits existants dans TEKKIShop ?',
    a: "Oui. Depuis ton tableau de bord, importe tous tes produits en une fois via un fichier CSV — pas besoin de tout ressaisir à la main, produit par produit.",
  },
  {
    q: 'Puis-je garder ma boutique Shopify pendant que je teste TEKKIShop ?',
    a: "Bien sûr. Créer ta boutique TEKKIShop est gratuit, et rien ne t'oblige à fermer l'ancienne. Beaucoup de marchands font tourner les deux quelques semaines, comparent leurs ventes, puis choisissent.",
  },
  {
    q: "Et si je change d'avis ?",
    a: "Tu peux exporter tes données et arrêter ton abonnement à tout moment, sans frais ni engagement. Ta boutique t'appartient — nos marchands restent parce que ça marche, pas parce qu'ils sont bloqués.",
  },
]

const CHECK_ICO = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12"/></svg>
const CROSS_ICO = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const ARROW_ICO = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, flexShrink: 0, marginTop: 2 }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>

export default function PourquoiPasShopifyPage() {
  return (
    <>
      <style>{`
        .pg-wrap{max-width:1200px;margin:0 auto;padding:0 24px}
        .pg-wrap-md{max-width:900px;margin:0 auto;padding:0 24px}
        .pg-wrap-sm{max-width:720px;margin:0 auto;padding:0 24px}

        /* TYPOGRAPHY */
        .pg-eyebrow{display:inline-flex;align-items:center;gap:8px;padding:6px 13px;border-radius:999px;font-size:11.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;margin-bottom:20px}
        .pg-h1{font-family:var(--lv6-display,"Bricolage Grotesque","Inter",system-ui,sans-serif);font-size:clamp(40px,5.5vw,68px);line-height:1;letter-spacing:-.05em;margin:0 0 22px;color:#101828}
        .pg-h2{font-family:var(--lv6-display,"Bricolage Grotesque","Inter",system-ui,sans-serif);font-size:clamp(30px,4vw,50px);line-height:1.05;letter-spacing:-.045em;margin:0 0 16px;color:#101828}
        .pg-h3{font-family:var(--lv6-display,"Bricolage Grotesque","Inter",system-ui,sans-serif);font-size:19px;font-weight:700;letter-spacing:-.02em;margin:0 0 8px;color:#101828}
        .pg-lead{font-size:18px;color:#667085;line-height:1.65;margin:0 0 28px;max-width:680px}
        .pg-accent{color:#2f8cff}
        .pg-section{padding:100px 0}
        .pg-section-soft{background:#f7f8fc}

        /* HERO */
        .sh-hero{background:linear-gradient(180deg,#f0f6ff 0%,#fff 100%);padding:80px 0 72px}
        .sh-hero-inner{max-width:800px;margin:0 auto;text-align:center;padding:0 24px}
        .sh-stats{display:flex;flex-wrap:wrap;justify-content:center;gap:28px 52px;margin-top:36px;padding-top:32px;border-top:1px solid #e6e9ef}
        .sh-stat-val{font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);font-size:clamp(24px,3.5vw,32px);font-weight:800;letter-spacing:-.04em;color:#101828;margin:0}
        .sh-stat-label{font-size:12px;color:#667085;margin-top:3px}

        /* QUOTE */
        .sh-quote{border-radius:28px;background:#0b1830;color:#fff;padding:44px 48px;position:relative;overflow:hidden}
        .sh-quote-text{font-size:17px;line-height:1.75;color:#b8cfe8;margin:0 0 16px}
        .sh-quote-text strong{color:#e8f0f8}

        /* TABLE */
        .sh-table-wrap{border-radius:22px;border:1px solid #e0e5ef;overflow:hidden;background:#fff;box-shadow:0 20px 64px rgba(16,24,40,.08);overflow-x:auto}
        .sh-thead{display:grid;grid-template-columns:1.2fr 1fr 1fr;background:#0b1830;color:#fff;font-size:13.5px;font-weight:700;min-width:600px}
        .sh-th{padding:15px 20px}
        .sh-th.blue{background:#2f8cff}
        .sh-trow{display:grid;grid-template-columns:1.2fr 1fr 1fr;border-top:1px solid #edf0f5;font-size:14px;min-width:600px}
        .sh-td{padding:15px 20px}
        .sh-td-theme{background:#f7f9fd;font-weight:600;color:#101828}
        .sh-td-sub{font-size:11.5px;color:#98a2b3;font-weight:400;display:block;margin-top:2px}
        .sh-td-sh{display:flex;align-items:flex-start;gap:8px;color:#667085}
        .sh-td-tk{display:flex;align-items:flex-start;gap:8px;background:rgba(47,140,255,.05);font-weight:600;color:#0d2248}
        .sh-table-note{text-align:center;font-size:12px;color:#9baec0;margin-top:14px}

        /* COST */
        .sh-cost-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:760px;margin:0 auto}
        .sh-cost-card{border-radius:22px;padding:28px 30px;border:1px solid}
        .sh-cost-row{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:11px 0;border-bottom:1px dashed rgba(16,24,40,.1);font-size:14px}
        .sh-cost-row-label{color:#475467}
        .sh-cost-row-sub{font-size:11.5px;color:#98a2b3;display:block;margin-top:1px}
        .sh-cost-row-val{font-weight:700;color:#101828;flex-shrink:0}
        .sh-cost-total{display:flex;justify-content:space-between;padding-top:16px;font-size:17px;font-weight:800;font-family:var(--lv6-display,"Bricolage Grotesque",system-ui)}

        /* HONEST */
        .sh-honest-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:760px;margin:40px auto 0}
        .sh-honest-card{border-radius:22px;border:1px solid;padding:28px}
        .sh-honest-row{display:flex;align-items:flex-start;gap:10px;padding:10px 0;font-size:14px;color:#475467;line-height:1.5}
        .sh-honest-row:not(:first-child){border-top:1px dashed #e6e9ef}

        /* MIGRATION */
        .sh-migrate{border-radius:24px;border:2px dashed #2f8cff;background:#f0f6ff;padding:44px;text-align:center;max-width:760px;margin:0 auto}
        .sh-migrate-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:20px}
        .sh-migrate-chip{font-size:13.5px;font-weight:700;background:#fff;border:1px solid #dce5f0;border-radius:999px;padding:9px 18px;color:#344054}

        /* FAQ */
        .sh-faq{max-width:680px;margin:40px auto 0;display:grid;gap:10px}
        .sh-faq details{border:1px solid #e6e9ef;border-radius:16px;overflow:hidden;background:#fff}
        .sh-faq summary{padding:18px 20px;font-weight:700;font-size:14.5px;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:16px;color:#101828}
        .sh-faq summary::-webkit-details-marker{display:none}
        .sh-faq summary::after{content:"+";font-size:22px;color:#9baec0;flex-shrink:0;transition:.2s;line-height:1}
        .sh-faq details[open] summary::after{content:"−"}
        .sh-faq-a{padding:0 20px 18px;color:#667085;font-size:14.5px;line-height:1.7}

        /* FINAL CTA */
        .sh-cta{background:linear-gradient(135deg,#1251b4,#2f8cff);color:#fff;text-align:center;padding:96px 24px}
        .sh-cta .pg-h2{color:#fff}
        .sh-cta-sub{font-size:17px;color:rgba(255,255,255,.75);line-height:1.65;max-width:560px;margin:0 auto 32px}
        .sh-cta-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:24px}
        .sh-cta-chip{font-size:13px;font-weight:700;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:7px 14px;color:#fff}

        /* BUTTONS */
        .pg-btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 28px;border-radius:14px;font-size:15px;font-weight:800;background:#2f8cff;color:#fff;text-decoration:none;border:none;cursor:pointer;transition:.22s;white-space:nowrap}
        .pg-btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(47,140,255,.3)}
        .pg-btn-white{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 28px;border-radius:14px;font-size:15px;font-weight:800;background:rgba(255,255,255,.12);color:#fff;border:1.5px solid rgba(255,255,255,.25);text-decoration:none;cursor:pointer;transition:.22s;white-space:nowrap}
        .pg-btn-white:hover{background:rgba(255,255,255,.2)}
        .pg-btn-outline{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 28px;border-radius:14px;font-size:15px;font-weight:700;background:#fff;color:#101828;border:1.5px solid #dce5f0;text-decoration:none;cursor:pointer;transition:.22s}
        .pg-btn-outline:hover{transform:translateY(-2px);border-color:#c0ccd9}

        @media(max-width:820px){
          .sh-hero{padding:56px 0 48px}
          .sh-quote{padding:28px 24px}
          .sh-cost-grid,.sh-honest-grid{grid-template-columns:1fr}
          .pg-section{padding:68px 0}
          .sh-cta{padding:72px 24px}
        }
        @media(max-width:540px){
          .pg-section{padding:52px 0}
          .sh-migrate{padding:28px 20px}
        }
      `}</style>

      <div className="lv6">
        <LandingNav />
        <LandingV6Init />

        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="sh-hero">
          <div className="sh-hero-inner">
            <span className="pg-eyebrow" style={{ background: '#eff4ff', color: '#2f8cff' }}>
              TEKKIShop vs Shopify
            </span>
            <h1 className="pg-h1">
              Shopify est un excellent outil.{' '}
              <span className="pg-accent">On l&apos;a utilisé pendant 11 ans.</span>
            </h1>
            <p className="pg-lead" style={{ margin: '0 auto', textAlign: 'center' }}>
              C&apos;est justement pour ça qu&apos;on sait exactement ce qui lui manque en Afrique.{' '}
              <strong style={{ color: '#344054' }}>TEKKIShop n&apos;a pas été construit contre Shopify — il a été construit à partir de tout ce que Shopify nous a fait vivre ici.</strong>{' '}
              Voici la comparaison honnête.
            </p>
            <div className="sh-stats">
              {CREDS.map(c => (
                <div key={c.label} style={{ textAlign: 'center' }}>
                  <p className="sh-stat-val">{c.chiffre}</p>
                  <p className="sh-stat-label">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Histoire ────────────────────────────────────────── */}
        <section className="pg-section" style={{ background: '#fff' }}>
          <div className="pg-wrap-md">
            <div className="sh-quote">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 36, height: 36, color: '#2f8cff', opacity: 0.5, marginBottom: 20 }}>
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
              </svg>
              <div style={{ display: 'grid', gap: 14 }}>
                <p className="sh-quote-text">
                  Pendant des années, chaque soir, je faisais la même chose : ouvrir Shopify et{' '}
                  <strong>mettre à jour à la main le statut de toutes les commandes payées à la livraison</strong>.
                  Une par une. Parce que Shopify ne sait pas qu&apos;ici, le client paie le livreur en cash, et que ce cash doit être compté quelque part.
                </p>
                <p className="sh-quote-text">
                  J&apos;appelais mes livreurs pour leur dicter les adresses. Je perdais des ventes Wave parce qu&apos;il n&apos;existait aucun moyen de l&apos;intégrer proprement.{' '}
                  <strong>Shopify n&apos;était pas mauvais — il était juste pensé pour un monde qui n&apos;est pas le nôtre.</strong>
                </p>
                <p className="sh-quote-text">Chaque fonctionnalité de TEKKIShop est née d&apos;une de ces soirées-là.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.1)' }}>
                <div style={{ position: 'relative', width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(255,255,255,.2)' }}>
                  <Image src="/avatars/ibuka.jpg" alt="Ibuka Ndjoli" fill className="object-cover" sizes="48px" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, margin: 0, color: '#fff' }}>Ibuka Ndjoli</p>
                  <p style={{ fontSize: 13, color: '#6a8ba8', margin: 0 }}>Fondateur de TEKKIShop · 11 ans d&apos;e-commerce entre l&apos;Europe et l&apos;Afrique</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tableau comparatif ──────────────────────────────── */}
        <section className="pg-section pg-section-soft">
          <div className="pg-wrap">
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <span className="pg-eyebrow" style={{ background: '#eff4ff', color: '#1a56db' }}>Comparaison point par point</span>
              <h2 className="pg-h2">Les différences qui comptent <span className="pg-accent">vraiment ici.</span></h2>
              <p className="pg-lead" style={{ margin: '0 auto' }}>
                Pas une liste de 200 fonctionnalités — juste ce qui change ta vie de marchand en Afrique ou dans la diaspora.
              </p>
            </div>

            <div className="pg-wrap-md" style={{ padding: 0 }}>
              <div className="sh-table-wrap">
                <div className="sh-thead">
                  <div className="sh-th">Ce qui compte pour toi</div>
                  <div className="sh-th">Shopify</div>
                  <div className="sh-th blue">TEKKIShop</div>
                </div>
                {TABLE_ROWS.map(r => (
                  <div key={r.theme} className="sh-trow">
                    <div className="sh-td sh-td-theme">
                      {r.theme}
                      <span className="sh-td-sub">{r.sub}</span>
                    </div>
                    <div className="sh-td sh-td-sh">
                      <span style={{ color: '#e03' }}>{CROSS_ICO}</span>
                      <span>{r.sh}</span>
                    </div>
                    <div className="sh-td sh-td-tk">
                      <span style={{ color: '#12b76a' }}>{CHECK_ICO}</span>
                      <span>{r.tk}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="sh-table-note">
                Comparaison établie en juillet 2026 sur la base des offres publiques de Shopify.
              </p>
            </div>
          </div>
        </section>

        {/* ── Le vrai coût ────────────────────────────────────── */}
        <section className="pg-section">
          <div className="pg-wrap">
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <span className="pg-eyebrow" style={{ background: '#fff4e5', color: '#b54708' }}>Le calcul que personne ne fait</span>
              <h2 className="pg-h2">Le prix affiché n&apos;est pas <span className="pg-accent">le prix réel.</span></h2>
              <p className="pg-lead" style={{ margin: '0 auto' }}>
                Pour faire fonctionner Shopify en Afrique, il faut empiler des applications tierces. Voici la facture complète.
              </p>
            </div>

            <div className="sh-cost-grid">
              <div className="sh-cost-card" style={{ borderColor: '#fecaca', background: '#fff8f8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20, color: '#dc2626' }}>
                    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8H8m8 4H8m8 4H8"/>
                  </svg>
                  <h3 className="pg-h3" style={{ margin: 0 }}>Shopify, équipé pour l&apos;Afrique</h3>
                </div>
                {[
                  { l: 'Abonnement Basic', s: 'Facturé en dollars', v: '≈ 17 000 FCFA' },
                  { l: 'App notifications WhatsApp', s: 'Application tierce payante', v: '≈ 6 000 FCFA' },
                  { l: 'App paiement à la livraison', s: 'Application tierce payante', v: '≈ 5 000 FCFA' },
                  { l: 'Paiements Wave / Orange Money', s: 'Toujours pas disponibles', v: '—' },
                ].map(item => (
                  <div key={item.l} className="sh-cost-row">
                    <span className="sh-cost-row-label">{item.l}<span className="sh-cost-row-sub">{item.s}</span></span>
                    <strong className="sh-cost-row-val">{item.v}</strong>
                  </div>
                ))}
                <div className="sh-cost-total" style={{ color: '#dc2626' }}>
                  <span>Par mois</span><span>≈ 28 000 FCFA</span>
                </div>
              </div>

              <div className="sh-cost-card" style={{ borderColor: '#a7f3d0', background: '#f0fdf4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20, color: '#059669' }}>
                    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8H8m8 4H8m8 4H8"/>
                  </svg>
                  <h3 className="pg-h3" style={{ margin: 0 }}>TEKKIShop, tout inclus</h3>
                </div>
                {[
                  { l: 'Abonnement Découverte', s: 'En FCFA, payable par mobile money', v: '2 900 FCFA' },
                  { l: 'Notifications SMS automatiques', s: 'Clients, vendeur et livreur', v: 'Inclus' },
                  { l: 'Livreurs + paiement à la livraison', s: 'Avec réconciliation automatique', v: 'Inclus' },
                  { l: 'Wave, Orange Money, MTN, Moov', s: 'Selon ton pays', v: 'Inclus' },
                ].map(item => (
                  <div key={item.l} className="sh-cost-row">
                    <span className="sh-cost-row-label">{item.l}<span className="sh-cost-row-sub">{item.s}</span></span>
                    <strong className="sh-cost-row-val">{item.v}</strong>
                  </div>
                ))}
                <div className="sh-cost-total" style={{ color: '#059669' }}>
                  <span>Par mois</span><span>Dès 2 900 FCFA</span>
                </div>
              </div>
            </div>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#9baec0', maxWidth: 560, margin: '16px auto 0' }}>
              Montants indicatifs convertis en FCFA pour comparaison. Commission de 3 % sur les paiements mobile money côté TEKKIShop.
            </p>
          </div>
        </section>

        {/* ── En toute honnêteté ──────────────────────────────── */}
        <section className="pg-section pg-section-soft">
          <div className="pg-wrap">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span className="pg-eyebrow" style={{ background: '#eff4ff', color: '#2f8cff' }}>En toute honnêteté</span>
              <h2 className="pg-h2">Parfois, Shopify est <span className="pg-accent">le bon choix.</span></h2>
              <p className="pg-lead" style={{ margin: '0 auto' }}>
                On ne va pas te mentir pour te convaincre. Voici comment choisir, selon ta situation réelle.
              </p>
            </div>

            <div className="sh-honest-grid">
              <div className="sh-honest-card" style={{ borderColor: '#e6e9ef', background: '#fff' }}>
                <h3 className="pg-h3" style={{ marginBottom: 16 }}>Choisis Shopify si…</h3>
                {HONNETE.shopify.map((t, i) => (
                  <div key={t} className="sh-honest-row" style={i === 0 ? { borderTop: 0, paddingTop: 0 } : {}}>
                    <span style={{ color: '#98a2b3', marginTop: 1 }}>{ARROW_ICO}</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <div className="sh-honest-card" style={{ borderColor: '#2f8cff', borderWidth: 2, background: '#fff' }}>
                <h3 className="pg-h3" style={{ marginBottom: 16, color: '#2f8cff' }}>Choisis TEKKIShop si…</h3>
                {HONNETE.tekki.map((t, i) => (
                  <div key={t} className="sh-honest-row" style={i === 0 ? { borderTop: 0, paddingTop: 0 } : {}}>
                    <span style={{ color: '#2f8cff', marginTop: 1 }}>{ARROW_ICO}</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: 16, fontWeight: 600, color: '#344054', maxWidth: 560, margin: '36px auto 0', lineHeight: 1.6 }}>
              La question n&apos;est pas « quel outil est le meilleur ? » mais{' '}
              <span className="pg-accent">« quel outil a été construit pour ton marché ? »</span>
            </p>
          </div>
        </section>

        {/* ── Migration ───────────────────────────────────────── */}
        <section className="pg-section">
          <div className="pg-wrap">
            <div className="sh-migrate">
              <h2 className="pg-h2">Déjà sur Shopify (ou ailleurs) ?</h2>
              <p className="pg-lead" style={{ margin: '12px auto 0', textAlign: 'center', maxWidth: 540 }}>
                Pas besoin de tout ressaisir à la main.{' '}
                <strong style={{ color: '#344054' }}>Importe tous tes produits en une fois avec un simple fichier CSV</strong>{' '}
                — noms, prix, descriptions — et compare les deux boutiques par toi-même.
              </p>
              <div className="sh-migrate-chips">
                {['1 · Exporte ton CSV depuis Shopify', '2 · Importe-le dans TEKKIShop', '3 · Compare, puis décide'].map(s => (
                  <span key={s} className="sh-migrate-chip">{s}</span>
                ))}
              </div>
              <div style={{ marginTop: 28 }}>
                <Link href="/start" className="pg-btn-primary">
                  Importer ma boutique et comparer
                  {ARROW_ICO}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────── */}
        <section className="pg-section pg-section-soft">
          <div className="pg-wrap">
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <span className="pg-eyebrow" style={{ background: '#eff4ff', color: '#2f8cff' }}>Questions fréquentes</span>
              <h2 className="pg-h2">Tout ce que tu veux savoir.</h2>
            </div>
            <div className="sh-faq">
              {FAQS.map(f => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p className="sh-faq-a">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────── */}
        <section className="sh-cta">
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <span className="pg-eyebrow" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>
              Prêt à tester ?
            </span>
            <h2 className="pg-h2" style={{ color: '#fff' }}>
              Ne nous crois pas sur parole. Compare par toi-même.
            </h2>
            <p className="sh-cta-sub">
              Crée ta boutique gratuitement en 5 minutes, importe tes produits, et regarde laquelle des deux te fait vendre le plus simplement.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              <Link href="/start" className="pg-btn-primary" style={{ background: '#fff', color: '#1251b4' }}>
                Créer ma boutique gratuitement
                {ARROW_ICO}
              </Link>
              <Link href="/#tarifs" className="pg-btn-white">Voir les tarifs</Link>
            </div>
            <div className="sh-cta-chips">
              {['Boutique gratuite à créer', 'Sans carte bancaire', 'Import CSV en 1 fois'].map(s => (
                <span key={s} className="sh-cta-chip">{s}</span>
              ))}
            </div>
          </div>
        </section>

        <LandingFooter />
      </div>
    </>
  )
}
