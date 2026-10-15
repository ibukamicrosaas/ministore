'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  BRAND, SOFT, DARKEST, ON_BRAND,
  JOURNEY_PRODUCT, JOURNEY_QTY, JOURNEY_DELIVERY_ZONE, JOURNEY_DELIVERY_FEE, JOURNEY_TOTAL,
  FAKE_CUSTOMER_NAME, FAKE_PHONE_FULL, FAKE_PHONE_MASKED, FAKE_ORDER_REF,
} from '@/lib/maison-awa-example-data'
import { MaisonAwaHomeScreen } from './MaisonAwaHome'
import {
  U, Ic,
  IC_CHEVRON_LEFT, IC_SHARE, IC_CHAT, IC_TRUCK, IC_CHECK_CIRCLE, IC_MINUS, IC_PLUS,
  IC_PACKAGE, IC_MAP, IC_USER, IC_MAIL, IC_PHONE, IC_PIN,
} from './maw-shared'

// Parcours "Côté client" (Accueil → Produit → Commande → Paiement → Succès)
// — section dédiée de la landing, plan validé par l'utilisateur le
// 2026-10-23 (voir conversation). TEMPS 1 (5 écrans statiques, navigation
// manuelle) validé par l'utilisateur le 2026-10-23. TEMPS 2 (ce tour) :
// lecture automatique ajoutée — voir le bloc de commentaires au-dessus de
// ClientJourney() plus bas pour le détail du comportement.
//
// Données 100% fictives (catalogue partagé avec MaisonAwaHome.tsx — voir
// src/lib/maison-awa-example-data.ts, catalogue validé 2026-10-23) :
// client "Aminata K.", téléphone "07 02 02 02 02" (affiché en entier dans
// le formulaire de commande, masqué "07 •• •• •• 02" ailleurs), référence
// de commande "MA-DEMO" (manifestement fausse). Produit commandé : 2e
// entrée du catalogue ("Pagne WAX Hollantex", 14 000 FCFA), quantité 1.
//
// Écrans construits à partir d'une relecture réelle du tunnel (pas
// inventés) :
// - Produit : fidèle à produit-mobile.dc.html (lu et confirmé identique
//   aux captures de contrôle dans un tour précédent).
// - Commande : sections et libellés exacts de OrderForm.tsx ("Ce que tu
//   commandes", "Comment tu reçois ta commande", "Où on te joint",
//   "Comment tu paies") + OrderSummary.tsx ("Sous-total", "Livraison",
//   "Total", "Tu paies maintenant").
// - Paiement : fidèle à pay/page.tsx pour le flux Wave spécifiquement
//   (relu dans ce tour) : PAS d'écran OTP (Wave a requiresOtp:false dans
//   payment-methods.ts/bictorys.ts — l'OTP n'existe que pour Orange Money
//   CI/BK), pas de champ téléphone sur cet écran (le numéro vient du
//   formulaire de commande, jamais ressaisi). Écart assumé : dans la vraie
//   app, cliquer "Payer" avec Wave ouvre une redirection externe (deep
//   link vers l'app/le site Wave) avant de revenir sur l'écran de succès —
//   ce mockup ne reproduit pas cette redirection hors du téléphone simulé,
//   il passe directement à l'écran Succès.
// - Succès : fidèle à success/page.tsx pour le cas "paiement en ligne
//   reçu" (icône de validation, pastille Référence, récap Articles
//   commandés / Livraison / Ce que tu as payé, boutons Suivre ma commande
//   / Contacter la boutique / Continuer mes achats). Titre "Paiement reçu"
//   (ligne 194) et sous-titre "Ton paiement a été reçu. La boutique
//   prépare ta commande." (ligne 203, cas isOnline && isPaid) repris mot
//   pour mot de success/page.tsx — vérifiés dans ce tour, plus une
//   approximation.
//
// Simplifications assumées (validées par l'utilisateur avant de coder) :
// un seul article (le vrai formulaire en permet jusqu'à 5), pas de code
// promo, pas de remise quantité, pas de carrousel "Tu aimeras aussi" en
// fin de parcours.
//
// Logos de paiement : Wave/Orange Money/Moov Money réutilisent
// public/logo-payments-v7/ ; MTN Money (ajouté le 2026-10-23, confirmation
// explicite de l'utilisateur) réutilise public/logo-payments/mtn_1.svg —
// pas de copie v7, mais ce même fichier de production est déjà utilisé
// directement ailleurs sur cette page (PAYMENT_LOGOS dans page.tsx) donc
// pas une nouvelle exception.
//
// Aucune durée annoncée sans mesure ("en 30 secondes", "en 3 clics") —
// aucun texte de ce type dans ce fichier.

