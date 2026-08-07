import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import Link  from 'next/link'
import Image from 'next/image'
import { LandingNav }    from '@/components/landing-v6/LandingNav'
import { PricingV6 }     from '@/components/landing-v6/PricingV6'
import { FAQv6 }         from '@/components/landing-v6/FAQv6'
import { DemoModal }     from '@/components/landing-v6/DemoModal'
import { LandingV6Init } from '@/components/landing-v6/LandingV6Init'
import './landing-v6.css'

export const metadata = {
  title: 'TEKKIShop — Crée ta boutique en ligne en 5 minutes, depuis ton téléphone',
  description: 'Mets tes produits en ligne, partage ton lien sur WhatsApp et reçois ton argent par Wave, Orange Money ou à la livraison. Déjà 1 400+ boutiques créées. Sans ordinateur, sans développeur.',
}

// ── Icônes SVG (zéro emoji sur la landing page) ─────────────────────────────

const IC = {
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  checkCircle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12.5l2.6 2.6L16 9.7" />
    </svg>
  ),
  checkVerified: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  shoppingBag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  creditCard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  dollarSign: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  shoppingCart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  camera: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  ),
  smartphone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  ),
  store: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  sparkle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6z"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06V9.66a5.67 5.67 0 0 0-.77-.05A5.69 5.69 0 1 0 15.54 15.3V8.9a7.35 7.35 0 0 0 4.3 1.38V7.19a4.29 4.29 0 0 1-3.24-1.37Z" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
}

