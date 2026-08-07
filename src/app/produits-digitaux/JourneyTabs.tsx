'use client'
import { useState } from 'react'
import Image from 'next/image'

const SCREENS = {
  product: (
    <div className="pd-demo-product">
      <div className="pd-demo-cover">
        <small>GUIDE PRATIQUE</small>
        <b>Lancer sa première boutique rentable</b>
      </div>
      <div className="pd-demo-info">
        <div className="pd-rating">★★★★★ <span>4,9</span></div>
        <h3 style={{ fontSize: 20, margin: '8px 0 6px' }}>Une méthode simple pour passer de l&apos;idée à la vente</h3>
        <p style={{ fontSize: 13, color: '#667085', margin: '0 0 12px' }}>Un guide concret, pensé pour les personnes qui veulent démarrer sans connaissances techniques.</p>
        <div className="pd-demo-price">4 500 FCFA</div>
        <div className="pd-demo-pay">Acheter maintenant</div>
      </div>
    </div>
  ),
  payment: (
    <div style={{ width: '100%', maxWidth: 380 }}>
      <h3 style={{ textAlign: 'center', fontSize: 18, margin: '0 0 6px' }}>Choisis ton moyen de paiement</h3>
      <p style={{ textAlign: 'center', color: '#667085', fontSize: 13, margin: '0 0 16px' }}>Finalise ta commande avec une solution disponible dans ton pays.</p>
      {[
        { label: 'Wave', src: '/logo-payments/wave_1.svg', bg: '#eaf4ff' },
        { label: 'Orange Money', src: '/logo-payments/om_1.svg', bg: '#fff2e8' },
        { label: 'Carte bancaire', src: '/logo-payments/visa.svg', bg: '#f0f4ff' },
      ].map(opt => (
        <div key={opt.label} className="pd-pay-option">
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: opt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Image src={opt.src} alt={opt.label} width={22} height={22} style={{ objectFit: 'contain' }} />
            </span>
            {opt.label}
          </span>
          <b>›</b>
        </div>
      ))}
      <div className="pd-demo-pay" style={{ marginTop: 14 }}>Payer 4 500 FCFA</div>
    </div>
  ),
  success: (
    <div className="pd-success-card">
      <div className="pd-success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h3>Paiement confirmé</h3>
      <p style={{ color: '#667085', fontSize: 14 }}>La commande est enregistrée et le fichier peut être transmis automatiquement.</p>
      <div style={{ marginTop: 18, padding: '12px 16px', borderRadius: 12, background: '#ecfdf3', color: '#067647', fontWeight: 800 }}>Commande #TK-2048 validée</div>
    </div>
  ),
  download: (
    <div className="pd-success-card">
      <div className="pd-success-icon" style={{ background: '#eff4ff', color: '#2f8cff' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </div>
      <h3>Ton achat est prêt</h3>
      <p style={{ color: '#667085', fontSize: 14 }}>Le client reçoit immédiatement l&apos;accès au produit qu&apos;il vient d&apos;acheter.</p>
      <div style={{ border: '1px solid #e6e9ef', borderRadius: 14, padding: '14px 16px', marginTop: 14, textAlign: 'left' }}>
        <strong style={{ display: 'block' }}>Lancer-sa-boutique.pdf</strong>
        <span style={{ fontSize: 12, color: '#667085' }}>PDF · 8,4 Mo</span>
        <div style={{ height: 38, borderRadius: 9, background: '#0b1830', color: '#fff', display: 'grid', placeItems: 'center', marginTop: 10, fontWeight: 800, fontSize: 13 }}>Télécharger mon fichier</div>
      </div>
    </div>
  ),
}

const TABS = [
  { key: 'product' as const, label: 'Le client découvre ton produit', sub: 'Une page claire avec bénéfices, prix et aperçu.' },
  { key: 'payment' as const, label: 'Il paie avec un moyen familier', sub: 'Il choisit le moyen disponible dans son pays.' },
  { key: 'success' as const, label: 'Le paiement est confirmé', sub: 'La commande est validée sans intervention manuelle.' },
  { key: 'download' as const, label: 'Il reçoit son fichier', sub: 'Le téléchargement est transmis automatiquement.' },
]

export function JourneyTabs() {
  const [active, setActive] = useState<keyof typeof SCREENS>('product')

  return (
    <div className="pd-journey">
      <div className="pd-journey-tabs">
        {TABS.map((tab, i) => (
          <button
            key={tab.key}
            className={`pd-journey-tab${active === tab.key ? ' active' : ''}`}
            onClick={() => setActive(tab.key)}
          >
            <span className="pd-tab-n">{i + 1}</span>
            <span>
              <b>{tab.label}</b>
              <span>{tab.sub}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="pd-browser">
        <div className="pd-browser-top">
          <span className="pd-dot" /><span className="pd-dot" /><span className="pd-dot" />
          <span className="pd-address" />
        </div>
        <div className="pd-browser-body">
          {SCREENS[active]}
        </div>
      </div>
    </div>
  )
}
