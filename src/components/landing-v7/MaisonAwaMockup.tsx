// Mockup téléphone pour la boutique fictive "Maison Awa" (mode & wax,
// Abidjan), conforme à tekkishop-landing-texte.md. Remplace ShopMockup.tsx
// (câblé en dur sur "Viens on s'connaît", partagé avec les 4 pages pays,
// non modifié) uniquement sur cette page de prévisualisation. État
// statique — l'animation éventuelle est le lot B, pas ce lot.
export function MaisonAwaMockup() {
  return (
    <div className="phone">
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="st-cover" style={{ background: 'linear-gradient(135deg,#c2410c,#1e3a8a 60%,#fde68a)' }} />
        <div className="st-ava" style={{ background: '#0b1a36', color: '#fbbf24', display: 'grid', placeItems: 'center', fontWeight: 800 }}>MA</div>
        <div className="st-body">
          <div className="st-name">Maison Awa</div>
          <div className="st-cat">Mode &amp; wax · Abidjan</div>
          <p className="st-desc">Robes, ensembles et accessoires en wax, cousus à Abidjan.</p>
          {/* Corrigé le 2026-10-09 : "+85 pièces vendues" restait un chiffre
              inventé (comme "+1 200" avant lui) pour une boutique fictive —
              aucun nombre de ventes affiché désormais, quel qu'il soit.
              Délai de livraison ("24h"/"rapide") retiré, aucun chiffre de
              remplacement : "Livraison à Abidjan" dit seulement où, pas
              en combien de temps. */}
          <div className="st-pills">
            <span className="st-pill">Livraison à Abidjan</span>
          </div>
          <div className="st-social">
            <span className="st-ig">Instagram</span>
            <span className="st-tt">TikTok</span>
          </div>
          <button className="st-order" type="button" tabIndex={-1}>Commander</button>
          {/* "Produits d'exemple" ajouté le 2026-10-09 : les prix n'étaient
              affichés nulle part comme des exemples — seul le code savait
              que la boutique elle-même est fictive. Catalogue aligné le
              2026-10-12 sur la vraie boutique tekki.shop/maison-awa
              (capture directe) : Robe Adjoa "à partir de" (prix variable
              réel), Pagne WAX Hollantex à la place d'"Ensemble Kita" (nom
              qui n'existe nulle part sur la vraie boutique). */}
          <div className="st-sec">Produits d&rsquo;exemple</div>
          <div className="st-favs">
            <div className="st-fav">
              <i style={{ background: 'repeating-radial-gradient(circle at 30% 40%,#c2410c 0 6px,#fbbf24 6px 12px,#1e3a8a 12px 18px)' }} />
              <div><b>Robe Adjoa</b><span>À partir de 45 000 FCFA</span></div>
            </div>
            <div className="st-fav">
              <i style={{ background: 'repeating-linear-gradient(135deg,#065f46 0 9px,#fbbf24 9px 14px,#7c2d12 14px 23px)' }} />
              <div><b>Pagne WAX Hollantex</b><span>14 000 FCFA</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