export default async function LandingPage() {
  const supabase = await createServerClient()
  const admin    = createAdminClient()

  const { count: totalShopsCount } = await admin
    .from('shops')
    .select('id', { count: 'exact', head: true })

  const { data: allShops } = await supabase
    .from('shops')
    .select('id, name, slug, plan, city, logo_url, is_active, created_at')
    .eq('is_active', true)
    .in('plan', ['pro', 'business'])
    .order('plan', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(8)

  const shops      = allShops ?? []
  const shopsCount = totalShopsCount ?? 0

  return (
    <div className="lv6" id="top">

      {/* ── Bannière TEKKIPro ──────────────────────────────────────── */}
      <div className="announcement-bar">
        <span>Tu proposes des services ?</span>
        <a href="https://tekki.pro" target="_blank" rel="noopener noreferrer">
          Découvre TEKKIPro →
        </a>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <LandingNav />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-grid">
          {/* Texte */}
          <div className="hero-copy">
            <div className="social-proof">
              <div className="avatars">
                <Image src="/avatars/1.jpg" alt="" width={36} height={36} className="avatar" />
                <Image src="/avatars/2.jpg" alt="" width={36} height={36} className="avatar" />
                <Image src="/avatars/3.jpg" alt="" width={36} height={36} className="avatar" />
                <Image src="/avatars/4.jpg" alt="" width={36} height={36} className="avatar" />
                <Image src="/avatars/5.jpg" alt="" width={36} height={36} className="avatar" />
              </div>
              <div>
                <b>{shopsCount}+ boutiques créées</b>
                <span>Disponible dans 11 pays</span>
              </div>
            </div>

            <h1>
              Crée ta boutique en ligne en <span className="grad">5&nbsp;minutes,</span> avec ton téléphone.
            </h1>

            <p className="lead">
              Ajoute tes produits, partage ton lien, et c&rsquo;est tout. Tes clients commandent seuls, paient par mobile money, et tu retires ton argent directement sur ton mobile money.
            </p>

            <div className="hero-ctas">
              <Link href="/start" className="btn btn-primary">
                Créer ma boutique gratuitement
                {IC.arrowRight}
              </Link>
              <a href="#probleme" className="btn btn-secondary">Voir comment ça marche</a>
            </div>

            <div className="objections">
              <span>{IC.check} Pas besoin de développeur</span>
              <span>{IC.check} Pas besoin d&rsquo;ordinateur</span>
              <span>{IC.check} 3 commandes offertes</span>
            </div>
          </div>

          {/* Téléphone */}
          <div className="hero-stage">
            <div className="phone">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="st-cover">
                  <div className="st-cover-logo">
                    <span style={{ color: '#e05a7a', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <svg viewBox="0 0 24 24" fill="#e05a7a" stroke="none" style={{ width: 9, height: 9 }}>
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </span>
                    Viens on s&rsquo;connaît
                  </div>
                  <div className="st-cover-txt">Des jeux de cartes pour tisser des liens plus forts avec vos proches.</div>
                  <div className="st-boxes" aria-hidden="true">
                    <i /><i /><i /><i /><i />
                  </div>
                  <div className="st-share">↗</div>
                </div>
                <div className="st-ava">Viens on<br />s&rsquo;connaît</div>
                <div className="st-body">
                  <div className="st-name">
                    Viens on s&rsquo;connaît
                    <span className="st-check">{IC.checkVerified}</span>
                  </div>
                  <div className="st-cat">Jeux de société</div>
                  <p className="st-desc">Les jeux de cartes qui vous rapprochent de vos proches | Couples – Amis – Famille</p>
                  <div className="st-pills">
                    <span className="st-pill">+8000 jeux vendus</span>
                    <span className="st-pill">Livraison gratuite à Dakar</span>
                  </div>
                  <div className="st-social">
                    <span className="st-ig">Instagram</span>
                    <span className="st-tt">TikTok</span>
                    <span className="st-fb">Facebook</span>
                  </div>
                  <button className="st-order" type="button" tabIndex={-1}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 0 1-8 0"/>
                      </svg>
                      Commander
                    </span>
                  </button>
                  <div className="st-sec">
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ width: 9, height: 9, color: '#ffb020' }}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Coups de cœur
                  </div>
                  <div className="st-favs">
                    <div className="st-fav">
                      <i />
                      <div><b>Pour Les Amoureux</b><span>14 000 FCFA</span></div>
                    </div>
                    <div className="st-fav">
                      <i />
                      <div><b>Et pourtant, on s&rsquo;aimait</b><span>4 500 FCFA</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="float float-1">
              <i style={{ background: '#fff', overflow: 'hidden', padding: 4, boxSizing: 'border-box' }}>
                <Image src="/logo-payments/wave_1.svg" alt="Wave" width={21} height={21} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </i>
              <div>
                <b>Paiement reçu</b>
                <small>Wave · 14 000 FCFA</small>
              </div>
            </div>
            <div className="float float-2">
              <i style={{ background: '#176bff' }}>{IC.shoppingBag}</i>
              <div>
                <b>Nouvelle commande</b>
                <small>2 articles · il y a 1 min</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bandeau paiements ──────────────────────────────────────── */}
      <div className="strip">
        <div className="strip-label">Tes clients paient comme ils veulent :</div>
        <div className="pay-row">
          <span className="pay">
            <Image src="/logo-payments/wave_1.svg" alt="" aria-hidden width={60} height={20} style={{ height: 20, width: 'auto' }} />
            Wave
          </span>
          <span className="pay">
            <Image src="/logo-payments/om_1.svg" alt="" aria-hidden width={60} height={20} style={{ height: 20, width: 'auto' }} />
            Orange Money
          </span>
          <span className="pay">
            <Image src="/logo-payments/mtn_1.svg" alt="" aria-hidden width={60} height={20} style={{ height: 20, width: 'auto' }} />
            MTN MoMo
          </span>
          <span className="pay">
            <Image src="/logo-payments/moov_1.svg" alt="" aria-hidden width={60} height={20} style={{ height: 20, width: 'auto' }} />
            Moov Money
          </span>
          <span className="pay">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, flexShrink: 0 }}>
              <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/>
              <circle cx="15" cy="5" r="1"/>
              <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
            </svg>
            À la livraison
          </span>
          <span className="pay">
            <Image src="/logo-payments/visa.svg" alt="" aria-hidden width={40} height={20} style={{ height: 20, width: 'auto' }} />
            <Image src="/logo-payments/Mastercard-Logo.wine.svg" alt="" aria-hidden width={40} height={20} style={{ height: 20, width: 'auto' }} />
            Carte bancaire
          </span>
        </div>
      </div>

      {/* ── Le problème ──────────────────────────────────────────── */}
      <section className="section" id="probleme">
        <div className="container problem-grid">
          <div className="reveal">
            <span className="label">Le vrai problème</span>
            <h2>WhatsApp t&rsquo;aide à commencer. Mais il t&rsquo;oblige à <span className="grad">tout faire toi-même.</span></h2>
            <p className="lead">Renvoyer les mêmes photos, répéter les prix, vérifier ce qu&rsquo;il te reste en stock, noter l&rsquo;adresse, confirmer que le client a bien payé, appeler le livreur, attendre qu&rsquo;il confirme le paiement et la livraison. Chaque vente te coûte une demi-heure de messages.</p>
            <div className="callout"><strong>Avec TEKKIShop, ta boutique se gère toute seule : ton client voit tout, choisit et paie tout seul. Toi, tu prépares la commande.</strong></div>
          </div>
          <div className="compare reveal">
            <div className="cmp cmp-bad">
              <span className="cmp-tag">Aujourd&rsquo;hui, sans TEKKIShop</span>
              <h3>Ta journée dépend de tes messages</h3>
              <ul>
                <li><b>✕</b> Tes photos et tes prix sont éparpillés dans les statuts et les discussions.</li>
                <li><b>✕</b> Tu répètes la même chose à chaque client.</li>
                <li><b>✕</b> Une commande se perd vite entre deux conversations.</li>
                <li><b>✕</b> Tu vérifies chaque paiement toi-même.</li>
                <li><b>✕</b> Si tu n&rsquo;es pas en ligne, la vente n&rsquo;avance pas.</li>
              </ul>
            </div>
            <div className="cmp cmp-good">
              <span className="cmp-tag">Demain, avec TEKKIShop</span>
              <h3>Ta boutique fait le premier travail</h3>
              <ul>
                <li><b>✓</b> Tous tes produits sont dans un seul lien.</li>
                <li><b>✓</b> Le client voit le prix, la description et ce qu&rsquo;il reste en stock.</li>
                <li><b>✓</b> Les commandes arrivent au même endroit, bien rangées.</li>
                <li><b>✓</b> Le client peut payer par mobile money ou à la livraison.</li>
                <li><b>✓</b> Tu gères tout depuis ton téléphone, n&rsquo;importe où.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Les 5 étapes ──────────────────────────────────────────── */}
      <section className="section" id="etapes" style={{ background: 'var(--sky)' }}>
        <div className="container">
          <div className="section-head center reveal">
            <span className="label">Aussi simple que ça</span>
            <h2>Ta boutique est prête en <span className="grad">5 étapes.</span></h2>
            <p className="lead">Pas besoin d&rsquo;ordinateur, ni de développeur. Tu gères tout depuis ton téléphone.</p>
          </div>

          {/* Étape 1 */}
          <div className="step-row reveal">
            <div className="step-media">
              <div className="app">
                <div className="app-bar">
                  <span className="app-logo">TEKKI<span>Shop</span></span>
                  <span className="app-step">Étape 1/5</span>
                </div>
                <div className="app-in">
                  <div className="prog"><i data-prog="20:400,40:2900" /></div>
                  <div className="qtitle">Comment s&rsquo;appelle ton business ?</div>
                  <div className="qsub">C&rsquo;est le nom que tes clients verront. Tu pourras le changer plus tard.</div>
                  <div className="qinput"><span data-type="Chez Fatou" data-delay="900" data-caret="1" /></div>
                  <div className="qchips"><span>Chez Fatou</span><span>Adja Cosmétiques</span><span>Dakar Sneakers</span></div>
                  <div className="tip" data-appear="1900">L&rsquo;URL de ta boutique sera : <b>tekki.shop/chez-fatou</b>. Choisis un nom court et mémorable que tes clients retiendront facilement.</div>
                  <div className="qbtn" data-ready="2600">Continuer</div>
                </div>
              </div>
            </div>
            <div>
              <div className="step-num"><i>01</i><span>60 secondes chrono</span></div>
              <h3>Réponds à 5 questions</h3>
              <p>Pas de blabla, pas de formulaire compliqué. Tu réponds, et ta boutique se construit pendant ce temps.</p>
              <ul className="step-pts">
                <li>{IC.check} Le nom de ton business, et ton adresse tekki.shop/tonnom est réservée</li>
                <li>{IC.check} Ce que tu vends, où tu vends déjà, dans quel pays tu es</li>
                <li>{IC.check} Quel est ton plus gros blocage pour vendre en ligne aujourd&rsquo;hui</li>
              </ul>
            </div>
          </div>

          {/* Étape 2 */}
          <div className="step-row reveal flip">
            <div className="step-media">
              <div className="app">
                <div className="app-bar">
                  <span className="app-logo">TEKKI<span>Shop</span></span>
                  <span className="app-step">Ton compte</span>
                </div>
                <div className="app-in">
                  <div className="prog"><i data-prog="100:400" /></div>
                  <div className="qtitle">Crée ton compte</div>
                  <div className="qsub">Pour retrouver ta boutique depuis n&rsquo;importe quel téléphone.</div>
                  <div className="fld" style={{ marginBottom: 11 }}>
                    <small>Ton numéro WhatsApp</small>
                    <b data-type="+221 77 123 46 78" data-delay="800" />
                  </div>
                  <span className="pinlab">Choisis un code PIN à 6 chiffres</span>
                  <div className="pin" data-pin="6" data-delay="1900"><i /><i /><i /><i /><i /><i /></div>
                  <div className="trust" data-appear="3450"><span>Création gratuite</span><span>Aucun engagement</span></div>
                  <div className="qbtn green" data-ready="3700">Ouvrir ma boutique</div>
                </div>
              </div>
            </div>
            <div>
              <div className="step-num"><i>02</i><span>Environ 30 secondes</span></div>
              <h3>Crée ton compte</h3>
              <p>Insère ton numéro WhatsApp et choisis un code PIN de 6 chiffres. Pas de mot de passe à retenir, pas d&rsquo;e-mail à confirmer.</p>
              <ul className="step-pts">
                <li>{IC.check} Ton numéro te sert d&rsquo;identifiant, comme sur ton mobile money</li>
                <li>{IC.check} Ton code PIN à 6 chiffres te sert de mot de passe</li>
                <li>{IC.check} Ta boutique existe déjà : le compte sert juste à y accéder</li>
              </ul>
            </div>
          </div>

          {/* Étape 3 */}
          <div className="step-row reveal">
            <div className="step-media">
              <div className="app">
                <div className="app-bar">
                  <span className="app-back">←</span>
                  <b>Nouveau produit</b>
                  <span className="app-step">Brouillon</span>
                </div>
                <div className="app-in">
                  {/* Type de produit */}
                  <div className="type-tabs">
                    <span className="on">Physique</span>
                    <span>Digital</span>
                  </div>
                  {/* Zone upload */}
                  <div className="upload" style={{ height: 52, flexDirection: 'row', gap: 7 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20, opacity: 0.45 }}>
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>Ajouter des photos (max 5 · JPG, PNG)</span>
                  </div>
                  {/* Thumbnails (photos en cours d'ajout) */}
                  <div className="thumbs" style={{ marginTop: 7 }}>
                    <i data-appear="250" /><i data-appear="420" /><i data-appear="590" />
                  </div>
                  {/* Champs */}
                  <div className="fld"><small>Nom du produit *</small><b data-type="Pour Les Amoureux" data-delay="900" /></div>
                  <div className="fld-row">
                    <div className="fld"><small>Prix de base (FCFA) *</small><b data-count="14000" data-suffix=" FCFA" data-delay="1600">5 000 FCFA</b></div>
                    <div className="fld"><small>Stock</small><b data-count="12" data-delay="1900">0</b></div>
                  </div>
                  {/* Produit en vedette */}
                  <div className="feat-row" data-appear="2150">
                    <span>Produit en vedette — Coups de cœur</span>
                    <div className="toggle-sw" />
                  </div>
                  <div className="app-btn" data-ready="2500">Créer le produit</div>
                </div>
              </div>
            </div>
            <div>
              <div className="step-num"><i>03</i><span>Environ 1 minute par produit</span></div>
              <h3>Ajoute tes produits</h3>
              <p>Une photo, un prix, une description. Exactement comme quand tu publies un statut, sauf que là, ça se vend tout seul.</p>
              <ul className="step-pts">
                <li>{IC.check} Prends la photo directement avec ton téléphone</li>
                <li>{IC.check} Indique ton stock : tes clients voient ce qu&rsquo;il reste</li>
                <li>{IC.check} Produits à livrer ou fichiers à télécharger, au choix</li>
              </ul>
            </div>
          </div>

          {/* Étape 4 */}
          <div className="step-row reveal flip">
            <div className="step-media">
              <div className="app">
                <div className="app-bar">
                  <span className="app-back">←</span>
                  <b>Paramètres</b>
                  <span className="app-step">Boutique</span>
                </div>
                <div className="app-in">
                  {/* Logo + Nom */}
                  <div className="sett-logo-row" data-appear="300">
                    <span className="bl on" style={{ background: 'linear-gradient(145deg,#7c3aed,#5b21b6)', width: 36, height: 36, borderRadius: '50%', display: 'block', flexShrink: 0 }} />
                    <div className="sett-logo-info">
                      <b>Chez Fatou</b>
                      <small>Logo de la boutique</small>
                      <span className="sett-change">Changer le logo</span>
                    </div>
                  </div>
                  {/* Nom + Ville */}
                  <div className="fld"><small>Nom de la boutique *</small><b>Chez Fatou</b></div>
                  <div className="fld-row">
                    <div className="fld"><small>Ville *</small><b>Dakar</b></div>
                    <div className="fld"><small>Pays</small><b>Sénégal</b></div>
                  </div>
                  {/* Couleur principale */}
                  <div className="brandbox" style={{ marginBottom: 0 }}>
                    <b style={{ fontSize: 10.5, display: 'block', marginBottom: 8 }}>Couleur principale</b>
                    <div className="swatches" data-swatch="3:1100,2:1450,0:1800">
                      <i style={{ background: '#002568' }} />
                      <i style={{ background: '#e4572e' }} />
                      <i style={{ background: '#12b981' }} />
                      <i style={{ background: '#1f6fd0' }} />
                      <i style={{ background: '#ffb020' }} />
                      <i style={{ background: '#f0575f' }} />
                      <i style={{ background: '#7c3aed' }} />
                      <i style={{ background: '#374151' }} />
                    </div>
                    <div className="saved" data-appear="2250">Enregistré</div>
                  </div>
                  <div className="app-btn" data-ready="2700">Enregistrer les modifications</div>
                </div>
              </div>
            </div>
            <div>
              <div className="step-num"><i>04</i><span>Environ 2 minutes</span></div>
              <h3>Personnalise ta boutique</h3>
              <p>Ton logo, ta photo de couverture, tes couleurs, tes zones de livraison. Ta boutique ressemble à ta marque, pas à un modèle.</p>
              <ul className="step-pts">
                <li>{IC.check} Logo, couverture et couleurs en quelques clics</li>
                <li>{IC.check} Tes boutons Appeler, Écrire, Instagram et TikTok</li>
                <li>{IC.check} Tes zones et tes frais de livraison</li>
              </ul>
            </div>
          </div>

          {/* Étape 5 */}
          <div className="step-row reveal">
            <div className="step-media">
              <div className="app">
                <div className="app-bar">
                  <span className="app-back">←</span>
                  <b>Ma boutique</b>
                  <span className="app-step">En ligne</span>
                </div>
                <div className="app-in">
                  <div className="db-link" data-appear="200">
                    <div className="db-link-head">
                      <i>↗</i>
                      <div><b>Lien de ton site</b><small>Partage-le à tes clients</small></div>
                    </div>
                    <div className="db-url">https://www.tekki.shop/chez-fatou <span>↗</span></div>
                    <div className="db-btns"><span className="wa">Partager sur WhatsApp</span><span>Carte</span><span>QR</span></div>
                    <div className="db-btns"><span>Copier le lien</span><span className="blue">Voir mon site</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="step-num"><i>05</i><span>Une fois, puis c&rsquo;est fait</span></div>
              <h3>Partage ton lien et commence à vendre</h3>
              <p>Ta boutique est en ligne dès que tu publies ton premier produit. Tu partages ton lien, tes clients commandent, et tes 3 premières commandes sont offertes.</p>
              <ul className="step-pts">
                <li>{IC.check} Ta boutique est publique dès ton premier produit publié</li>
                <li>{IC.check} Tes 3 premières commandes sont offertes, sans rien payer</li>
                <li>{IC.check} Partage ton lien, ton QR code, et commence à recevoir des commandes</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── La vitrine vue par tes clients ──────────────────────────── */}
      <section className="section">
        <div className="container split">
          <div className="split-media reveal">
            <div className="db-wrap">
              <div className="phone" style={{ position: 'relative', zIndex: 2 }}>
                <div className="phone-notch" />
                <div className="phone-screen">
                  {/* Vue boutique complète — Chez Fatou */}
                  <div className="st-cover" style={{ background: 'linear-gradient(150deg,#ffd6e8,#c49af5 60%,#8b5cf6)' }}>
                    <div className="st-cover-logo" style={{ color: '#5b21b6' }}>Chez Fatou</div>
                    <div className="st-cover-txt" style={{ color: '#3b0764' }}>Mode féminine & Cosmétiques naturels · Dakar</div>
                    <div className="st-boxes" aria-hidden="true"><i /><i /><i /><i /><i /></div>
                    <div className="st-share">↗</div>
                  </div>
                  <div className="st-ava" style={{ background: 'linear-gradient(150deg,#7c3aed,#5b21b6)', color: '#e9d5ff' }}>CF</div>
                  <div className="st-body">
                    <div className="st-name">
                      Chez Fatou
                      <span className="st-check">{IC.checkVerified}</span>
                    </div>
                    <div className="st-cat">Mode &amp; Beauté</div>
                    <p className="st-desc">Prêt-à-porter féminin haut de gamme et cosmétiques 100% naturels fabriqués au Sénégal.</p>
                    <div className="st-pills">
                      <span className="st-pill">Livraison Dakar &amp; Banlieue</span>
                      <span className="st-pill">+500 clientes satisfaites</span>
                    </div>
                    <div className="st-social">
                      <span className="st-ig">Instagram</span>
                      <span className="st-tt">TikTok</span>
                      <span className="st-fb">Appeler</span>
                    </div>
                    <button className="st-order" type="button" tabIndex={-1}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                        Commander
                      </span>
                    </button>
                    <div className="st-sec">
                      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ width: 9, height: 9, color: '#ffb020' }}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      Coups de cœur
                    </div>
                    <div className="st-favs">
                      <div className="st-fav">
                        <i style={{ background: 'linear-gradient(150deg,#fce7f3,#f9a8d4)' }} />
                        <div><b>Robe Wax Imprimé</b><span>18 500 FCFA</span></div>
                      </div>
                      <div className="st-fav">
                        <i style={{ background: 'linear-gradient(150deg,#ede9fe,#c4b5fd)' }} />
                        <div><b>Huile Argan Pure</b><span>7 500 FCFA</span></div>
                      </div>
                    </div>
                    <div className="mfoot">Toi aussi, ouvre ta boutique en 5 min avec <b>TEKKIShop →</b></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="reveal">
            <span className="label">Une vraie boutique</span>
            <h2>Une boutique qui inspire confiance. <span className="grad">Sans rien faire de technique.</span></h2>
            <p className="lead">Ton client ouvre ton lien, voit tous tes produits avec les prix, choisit, remplit son adresse et paie. Il n&rsquo;a pas besoin de t&rsquo;écrire pour acheter.</p>
            <ul className="checks">
              <li>
                {IC.checkCircle}
                <div><b>Un seul lien pour toute ta boutique</b><p>Fini les 10 photos et les prix envoyés un par un dans la discussion WhatsApp ou en DM.</p></div>
              </li>
              <li>
                {IC.checkCircle}
                <div><b>Du produit au paiement, sans sortir de la page</b><p>Ton client choisit le produit, commande et paie par mobile money ou à la livraison.</p></div>
              </li>
              <li>
                {IC.checkCircle}
                <div><b>Tes boutons Appeler et WhatsApp restent là</b><p>Ceux qui préfèrent te parler avant d&rsquo;acheter peuvent toujours le faire en un clic.</p></div>
              </li>
            </ul>
            <button className="btn btn-secondary" data-open-demo>Voir une vraie boutique</button>
          </div>
        </div>
      </section>

      {/* ── Timeline 24h/24 ──────────────────────────────────────── */}
      <section className="timeline-sec">
        <div className="container">
          <div className="section-head center reveal">
            <span className="label label--dark">Pendant que tu vis ta vie</span>
            <h2>Ta boutique travaille pour toi, <span style={{ color: 'var(--amber)' }}>24h/24.</span></h2>
            <p className="lead">Une journée réelle d&rsquo;un vendeur TEKKIShop. Regarde bien l&rsquo;heure de la vente la plus intéressante.</p>
          </div>
          <div className="tl-grid">
            <div className="tl reveal">
              {[
                { time: '07:12', bold: 'Tu mets ton lien dans ton statut', text: 'Une seule adresse à partager, au lieu de dix photos envoyées une par une.', night: false },
                { time: '09:40', bold: 'Première commande, déjà payée', text: 'Le client a choisi, commandé et payé par Wave. Tu n\'as répondu à aucun message.', night: false },
                { time: '12:05', bold: 'Pendant que tu es occupé, ta boutique répond', text: 'Le prix, les couleurs, ce qu\'il reste en stock, les frais de livraison : le client voit déjà tout sur ta boutique.', night: false },
                { time: '16:30', bold: 'Tu prépares toutes tes livraisons d\'un coup', text: 'Les commandes du jour sont dans un seul écran, avec toutes les infos nécessaires.', night: false },
                { time: '21:18', bold: 'Le livreur a reçu les commandes et validé les livraisons', text: 'Chaque commande est envoyée en 1 clic au livreur, et il valide chaque livraison en 1 clic, ce qui met à jour automatiquement le statut de la commande.', night: false },
                { time: '02:47', bold: 'Tu dors. Une cliente commande depuis Abidjan.', text: 'Elle regarde ton catalogue, paie par Orange Money et reçoit son reçu. Tu découvriras la commande au réveil.', night: true, badge: 'Ça, tu ne peux pas le faire toi-même' },
                { time: '08:00', bold: 'Tu retires ton argent', text: 'Ton argent arrive dans ta page Revenus, et tu le retires sur ton mobile money de manière instantanée.', night: false },
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
                <p>arrive en dehors de tes heures de travail. Sans boutique en ligne, ce sont des ventes que tu ne verras jamais.</p>
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

      {/* ── Espace vendeur ──────────────────────────────────────────── */}
      <section className="section">
        <div className="container split">
          <div className="split-media reveal">
            <div className="db-wrap">
              <div className="phone" style={{ position: 'relative', zIndex: 2 }}>
                <div className="phone-notch" />
                <div className="phone-screen">
                  <div className="db-screen">
                    <div className="db-top">
                      <span className="db-burger">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: 14, height: 14 }}>
                          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                      </span>
                      <div className="db-icons">
                        <span style={{ position: 'relative' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                            <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                          </svg>
                          <i className="db-dot" />
                        </span>
                        <span className="db-bell">{IC.bell}</span>
                        <span>{IC.eye}</span>
                      </div>
                    </div>
                    <div className="db-body">
                      <div className="db-date">Lundi 3 Août</div>
                      <div className="db-hello">Bonsoir, Viens on s&rsquo;connaît</div>
                      <div className="db-sales">
                        <div className="db-sales-head">Ventes &mdash; Auj. · 1 vente <i>↗</i></div>
                        <div className="db-amount">14 000 <small>F</small></div>
                        <div className="db-chips">
                          <span className="on">Auj.</span><span>Hier</span><span>Semaine</span><span>Mois</span><span>Trimestre</span>
                        </div>
                      </div>
                      <div className="db-two">
                        <div className="db-mini"><small>Produits</small><b>7</b><span>actifs</span><i>{IC.box}</i></div>
                        <div className="db-mini"><small>En attente</small><b>0</b><span>commandes</span><i>{IC.shoppingCart}</i></div>
                      </div>
                      <div className="db-link">
                        <div className="db-link-head">
                          <i>↗</i>
                          <div><b>Lien de ton site</b><small>Partage ce lien à tes clients</small></div>
                        </div>
                        <div className="db-url">https://www.tekki.shop/viensonsconnait <span>↗</span></div>
                        <div className="db-btns"><span className="wa">Partager sur WhatsApp</span><span>Carte</span><span>QR</span></div>
                        <div className="db-btns"><span>Copier le lien</span><span className="blue">Voir mon site</span></div>
                      </div>
                      <div className="db-oh"><b>Commandes en cours</b><span>Voir toutes →</span></div>
                      <div className="db-orders">
                        <div className="db-order">
                          <i /><div><b>Ndeye Marie Diaw <em>#B1DF87</em></b><p>Pour les Mariés</p></div>
                          <div className="db-order-right"><strong>14 000 F</strong><span className="db-badge">Confirmée</span></div>
                        </div>
                        <div className="db-order">
                          <i /><div><b>Moïse Junior <em>#0B8132</em></b><p>Et Pourtant, on s&rsquo;aimait</p></div>
                          <div className="db-order-right"><strong>225 F</strong><span className="db-badge">Confirmée</span></div>
                        </div>
                        <div className="db-order">
                          <i /><div><b>Penda Barhama <em>#ABFBAC</em></b><p>Et Pourtant, on s&rsquo;aimait</p></div>
                          <div className="db-order-right"><strong>4 500 F</strong><span className="db-badge">Confirmée</span></div>
                        </div>
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
            <h2>La même boutique, vue de ton côté.</h2>
            <p className="lead">Tes ventes du jour, tes commandes, tes produits, tes clients, tes revenus, tes codes promo, ton suivi livreur : tout tient dans un écran, sur le même téléphone que tu as déjà dans la main.</p>
            <div className="feat-list">
              <div className="feat"><span className="feat-n">01</span><b>Tes ventes du jour</b><p>Aujourd&rsquo;hui, hier, la semaine, le mois. Tu sais toujours où tu en es.</p></div>
              <div className="feat"><span className="feat-n">02</span><b>Tes commandes en cours</b><p>Qui a commandé, quel produit, combien, et si c&rsquo;est confirmé.</p></div>
              <div className="feat"><span className="feat-n">03</span><b>Ton lien, prêt à partager</b><p>Un bouton pour l&rsquo;envoyer sur WhatsApp, un QR code à imprimer, une carte à publier.</p></div>
              <div className="feat"><span className="feat-n">04</span><b>Ton Assistant IA</b><p>Il t&rsquo;explique ce que tu ne comprends pas, te guide pas à pas et te conseille pour vendre plus.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ce que tu peux vendre ──────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--sky)' }}>
        <div className="container">
          <div className="section-head center reveal">
            <span className="label">Une boutique pour ton commerce</span>
            <h2>Vends ce que tu sais créer, fabriquer ou revendre.</h2>
            <p className="lead">Que tu vendes des objets à livrer ou des fichiers à télécharger, ça marche pareil.</p>
          </div>
          <div className="cards-3 reveal">
            <article className="card">
              <div className="card-ico" style={{ background: '#ffeee3', color: '#e4572e' }}>{IC.shoppingBag}</div>
              <h3>Produits à livrer</h3>
              <p>Mode, beauté, alimentation, décoration, accessoires, artisanat, électronique.</p>
            </article>
            <article className="card">
              <div className="card-ico" style={{ background: '#e9ecff', color: '#4039c9' }}>{IC.smartphone}</div>
              <h3>Produits à télécharger</h3>
              <p>Ebooks, guides, formations, modèles. Le client les reçoit juste après avoir payé.</p>
            </article>
            <article className="card">
              <div className="card-ico" style={{ background: '#e3f9ee', color: '#078959' }}>{IC.store}</div>
              <h3>Boutiques et commerces</h3>
              <p>Mets ton catalogue en ligne et transforme tes abonnés en vrais clients.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Témoignages ──────────────────────────────────────────── */}
      <section className="section testi-sec">
        <div className="container">
          <div className="section-head center reveal">
            <span className="label">Ils l&rsquo;ont fait avant toi</span>
            <h2>Vendre en ligne n&rsquo;a jamais été <span className="grad">aussi simple.</span></h2>
            <p className="lead">Des vendeurs qui ont arrêté de gérer leurs commandes dans une discussion WhatsApp.</p>
          </div>
          <div className="testi-grid reveal">
            {[
              { stars: '★★★★★', text: 'J\'ai créé ma boutique un dimanche soir. Le lundi matin, j\'avais déjà deux ventes payées sans avoir répondu à un seul message.', name: 'Aminata S.', role: 'Mode féminine · Dakar', initials: 'AS', bg: 'linear-gradient(145deg,#ff955b,#e4572e)' },
              { stars: '★★★★★', text: 'Avant, je passais mes soirées à renvoyer les mêmes photos et les mêmes prix. Maintenant j\'envoie un lien et je m\'occupe de mes livraisons.', name: 'Fatou K.', role: 'Cosmétiques naturels · Abidjan', initials: 'FK', bg: 'linear-gradient(145deg,#6e78ff,#4039c9)' },
              { stars: '★★★★★', text: 'Je vends des formations. Orange Money marche directement et mes clients téléchargent tout de suite. C\'est ça qui manquait ici.', name: 'Marie N.', role: 'Formations en ligne · Cotonou', initials: 'MN', bg: 'linear-gradient(145deg,#23c78c,#078959)' },
              { stars: '★★★★★', text: 'Ce qui m\'a convaincue, c\'est que tout se fait au téléphone. Je n\'ai pas d\'ordinateur et je n\'en ai jamais eu besoin.', name: 'Rokhaya D.', role: 'Artisanat · Thiès', initials: 'RD', bg: 'linear-gradient(145deg,#ffca57,#de8c00)' },
              { stars: '★★★★★', text: 'Mes commandes ne se perdent plus. Je vois qui a payé, qui attend, ce qu\'il me reste. Avant je notais tout dans un cahier.', name: 'Ibrahim T.', role: 'Électronique · Ouagadougou', initials: 'IT', bg: 'linear-gradient(145deg,#4fb0ff,#1160c4)' },
              { stars: '★★★★★', text: 'Mes clientes en France commandent maintenant elles aussi. Une boutique, un lien, et je vends des deux côtés.', name: 'Khadija M.', role: 'Épicerie fine · Bamako', initials: 'KM', bg: 'linear-gradient(145deg,#4fc3d9,#1a7f96)' },
            ].map((t) => (
              <article key={t.name} className="testi">
                <div className="stars">{t.stars}</div>
                <p>{t.text}</p>
                <div className="testi-who">
                  <i style={{ background: t.bg }}>{t.initials}</i>
                  <div><b>{t.name}</b><small>{t.role}</small></div>
                </div>
              </article>
            ))}
          </div>
          <p className="swipe-hint">← Fais glisser pour lire la suite →</p>

          {shops.length > 0 && (
            <div className="merchants reveal">
              {shops.map(s => <span key={s.id}>{s.name}</span>)}
            </div>
          )}

          <div className="stats-bar reveal">
            <div className="stat"><b>{shopsCount.toLocaleString('fr-FR')}</b><small>boutiques créées</small></div>
            <div className="stat"><b>6</b><small>pays d&rsquo;Afrique</small></div>
            <div className="stat"><b>5</b><small>pays d&rsquo;Occident</small></div>
            <div className="stat"><b>4,7<span style={{ fontSize: '.5em' }}>/5</span></b><small>note des vendeurs</small></div>
          </div>
        </div>
      </section>

      {/* ── Tarifs ──────────────────────────────────────────────────── */}
      <PricingV6 />

      {/* ── Fondateur ───────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--sky)' }}>
        <div className="container founder">
          <div className="founder-card reveal">
            <div className="founder-ava" style={{ overflow: 'hidden' }}>
              <Image src="/avatars/ibuka.jpg" alt="Ibuka Ndjoli" width={100} height={100} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <b>Ibuka Ndjoli</b>
            <small>Fondateur de TEKKIShop &amp; entrepreneur e-commerce</small>
          </div>
          <div className="reveal">
            <span className="label">Conçu à partir du terrain</span>
            <h2>Fait par des gens qui ont vendu en ligne ici, avant toi.</h2>
            <p className="quote">« Vendre en ligne depuis l&rsquo;Afrique ne devrait pas demander un ordinateur, un développeur ou des connaissances techniques. »</p>
            <p className="lead">TEKKIShop est né de plusieurs années passées à vendre en ligne et à accompagner des marques africaines. Notre travail, c&rsquo;est de faire disparaître la partie technique pour que tu t&rsquo;occupes de tes produits, de tes clients et de ton argent.</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <FAQv6 />

      {/* ── CTA final ──────────────────────────────────────────────── */}
      <section className="cta-sec">
        <div className="container">
          <div className="cta-card reveal">
            <h2>Ton téléphone peut devenir ta boutique. Aujourd&rsquo;hui.</h2>
            <p>Crée ta boutique, ajoute tes produits, partage ton lien, et commence à vendre sans prise de tête.</p>
            <div className="cta-actions">
              <Link href="/start" className="btn btn-light">Créer ma boutique gratuitement</Link>
              <button className="btn btn-ghost" data-open-demo>Voir une vraie boutique</button>
            </div>
            <p className="cta-micro">Pas besoin d&rsquo;ordinateur · Tes 3 premières commandes sont offertes</p>
          </div>
        </div>
      </section>

      {/* ── Pied de page ───────────────────────────────────────────── */}
      <footer>
        <div className="container">
          <div className="foot-grid">
            <div className="foot-brand">
              <a href="#top" aria-label="TEKKIShop — Accueil">
                <Image src="/logo_white.svg" alt="TEKKIShop" width={140} height={40} style={{ height: 40, width: 'auto' }} />
              </a>
              <p>La manière simple de créer une boutique en ligne, encaisser par mobile money et gérer ses ventes depuis son téléphone.</p>
              <a className="foot-tt" href="https://www.tiktok.com/@tekkishop" target="_blank" rel="noopener noreferrer">
                {IC.tiktok}
                Suis-nous sur TikTok
              </a>
            </div>
            <div className="foot-col">
              <h4>Produit</h4>
              <a href="#probleme">Pourquoi TEKKIShop</a>
              <a href="#etapes">Comment ça marche</a>
              <a href="#tarifs">Tarifs</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="foot-col">
              <h4>Ressources</h4>
              <Link href="/pourquoi-pas-shopify">Pourquoi pas Shopify ?</Link>
              <Link href="/produits-digitaux">Vendre des produits digitaux</Link>
              <Link href="/europe-canada">Vendre depuis la Diaspora</Link>
              <Link href="/licence">Devenir licencié TEKKIShop</Link>
            </div>
            <div className="foot-col">
              <h4>Aide</h4>
              <Link href="/aide">Centre d&rsquo;aide</Link>
              <a href="https://www.tiktok.com/@tekkishop" target="_blank" rel="noopener noreferrer">Nos tutoriels vidéo</a>
              <a href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, '')}`}>Support WhatsApp</a>
              <Link href="/contact">Nous contacter</Link>
            </div>
            <div className="foot-col">
              <h4>Légal</h4>
              <Link href="/legal/cgu">Conditions d&rsquo;utilisation</Link>
              <Link href="/legal/privacy">Confidentialité</Link>
              <Link href="/mentions-legales">Mentions légales</Link>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© {new Date().getFullYear()} TEKKIShop. Tous droits réservés.</span>
            <span>Une solution de <a href="https://getdukka.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>Dukka</a>, pensée pour l&rsquo;e-commerce en Afrique.</span>
          </div>
        </div>
      </footer>

      {/* ── Éléments flottants / modale ─────────────────────────────── */}
      <DemoModal />

      {/* ── Initialisation JS (IntersectionObserver + animations) ────── */}
      <LandingV6Init />

      {/* ── Données structurées ─────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'Faut-il choisir un plan pour pouvoir vendre ?', acceptedAnswer: { '@type': 'Answer', text: 'Non. La boutique est en ligne et peut recevoir des commandes dès la publication du premier produit. Les 3 premières commandes sont offertes ; un plan n\'est nécessaire que pour continuer à en recevoir au-delà.' } },
            { '@type': 'Question', name: 'Faut-il un ordinateur pour utiliser TEKKIShop ?', acceptedAnswer: { '@type': 'Answer', text: 'Non. Tout se fait depuis un téléphone, sans connaissance technique et sans développeur.' } },
            { '@type': 'Question', name: 'Combien de temps faut-il pour créer sa boutique ?', acceptedAnswer: { '@type': 'Answer', text: 'Environ 5 minutes pour ouvrir la boutique et publier les premiers produits.' } },
            { '@type': 'Question', name: 'Comment les clients paient-ils ?', acceptedAnswer: { '@type': 'Answer', text: 'Par Wave, Orange Money, MTN MoMo, Moov Money, carte bancaire ou paiement à la livraison, selon le pays.' } },
          ],
        })}}
      />
    </div>
  )
}