const STEP_LABELS = ['Accueil', 'Produit', 'Commande', 'Paiement', 'Succès'] as const

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: U(12), fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6A625B', margin: `0 0 ${U(12)}` }}>{children}</div>
}

function TopBar({ title }: { title: string }) {
  return (
    <div style={{ height: U(56), padding: `0 ${U(14)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #EFE9E2', background: '#fff' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: U(6), fontSize: U(14.5), fontWeight: 600 }}><Ic size={18}>{IC_CHEVRON_LEFT}</Ic>Maison Awa</span>
      <b style={{ fontSize: U(15), fontWeight: 700 }}>{title}</b>
    </div>
  )
}

// ───────────────────────── Écran 1 : Accueil ─────────────────────────────
function ScreenAccueil() {
  return <MaisonAwaHomeScreen />
}

// ───────────────────────── Écran 2 : Produit ─────────────────────────────
// Fidèle à produit-mobile.dc.html (galerie, infos+achat, "Avant de
// commander", description) — "À découvrir aussi" et le pied de page omis
// ici (hors du premier écran visible du téléphone, simplification).
function ScreenProduit() {
  return (
    <>
      <div style={{ height: U(360), position: 'relative', background: SOFT }}>
        <Image src={JOURNEY_PRODUCT.src} alt={JOURNEY_PRODUCT.alt} fill sizes="390px" style={{ objectFit: 'cover' }} />
        <span style={{ position: 'absolute', top: U(14), left: U(14), height: U(38), padding: `0 ${U(14)} 0 ${U(10)}`, borderRadius: 999, background: 'rgba(255,255,255,.94)', display: 'flex', alignItems: 'center', gap: U(6), fontSize: U(13.5), fontWeight: 600 }}><Ic size={16}>{IC_CHEVRON_LEFT}</Ic>Maison Awa</span>
        <span style={{ position: 'absolute', top: U(14), right: U(14), width: U(38), height: U(38), borderRadius: '50%', background: 'rgba(255,255,255,.94)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic size={17}>{IC_SHARE}</Ic></span>
      </div>
      <div style={{ padding: `${U(20)} ${U(18)} 0` }}>
        <span style={{ fontSize: U(12), fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: BRAND }}>{JOURNEY_PRODUCT.cat}</span>
        <h3 style={{ margin: `${U(4)} 0 0`, fontSize: U(23), lineHeight: 1.15, fontWeight: 800, letterSpacing: '-.02em' }}>{JOURNEY_PRODUCT.name}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: U(8) }}>
          <span style={{ fontSize: U(22), fontWeight: 800, color: BRAND }}>{JOURNEY_PRODUCT.price}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: U(5), padding: `${U(5)} ${U(10)}`, borderRadius: 999, background: '#E3F4EA', color: '#0B6B3A', fontSize: U(12), fontWeight: 600 }}><Ic size={12}>{IC_CHECK_CIRCLE}</Ic>En stock</span>
        </div>
      </div>
      <div style={{ padding: `${U(18)} ${U(18)} 0`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: U(14), fontWeight: 600 }}>Quantité</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: U(6) }}>
          <span style={{ width: U(36), height: U(36), borderRadius: U(10), border: '1px solid #E4DDD5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic size={14}>{IC_MINUS}</Ic></span>
          <span style={{ minWidth: U(28), textAlign: 'center', fontSize: U(15), fontWeight: 700 }}>{JOURNEY_QTY}</span>
          <span style={{ width: U(36), height: U(36), borderRadius: U(10), border: '1px solid #E4DDD5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic size={14}>{IC_PLUS}</Ic></span>
        </div>
      </div>
      <div style={{ padding: `${U(16)} ${U(18)} 0`, display: 'flex', flexDirection: 'column', gap: U(10) }}>
        <span style={{ height: U(46), borderRadius: U(14), background: BRAND, color: ON_BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: U(8), fontSize: U(15), fontWeight: 700 }}><Ic size={17}>{IC_PACKAGE}</Ic>Commander</span>
        <span style={{ height: U(42), borderRadius: U(14), border: '1.5px solid #B9E3C9', background: '#F3FBF6', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: U(8), fontSize: U(13.5), fontWeight: 600 }}><Ic size={16}>{IC_CHAT}</Ic>Poser une question sur WhatsApp</span>
      </div>
      <div style={{ margin: `${U(20)} ${U(18)} 0`, border: '1px solid #EFE9E2', borderRadius: U(18), background: SOFT, padding: `${U(16)} ${U(14)}`, display: 'flex', flexDirection: 'column', gap: U(14) }}>
        <SectionLabel>Avant de commander</SectionLabel>
        {[
          { icon: IC_TRUCK, title: 'Paiement', text: 'Wave, Orange Money, Moov Money ou espèces à la livraison.' },
          { icon: IC_MAP, title: 'Livraison ou retrait', text: "Livraison à domicile ou retrait en boutique, à choisir à l'étape suivante." },
          { icon: IC_CHECK_CIRCLE, title: 'Suivi de commande', text: 'Tu reçois un lien de suivi dès que ta commande est passée.' },
        ].map(row => (
          <div key={row.title} style={{ display: 'flex', gap: U(10), alignItems: 'flex-start' }}>
            <span style={{ flex: `0 0 ${U(32)}`, width: U(32), height: U(32), borderRadius: U(10), background: '#fff', color: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic size={16}>{row.icon}</Ic></span>
            <div>
              <b style={{ display: 'block', fontSize: U(13.5), fontWeight: 600 }}>{row.title}</b>
              <span style={{ fontSize: U(12.5), lineHeight: 1.4, color: '#6A625B' }}>{row.text}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: `${U(20)} ${U(18)} ${U(28)}` }}>
        <h4 style={{ margin: `0 0 ${U(8)}`, fontSize: U(15.5), fontWeight: 700 }}>Description</h4>
        <p style={{ margin: 0, fontSize: U(13.5), lineHeight: 1.6, color: '#4A433D' }}>Pagne wax Hollantex, motif floral rouge et or. Idéal pour une robe, un ensemble ou un boubou.</p>
      </div>
    </>
  )
}

// ───────────────────────── Écran 3 : Commande ────────────────────────────
// Sections et libellés exacts d'OrderForm.tsx + OrderSummary.tsx.
function ScreenCommande() {
  return (
    <>
      <TopBar title="Commander" />
      <div style={{ padding: `${U(18)} ${U(16)} 0` }}>
        <SectionLabel>Ce que tu commandes</SectionLabel>
        <div style={{ display: 'flex', gap: U(10), alignItems: 'center', padding: U(10), border: '1px solid #EFE9E2', borderRadius: U(14) }}>
          <div style={{ width: U(52), height: U(52), borderRadius: U(10), overflow: 'hidden', position: 'relative', flex: 'none', background: SOFT }}>
            <Image src={JOURNEY_PRODUCT.src} alt={JOURNEY_PRODUCT.alt} fill sizes="52px" style={{ objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ display: 'block', fontSize: U(13.5), fontWeight: 600 }}>{JOURNEY_PRODUCT.name}</b>
            <span style={{ fontSize: U(12.5), color: '#6A625B' }}>{JOURNEY_PRODUCT.price}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: U(5) }}>
            <span style={{ width: U(26), height: U(26), borderRadius: U(7), border: '1px solid #E4DDD5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic size={11}>{IC_MINUS}</Ic></span>
            <span style={{ fontSize: U(13), fontWeight: 700 }}>{JOURNEY_QTY}</span>
            <span style={{ width: U(26), height: U(26), borderRadius: U(7), border: '1px solid #E4DDD5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic size={11}>{IC_PLUS}</Ic></span>
          </div>
        </div>
      </div>

      <div style={{ padding: `${U(22)} ${U(16)} 0` }}>
        <SectionLabel>Comment tu reçois ta commande</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: U(8) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: U(10), padding: U(12), borderRadius: U(12), border: `1.5px solid ${BRAND}`, background: '#FBF3EC' }}>
            <span style={{ width: U(16), height: U(16), borderRadius: '50%', border: `5px solid ${BRAND}`, flex: 'none' }} />
            <span style={{ fontSize: U(13.5), fontWeight: 600 }}>Livraison à domicile</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: U(10), padding: U(12), borderRadius: U(12), border: '1px solid #E4DDD5' }}>
            <span style={{ width: U(16), height: U(16), borderRadius: '50%', border: '1.5px solid #C9BFB4', flex: 'none' }} />
            <span style={{ fontSize: U(13.5), color: '#6A625B' }}>Retrait en boutique</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: U(10), padding: `${U(10)} ${U(12)}`, borderRadius: U(12), background: SOFT, marginTop: U(2) }}>
            <span style={{ width: U(14), height: U(14), borderRadius: '50%', border: `4px solid ${BRAND}`, flex: 'none' }} />
            <span style={{ fontSize: U(13), flex: 1 }}>{JOURNEY_DELIVERY_ZONE}</span>
            <span style={{ fontSize: U(13), fontWeight: 700, color: BRAND }}>{JOURNEY_DELIVERY_FEE.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div style={{ marginTop: U(4) }}>
            <span style={{ fontSize: U(12), fontWeight: 600 }}>Adresse de livraison *</span>
            <div style={{ marginTop: U(5), padding: U(10), borderRadius: U(10), border: '1px solid #E4DDD5', fontSize: U(13), color: '#4A433D' }}>Cocody, non loin de la pharmacie</div>
          </div>
        </div>
      </div>

      <div style={{ padding: `${U(22)} ${U(16)} 0` }}>
        <SectionLabel>Où on te joint</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: U(8) }}>
          <Field icon={IC_USER} label="Nom complet *" value={FAKE_CUSTOMER_NAME} />
          <Field icon={IC_PHONE} label="Téléphone *" value={FAKE_PHONE_FULL} />
          <div style={{ display: 'flex', alignItems: 'center', gap: U(7), fontSize: U(12), color: '#6A625B' }}>
            <span style={{ width: U(15), height: U(15), borderRadius: U(4), background: BRAND, flex: 'none' }} />
            Même numéro pour WhatsApp
          </div>
          <Field icon={IC_MAIL} label="E-mail (optionnel)" value="" placeholder="ton@email.com" />
        </div>
      </div>

      <div style={{ padding: `${U(22)} ${U(16)} 0` }}>
        <SectionLabel>Comment tu paies</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: U(8) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: U(10), padding: U(12), borderRadius: U(12), border: `1.5px solid ${BRAND}`, background: '#FBF3EC' }}>
            <span style={{ width: U(16), height: U(16), borderRadius: '50%', border: `5px solid ${BRAND}`, flex: 'none' }} />
            <div style={{ flex: 1 }}>
              <b style={{ display: 'block', fontSize: U(13.5), fontWeight: 600 }}>Payer maintenant</b>
              <span style={{ fontSize: U(12), color: '#6A625B' }}>Wave, Orange Money, Moov Money</span>
            </div>
            <Image src="/logo-payments-v7/wave_1.svg" alt="Wave" width={22} height={22} style={{ width: U(22), height: U(22) }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: U(10), padding: U(12), borderRadius: U(12), border: '1px solid #E4DDD5' }}>
            <span style={{ width: U(16), height: U(16), borderRadius: '50%', border: '1.5px solid #C9BFB4', flex: 'none' }} />
            <span style={{ fontSize: U(13.5), color: '#6A625B' }}>Payer à la livraison</span>
          </div>
        </div>
      </div>

      <div style={{ padding: `${U(22)} ${U(16)} ${U(24)}` }}>
        <SectionLabel>Ce que tu paies</SectionLabel>
        <OrderSummaryBlock />
        <span style={{ marginTop: U(14), height: U(48), borderRadius: U(14), background: BRAND, color: ON_BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: U(14.5), fontWeight: 700 }}>Confirmer la commande</span>
        <p style={{ marginTop: U(10), textAlign: 'center', fontSize: U(11), color: '#9A9289' }}>Paiement traité par Bictorys · Lien de suivi envoyé après la commande</p>
      </div>
    </>
  )
}

function Field({ icon, label, value, placeholder }: { icon: React.ReactNode; label: string; value: string; placeholder?: string }) {
  return (
    <div>
      <span style={{ fontSize: U(12), fontWeight: 600 }}>{label}</span>
      <div style={{ marginTop: U(5), height: U(38), padding: `0 ${U(10)}`, borderRadius: U(10), border: '1px solid #E4DDD5', display: 'flex', alignItems: 'center', gap: U(8), fontSize: U(13), color: value ? '#1F1B18' : '#B5ACA2' }}>
        <Ic size={14}>{icon}</Ic>{value || placeholder}
      </div>
    </div>
  )
}

function OrderSummaryBlock() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: U(6) }}>
      <Row label={`Sous-total (${JOURNEY_QTY} article)`} value={`${JOURNEY_PRODUCT.priceValue.toLocaleString('fr-FR')} FCFA`} />
      <Row label={`Livraison (${JOURNEY_DELIVERY_ZONE})`} value={`${JOURNEY_DELIVERY_FEE.toLocaleString('fr-FR')} FCFA`} />
      <div style={{ borderTop: '1px solid #EFE9E2', margin: `${U(4)} 0` }} />
      <Row label="Total" value={`${JOURNEY_TOTAL.toLocaleString('fr-FR')} FCFA`} bold />
      <div style={{ marginTop: U(6), padding: U(10), borderRadius: U(10), background: SOFT, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: U(12.5), color: '#6A625B' }}>Tu paies maintenant</span>
        <b style={{ fontSize: U(14), color: BRAND }}>{JOURNEY_TOTAL.toLocaleString('fr-FR')} FCFA</b>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: U(13), fontWeight: bold ? 700 : 400 }}>
      <span style={{ color: bold ? '#1F1B18' : '#6A625B' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

// ───────────────────────── Écran 4 : Paiement ────────────────────────────
// Fidèle à pay/page.tsx pour le flux Wave (relu dans ce tour, voir
// commentaire en tête de fichier) : pas d'OTP, pas de champ téléphone.
// MTN Money ajouté le 2026-10-23 (confirmation explicite de l'utilisateur
// que son usage est possible ici) : logo réutilisé de public/logo-payments/
// mtn_1.svg — pas de copie dans logo-payments-v7/ (dossier qui ne contient
// que Wave/Orange Money/Moov Money/Visa/Mastercard). Ce même fichier de
// production est déjà utilisé directement ailleurs sur CETTE page
// (PAYMENT_LOGOS dans page.tsx, bandeau "Tes clients paient comme ils
// veulent") — le commentaire voisin de ce bandeau affirme à tort que tout
// y est systématiquement copié dans logo-payments-v7/ et que MTN en est
// absent "hors étape de paiement" ; en réalité MTN y est déjà affiché avec
// le fichier de production. Repris ici à l'identique, pas une nouvelle
// exception inventée.
const PAY_METHODS = [
  { key: 'wave', label: 'Wave', desc: 'Paiement instantané', logo: '/logo-payments-v7/wave_1.svg', selected: true },
  { key: 'om', label: 'Orange Money', desc: 'Via code OTP (#144*82#)', logo: '/logo-payments-v7/om_1.svg', selected: false },
  { key: 'mtn', label: 'MTN Money', desc: 'Paiement push mobile', logo: '/logo-payments/mtn_1.svg', selected: false },
  { key: 'moov', label: 'Moov Money', desc: 'Paiement push mobile', logo: '/logo-payments-v7/moov_1.svg', selected: false },
] as const

function ScreenPaiement() {
  return (
    <>
      <TopBar title="" />
      <div style={{ padding: `${U(20)} ${U(18)} 0`, textAlign: 'center' }}>
        <h3 style={{ margin: 0, fontSize: U(21), fontWeight: 800, letterSpacing: '-.015em' }}>Comment veux-tu payer ?</h3>
        <p style={{ margin: `${U(4)} 0 0`, fontSize: U(13), color: '#6A625B' }}>Paiement chez Maison Awa</p>
        <span style={{ display: 'inline-block', marginTop: U(10), padding: `${U(6)} ${U(14)}`, borderRadius: 999, background: SOFT, fontSize: U(14), fontWeight: 700, color: BRAND }}>{JOURNEY_TOTAL.toLocaleString('fr-FR')} FCFA</span>
      </div>

      <div style={{ margin: `${U(18)} ${U(16)} 0`, padding: U(14), border: '1px solid #EFE9E2', borderRadius: U(14) }}>
        <OrderSummaryBlock />
      </div>

      <div style={{ padding: `${U(18)} ${U(16)} 0`, display: 'flex', flexDirection: 'column', gap: U(8) }}>
        {PAY_METHODS.map(m => (
          <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: U(10), padding: U(12), borderRadius: U(12), border: m.selected ? `1.5px solid ${BRAND}` : '1px solid #E4DDD5', background: m.selected ? '#FBF3EC' : 'transparent' }}>
            <span style={{ width: U(16), height: U(16), borderRadius: '50%', border: m.selected ? `5px solid ${BRAND}` : '1.5px solid #C9BFB4', flex: 'none' }} />
            <Image src={m.logo} alt="" width={22} height={22} style={{ width: U(22), height: U(22), flex: 'none' }} />
            <div style={{ flex: 1 }}>
              <b style={{ display: 'block', fontSize: U(13.5), fontWeight: 600 }}>{m.label}</b>
              <span style={{ fontSize: U(11.5), color: '#6A625B' }}>{m.desc}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Pas d'écran OTP : Wave a requiresOtp:false (payment-methods.ts /
          bictorys.ts) — seul Orange Money CI/BK en a un dans le vrai
          tunnel. Pas de champ téléphone : le numéro vient du formulaire de
          commande, jamais ressaisi ici (vérifié dans pay/page.tsx). */}
      <div style={{ padding: `${U(20)} ${U(16)} ${U(24)}` }}>
        <span style={{ height: U(48), borderRadius: U(14), background: BRAND, color: ON_BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: U(14.5), fontWeight: 700 }}>Payer {JOURNEY_TOTAL.toLocaleString('fr-FR')} FCFA</span>
        <p style={{ marginTop: U(10), textAlign: 'center', fontSize: U(11), color: '#9A9289' }}>Tes données sont sécurisées par Bictorys.</p>
      </div>
    </>
  )
}

// ───────────────────────── Écran 5 : Succès ──────────────────────────────
// Fidèle à success/page.tsx, cas "paiement en ligne reçu" (titre "Paiement
// reçu" confirmé ; sous-titre non vérifié mot pour mot, voir commentaire
// en tête de fichier).
function ScreenSucces() {
  return (
    <div style={{ padding: `${U(36)} ${U(20)} ${U(28)}`, textAlign: 'center' }}>
      <span style={{ display: 'inline-flex', width: U(64), height: U(64), borderRadius: '50%', background: '#E3F4EA', color: '#0B6B3A', alignItems: 'center', justifyContent: 'center' }}><Ic size={32}>{IC_CHECK_CIRCLE}</Ic></span>
      <h3 style={{ margin: `${U(16)} 0 0`, fontSize: U(22), fontWeight: 800 }}>Paiement reçu</h3>
      {/* Sous-titre exact de success/page.tsx:203 (cas isOnline && isPaid),
          repris mot pour mot plutôt qu'approximé. */}
      <p style={{ margin: `${U(6)} 0 0`, fontSize: U(13.5), color: '#6A625B' }}>Ton paiement a été reçu. La boutique prépare ta commande.</p>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: U(6), marginTop: U(14), padding: `${U(6)} ${U(14)}`, borderRadius: 999, background: SOFT, fontSize: U(12.5), fontWeight: 700, letterSpacing: '.03em' }}>Référence <span style={{ fontFamily: 'monospace' }}>{FAKE_ORDER_REF}</span></span>

      <div style={{ marginTop: U(22), border: '1px solid #EFE9E2', borderRadius: U(16), textAlign: 'left', overflow: 'hidden' }}>
        <div style={{ padding: U(14), borderBottom: '1px solid #EFE9E2' }}>
          <SectionLabel>Articles commandés</SectionLabel>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: U(13) }}>
            <span>{JOURNEY_PRODUCT.name} × {JOURNEY_QTY}</span>
            <b>{JOURNEY_PRODUCT.priceValue.toLocaleString('fr-FR')} FCFA</b>
          </div>
        </div>
        <div style={{ padding: U(14), borderBottom: '1px solid #EFE9E2' }}>
          <SectionLabel>Livraison</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: U(8), fontSize: U(13) }}>
            <Ic size={15}>{IC_TRUCK}</Ic>À domicile — {JOURNEY_DELIVERY_ZONE}
          </div>
          <div style={{ marginTop: U(6), fontSize: U(12), color: '#6A625B' }}>{FAKE_CUSTOMER_NAME} · {FAKE_PHONE_MASKED}</div>
        </div>
        <div style={{ padding: U(14) }}>
          <SectionLabel>Ce que tu as payé</SectionLabel>
          <OrderSummaryBlock />
        </div>
      </div>

      <div style={{ marginTop: U(20), display: 'flex', flexDirection: 'column', gap: U(8) }}>
        <span style={{ height: U(46), borderRadius: U(14), background: BRAND, color: ON_BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: U(14), fontWeight: 700 }}>Suivre ma commande</span>
        <span style={{ height: U(44), borderRadius: U(14), border: '1.5px solid #B9E3C9', background: '#F3FBF6', color: '#0B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: U(7), fontSize: U(13.5), fontWeight: 600 }}><Ic size={15}>{IC_CHAT}</Ic>Contacter la boutique</span>
        <span style={{ fontSize: U(13), fontWeight: 600, color: BRAND, padding: U(6) }}>Continuer mes achats</span>
      </div>
    </div>
  )
}

const SCREENS = [ScreenAccueil, ScreenProduit, ScreenCommande, ScreenPaiement, ScreenSucces]

// Durée de lecture par écran (ms) — 2,2-2,8s demandés (2026-10-24,
// accéléré depuis 3,5-4,5s : le rythme précédent laissait croire qu'il
// fallait scroller), Succès un peu plus long (~3,2s, "pause un peu plus
// longue sur Succès") avant de boucler sur l'Accueil.
const STEP_DURATION_MS = [2500, 2500, 2500, 2500, 3200]
const FADE_MS = 300

// TEMPS 2 (2026-10-23) : lecture automatique des 5 écrans.
// - Déclenchement : IntersectionObserver (seuil 0.4) sur le conteneur
//   entier — jamais au chargement de la page. Hors de vue => en pause ;
//   de retour => reprise à l'écran où on en était (pas de redémarrage à
//   l'Accueil).
// - prefers-reduced-motion : aucune lecture automatique, jamais — seule
//   la navigation manuelle (points, flèches) reste disponible, comme en
//   Temps 1.
// - Survol / toucher / focus clavier : pause TEMPORAIRE (reprend quand on
//   relâche). Cliquer un point ou utiliser les flèches : arrêt
//   DÉFINITIF de la lecture auto pour cette visite (navigation purement
//   manuelle ensuite) — distinction volontaire entre les deux, demandée
//   explicitement.
// - Fondu ~300ms entre écrans (2026-10-24, accéléré depuis 400ms) : géré
//   par un état "fading" qui passe l'opacité à 0 (150ms) avant de
//   changer d'écran, puis la repasse à 1 (150ms) — pas une vraie fusion
//   des deux écrans superposés, mais un aller-retour d'opacité qui reste
//   à ~300ms au total comme demandé.
export function ClientJourney() {
  const [step, setStep] = useState(0)
  const [fading, setFading] = useState(false)
  const [inView, setInView] = useState(false)
  const [hoverPaused, setHoverPaused] = useState(false)
  const [userControl, setUserControl] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // prefers-reduced-motion — lu une fois au montage, pas besoin de suivre
  // les changements en direct pour ce composant.
  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  // Déclenchement à la visibilité — jamais au chargement.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function clearTimers() {
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
  }

  // Avance automatique : programme le prochain changement d'écran tant
  // que rien n'a mis la lecture en pause (vue, survol/focus, contrôle
  // manuel pris) ni désactivé l'animation (reduced motion).
  useEffect(() => {
    if (!inView || hoverPaused || userControl || reducedMotion) return
    advanceTimeoutRef.current = setTimeout(() => {
      setFading(true)
      fadeTimeoutRef.current = setTimeout(() => {
        setStep(s => (s + 1) % SCREENS.length)
        setFading(false)
      }, FADE_MS / 2)
    }, STEP_DURATION_MS[step])
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, inView, hoverPaused, userControl, reducedMotion])

  // Navigation manuelle (points ou flèches) : arrêt définitif de la
  // lecture auto pour cette visite, changement immédiat (pas de fondu
  // supplémentaire par-dessus une transition déjà en cours).
  function go(next: number) {
    clearTimers()
    setUserControl(true)
    setFading(false)
    setStep(Math.max(0, Math.min(SCREENS.length - 1, next)))
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(step + 1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(step - 1) }
  }

  const Screen = SCREENS[step]

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Aperçu du parcours client, étape par étape"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onTouchStart={() => setHoverPaused(true)}
      onTouchEnd={() => setHoverPaused(false)}
      onFocus={() => setHoverPaused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHoverPaused(false) }}
      style={{ outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
    >
      <div className="phone">
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
            <div
              style={{
                width: '100cqw', background: '#fff', color: '#1F1B18', fontFamily: 'var(--display)',
                opacity: fading ? 0 : 1, transition: reducedMotion ? 'none' : `opacity ${FADE_MS / 2}ms ease`,
              }}
            >
              <Screen />
            </div>
          </div>
        </div>
      </div>

      {/* Repère de progression — 5 points cliquables, vrais boutons
          focusables (pas seulement une décoration). aria-live annonce
          l'étape pour les lecteurs d'écran, sans dépendre de la vue. */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 18 }}>
        {STEP_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => go(i)}
            aria-label={`Étape ${i + 1} sur ${STEP_LABELS.length} : ${label}`}
            aria-current={i === step ? 'step' : undefined}
            style={{
              width: i === step ? 22 : 8, height: 8, borderRadius: 999, border: 'none', padding: 0, cursor: 'pointer',
              background: i === step ? BRAND : '#E4DDD5', transition: 'width .2s ease, background .2s ease',
            }}
          />
        ))}
      </div>
      <p aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        Étape {step + 1} sur {STEP_LABELS.length} : {STEP_LABELS[step]}
      </p>
    </div>
  )
}
