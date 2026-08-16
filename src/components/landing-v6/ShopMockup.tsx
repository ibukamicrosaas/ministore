const checkVerified = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

/**
 * Mockup téléphone de « Viens on s'connaît » — boutique réelle, utilisée à
 * la fois en hero et dans la section « Une vraie boutique » : le CTA de
 * cette dernière renvoie vers viensonsconnait.com, les deux doivent donc
 * montrer la même boutique.
 */
export function ShopMockup() {
  return (
    <div className="phone">
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="st-cover">
          <div className="st-cover-logo">
            <span style={{ color: '#e05a7a', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <svg viewBox="0 0 24 24" fill="#e05a7a" stroke="none" style={{ width: 9, height: 9 }}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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
        <div
          className="st-ava"
          style={{ backgroundImage: 'url(/logo-vosc.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="st-body">
          <div className="st-name">
            Viens on s&rsquo;connaît
            <span className="st-check">{checkVerified}</span>
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
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Commander
            </span>
          </button>
          <div className="st-sec">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ width: 9, height: 9, color: '#ffb020' }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Coups de cœur
          </div>
          <div className="st-favs">
            <div className="st-fav">
              <i style={{ backgroundImage: 'url(/jeu.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div><b>Pour Les Amoureux</b><span>14 000 FCFA</span></div>
            </div>
            <div className="st-fav">
              <i style={{ backgroundImage: 'url(/ebook.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div><b>Et pourtant, on s&rsquo;aimait</b><span>4 500 FCFA</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
