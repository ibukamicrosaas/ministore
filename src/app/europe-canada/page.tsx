import Link from 'next/link'
import Image from 'next/image'
import { EU_CA_COUNTRIES } from '@/components/landing/countries'
import { APP_NAME } from '@/constants'
import '../landing-v6.css'
import { LandingNav } from '@/components/landing-v6/LandingNav'
import { LandingFooter } from '@/components/landing-v6/LandingFooter'
import { LandingV6Init } from '@/components/landing-v6/LandingV6Init'

export const metadata = {
  title: `Vends en euros à Paris, en FCFA à Dakar — ${APP_NAME}`,
  description: "TEKKIShop est disponible en Europe francophone et au Canada. Encaisse par carte via Stripe en € ou CAD — et sers aussi tes clients en Afrique par mobile money, depuis la même boutique.",
}

const EU_PAYMENTS = [
  { name: 'Visa', logo: '/logo-payments/visa.svg' },
  { name: 'Mastercard', logo: '/logo-payments/Mastercard-Logo.wine.svg' },
]
const AF_PAYMENTS = [
  { name: 'Wave', logo: '/logo-payments/wave_1.svg' },
  { name: 'MaxIt', logo: '/logo-payments/maxit.webp' },
  { name: 'MTN Money', logo: '/logo-payments/mtn_1.svg' },
]

const ETAPES = [
  { n: '1', titre: 'Crée ta boutique', texte: 'En euros (€) ou en dollars canadiens (CAD), en quelques minutes, depuis ton téléphone ou ton ordinateur.' },
  { n: '2', titre: 'Connecte ton compte Stripe', texte: 'Stripe te guide dans la vérification de ton identité — auto-entrepreneur, indépendant ou société. Pas besoin d\'être une entreprise établie.' },
  { n: '3', titre: 'Tes clients paient par carte', texte: 'Visa ou Mastercard, directement sur ta boutique. Tes clients en Afrique, eux, paient par mobile money.' },
  { n: '4', titre: "L'argent arrive sur ton compte", texte: 'Virements automatiques vers ton compte bancaire, selon le calendrier standard de Stripe pour ton pays.' },
]

const SANS_ITEMS = [
  'Un Shopify ou Wix pour tes clients en Europe (abonnement + apps + configuration Stripe à faire toi-même)',
  'Une deuxième solution — ou des messages WhatsApp sans fin — pour tes clients en Afrique',
  'Aucune plateforme européenne ne gère Wave, Orange Money ou le paiement à la livraison',
  'Deux catalogues à maintenir, deux fois le travail',
]
const AVEC_ITEMS = [
  { b: 'Une seule boutique', t: ', un seul catalogue, un seul tableau de bord' },
  { b: 'Tes clients d\'Europe et du Canada', t: ' paient par carte via Stripe — l\'argent va directement sur ton compte' },
  { b: 'Tes clients d\'Afrique', t: ' paient par mobile money ou à la livraison — comme ils ont l\'habitude' },
  { b: 'Tous les outils TEKKIShop', t: ' restent inclus : livreurs, avis clients, notifications SMS' },
]

const PERSONAS = [
  { titre: "L'entrepreneuse de la diaspora", texte: "Wax, épicerie, cosmétiques, artisanat : tu vends les produits du pays à la communauté en Europe — et tu livres aussi la famille restée au pays, depuis la même boutique.", ex: 'Encaisse en € ET en FCFA' },
  { titre: 'Le coach / créateur francophone', texte: "Formations, guides, ebooks, accompagnements : ton audience est des deux côtés de la Méditerranée. Ton lien boutique aussi.", ex: 'Produits digitaux inclus' },
  { titre: 'La marque africaine qui exporte', texte: "Ta marque cartonne à Abidjan ou Dakar ? Ouvre le marché européen sans deuxième plateforme : mêmes produits, prix en euros, paiement par carte.", ex: 'Une boutique, deux continents' },
]

