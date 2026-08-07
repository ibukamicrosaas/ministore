import Image from 'next/image'
import Link from 'next/link'
import { APP_NAME } from '@/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import '../landing-v6.css'
import { LandingNav } from '@/components/landing-v6/LandingNav'
import { LandingFooter } from '@/components/landing-v6/LandingFooter'
import { LandingV6Init } from '@/components/landing-v6/LandingV6Init'
import { JourneyTabs } from './JourneyTabs'
import { RevenueCalcV6 } from './RevenueCalcV6'

export const metadata = {
  title: `Vendre des produits digitaux — Ebooks, guides, templates — ${APP_NAME}`,
  description: "Vends tes ebooks, guides, templates, formations et autres produits digitaux avec TEKKIShop. Livraison automatique, paiement mobile money inclus.",
}

const PAYMENT_LOGOS = [
  { name: 'Wave', src: '/logo-payments/wave_1.svg' },
  { name: 'Orange Money', src: '/logo-payments/om_1.svg' },
  { name: 'MTN', src: '/logo-payments/mtn_1.svg' },
  { name: 'Flooz', src: '/logo-payments/flooz.png' },
  { name: 'T-Money', src: '/logo-payments/tmoney.png' },
  { name: 'Moov', src: '/logo-payments/moov_1.svg' },
]

const USE_CASES = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    titre: 'Auteur ou expert',
    texte: 'Ebook, guide pratique, méthode, checklist, recueil ou workbook.',
    ex: 'Ex. : ebook à 4 500 FCFA',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
    titre: 'Coach ou formateur',
    texte: 'Support de formation, exercices, ressources et mini-programmes.',
    ex: 'Ex. : guide à 10 000 FCFA',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg>,
    titre: 'Designer ou créatif',
    texte: 'Templates, kits visuels, modèles Canva, packs et ressources créatives.',
    ex: 'Ex. : pack à 6 000 FCFA',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
    titre: 'Musicien ou producteur',
    texte: 'Beats, jingles, effets sonores, partitions et fichiers audio.',
    ex: 'Ex. : beat à 25 000 FCFA',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>,
    titre: 'Consultant ou freelance',
    texte: 'Tableaux Excel, modèles de contrats, audits et outils métier.',
    ex: 'Ex. : modèle à 8 000 FCFA',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>,
    titre: 'Créateur de contenu',
    texte: 'Calendriers éditoriaux, scripts, prompts, fiches pratiques et packs.',
    ex: 'Ex. : pack à 5 000 FCFA',
  },
]

const FEATURES = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
    titre: 'Boutique professionnelle',
    texte: 'Présente ton produit avec une page claire, cohérente avec ta marque et adaptée au mobile.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    titre: 'Paiements locaux',
    texte: 'Permets à tes clients de payer avec les solutions disponibles sur leur marché.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    titre: 'Livraison automatique',
    texte: 'Le fichier est transmis sans que tu aies à vérifier et répondre à chaque commande.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    titre: 'Produits physiques et digitaux',
    texte: 'Gère les deux types de produits depuis une seule boutique TEKKIShop.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>,
    titre: 'Gestion depuis le téléphone',
    texte: 'Ajoute tes produits, suis tes commandes et pilote ta boutique où que tu sois.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    titre: 'Suivi de ton activité',
    texte: 'Garde une vue claire sur tes ventes, tes produits et tes commandes.',
  },
]

const PLANS = [
  {
    tag: 'POUR COMMENCER',
    name: 'Découverte',
    price: '2 900',
    desc: 'Pour lancer une première offre digitale et valider ton marché simplement.',
    features: [
      "Jusqu'à 10 produits en ligne",
      'Paiement mobile money et à la livraison',
      'Vente de produits digitaux',
      'Commandes et livraison automatique',
      'Assistant IA (20 messages/jour)',
      '3 % sur les paiements en ligne, pour couvrir les frais des opérateurs',
    ],
    cta: { label: 'Commencer avec Découverte', href: '/start?plan=decouverte', primary: false },
  },
  {
    tag: 'LE PLUS CHOISI',
    name: 'Business',
    price: '4 900',
    desc: 'Pour les créateurs qui veulent vendre régulièrement et développer plusieurs offres.',
    features: [
      'Produits illimités',
      'Paiement mobile money et à la livraison',
      'Notifications SMS automatiques',
      'Codes promo pour fidéliser tes clients',
      'Tableau de bord avancé',
      'Assistant IA (50 messages/jour)',
    ],
    cta: { label: 'Choisir Business', href: '/start?plan=business', primary: true },
    best: true,
  },
  {
    tag: 'POUR ALLER PLUS LOIN',
    name: 'Pro',
    price: '9 900',
    desc: 'Pour les marques et créateurs ayant des besoins plus avancés.',
    features: [
      "Tout ce qu'offre Business",
      'Assistant IA illimité',
      '0 % de commission sur tes paiements',
      'Domaine personnalisé (tonsite.com)',
      'Support prioritaire par WhatsApp',
      'Export Excel des commandes',
    ],
    cta: { label: 'Choisir Pro', href: '/start?plan=pro', primary: false },
  },
]

const FAQS = [
  { q: 'Quels produits digitaux puis-je vendre ?', a: "Tu peux vendre notamment des ebooks, guides, templates, fichiers audio, ressources de formation, documents, tableaux et packs téléchargeables. Formats acceptés : PDF, EPUB, ZIP, DOCX, XLSX, MP3 et autres." },
  { q: "Ai-je besoin d'un ordinateur ?", a: "Non. La création et la gestion de ta boutique sont pensées pour être réalisées depuis ton téléphone." },
  { q: 'Comment mon client reçoit-il son fichier ?', a: "Après validation de son paiement, l'accès au fichier lui est transmis automatiquement, sans intervention manuelle de ta part." },
  { q: 'Puis-je vendre des produits physiques et digitaux ?', a: "Oui. TEKKIShop te permet de réunir des produits physiques et digitaux dans le même environnement." },
  { q: 'Faut-il choisir un plan pour pouvoir vendre ?', a: "Non. Ta boutique est en ligne et peut recevoir des commandes dès que tu publies ton premier produit. Tes 3 premières commandes sont offertes. Tu choisis un plan seulement pour continuer à en recevoir au-delà." },
  { q: 'Comment sont calculés mes gains ?', a: "Tu fixes le prix de ton produit. Tes revenus dépendent du nombre de ventes, de la commission applicable (3 % sur les paiements en ligne) et du plan d'abonnement choisi." },
]

const CHECK_ICO = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>

