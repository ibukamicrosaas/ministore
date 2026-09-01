import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import Link  from 'next/link'
import Image from 'next/image'
import { LandingNav }    from '@/components/landing-v6/LandingNav'
import { PricingV6 }     from '@/components/landing-v6/PricingV6'
import { FAQv6 }         from '@/components/landing-v6/FAQv6'
import { DemoModal }     from '@/components/landing-v6/DemoModal'
import { LandingV6Init } from '@/components/landing-v6/LandingV6Init'
import { ShopMockup }    from '@/components/landing-v6/ShopMockup'
import { LandingFooter } from '@/components/landing-v6/LandingFooter'
import { RealShopsShowcase } from '@/components/landing-v6/RealShopsShowcase'
import { IC }            from '@/components/landing-v6/icons'
import './landing-v6.css'

export const metadata = {
  title: 'TEKKIShop — Crée ta boutique en ligne en 5 minutes, depuis ton téléphone',
  description: 'Mets tes produits en ligne, partage ton lien sur WhatsApp et reçois ton argent par Wave, Orange Money ou à la livraison. Déjà 1 400+ boutiques créées. Sans ordinateur, sans développeur.',
}

// ── Icônes SVG (zéro emoji sur la landing page) ─────────────────────────────
// Partagées avec les pages pays (ex. /togo) — voir landing-v6/icons.tsx

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

      {/* ── Bannière d'annonce ─────────────────────────────────────── */}
      <div className="announcement-bar">
        <span>3 premières commandes offertes</span>
        <Link href="/start">
          Je me lance →
        </Link>
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
                <b>+{shopsCount} boutiques créées</b>
                <span>par des marchands dans 6 pays</span>
              </div>
            </div>

            <h1>
              Crée ta boutique en ligne en <span className="grad">5&nbsp;minutes,</span> avec ton téléphone.
            </h1>

            <p className="lead">
              Ajoute tes produits, partage ton lien, et c&rsquo;est tout. Tes clients commandent seuls, paient par mobile money ou à la livraison, et tu retires ton argent sur ton mobile money ou compte bancaire.
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
            <ShopMockup />

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
                  <div className="qinput"><span data-type="Nala Store" data-delay="900" data-caret="1" /></div>
                  <div className="qchips"><span>Nala Store</span><span>Maison Kora</span><span>Elite Sneakers</span></div>
                  <div className="tip" data-appear="1900">L&rsquo;URL de ta boutique sera : <b>tekki.shop/nala-store</b>. Choisis un nom court et mémorable que tes clients retiendront facilement.</div>
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
              <div style={{ position: 'relative', zIndex: 2 }}>
                <ShopMockup />
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
                <div><b>Un seul lien pour toute ta boutique</b><p>Fini les 10 photos et les prix envoyés un par un dans la discussion WhatsApp ou en DM Instagram/TikTok.</p></div>
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
            <a className="btn btn-secondary" href="https://viensonsconnait.com" target="_blank" rel="noopener noreferrer">Voir une vraie boutique</a>
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
                        <div className="db-amount">154 000 <small>F</small></div>
                        <div className="db-chips">
                          <span className="on">Auj.</span><span>Hier</span><span>Semaine</span><span>Mois</span><span>Trimestre</span>
                        </div>
                      </div>
                      <div className="db-two">
                        <div className="db-mini"><small>Produits</small><b>7</b><span>actifs</span><i>{IC.box}</i></div>
                        <div className="db-mini"><small>En attente</small><b>3</b><span>commandes</span><i>{IC.shoppingCart}</i></div>
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

      {/* ── Vraies boutiques ─────────────────────────────────────── */}
      <section className="section testi-sec">
        <div className="container">
          <RealShopsShowcase
            shopIds={[]}
            eyebrow="Ils l'ont fait avant toi"
            headline={<>Vendre en ligne n&rsquo;a jamais été <span className="grad">aussi simple.</span></>}
          />

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
            <p className="quote">« Vendre en ligne depuis l&rsquo;Afrique ne devrait pas nécessiter un ordinateur, un développeur ou des connaissances techniques poussées. »</p>
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
              <a className="btn btn-ghost" href="https://viensonsconnait.com" target="_blank" rel="noopener noreferrer">Voir une vraie boutique</a>
            </div>
            <p className="cta-micro">Lance-toi aujourd&rsquo;hui · Tes 3 premières commandes sont offertes</p>
          </div>
        </div>
      </section>

      {/* ── Pied de page ───────────────────────────────────────────── */}
      <LandingFooter />

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