const FAQS = [
  { q: 'Dois-je avoir une entreprise enregistrée en France, en Belgique ou au Canada ?', a: "Pas forcément. Que tu sois auto-entrepreneur, indépendant ou société, Stripe te guide dans la vérification de ton identité au moment de connecter ton compte. C'est lui qui valide ton statut, selon les règles de ton pays." },
  { q: "Quand est-ce que je reçois l'argent sur mon compte bancaire ?", a: "Les paiements arrivent d'abord sur ton compte Stripe, puis sont virés automatiquement vers ton compte bancaire selon le calendrier standard de Stripe pour ton pays (généralement quelques jours ouvrés après chaque vente)." },
  { q: 'Quels moyens de paiement mes clients peuvent-ils utiliser ?', a: "En Europe et au Canada : carte bancaire Visa ou Mastercard, via Stripe, avec 3D Secure. En Afrique : les moyens de paiement mobile money du pays de tes clients (Wave, Orange Money, MTN, Moov…) et le paiement à la livraison." },
  { q: 'Puis-je vendre à des clients en Afrique depuis ma boutique en Europe ?', a: "Oui — c'est même toute la force de TEKKIShop. Ta boutique sert tes deux marchés : tes clients d'Europe paient par carte, tes clients d'Afrique par mobile money ou à la livraison. Un seul catalogue, un seul tableau de bord." },
  { q: 'TEKKIShop garde-t-il une partie de mes paiements par carte ?', a: "Non. Tes paiements Stripe vont directement sur ton compte Stripe — TEKKIShop ne prélève aucune commission dessus. Tu paies ton abonnement TEKKIShop et les frais standards de Stripe, rien d'autre." },
  { q: 'Pourquoi TEKKIShop plutôt que Shopify pour vendre en Europe ?', a: "Si ton marché est uniquement européen, Shopify est un excellent outil. Mais si ton business vit entre l'Europe et l'Afrique, TEKKIShop est la seule plateforme qui gère vraiment les deux mondes à la fois." },
]

const CHECK_ICO = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, flexShrink: 0, marginTop: 2 }}><polyline points="20 6 9 17 4 12"/></svg>
const CROSS_ICO = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, flexShrink: 0, marginTop: 2 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const ARROW_ICO = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>