export default async function ProduitsDigitauxPage() {
  const admin = createAdminClient()
  const { count: shopCount } = await admin
    .from('shops')
    .select('id', { count: 'exact', head: true })

  const shopCountDisplay = shopCount ? shopCount.toLocaleString('fr-FR') : '1 400+'

  return (
    <>
      <style>{`
        /* ── Layout ────────────────────────────── */
        .pd-wrap{max-width:1180px;margin:0 auto;padding:0 24px}

        /* ── Eyebrow ───────────────────────────── */
        .pd-eyebrow{display:inline-flex;align-items:center;gap:8px;padding:7px 13px;border-radius:999px;font-size:11.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;margin-bottom:22px}
        .pd-eyebrow-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}

        /* ── Typography ────────────────────────── */
        .pd-h1{font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);font-size:clamp(42px,6vw,72px);line-height:.97;letter-spacing:-.055em;margin:0 0 22px;color:#101828}
        .pd-h2{font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);font-size:clamp(32px,4.5vw,54px);line-height:1.04;letter-spacing:-.045em;margin:0 0 16px;color:#101828}
        .pd-h3{font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);font-size:21px;line-height:1.2;letter-spacing:-.02em;margin:0 0 8px;color:#101828}
        .pd-lead{font-size:18px;color:#667085;line-height:1.65;margin:0 0 28px;max-width:680px}
        .pd-accent{color:#7c3aed}
        .pd-section{padding:110px 0}
        .pd-section-soft{background:#f7f8fc}
        .pd-section-navy{background:#0b1830;color:#fff}
        .pd-center{text-align:center}
        .pd-center .pd-lead{margin-left:auto;margin-right:auto}

        /* ── Hero ──────────────────────────────── */
        .pd-hero{
          padding:76px 0 52px;
          background:
            radial-gradient(circle at 12% 10%,rgba(124,58,237,.13),transparent 28%),
            radial-gradient(circle at 88% 18%,rgba(47,140,255,.13),transparent 30%),
            linear-gradient(180deg,#fbfaff 0%,#fff 75%);
        }
        .pd-hero-grid{display:grid;grid-template-columns:1.08fr .92fr;gap:64px;align-items:center}
        .pd-hero-points{display:flex;gap:14px;flex-wrap:wrap;margin:18px 0 0}
        .pd-hero-point{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;color:#344054}
        .pd-hero-check{width:19px;height:19px;border-radius:50%;display:grid;place-items:center;background:#ecfdf3;color:#12b76a;flex-shrink:0}
        .pd-hero-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
        .pd-chip{border:1px solid #e6e9ef;background:#fff;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:750;color:#475467}
        .pd-actions{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:4px}

        /* Phone mockup */
        .pd-visual{position:relative;min-height:590px}
        .pd-phone{width:300px;height:580px;border-radius:44px;background:#0d1b31;padding:9px;position:absolute;right:40px;top:0;box-shadow:0 35px 90px rgba(13,27,49,.28);transform:rotate(1.5deg)}
        .pd-phone-screen{height:100%;border-radius:36px;background:#fff;overflow:hidden;position:relative;border:1px solid rgba(255,255,255,.5)}
        .pd-notch{position:absolute;top:9px;left:50%;transform:translateX(-50%);width:84px;height:22px;border-radius:18px;background:#0d1b31;z-index:2}
        .pd-store-head{padding:46px 18px 12px;text-align:center;background:linear-gradient(180deg,#f7f3ff,white);border-bottom:1px solid #eee}
        .pd-creator-avatar{width:48px;height:48px;border-radius:16px;margin:0 auto 9px;background:linear-gradient(145deg,#6e5cff,#9f87ff);display:grid;place-items:center;color:#fff;font-size:22px;font-weight:900;box-shadow:0 8px 20px rgba(124,58,237,.25)}
        .pd-store-head strong{display:block;font-size:13px}
        .pd-store-head span{font-size:10.5px;color:#667085}
        .pd-product-card{margin:14px;padding:13px;border:1px solid #e6e9ef;border-radius:16px;box-shadow:0 8px 22px rgba(16,24,40,.06)}
        .pd-product-cover{height:148px;border-radius:12px;background:linear-gradient(145deg,#0d1b31 0 50%,#7650ff 50% 100%);padding:16px;color:white;display:flex;flex-direction:column;justify-content:flex-end}
        .pd-product-cover small{opacity:.76;font-weight:700;font-size:11px}
        .pd-product-cover b{font-size:19px;line-height:1.1;letter-spacing:-.03em}
        .pd-price-row{display:flex;align-items:center;justify-content:space-between;margin-top:11px;font-size:13px}
        .pd-price-row b{font-size:16px}
        .pd-buy-btn{width:100%;height:42px;border:0;border-radius:11px;background:#7c3aed;color:white;font-weight:850;margin-top:11px;font-size:13px;cursor:pointer}
        .pd-trust-row{display:flex;justify-content:center;gap:12px;font-size:9.5px;color:#667085;margin-top:7px}

        /* Floating elements */
        .pd-delivery-toast{position:absolute;right:-10px;top:88px;background:#fff;border:1px solid #e6e9ef;border-radius:13px;padding:11px 14px;box-shadow:0 12px 36px rgba(16,24,40,.12);display:flex;align-items:center;gap:9px;font-size:11.5px;font-weight:800;z-index:3}
        .pd-delivery-icon{width:28px;height:28px;border-radius:50%;background:#ecfdf3;color:#12b76a;display:grid;place-items:center;flex-shrink:0}
        .pd-payment-card{position:absolute;left:-4px;bottom:32px;background:#fff;border:1px solid #e6e9ef;border-radius:18px;padding:16px;width:230px;box-shadow:0 20px 50px rgba(16,24,40,.1);z-index:5}
        .pd-payment-title{font-size:11px;color:#667085;margin-bottom:9px;font-weight:600}
        .pd-pay-option{display:flex;align-items:center;justify-content:space-between;padding:10px;border:1px solid #e6e9ef;border-radius:10px;margin-top:7px;font-size:11.5px;font-weight:750}
        .pd-pay-logo{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;position:relative;overflow:hidden;flex-shrink:0}
        .pd-file-badge{position:absolute;left:30px;top:80px;padding:11px 13px;background:#0b1830;color:#fff;border-radius:14px;font-size:11px;box-shadow:0 12px 30px rgba(11,27,53,.22);z-index:4}
        .pd-file-badge b{display:block;font-size:15px}

        /* ── Proof bar ─────────────────────────── */
        .pd-proofbar{border-top:1px solid #e6e9ef;border-bottom:1px solid #e6e9ef;background:#fff}
        .pd-proof-grid{display:grid;grid-template-columns:repeat(4,1fr)}
        .pd-proof-item{padding:24px;text-align:center;border-right:1px solid #e6e9ef}
        .pd-proof-item:last-child{border-right:0}
        .pd-proof-item strong{display:block;font-size:23px;letter-spacing:-.03em;font-family:var(--lv6-display,"Bricolage Grotesque",system-ui);color:#0b1830}
        .pd-proof-item span{font-size:12.5px;color:#667085;margin-top:2px;display:block}

        /* ── Before/After ──────────────────────── */
        .pd-split{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:44px}
        .pd-panel{border-radius:26px;padding:28px;border:1px solid #e6e9ef;background:#fff}
        .pd-panel-dark{background:#0b1830;color:#fff;border-color:#0b1830}
        .pd-panel-label{display:flex;align-items:center;gap:10px;font-weight:850;margin-bottom:22px;font-size:15px}
        .pd-panel-list{display:grid;gap:16px}
        .pd-panel-row{display:flex;gap:11px;align-items:flex-start}
        .pd-panel-icon{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;background:#fff7e8;color:#f79009;font-weight:900;font-size:12px}
        .pd-panel-dark .pd-panel-icon{background:rgba(18,183,106,.15);color:#4ade80}
        .pd-panel-row b{display:block;margin-bottom:3px;font-size:14px}
        .pd-panel-row p{font-size:13px;color:#667085;margin:0}
        .pd-panel-dark .pd-panel-row p{color:#c8d2e1}
        .pd-positioning{margin:28px auto 0;max-width:820px;text-align:center;font-size:18px;font-weight:800;color:#344054;line-height:1.5}

        /* ── Steps ─────────────────────────────── */
        .pd-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:46px}
        .pd-step{padding:24px;border:1px solid #e6e9ef;border-radius:22px;background:#fff;transition:.2s ease}
        .pd-step:hover{transform:translateY(-5px);box-shadow:0 14px 36px rgba(16,24,40,.09)}
        .pd-step-num{width:36px;height:36px;border-radius:12px;background:#f4f0ff;color:#7c3aed;display:grid;place-items:center;font-weight:900;margin-bottom:20px}
        .pd-step p{color:#667085;font-size:13.5px;margin:0 0 16px}
        .pd-step-mini{border-radius:12px;background:#f7f8fc;padding:12px;min-height:88px}
        .pd-fake-input{height:10px;border-radius:5px;background:#e6e9ef;margin-bottom:7px}
        .pd-fake-input.short{width:60%}
        .pd-fake-btn{height:26px;border-radius:7px;background:#7c3aed;margin-top:11px}
        @keyframes pd-blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes pd-step-pulse{0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.42)}60%{box-shadow:0 0 0 10px rgba(124,58,237,0)}}
        .pd-cursor{display:inline-block;width:1.5px;height:13px;background:#7c3aed;animation:pd-blink 1s step-end infinite;vertical-align:middle;margin-left:1px}

        /* ── Journey (client component) ────────── */
        .pd-journey{display:grid;grid-template-columns:1.05fr .95fr;gap:44px;align-items:center;margin-top:46px}
        .pd-journey-tabs{display:grid;gap:10px}
        .pd-journey-tab{width:100%;text-align:left;border:1px solid #e6e9ef;background:#fff;border-radius:16px;padding:16px 18px;cursor:pointer;display:flex;align-items:flex-start;gap:13px;transition:.2s ease;font-family:inherit}
        .pd-journey-tab.active{border-color:rgba(124,58,237,.4);box-shadow:0 10px 28px rgba(124,58,237,.10);background:#fcfbff}
        .pd-tab-n{width:30px;height:30px;border-radius:9px;background:#f4f0ff;color:#7c3aed;display:grid;place-items:center;font-weight:900;flex-shrink:0}
        .pd-journey-tab b{display:block;font-size:14px;font-weight:700;color:#101828}
        .pd-journey-tab span span{display:block;font-size:12.5px;color:#667085;margin-top:3px}
        .pd-browser{border:1px solid #e6e9ef;border-radius:24px;background:#fff;box-shadow:0 24px 70px rgba(16,24,40,.13);overflow:hidden}
        .pd-browser-top{height:42px;background:#f4f5f7;border-bottom:1px solid #e6e9ef;display:flex;align-items:center;padding:0 14px;gap:6px}
        .pd-dot{width:8px;height:8px;border-radius:50%;background:#d0d5dd}
        .pd-address{height:22px;border-radius:7px;background:#fff;border:1px solid #e4e7ec;margin-left:7px;flex:1}
        .pd-browser-body{padding:24px;min-height:430px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#fff,#fbfbfe)}
        .pd-demo-product{display:grid;grid-template-columns:.92fr 1.08fr;gap:20px;width:100%;align-items:center}
        .pd-demo-cover{height:260px;border-radius:18px;background:linear-gradient(145deg,#111d35 0 48%,#8a5cff 48%);padding:22px;color:white;display:flex;flex-direction:column;justify-content:flex-end}
        .pd-demo-cover b{font-size:23px;line-height:1.05}
        .pd-demo-info h3{font-size:22px;margin:0 0 6px}
        .pd-demo-info p{font-size:13.5px;color:#667085;margin:0 0 10px}
        .pd-rating{color:#fdb022;font-size:13px;margin-bottom:4px}
        .pd-demo-price{font-size:24px;font-weight:900;margin:14px 0 10px;color:#0b1830}
        .pd-demo-pay{height:44px;border-radius:11px;background:#7c3aed;color:white;display:grid;place-items:center;font-weight:850;font-size:14px}
        .pd-pay-option{display:flex;align-items:center;justify-content:space-between;padding:11px;border:1px solid #e6e9ef;border-radius:11px;margin-top:8px;font-size:13px;font-weight:750}
        .pd-success-card{text-align:center;max-width:340px}
        .pd-success-icon{width:64px;height:64px;border-radius:50%;background:#ecfdf3;color:#12b76a;display:grid;place-items:center;margin:0 auto 18px}

        /* ── Use cases ─────────────────────────── */
        .pd-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:44px}
        .pd-use-card{background:#fff;border:1px solid #e6e9ef;border-radius:22px;padding:24px;transition:.2s ease}
        .pd-use-card:hover{transform:translateY(-4px);box-shadow:0 14px 36px rgba(16,24,40,.08)}
        .pd-use-icon{width:46px;height:46px;border-radius:14px;background:#f4f0ff;color:#7c3aed;display:grid;place-items:center;margin-bottom:18px}
        .pd-use-icon svg{width:22px;height:22px}
        .pd-use-card p{font-size:14px;color:#667085;margin:0 0 12px;line-height:1.55}
        .pd-use-ex{display:inline-flex;padding:6px 11px;border-radius:999px;background:#f4f0ff;color:#7c3aed;font-size:12px;font-weight:800}

        /* ── Calculator ────────────────────────── */
        .pd-calc-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:52px;align-items:center}
        .pd-calc-title{color:#fff}
        .pd-calc-lead{color:#bac6d8;font-size:18px;max-width:580px;margin:0 0 28px}
        .pd-transparent-card{display:grid;gap:11px;margin-top:22px}
        .pd-transparent-item{display:flex;align-items:center;gap:11px;color:#d7dfec;font-size:14.5px}
        .pd-transparent-check{width:20px;height:20px;border-radius:50%;background:rgba(18,183,106,.18);color:#4ade80;display:grid;place-items:center;flex-shrink:0}
        .pd-calc-box{background:#fff;color:#101828;border-radius:26px;padding:28px;box-shadow:0 30px 80px rgba(0,0,0,.24)}
        .rv-field{margin-bottom:22px}
        .rv-label{display:flex;justify-content:space-between;font-weight:800;font-size:14px;margin-bottom:10px;color:#101828}
        .rv-val{color:#7c3aed}
        .rv-range{width:100%;accent-color:#7c3aed;margin:4px 0}
        .rv-hints{display:flex;justify-content:space-between;font-size:11.5px;color:#98a2b3;margin-top:4px}
        .rv-result{background:linear-gradient(145deg,#f7f3ff,#eef8ff);border:1px solid #e7ddff;border-radius:18px;padding:20px;margin-top:20px}
        .rv-row{display:flex;justify-content:space-between;gap:20px;padding:9px 0;border-bottom:1px solid rgba(16,24,40,.08);font-size:14px}
        .rv-row:last-child{border:0}
        .rv-total{font-size:19px;font-weight:900;color:#12b76a}
        .rv-note{font-size:12px;color:#98a2b3;margin-top:11px;line-height:1.5}

        /* ── Features ──────────────────────────── */
        .pd-feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:44px}
        .pd-feature{padding:24px;border:1px solid #e6e9ef;border-radius:20px;background:#fff}
        .pd-feature-icon{width:42px;height:42px;border-radius:13px;background:#f4f0ff;color:#7c3aed;display:grid;place-items:center;margin-bottom:14px}
        .pd-feature-icon svg{width:20px;height:20px}
        .pd-feature p{color:#667085;font-size:14px;margin:0;line-height:1.55}

        /* ── Pricing ───────────────────────────── */
        .pd-pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:44px;align-items:stretch}
        .pd-price-card{padding:28px;border:1px solid #e6e9ef;border-radius:26px;background:#fff;display:flex;flex-direction:column}
        .pd-price-card-best{background:#0b1830;color:#fff;border-color:#0b1830;transform:translateY(-8px);box-shadow:0 24px 70px rgba(11,27,53,.22)}
        .pd-price-tag{font-size:11.5px;font-weight:850;color:#7c3aed;margin-bottom:14px;letter-spacing:.05em}
        .pd-price-card-best .pd-price-tag{color:#a9cfff}
        .pd-price{font-size:40px;line-height:1;font-weight:950;letter-spacing:-.045em;font-family:var(--lv6-display,"Bricolage Grotesque",system-ui)}
        .pd-price small{font-size:13px;font-weight:700;color:#667085}
        .pd-price-card-best .pd-price small{color:#b8c3d5}
        .pd-price-desc{font-size:14px;color:#667085;min-height:46px;margin:13px 0 20px;line-height:1.55}
        .pd-price-card-best .pd-price-desc{color:#c6cfdd}
        .pd-price-list{display:grid;gap:11px;margin:20px 0 26px;font-size:14px;padding:0}
        .pd-price-list li{display:flex;align-items:flex-start;gap:8px;list-style:none}
        .pd-price-list li span{width:18px;height:18px;border-radius:50%;background:#ecfdf3;color:#12b76a;display:grid;place-items:center;flex-shrink:0;margin-top:1px}
        .pd-price-card-best .pd-price-list li span{background:rgba(18,183,106,.2);color:#4ade80}
        .pd-price-card .pd-plan-btn{margin-top:auto;display:flex;align-items:center;justify-content:center;min-height:48px;border-radius:13px;font-weight:800;font-size:14px;text-decoration:none;border:1.5px solid #e6e9ef;background:#fff;color:#101828;transition:.22s}
        .pd-price-card .pd-plan-btn:hover{transform:translateY(-2px);border-color:#c0ccd9}
        .pd-price-card .pd-plan-btn-violet{background:#7c3aed;color:#fff;border-color:#7c3aed;box-shadow:0 14px 32px rgba(124,58,237,.27)}
        .pd-price-card .pd-plan-btn-violet:hover{box-shadow:0 18px 40px rgba(124,58,237,.35)}
        .pd-trial-note{margin:28px auto 0;max-width:740px;padding:15px 20px;border-radius:14px;background:#f4f0ff;color:#513095;text-align:center;font-weight:750;font-size:14px}

        /* ── Founder ───────────────────────────── */
        .pd-mission-card{display:grid;grid-template-columns:.7fr 1.3fr;gap:38px;align-items:center;background:linear-gradient(145deg,#071a35,#0e2645);color:#fff;border-radius:32px;padding:44px;overflow:hidden}
        .pd-founder-photo{border-radius:22px;overflow:hidden;height:320px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.3)}
        .pd-mission-eyebrow{display:inline-flex;align-items:center;gap:8px;padding:7px 13px;border-radius:999px;background:rgba(255,255,255,.09);color:#bcd7ff;font-size:11.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;margin-bottom:22px}
        .pd-mission-quote{font-size:22px;font-weight:850;line-height:1.38;letter-spacing:-.02em;margin-bottom:16px;color:#fff}
        .pd-mission-lead{font-size:16px;color:#c8d2e1;line-height:1.65;margin:0 0 20px}
        .pd-mission-credit{font-size:13px;color:#9fb0c8;margin:0}

        /* ── FAQ ───────────────────────────────── */
        .pd-faq{max-width:820px;margin:42px auto 0;display:grid;gap:10px}
        .pd-faq details{border:1px solid #e6e9ef;border-radius:16px;overflow:hidden;background:#fff}
        .pd-faq summary{padding:19px 20px;font-weight:700;font-size:14.5px;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:16px;color:#101828}
        .pd-faq summary::-webkit-details-marker{display:none}
        .pd-faq summary::after{content:"+";font-size:22px;color:#9baec0;flex-shrink:0;transition:.2s;line-height:1}
        .pd-faq details[open] summary::after{content:"−"}
        .pd-faq-a{padding:0 20px 18px;color:#667085;font-size:14.5px;line-height:1.7}

        /* ── CTA ───────────────────────────────── */
        .pd-cta{padding:105px 0;background:#0b1830;color:#fff;text-align:center}
        .pd-cta-lead{color:#b9c4d6;font-size:18px;max-width:600px;margin:0 auto 34px;line-height:1.65}
        .pd-cta-note{font-size:13px;color:#6a7f9a;margin-top:16px}
        .pd-cta-actions{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}

        /* ── Buttons ───────────────────────────── */
        .pd-btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 28px;border-radius:14px;font-size:15px;font-weight:800;background:#7c3aed;color:#fff;text-decoration:none;border:none;cursor:pointer;transition:.22s;box-shadow:0 14px 32px rgba(124,58,237,.27)}
        .pd-btn-primary:hover{transform:translateY(-2px);box-shadow:0 20px 44px rgba(124,58,237,.38)}
        .pd-btn-ghost{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 28px;border-radius:14px;font-size:15px;font-weight:700;background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.24);text-decoration:none;cursor:pointer;transition:.22s}
        .pd-btn-ghost:hover{background:rgba(255,255,255,.07)}
        .pd-btn-outline{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 28px;border-radius:14px;font-size:15px;font-weight:700;background:#fff;color:#101828;border:1.5px solid #dce5f0;text-decoration:none;cursor:pointer;transition:.22s}
        .pd-btn-outline:hover{transform:translateY(-2px);border-color:#c0ccd9}

        /* ── Payment logos bar ─────────────────── */
        .pd-paybar{border-top:1px solid #e6e9ef;border-bottom:1px solid #e6e9ef;background:#fff;padding:14px 0}
        .pd-paybar-inner{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px 14px;max-width:1180px;margin:0 auto;padding:0 24px}
        .pd-pay-badge{display:inline-flex;align-items:center;gap:8px;border:1px solid #e6e9ef;border-radius:999px;padding:7px 14px;font-size:13px;font-weight:700;color:#344054;background:#fff}
        .pd-paybar-label{font-size:12px;color:#98a2b3;font-weight:700;white-space:nowrap}

        /* ── Responsive ────────────────────────── */
        @media(max-width:1024px){
          .pd-hero-grid,.pd-journey,.pd-calc-grid,.pd-mission-card{grid-template-columns:1fr}
          .pd-visual{min-height:560px;margin-top:28px}
          .pd-phone{right:8%}
          .pd-steps,.pd-pricing-grid{grid-template-columns:repeat(2,1fr)}
          .pd-cards,.pd-feature-grid{grid-template-columns:repeat(2,1fr)}
          .pd-price-card-best{transform:none}
          .pd-proof-grid{grid-template-columns:repeat(2,1fr)}
          .pd-proof-item:nth-child(2){border-right:0}
          .pd-proof-item:nth-child(-n+2){border-bottom:1px solid #e6e9ef}
          .pd-mission-card{padding:32px}
        }
        @media(max-width:680px){
          .pd-hero{padding-top:52px}
          .pd-visual{min-height:530px}
          .pd-phone{width:270px;height:520px;right:0}
          .pd-file-badge{left:0;top:58px}
          .pd-payment-card{left:0;bottom:0;width:205px}
          .pd-split,.pd-steps,.pd-cards,.pd-feature-grid,.pd-pricing-grid{grid-template-columns:1fr}
          .pd-proof-grid{grid-template-columns:1fr 1fr}
          .pd-proof-item{padding:18px 8px}
          .pd-section{padding:76px 0}
          .pd-demo-product{grid-template-columns:1fr}
          .pd-demo-cover{height:180px}
          .pd-journey{gap:26px}
          .pd-calc-box{padding:20px}
        }
      `}</style>

      <div className="lv6">
        <LandingNav />
        <LandingV6Init />

        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="pd-hero">
          <div className="pd-wrap">
            <div className="pd-hero-grid">
              <div>
                <span className="pd-eyebrow" style={{ background: '#f4f0ff', color: '#7c3aed' }}>
                  <span className="pd-eyebrow-dot" style={{ background: '#7c3aed' }} />
                  Produits digitaux sur TEKKIShop
                </span>
                <h1 className="pd-h1">
                  Transforme ce que tu sais en <span className="pd-accent">revenu.</span>
                </h1>
                <p className="pd-lead">
                  Vends tes ebooks, guides, templates, formations, audios et fichiers depuis ton téléphone.
                  Tes clients paient avec les moyens disponibles dans leur pays et reçoivent automatiquement leur achat.
                </p>
                <div className="pd-actions">
                  <Link href="/start" className="pd-btn-primary" style={{ color: '#fff' }}>
                    Vendre mon premier produit
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </Link>
                  <a href="#gains" className="pd-btn-outline">Calculer mes gains</a>
                </div>
                <div className="pd-hero-points">
                  {['Fichier livré automatiquement', 'Mobile money & carte acceptés', 'Tu vends même quand tu dors'].map(t => (
                    <span key={t} className="pd-hero-point">
                      <span className="pd-hero-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="pd-hero-chips">
                  {['PDF', 'EPUB', 'ZIP', 'DOCX', 'XLSX', 'MP3'].map(f => (
                    <span key={f} className="pd-chip">{f}</span>
                  ))}
                </div>
              </div>

              {/* Phone mockup */}
              <div className="pd-visual" aria-label="Aperçu d'une boutique de produits digitaux">
                <div className="pd-file-badge">
                  <span>Ton fichier</span>
                  <b>prêt à vendre</b>
                </div>
                <div className="pd-payment-card">
                  <div className="pd-payment-title">Le client choisit son paiement</div>
                  <div className="pd-pay-option">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="pd-pay-logo" style={{ background: '#eaf4ff' }}>
                        <Image src="/logo-payments/wave_1.svg" alt="Wave" fill style={{ objectFit: 'contain', padding: 3 }} sizes="26px" />
                      </span>
                      Wave
                    </span>
                    <b>›</b>
                  </div>
                  <div className="pd-pay-option">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="pd-pay-logo" style={{ background: '#fff2e8' }}>
                        <Image src="/logo-payments/om_1.svg" alt="Orange Money" fill style={{ objectFit: 'contain', padding: 3 }} sizes="26px" />
                      </span>
                      Orange Money
                    </span>
                    <b>›</b>
                  </div>
                </div>
                <div className="pd-phone">
                  <div className="pd-phone-screen">
                    <div className="pd-notch" />
                    <div className="pd-store-head">
                      <div className="pd-creator-avatar">I</div>
                      <strong>La boutique d&apos;Ibuka</strong>
                      <span>Guides pratiques pour entrepreneurs</span>
                    </div>
                    <div className="pd-product-card">
                      <div className="pd-product-cover">
                        <small>GUIDE PRATIQUE</small>
                        <b>Lancer sa première boutique rentable</b>
                      </div>
                      <div className="pd-price-row">
                        <span>PDF · 58 pages</span>
                        <b>4 500 FCFA</b>
                      </div>
                      <button className="pd-buy-btn">Acheter maintenant</button>
                      <div className="pd-trust-row">
                        <span>Paiement sécurisé</span>
                        <span>Livraison auto</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pd-delivery-toast">
                  <span className="pd-delivery-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span>Fichier envoyé<br /><small style={{ color: '#667085', fontWeight: 400 }}>automatiquement</small></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Proof bar ────────────────────────────────────────── */}
        <div className="pd-proofbar">
          <div className="pd-wrap">
            <div className="pd-proof-grid">
              <div className="pd-proof-item">
                <strong>{shopCountDisplay}</strong>
                <span>boutiques créées</span>
              </div>
              <div className="pd-proof-item">
                <strong>6 pays</strong>
                <span>déjà couverts</span>
              </div>
              <div className="pd-proof-item">
                <strong>100 % mobile</strong>
                <span>création et gestion</span>
              </div>
              <div className="pd-proof-item">
                <strong>24 h/24</strong>
                <span>livraison automatique</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Payment logos ─────────────────────────────────────── */}
        <div className="pd-paybar">
          <div className="pd-paybar-inner">
            <span className="pd-paybar-label">Modes de paiement acceptés</span>
            {PAYMENT_LOGOS.map(p => (
              <span key={p.name} className="pd-pay-badge">
                <span style={{ position: 'relative', width: 24, height: 18, display: 'inline-block', flexShrink: 0 }}>
                  <Image src={p.src} alt={p.name} fill style={{ objectFit: 'contain' }} sizes="24px" />
                </span>
                {p.name}
              </span>
            ))}
            <span className="pd-pay-badge" style={{ color: '#12b76a' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><polyline points="20 6 9 17 4 12"/></svg>
              À la livraison
            </span>
          </div>
        </div>

        {/* ── Before / After ───────────────────────────────────── */}
        <section className="pd-section pd-section-soft">
          <div className="pd-wrap">
            <div className="pd-center">
              <span className="pd-eyebrow" style={{ background: '#f4f0ff', color: '#7c3aed' }}>
                <span className="pd-eyebrow-dot" style={{ background: '#7c3aed' }} />
                Le vrai bénéfice
              </span>
              <h2 className="pd-h2">Toi, tu crées. <span className="pd-accent">TEKKIShop gère le reste.</span></h2>
              <p className="pd-lead">Ton énergie doit servir à créer un produit utile et à le faire connaître, pas à bricoler une infrastructure technique.</p>
            </div>

            <div className="pd-split">
              <article className="pd-panel">
                <div className="pd-panel-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20, color: '#f79009', flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                  Sans TEKKIShop
                </div>
                <div className="pd-panel-list">
                  {[
                    { b: 'Tu construis plusieurs outils', p: "Page de vente, formulaire, paiement, hébergement du fichier et suivi client." },
                    { b: 'Tu confirmes chaque paiement', p: "Le client envoie une capture, tu vérifies, puis tu réponds manuellement." },
                    { b: 'Tu envoies chaque fichier', p: "Un à un, sur WhatsApp ou par e-mail, même la nuit ou le week-end." },
                    { b: 'Tu risques de perdre des ventes', p: "À chaque délai, chaque oubli et chaque étape trop compliquée." },
                  ].map((item, i) => (
                    <div key={item.b} className="pd-panel-row">
                      <span className="pd-panel-icon">{i + 1}</span>
                      <div><b>{item.b}</b><p>{item.p}</p></div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="pd-panel pd-panel-dark">
                <div className="pd-panel-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20, color: '#4ade80', flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                  Avec TEKKIShop
                </div>
                <div className="pd-panel-list">
                  {[
                    { b: 'Une vraie boutique en quelques minutes', p: "Ajoute ton produit, son prix, sa description et ton fichier." },
                    { b: 'Des paiements adaptés aux marchés locaux', p: "Tes clients paient directement pendant leur commande." },
                    { b: 'Une livraison instantanée', p: "Après validation du paiement, l'accès au fichier est envoyé automatiquement." },
                    { b: 'Une activité qui tourne sans toi', p: "Ta boutique continue de vendre pendant que tu crées, travailles ou dors." },
                  ].map(item => (
                    <div key={item.b} className="pd-panel-row">
                      <span className="pd-panel-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      <div><b>{item.b}</b><p>{item.p}</p></div>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <p className="pd-positioning">
              Pas de colis. Pas de stock. Pas de livraison physique.{' '}
              <span className="pd-accent">Ton savoir devient un produit vendable partout.</span>
            </p>
          </div>
        </section>

        {/* ── 4 étapes ─────────────────────────────────────────── */}
        <section id="comment" className="pd-section">
          <div className="pd-wrap">
            <div className="pd-center">
              <span className="pd-eyebrow" style={{ background: '#f4f0ff', color: '#7c3aed' }}>
                <span className="pd-eyebrow-dot" style={{ background: '#7c3aed' }} />
                4 étapes seulement
              </span>
              <h2 className="pd-h2">Ton premier produit peut être en vente <span className="pd-accent">aujourd&apos;hui.</span></h2>
              <p className="pd-lead">Aucun tunnel complexe. Aucun outil à connecter. Tu avances étape par étape depuis ton téléphone.</p>
            </div>
            <div className="pd-steps">
              {[
                {
                  n: '1', h: 'Crée ta boutique', p: 'Choisis ton nom, ajoute ton logo et personnalise les couleurs.',
                  mini: (
                    <div className="pd-step-mini" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ background: '#fff', border: '1.5px solid #e6e9ef', borderRadius: 9, padding: '7px 10px' }}>
                        <div style={{ fontSize: 9, color: '#98a2b3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Nom de ta boutique</div>
                        <div style={{ fontSize: 12, fontWeight: 750, color: '#0b1830', display: 'flex', alignItems: 'center' }}>
                          La boutique d&apos;Ibuka<span className="pd-cursor" />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {['#7c3aed', '#0b1830', '#12b76a', '#f79009'].map((c, i) => (
                          <span key={c} style={{ width: 22, height: 22, borderRadius: 7, background: c, flexShrink: 0, outline: i === 0 ? '2.5px solid #7c3aed' : 'none', outlineOffset: 2 }} />
                        ))}
                        <span style={{ marginLeft: 'auto', fontSize: 9, color: '#98a2b3', alignSelf: 'center' }}>Couleur principale</span>
                      </div>
                      <div style={{ height: 28, borderRadius: 8, background: '#7c3aed', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 10, fontWeight: 800 }}>Créer ma boutique</div>
                    </div>
                  ),
                },
                {
                  n: '2', h: 'Ajoute ton produit', p: 'Renseigne le titre, la couverture, le prix et importe ton fichier.',
                  mini: (
                    <div className="pd-step-mini" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <div style={{ height: 62, borderRadius: 9, background: 'linear-gradient(145deg,#0d1b31 0 48%,#7650ff 48%)', padding: '8px 10px', display: 'flex', alignItems: 'flex-end' }}>
                        <div>
                          <div style={{ fontSize: 8, color: 'rgba(255,255,255,.75)', fontWeight: 700, textTransform: 'uppercase' }}>GUIDE PRATIQUE</div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Lancer sa boutique rentable</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                        <span style={{ fontSize: 10, color: '#667085' }}>PDF · 8,4 Mo</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#0b1830' }}>4 500 FCFA</span>
                      </div>
                      <div style={{ background: '#fff', border: '1.5px dashed #c6b9ff', borderRadius: 8, padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11, flexShrink: 0 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed' }}>guide.pdf importé</span>
                        <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: '#12b76a', flexShrink: 0 }} />
                      </div>
                    </div>
                  ),
                },
                {
                  n: '3', h: 'Ta boutique est déjà en ligne', p: 'Dès ton premier produit publié, tes clients peuvent la voir et commander.',
                  mini: (
                    <div className="pd-step-mini" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <div style={{ background: '#fff', border: '1.5px solid #d9c8ff', borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#12b76a', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#0b1830' }}>Boutique en ligne</span>
                      </div>
                      <div style={{ height: 28, borderRadius: 8, background: '#f4f0ff', border: '1.5px dashed #c6b9ff', display: 'grid', placeItems: 'center', color: '#7c3aed', fontSize: 10, fontWeight: 800 }}>
                        3 commandes offertes
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#12b76a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                        <span style={{ fontSize: 9.5, color: '#667085' }}>Aucun paiement à faire pour commencer</span>
                      </div>
                    </div>
                  ),
                },
                {
                  n: '4', h: 'Partage ton lien', p: 'Publie-le sur WhatsApp, Instagram, TikTok, LinkedIn ou par e-mail.',
                  mini: (
                    <div className="pd-step-mini" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <div style={{ background: '#fff', border: '1.5px solid #e6e9ef', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10, flexShrink: 0 }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed' }}>tekki.shop/ta-boutique</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[{ bg: '#25d366', label: 'WA' }, { bg: 'linear-gradient(135deg,#f58529,#dd2a7b)', label: 'IG' }, { bg: '#010101', label: 'TK' }].map(p => (
                          <span key={p.label} style={{ width: 28, height: 28, borderRadius: 8, background: p.bg, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 9, fontWeight: 900, flexShrink: 0 }}>{p.label}</span>
                        ))}
                        <span style={{ fontSize: 9.5, color: '#98a2b3', alignSelf: 'center' }}>+ LinkedIn, email…</span>
                      </div>
                      <div style={{ height: 28, borderRadius: 8, background: '#12b76a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800, gap: 5 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        Partager mon lien
                      </div>
                    </div>
                  ),
                },
              ].map(s => (
                <article key={s.n} className="pd-step">
                  <div className="pd-step-num">{s.n}</div>
                  <h3 className="pd-h3">{s.h}</h3>
                  <p>{s.p}</p>
                  {s.mini}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Expérience client ─────────────────────────────────── */}
        <section className="pd-section" id="experience" style={{ background: 'linear-gradient(180deg,#fff,#fafbff)' }}>
          <div className="pd-wrap">
            <div className="pd-center">
              <span className="pd-eyebrow" style={{ background: '#f4f0ff', color: '#7c3aed' }}>
                <span className="pd-eyebrow-dot" style={{ background: '#7c3aed' }} />
                Une expérience qui rassure
              </span>
              <h2 className="pd-h2">De la découverte au téléchargement, <span className="pd-accent">tout est fluide.</span></h2>
              <p className="pd-lead">Une expérience d&apos;achat claire réduit les hésitations et donne une image professionnelle à ton produit.</p>
            </div>
            <JourneyTabs />
          </div>
        </section>

        {/* ── Use cases ────────────────────────────────────────── */}
        <section className="pd-section pd-section-soft">
          <div className="pd-wrap">
            <div className="pd-center">
              <span className="pd-eyebrow" style={{ background: '#f4f0ff', color: '#7c3aed' }}>
                <span className="pd-eyebrow-dot" style={{ background: '#7c3aed' }} />
                Ton expertise a déjà de la valeur
              </span>
              <h2 className="pd-h2">Qu&apos;est-ce que tu pourrais <span className="pd-accent">vendre dès maintenant&nbsp;?</span></h2>
              <p className="pd-lead">Commence avec ce que tu connais déjà, puis améliore ton offre grâce aux retours de tes premiers clients.</p>
            </div>
            <div className="pd-cards">
              {USE_CASES.map(uc => (
                <article key={uc.titre} className="pd-use-card">
                  <div className="pd-use-icon">{uc.icon}</div>
                  <h3 className="pd-h3">{uc.titre}</h3>
                  <p>{uc.texte}</p>
                  <span className="pd-use-ex">{uc.ex}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Calculateur ──────────────────────────────────────── */}
        <section id="gains" className="pd-section pd-section-navy">
          <div className="pd-wrap">
            <div className="pd-calc-grid">
              <div>
                <span className="pd-eyebrow" style={{ background: 'rgba(124,58,237,.18)', color: '#cbb7ff' }}>
                  <span className="pd-eyebrow-dot" style={{ background: '#cbb7ff' }} />
                  Transparence totale
                </span>
                <h2 className="pd-h2 pd-calc-title">Vois combien tu peux gagner, <span style={{ color: '#a982ff' }}>exactement.</span></h2>
                <p className="pd-calc-lead">La simulation ci-contre utilise une commission de 3&nbsp;% et le plan Découverte à 2&nbsp;900&nbsp;FCFA par mois, comme exemple.</p>
                <div className="pd-transparent-card">
                  {['Pas de calcul caché', 'Tu fixes librement le prix de ton produit', 'Tu vois ton revenu avant même de publier'].map(t => (
                    <div key={t} className="pd-transparent-item">
                      <span className="pd-transparent-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
              <div className="pd-calc-box">
                <RevenueCalcV6 />
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────── */}
        <section className="pd-section">
          <div className="pd-wrap">
            <div className="pd-center">
              <span className="pd-eyebrow" style={{ background: '#f4f0ff', color: '#7c3aed' }}>
                <span className="pd-eyebrow-dot" style={{ background: '#7c3aed' }} />
                L&apos;essentiel, sans la complexité
              </span>
              <h2 className="pd-h2">Tout ce qu&apos;il faut pour vendre. <span className="pd-accent">Rien à bricoler.</span></h2>
              <p className="pd-lead">TEKKIShop réunit les briques indispensables dans une expérience pensée pour les personnes non techniques.</p>
            </div>
            <div className="pd-feature-grid">
              {FEATURES.map(f => (
                <article key={f.titre} className="pd-feature">
                  <div className="pd-feature-icon">{f.icon}</div>
                  <h3 className="pd-h3">{f.titre}</h3>
                  <p>{f.texte}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────── */}
        <section id="tarifs" className="pd-section" style={{ background: 'linear-gradient(180deg,#fafbff,#fff)' }}>
          <div className="pd-wrap">
            <div className="pd-center">
              <span className="pd-eyebrow" style={{ background: '#f4f0ff', color: '#7c3aed' }}>
                <span className="pd-eyebrow-dot" style={{ background: '#7c3aed' }} />
                Commence sans pression
              </span>
              <h2 className="pd-h2">Vends dès aujourd&apos;hui. <span className="pd-accent">Paie après avoir vendu.</span></h2>
              <p className="pd-lead">Ta boutique est en ligne dès ton premier produit publié, et tes 3 premières commandes sont offertes. Tu choisis un plan seulement quand tu veux continuer à en recevoir.</p>
            </div>
            <div className="pd-pricing-grid">
              {PLANS.map(plan => (
                <article key={plan.name} className={`pd-price-card${plan.best ? ' pd-price-card-best' : ''}`}>
                  <div className="pd-price-tag">{plan.tag}</div>
                  <h3 className="pd-h3" style={plan.best ? { color: '#fff' } : {}}>{plan.name}</h3>
                  <div className="pd-price">
                    {plan.price} <small>FCFA / mois</small>
                  </div>
                  <p className="pd-price-desc">{plan.desc}</p>
                  <ul className="pd-price-list">
                    {plan.features.map(f => (
                      <li key={f}>
                        <span>{CHECK_ICO}</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.cta.href} className={`pd-plan-btn${plan.cta.primary ? ' pd-plan-btn-violet' : ''}`}>
                    {plan.cta.label}
                  </Link>
                </article>
              ))}
            </div>
            <div className="pd-trial-note">
              Tes 3 premières commandes sont offertes. Le paiement d&apos;un plan n&apos;est requis que pour continuer à en recevoir au-delà.
            </div>
          </div>
        </section>

        {/* ── Fondateur ────────────────────────────────────────── */}
        <section className="pd-section">
          <div className="pd-wrap">
            <div className="pd-mission-card">
              <div className="pd-founder-photo">
                <Image
                  src="/avatars/ibuka.jpg"
                  alt="Ibuka Ndjoli — Fondateur de TEKKIShop"
                  fill
                  style={{ objectFit: 'cover', objectPosition: 'top center' }}
                  sizes="(max-width: 1024px) 100vw, 400px"
                />
              </div>
              <div>
                <span className="pd-mission-eyebrow">
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#75b5ff', flexShrink: 0 }} />
                  Pourquoi TEKKIShop existe
                </span>
                <p className="pd-mission-quote">
                  &laquo;&nbsp;Vendre en ligne depuis l&apos;Afrique ne devrait pas nécessiter un développeur, un ordinateur ou des connaissances techniques.&nbsp;&raquo;
                </p>
                <p className="pd-mission-lead">
                  TEKKIShop est construit pour rendre la vente en ligne aussi simple que possible&nbsp;: créer sa boutique, ajouter ses produits, accepter des paiements et commencer à vendre.
                </p>
                <p className="pd-mission-credit">Ibuka Ndjoli — Fondateur de TEKKIShop</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section id="faq" className="pd-section pd-section-soft">
          <div className="pd-wrap">
            <div className="pd-center">
              <span className="pd-eyebrow" style={{ background: '#f4f0ff', color: '#7c3aed' }}>
                <span className="pd-eyebrow-dot" style={{ background: '#7c3aed' }} />
                Questions fréquentes
              </span>
              <h2 className="pd-h2">Tout ce qu&apos;il faut savoir avant de <span className="pd-accent">commencer.</span></h2>
            </div>
            <div className="pd-faq">
              {FAQS.map(f => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p className="pd-faq-a">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA final ────────────────────────────────────────── */}
        <section className="pd-cta" id="cta">
          <div className="pd-wrap">
            <span className="pd-eyebrow" style={{ background: 'rgba(124,58,237,.18)', color: '#d8caff' }}>
              <span className="pd-eyebrow-dot" style={{ background: '#d8caff' }} />
              Ton premier produit peut être prêt aujourd&apos;hui
            </span>
            <h2 className="pd-h2" style={{ color: '#fff', maxWidth: 760, margin: '0 auto 16px' }}>
              Ce que tu sais peut se vendre pendant que tu dors.
            </h2>
            <p className="pd-cta-lead">
              Crée ta boutique en quelques minutes, ajoute ton produit et prépare-toi à recevoir tes premières commandes.
            </p>
            <div className="pd-cta-actions">
              <Link href="/start" className="pd-btn-primary">
                Créer ma boutique gratuitement
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <a href="https://tekki.shop/marcusdawriter" target="_blank" rel="noopener noreferrer" className="pd-btn-ghost">
                Voir une vraie boutique
              </a>
            </div>
            <p className="pd-cta-note">Aucun code · 3 premières commandes offertes · Paie seulement après avoir vendu</p>
          </div>
        </section>

        <LandingFooter />
      </div>
    </>
  )
}