export default function EuropeCanadaPage() {
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
        .pg-section{padding:100px 0}
        .pg-section-soft{background:#f7f8fc}

        /* HERO */
        .ec-hero{background:radial-gradient(circle at 10% 20%,rgba(67,56,202,.09),transparent 30%),radial-gradient(circle at 90% 70%,rgba(245,158,11,.07),transparent 30%),linear-gradient(180deg,#eef0ff 0%,#fff 72%);padding:80px 0 72px}
        .ec-hero-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:52px;align-items:center;max-width:1100px;margin:0 auto;padding:0 24px}
        .ec-flags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;font-size:22px}

        /* PAYMENT CARDS */
        .ec-cards{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .ec-card{border:1px solid #e6e9ef;border-radius:22px;background:#fff;padding:18px;box-shadow:0 14px 40px rgba(16,24,40,.07)}
        .ec-card-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#98a2b3;margin-bottom:10px}
        .ec-pay-btn{border-radius:10px;text-align:center;padding:10px;font-weight:800;font-size:12.5px;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:6px}
        .ec-logos-row{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px;flex-wrap:wrap;font-size:11px;color:#98a2b3}

        /* PAYMENT BAR */
        .ec-paybar{border-top:1px solid #e6e9ef;border-bottom:1px solid #e6e9ef;background:#fff;padding:16px 0}
        .ec-paybar-inner{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;max-width:1100px;margin:0 auto;padding:0 24px}
        .ec-pay-badge{display:inline-flex;align-items:center;gap:8px;border:1px solid #e6e9ef;border-radius:999px;padding:7px 14px;font-size:13px;font-weight:700;color:#344054;background:#fff}
        .ec-plus{font-size:18px;font-weight:900;color:#4338ca;padding:0 4px}

        /* DOUBLE MARKET */
        .ec-split{display:grid;grid-template-columns:1fr 1.3fr;gap:20px;max-width:880px;margin:0 auto}
        .ec-list-row{display:flex;align-items:flex-start;gap:10px;padding:11px 0;border-top:1px dashed rgba(16,24,40,.1);font-size:14.5px;color:#475467;line-height:1.5}
        .ec-list-row:first-child{border-top:0;padding-top:0}

        /* ETAPES */
        .ec-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:48px}
        .ec-step{border:1px solid #e0e5f5;border-radius:22px;background:#eef1ff;padding:26px;transition:.2s}
        .ec-step:hover{transform:translateY(-4px);box-shadow:0 14px 36px rgba(67,56,202,.1)}
        .ec-step-n{width:38px;height:38px;border-radius:13px;background:#4338ca;color:#fff;display:grid;place-items:center;font-weight:900;font-size:15px;margin-bottom:18px;font-family:var(--lv6-display,"Bricolage Grotesque",system-ui)}

        /* STRIPE TRUST */
        .ec-stripe{border:1px solid #e6e9ef;border-radius:28px;background:#fff;padding:48px;text-align:center;max-width:740px;margin:0 auto;box-shadow:0 4px 24px rgba(16,24,40,.05)}
        .ec-shield-ico{width:60px;height:60px;border-radius:20px;background:#4338ca;display:grid;place-items:center;margin:0 auto 20px}
        .ec-trust-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:24px}
        .ec-trust-chip{display:inline-flex;align-items:center;gap:7px;border:1px solid #d1fae5;background:#f0fdf4;border-radius:999px;padding:7px 14px;font-size:12.5px;font-weight:700;color:#065f46}

        /* PERSONAS */
        .ec-personas{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        .ec-persona-card{border:1px solid #e6e9ef;border-radius:22px;background:#fff;padding:26px;transition:.2s}
        .ec-persona-card:hover{transform:translateY(-4px);box-shadow:0 14px 36px rgba(16,24,40,.07)}
        .ec-persona-ex{display:inline-block;margin-top:12px;font-size:12px;font-weight:800;color:#4338ca;background:#eef0ff;border-radius:999px;padding:6px 12px}

        /* FAQ */
        .ec-faq{max-width:680px;margin:40px auto 0;display:grid;gap:10px}
        .ec-faq details{border:1px solid #e6e9ef;border-radius:16px;overflow:hidden;background:#fff}
        .ec-faq summary{padding:18px 20px;font-weight:700;font-size:14.5px;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:16px;color:#101828}
        .ec-faq summary::-webkit-details-marker{display:none}
        .ec-faq summary::after{content:"+";font-size:22px;color:#9baec0;flex-shrink:0;transition:.2s;line-height:1}
        .ec-faq details[open] summary::after{content:"−"}
        .ec-faq-a{padding:0 20px 18px;color:#667085;font-size:14.5px;line-height:1.7}

        /* BUTTONS */
        .pg-btn-indigo{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 28px;border-radius:14px;font-size:15px;font-weight:800;background:#4338ca;color:#fff;text-decoration:none;border:none;cursor:pointer;transition:.22s;white-space:nowrap;box-shadow:0 12px 28px rgba(67,56,202,.3)}
        .pg-btn-indigo:hover{transform:translateY(-2px);box-shadow:0 16px 36px rgba(67,56,202,.38)}
        .pg-btn-outline-d{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 28px;border-radius:14px;font-size:15px;font-weight:700;background:rgba(255,255,255,.1);color:#fff;border:1.5px solid rgba(255,255,255,.2);text-decoration:none;cursor:pointer;transition:.22s;white-space:nowrap}
        .pg-btn-outline-d:hover{background:rgba(255,255,255,.16)}
        .pg-btn-secondary{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 28px;border-radius:14px;font-size:15px;font-weight:700;background:#fff;color:#101828;border:1.5px solid #dce5f0;text-decoration:none;cursor:pointer;transition:.22s}
        .pg-btn-secondary:hover{transform:translateY(-2px);border-color:#c0ccd9}

        @media(max-width:1024px){
          .ec-steps{grid-template-columns:repeat(2,1fr)}
          .ec-personas{grid-template-columns:1fr 1fr}
        }
        @media(max-width:820px){
          .ec-hero-grid{grid-template-columns:1fr}
          .ec-hero{padding:56px 0 48px}
          .pg-section{padding:68px 0}
          .ec-split{grid-template-columns:1fr}
        }
        @media(max-width:540px){
          .pg-section{padding:52px 0}
          .ec-steps,.ec-personas{grid-template-columns:1fr}
          .ec-cards{grid-template-columns:1fr}
          .ec-stripe{padding:28px 20px}
        }
      `}</style>

      <div className="lv6">
        <LandingNav />
        <LandingV6Init />

        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="ec-hero">
          <div className="ec-hero-grid">
            <div>
              <div className="ec-flags">
                {EU_CA_COUNTRIES.map(c => <span key={c.name}>{c.flag}</span>)}
              </div>
              <span className="pg-eyebrow" style={{ background: '#eef0ff', color: '#4338ca' }}>
                Nouveau · Europe &amp; Canada
              </span>
              <h1 className="pg-h1">
                Vends{' '}
                <span style={{ color: '#4338ca' }}>en euros à Paris</span>,{' '}
                <span style={{ color: '#d97706' }}>et en FCFA à Dakar,</span>{' '}
                depuis la même boutique.
              </h1>
              <p className="pg-lead">
                TEKKIShop est en Europe francophone et au Canada.{' '}
                <strong style={{ color: '#344054' }}>Encaisse par carte bancaire via Stripe</strong>{' '}
                auprès de tes clients d&apos;ici — et continue de{' '}
                <strong style={{ color: '#344054' }}>servir tes clients en Afrique par mobile money</strong>. Une seule boutique, deux mondes.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <Link href="/start" className="pg-btn-indigo">
                  Créer ma boutique en Europe
                  {ARROW_ICO}
                </Link>
                <a href="#double" className="pg-btn-secondary">Voir le double marché</a>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 24px', fontSize: 13.5, fontWeight: 600, color: '#475467' }}>
                {['Boutique en € ou en $ CAD', 'Paiements sécurisés par Stripe'].map(r => (
                  <span key={r} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#12b76a' }}>{CHECK_ICO}</span>
                    {r}
                  </span>
                ))}
              </div>
            </div>

            {/* Double carte paiement */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <span style={{ borderRadius: 999, background: '#0b1830', color: '#fff', fontSize: 12, fontWeight: 800, padding: '9px 18px', whiteSpace: 'nowrap' }}>
                  1 seule boutique TEKKIShop
                </span>
              </div>
              <div className="ec-cards">
                <div className="ec-card" style={{ boxShadow: '0 14px 40px rgba(67,56,202,.1)' }}>
                  <p className="ec-card-label">Ta cliente à Paris 🇫🇷</p>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#101828', margin: '0 0 4px' }}>Robe wax premium</p>
                  <p style={{ fontFamily: 'var(--lv6-display,system-ui)', fontSize: 22, fontWeight: 800, color: '#4338ca', margin: '0 0 8px' }}>89,00 €</p>
                  <div className="ec-pay-btn" style={{ background: '#4338ca', color: '#fff' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    Payer par carte
                  </div>
                  <div className="ec-logos-row">
                    <div style={{ position: 'relative', width: 28, height: 18 }}><Image src="/logo-payments/visa.svg" alt="Visa" fill style={{ objectFit: 'contain' }} sizes="28px" /></div>
                    <div style={{ position: 'relative', width: 28, height: 18 }}><Image src="/logo-payments/Mastercard-Logo.wine.svg" alt="Mastercard" fill style={{ objectFit: 'contain' }} sizes="28px" /></div>
                    <span>· via Stripe</span>
                  </div>
                </div>

                <div className="ec-card" style={{ boxShadow: '0 14px 40px rgba(245,158,11,.1)' }}>
                  <p className="ec-card-label">Ta cliente à Dakar 🇸🇳</p>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#101828', margin: '0 0 4px' }}>Robe wax premium</p>
                  <p style={{ fontFamily: 'var(--lv6-display,system-ui)', fontSize: 22, fontWeight: 800, color: '#d97706', margin: '0 0 8px' }}>45 000 FCFA</p>
                  <div className="ec-pay-btn" style={{ background: '#d97706', color: '#fff' }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', position: 'relative', flexShrink: 0 }}>
                      <Image src="/logo-payments/wave_1.svg" alt="Wave" fill style={{ objectFit: 'contain', padding: 2 }} sizes="18px" />
                    </span>
                    Payer par Wave
                  </div>
                  <div className="ec-logos-row">
                    <span style={{ position: 'relative', width: 18, height: 18, display: 'inline-block' }}><Image src="/logo-payments/wave_1.svg" alt="Wave" fill style={{ objectFit: 'contain' }} sizes="18px" /></span>
                    Wave ·
                    <span style={{ position: 'relative', width: 18, height: 18, display: 'inline-block' }}><Image src="/logo-payments/om_1.svg" alt="OM" fill style={{ objectFit: 'contain' }} sizes="18px" /></span>
                    OM · à la livraison
                  </div>
                </div>
              </div>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#667085', marginTop: 12 }}>
                Deux clientes, deux continents, deux modes de paiement —{' '}
                <strong style={{ color: '#344054' }}>zéro complication pour toi.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* ── Logos paiements ─────────────────────────────────── */}
        <div className="ec-paybar">
          <div className="ec-paybar-inner">
            {EU_PAYMENTS.map(p => (
              <span key={p.name} className="ec-pay-badge">
                <span style={{ position: 'relative', width: 28, height: 18, display: 'inline-block' }}>
                  <Image src={p.logo} alt={p.name} fill style={{ objectFit: 'contain' }} sizes="28px" />
                </span>
                {p.name}
              </span>
            ))}
            <span className="ec-plus">+</span>
            {AF_PAYMENTS.map(p => (
              <span key={p.name} className="ec-pay-badge">
                <span style={{ position: 'relative', width: 28, height: 18, display: 'inline-block' }}>
                  <Image src={p.logo} alt={p.name} fill style={{ objectFit: 'contain' }} sizes="28px" />
                </span>
                {p.name}
              </span>
            ))}
            <span className="ec-pay-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, color: '#059669' }}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              À la livraison
            </span>
          </div>
        </div>

        {/* ── Double marché ────────────────────────────────────── */}
        <section id="double" className="pg-section pg-section-soft">
          <div className="pg-wrap">
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <span className="pg-eyebrow" style={{ background: '#eef0ff', color: '#4338ca' }}>Ce que personne d&apos;autre ne fait</span>
              <h2 className="pg-h2">Un pied ici, un pied là-bas ? <span style={{ color: '#4338ca' }}>Ta boutique aussi.</span></h2>
              <p className="pg-lead" style={{ margin: '0 auto' }}>
                Si tu vis entre deux mondes — la France et le Sénégal, la Belgique et la Côte d&apos;Ivoire, le Canada et le Mali — ton business aussi.
              </p>
            </div>

            <div className="ec-split">
              <div style={{ border: '1px solid #e6e9ef', borderRadius: 24, background: '#fff', padding: 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <span style={{ color: '#e03' }}>{CROSS_ICO}</span>
                  <h3 className="pg-h3" style={{ margin: 0 }}>Sans TEKKIShop</h3>
                </div>
                {SANS_ITEMS.map((t, i) => (
                  <div key={t} className="ec-list-row" style={i === 0 ? { borderTop: 0, paddingTop: 0 } : {}}>
                    <span style={{ color: '#e03', flexShrink: 0, marginTop: 2 }}>{CROSS_ICO}</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderRadius: 24, background: '#0b1830', color: '#fff', padding: 30, boxShadow: '0 24px 70px rgba(11,24,48,.22)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <span style={{ color: '#4ade80' }}>{CHECK_ICO}</span>
                  <h3 className="pg-h3" style={{ margin: 0, color: '#fff' }}>Avec TEKKIShop</h3>
                </div>
                {AVEC_ITEMS.map((item, i) => (
                  <div key={item.b} className="ec-list-row" style={i === 0 ? { borderTop: 0, paddingTop: 0, color: '#c8d8e8' } : { borderTopColor: 'rgba(255,255,255,.1)', color: '#c8d8e8' }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(18,183,106,.15)', color: '#4ade80', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{CHECK_ICO}</span>
                    <span><strong style={{ color: '#fff' }}>{item.b}</strong>{item.t}</span>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: 16, fontWeight: 600, color: '#344054', maxWidth: 560, margin: '36px auto 0', lineHeight: 1.6 }}>
              Les plateformes occidentales connaissent l&apos;Europe.{' '}
              <span style={{ color: '#4338ca' }}>Nous, on connaît les deux rives.</span>
            </p>
          </div>
        </section>

        {/* ── 4 étapes ────────────────────────────────────────── */}
        <section className="pg-section">
          <div className="pg-wrap">
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <span className="pg-eyebrow" style={{ background: '#eef0ff', color: '#4338ca' }}>C&apos;est simple</span>
              <h2 className="pg-h2">4 étapes, et tu encaisses en euros.</h2>
            </div>
            <div className="ec-steps">
              {ETAPES.map(e => (
                <div key={e.n} className="ec-step">
                  <div className="ec-step-n">{e.n}</div>
                  <p className="pg-h3">{e.titre}</p>
                  <p style={{ fontSize: 14, color: '#475467', margin: 0, lineHeight: 1.6 }}>{e.texte}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Confiance Stripe ─────────────────────────────────── */}
        <section className="pg-section pg-section-soft">
          <div className="pg-wrap">
            <div className="ec-stripe">
              <div className="ec-shield-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
              </div>
              <h2 className="pg-h2">TEKKIShop ne touche jamais à ton argent.</h2>
              <p className="pg-lead" style={{ margin: '0 auto 0', textAlign: 'center', maxWidth: 560 }}>
                Tu connectes <strong style={{ color: '#344054' }}>ton propre compte Stripe</strong> — le standard de paiement utilisé par des millions de commerçants dans le monde. Les paiements de tes clients vont <strong style={{ color: '#344054' }}>directement dessus</strong>. TEKKIShop n&apos;est jamais intermédiaire financier : ton argent t&apos;appartient, à chaque instant.
              </p>
              <div className="ec-trust-chips">
                {['Ton compte Stripe, ton argent', 'Virements automatiques', 'Paiements sécurisés 3D Secure'].map(p => (
                  <span key={p} className="ec-trust-chip">
                    {CHECK_ICO}
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Personas ─────────────────────────────────────────── */}
        <section className="pg-section">
          <div className="pg-wrap">
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <span className="pg-eyebrow" style={{ background: '#eef0ff', color: '#4338ca' }}>Qui vend depuis l&apos;Europe et le Canada</span>
              <h2 className="pg-h2">Des entrepreneurs entre deux mondes. <span style={{ color: '#4338ca' }}>Comme toi.</span></h2>
            </div>
            <div className="ec-personas">
              {PERSONAS.map(p => (
                <div key={p.titre} className="ec-persona-card">
                  <p className="pg-h3">{p.titre}</p>
                  <p style={{ fontSize: 14, color: '#667085', margin: 0, lineHeight: 1.6 }}>{p.texte}</p>
                  <span className="ec-persona-ex">{p.ex}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Ce que ça coûte ─────────────────────────────────── */}
        <section className="pg-section pg-section-soft">
          <div className="pg-wrap">
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <span className="pg-eyebrow" style={{ background: '#eef0ff', color: '#4338ca' }}>Transparence totale</span>
              <h2 className="pg-h2">Ce que ça te coûte. <span style={{ color: '#4338ca' }}>Et rien de plus.</span></h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 760, margin: '0 auto' }}>
              <div style={{ border: '1px solid #e6e9ef', borderRadius: 22, background: '#fff', padding: 30 }}>
                <h3 className="pg-h3">Commission TEKKIShop sur tes ventes Stripe</h3>
                <p style={{ fontFamily: 'var(--lv6-display,system-ui)', fontSize: 44, fontWeight: 900, color: '#059669', margin: '8px 0 12px', lineHeight: 1 }}>0 %</p>
                <p style={{ fontSize: 14, color: '#667085', lineHeight: 1.65, margin: 0 }}>
                  Tes paiements par carte vont sur ton compte Stripe. Tu paies uniquement les frais standards de Stripe et ton abonnement TEKKIShop. C&apos;est tout.
                </p>
              </div>
              <div style={{ border: '1px solid #e6e9ef', borderRadius: 22, background: '#fff', padding: 30 }}>
                <h3 className="pg-h3" style={{ marginBottom: 16 }}>Ton abonnement inclut tout</h3>
                {[
                  'Ta boutique en € ou CAD, format mobile',
                  'Produits physiques et digitaux inclus',
                  'Collecte automatique des avis clients',
                  'Ton marché Afrique inclus, sans supplément',
                  'Support en français, sur WhatsApp',
                ].map((t, i) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderTop: i > 0 ? '1px dashed #e6e9ef' : 'none', fontSize: 14, color: '#475467', lineHeight: 1.5 }}>
                    <span style={{ color: '#059669', flexShrink: 0, marginTop: 2 }}>{CHECK_ICO}</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────── */}
        <section className="pg-section">
          <div className="pg-wrap">
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <span className="pg-eyebrow" style={{ background: '#eef0ff', color: '#4338ca' }}>Questions fréquentes</span>
              <h2 className="pg-h2">Tout ce que tu veux savoir.</h2>
            </div>
            <div className="ec-faq">
              {FAQS.map(f => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p className="ec-faq-a">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────── */}
        <section style={{ background: 'linear-gradient(135deg,#312e81,#4338ca)', color: '#fff', textAlign: 'center', padding: '96px 24px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <span className="pg-eyebrow" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>
              Vends depuis où tu es
            </span>
            <h2 className="pg-h2" style={{ color: '#fff' }}>
              Ton business vit entre deux mondes. Ta boutique est prête à faire pareil.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,.72)', lineHeight: 1.65, maxWidth: 540, margin: '0 auto 32px' }}>
              Crée ta boutique en euros ou en dollars canadiens, connecte ton compte Stripe, et vends des deux côtés dès aujourd&apos;hui.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              <Link href="/start" className="pg-btn-indigo" style={{ background: '#fff', color: '#312e81', boxShadow: 'none' }}>
                Créer ma boutique
                {ARROW_ICO}
              </Link>
              <Link href="/login" className="pg-btn-outline-d">Connexion</Link>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 24 }}>
              {['Boutique gratuite à créer', 'Pas besoin de carte bancaire', 'Support en français'].map(s => (
                <span key={s} style={{ fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 999, padding: '7px 14px', color: '#fff' }}>{s}</span>
              ))}
            </div>
          </div>
        </section>

        <LandingFooter />
      </div>
    </>
  )
}
