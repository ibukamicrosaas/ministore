// Feuille de style Vitrine, scopée sous `.vt` (aucune fuite vers Classique).
// Mobile d'abord ; paliers : 768 px (tablette) et 1024 px (desktop, conteneur 1 200 px).
// Les couleurs viennent de variables CSS posées sur la racine (deriveVitrineTokens).
export const VITRINE_CSS = `
.vt{font-family:var(--font-vitrine),system-ui,-apple-system,'Segoe UI',sans-serif;background:#fff;color:#1F1B18;-webkit-font-smoothing:antialiased;line-height:1.4}
.vt *{box-sizing:border-box}
.vt :where(a){color:inherit;text-decoration:none}
.vt button{font-family:inherit;cursor:pointer}
.vt :focus-visible{outline:2px solid #1F1B18;outline-offset:2px}
.vt-darkzone :focus-visible{outline-color:#fff}
.vt h1,.vt h2,.vt h3,.vt p{margin:0}
.vt-wrap{max-width:1200px;margin:0 auto;padding-left:16px;padding-right:16px}
.vt-only-d{display:none!important}
.vt-ic{flex:0 0 auto}

/* Header */
.vt-header{position:sticky;top:0;z-index:5;background:rgba(255,255,255,.96);border-bottom:1px solid #EFE9E2}
.vt-header-in{height:64px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.vt-brand{display:flex;align-items:center;gap:10px;min-width:0}
.vt-brand b{font-size:17px;font-weight:700;letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vt-logo{width:38px;height:38px;border-radius:50%;object-fit:cover;border:1px solid #EFE9E2;background:#fff;flex:0 0 auto}
.vt-mono{width:38px;height:38px;border-radius:50%;background:var(--soft);color:var(--graphic);display:flex;align-items:center;justify-content:center;font-weight:700;flex:0 0 auto}
.vt-nav{display:none;align-items:center;gap:4px}
.vt-nav a{padding:10px 14px;border-radius:12px;font-size:15px;font-weight:600}
.vt-nav a:hover{background:var(--soft)}
.vt-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;border-radius:14px;font-weight:700;border:0;white-space:nowrap}
.vt-btn-brand{background:var(--brand);color:var(--on-brand)}
.vt-hdr-cta{display:none;height:46px;padding:0 20px;font-size:15px}

/* Hero */
.vt-hero{padding-top:12px}
.vt-hero-in{border-radius:28px;overflow:hidden;background:linear-gradient(145deg,var(--tint),var(--soft));display:grid;grid-template-columns:minmax(0,1fr)}
.vt-hero-txt{padding:28px 20px;display:flex;flex-direction:column;justify-content:flex-end;gap:12px;min-height:220px}
.vt-badge{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:#fff;color:var(--text);font-size:13px;font-weight:700}
.vt-hero h1{font-size:28px;line-height:1.15;font-weight:800;letter-spacing:-.02em;color:var(--text);overflow-wrap:anywhere}
.vt-hero-desc{font-size:15px;line-height:1.5;color:#4A433D;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.vt-hero-cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:4px}
.vt-hero-cta .vt-btn{height:48px;font-size:15px}
.vt-hero-main{flex:1;max-width:240px;padding:0 20px}
.vt-hero-wa{width:48px;background:rgba(255,255,255,.55);border:1px solid var(--line);color:var(--graphic)}
.vt-hero-wa span{display:none}
.vt-hero-vis{display:none}
.vt-hero-vis.vt-cv{display:block;order:-1}
.vt-hero-cover{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}
.vt-vis-logo{width:200px;height:200px;border-radius:50%;border:6px solid #fff;object-fit:cover;background:#fff;box-shadow:0 18px 40px -18px rgba(31,27,24,.35)}
.vt-vis-mono{width:200px;height:200px;border-radius:50%;background:#fff;color:var(--graphic);display:flex;align-items:center;justify-content:center;font-size:84px;font-weight:800;box-shadow:0 18px 40px -18px rgba(31,27,24,.35)}
.vt-mosaic{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px;padding:28px;width:100%;height:100%;min-height:360px}
.vt-mosaic-item{border-radius:20px;overflow:hidden;min-height:0}
.vt-mosaic-item:first-child{grid-row:1 / span 2}
.vt-mosaic.vt-m1{grid-template-columns:1fr;grid-template-rows:1fr}
.vt-mosaic.vt-m1 .vt-mosaic-item:first-child{grid-row:auto}
.vt-mosaic.vt-m2{grid-template-rows:1fr}
.vt-mosaic.vt-m2 .vt-mosaic-item:first-child{grid-row:auto}

/* Réassurance */
.vt-trust{margin-top:16px;display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
.vt-trust-i{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid #EFE9E2;border-radius:16px;min-width:0}
.vt-trust-i .vt-ico{flex:0 0 38px;width:38px;height:38px;border-radius:50%;background:var(--soft);color:var(--graphic);display:flex;align-items:center;justify-content:center}
.vt-trust-i b{display:block;font-size:14px;font-weight:600}
.vt-trust-i span{display:block;font-size:12.5px;color:#6A625B;overflow-wrap:anywhere}
/* PROPOSITION (b) non décidée : bande compacte une ligne, défilable horizontalement */
@media (max-width:767px){
  .vt-trust--row{display:flex;overflow-x:auto;gap:8px;scrollbar-width:none;margin-top:14px}
  .vt-trust--row::-webkit-scrollbar{display:none}
  .vt-trust--row .vt-trust-i{flex:0 0 auto;max-width:240px;padding:9px 12px;gap:9px}
  .vt-trust--row .vt-trust-i .vt-ico{flex-basis:30px;width:30px;height:30px}
  .vt-trust--row .vt-trust-i b{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .vt-trust--row .vt-trust-i span{display:none}
}
/* PROPOSITION (hero) non décidée : hauteur réduite sans couverture ni logo */
.vt-hero-in--short{min-height:0}
.vt-hero-in--short .vt-hero-txt{min-height:0;padding-top:22px;padding-bottom:22px}
/* Garde le logo (ou le monogramme), réduit seulement l'espace qui lui est
   réservé — ne le masque plus (correction demandée, la v1 de cette
   proposition le cachait à tort). Sur mobile, .vt-hero-vis est déjà masqué
   par la règle de base, rien à faire ici pour ce palier. */
@media (min-width:768px){
  .vt-hero-in--short.vt-hero-in{min-height:0}
  .vt-hero-in--short .vt-hero-vis{min-height:0;padding:20px}
  .vt-hero-in--short .vt-vis-logo,
  .vt-hero-in--short .vt-vis-mono{width:96px;height:96px;font-size:34px;box-shadow:none;border-width:4px}
}

/* PROPOSITION, non décidée : hero mobile plein cadre avec couverture réelle
   en fond (voile sombre + texte par-dessus, comme Main.dc.html) — desktop
   inchangé (toujours 2 colonnes, @media 768px ci-dessus reprend la main). */
.vt-hero-in--fullbleed{position:relative;min-height:420px}
.vt-hero-fb-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
.vt-hero-fb-veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 25%,var(--darkest) 100%);opacity:.94;z-index:1}
.vt-hero-in--fullbleed .vt-hero-txt{position:relative;z-index:2;min-height:420px}
.vt-hero-in--fullbleed .vt-hero-txt h1{color:#fff}
.vt-hero-in--fullbleed .vt-hero-desc{color:rgba(255,255,255,.92)}
.vt-hero-in--fullbleed .vt-badge{background:rgba(255,255,255,.18);color:#fff;backdrop-filter:blur(2px)}
.vt-hero-in--fullbleed .vt-hero-wa{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.45);color:#fff}

/* Catalogue */
.vt-cat{padding-top:34px}
.vt-sec-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
.vt-sec-head h2{font-size:20px;font-weight:700;letter-spacing:-.01em}
.vt-sec-head .vt-count{font-size:13.5px;color:#6A625B;margin-left:10px;font-weight:400}
.vt-toggle{display:flex;padding:3px;border-radius:12px;background:#F4EFE9}
.vt-toggle button{width:44px;height:38px;border:0;border-radius:9px;background:transparent;color:#6A625B;display:flex;align-items:center;justify-content:center}
.vt-toggle button[aria-pressed="true"]{background:#fff;color:var(--graphic);box-shadow:0 1px 3px rgba(31,27,24,.12)}
.vt-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 12px}
.vt-card{display:flex;flex-direction:column;gap:10px;min-width:0}
.vt-media{aspect-ratio:4/5;border-radius:18px;overflow:hidden;background:var(--soft);position:relative}
.vt-media img{width:100%;height:100%;object-fit:cover;display:block}
.vt-ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--graphic);background:linear-gradient(160deg,var(--soft),var(--tint))}
.vt-ph svg{opacity:.55}
.vt-meta{display:flex;flex-direction:column;gap:3px;min-width:0}
.vt-cap{font-size:11.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#6A625B}
.vt-name{font-size:15px;font-weight:600;line-height:1.3;overflow-wrap:anywhere}
.vt-price{font-size:15px;font-weight:700;color:var(--text)}
.vt-wa-card{border:1.5px dashed var(--line);border-radius:18px;background:var(--soft);padding:20px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;min-height:200px}
.vt-wa-card .vt-wa-ic{width:46px;height:46px;border-radius:50%;background:#E3F4EA;color:#0B6B3A;display:flex;align-items:center;justify-content:center}
.vt-wa-card b{font-size:15px;font-weight:600;line-height:1.3}
.vt-wa-card .vt-sub{font-size:13px;color:#6A625B;line-height:1.4}
.vt-wa-card .vt-link{font-size:13.5px;font-weight:700;color:var(--text)}
.vt-wa-txt{display:flex;flex-direction:column;gap:3px;align-items:inherit}
@media (max-width:767px){.vt-wa-card--mwide{grid-column:1 / -1;flex-direction:row;text-align:left;min-height:0;padding:16px;justify-content:flex-start}.vt-wa-card--mwide .vt-wa-txt{align-items:flex-start}}
/* Liste */
.vt-list{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
.vt-row{display:flex;align-items:center;gap:14px;padding:10px;border:1px solid #EFE9E2;border-radius:18px;min-width:0}
.vt-row .vt-media{flex:0 0 92px;width:92px;aspect-ratio:1/1;border-radius:14px}
.vt-row .vt-meta{flex:1}
.vt-row .vt-chev{color:#6A625B}
.vt-row.vt-wa-card{flex-direction:row;text-align:left;min-height:0;justify-content:flex-start;padding:14px}
/* Produit unique : carte vedette */
.vt-feat{display:flex;flex-direction:column;border:1px solid #EFE9E2;border-radius:24px;overflow:hidden;background:#fff}
.vt-feat .vt-media{aspect-ratio:1/1;border-radius:0}
/* PROPOSITION, non décidée : bandeau réduit quand le produit unique n'a pas
   de photo (au lieu du grand carré 1:1 occupant toute la largeur). */
.vt-feat--compact-photo .vt-media{aspect-ratio:16/9;max-height:140px}
@media (min-width:768px){.vt-feat--compact-photo .vt-media{aspect-ratio:auto;flex:0 0 160px;max-height:none}}
/* PROPOSITION, non décidée : catalogue paginé — bouton « Voir plus ». */
.vt-more-wrap{display:flex;justify-content:center;margin-top:28px}
.vt-more-btn{height:50px;padding:0 28px;font-size:15px}
.vt-feat-info{padding:20px 18px 22px;display:flex;flex-direction:column;gap:10px}
.vt-feat-info .vt-name{font-size:22px;font-weight:800;line-height:1.2;letter-spacing:-.01em}
.vt-feat-info .vt-price{font-size:22px;font-weight:800}
.vt-feat-desc{font-size:15px;line-height:1.55;color:#4A433D;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.vt-feat-act{display:flex;flex-direction:column;gap:10px;margin-top:8px}
.vt-feat-act .vt-btn{height:52px;font-size:16px;border-radius:16px}
.vt-btn-line{border:1.5px solid var(--line);background:#fff;color:#1F1B18}
.vt-empty{padding:40px 16px;text-align:center;color:#6A625B;border:1px dashed #EFE9E2;border-radius:18px}

/* Étapes */
.vt-steps{margin-top:42px;background:var(--soft);padding:32px 0 34px}
.vt-steps h2{font-size:20px;font-weight:700;margin-bottom:20px}
.vt-steps-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:18px}
.vt-step{display:flex;gap:14px;align-items:flex-start}
.vt-step .vt-num{flex:0 0 34px;width:34px;height:34px;border-radius:50%;background:var(--brand);color:var(--on-brand);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px}
.vt-step b{font-size:16px;font-weight:600;display:block}
.vt-step p{margin-top:3px;font-size:14px;color:#6A625B;line-height:1.5}

/* Communauté */
.vt-comm{padding-top:34px}
.vt-comm-card{border:1px solid #EFE9E2;border-radius:24px;padding:24px 20px;display:flex;flex-direction:column;gap:14px;align-items:flex-start}
.vt-comm-card .vt-wa-ic{width:46px;height:46px;border-radius:50%;background:#E3F4EA;color:#0B6B3A;display:flex;align-items:center;justify-content:center}
.vt-comm-card h2{font-size:20px;font-weight:700}
.vt-comm-card p{font-size:15px;color:#6A625B;line-height:1.5}
.vt-btn-wa{height:50px;padding:0 22px;background:#0B6B3A;color:#fff;font-size:15.5px;border-radius:14px}

/* Pied de page */
.vt-footer{margin-top:40px;background:var(--darkest);color:#fff}
.vt-foot-in{padding-top:34px;padding-bottom:28px;display:flex;flex-direction:column;gap:24px}
.vt-foot-brand{display:flex;flex-direction:column;gap:14px;min-width:0}
.vt-foot-id{display:flex;align-items:center;gap:12px}
.vt-foot-id .vt-logo{width:52px;height:52px;border:0}
.vt-foot-id .vt-mono{width:52px;height:52px;background:rgba(255,255,255,.15);color:#fff;font-size:20px}
.vt-foot-id b{font-size:20px;font-weight:700;overflow-wrap:anywhere}
.vt-foot-id small{display:block;font-size:13.5px;opacity:.75}
.vt-foot-desc{font-size:15px;line-height:1.55;opacity:.88;overflow-wrap:anywhere;white-space:pre-line}
@media (max-width:767px){.vt-clamp.is-clamped{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}}
.vt-more{align-self:flex-start;background:none;border:0;color:#fff;font-size:14px;font-weight:600;text-decoration:underline;padding:6px 0;opacity:.95}
.vt-foot-cta{display:flex;gap:10px}
.vt-foot-cta .vt-btn{flex:1;height:48px;font-size:15px;font-weight:600}
.vt-foot-lbl{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;opacity:.6;display:block;margin-bottom:10px}
.vt-soc{display:flex;gap:10px}
.vt-soc a{width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center}
.vt-soc svg{width:21px;height:21px}
.vt-pay{display:flex;flex-wrap:wrap;gap:8px}
.vt-paylogo{width:68px;height:52px;border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden}
.vt-paylogo img{width:48px;height:40px;object-fit:contain;display:block}
.vt-paypill{padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.3);font-size:13px;height:52px;display:inline-flex;align-items:center}
.vt-foot-col-nav,.vt-foot-links{display:none}
.vt-contact-lbl{display:none}
.vt-foot-bot{border-top:1px solid rgba(255,255,255,.16);padding-top:18px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}
.vt-foot-bot a{font-size:14px;opacity:.95}

/* Barre fixe mobile */
.vt-sticky{position:sticky;bottom:0;display:flex;gap:10px;padding:12px 16px;background:#fff;border-top:1px solid #EFE9E2;z-index:4}
.vt-sticky .vt-wa-sq{flex:0 0 56px;height:56px;border-radius:16px;border:1.5px solid #B9E3C9;background:#F3FBF6;color:#0B6B3A;display:flex;align-items:center;justify-content:center}
.vt-sticky .vt-btn{flex:1;height:56px;border-radius:16px;font-size:16.5px}
.vt-sticky button:disabled{opacity:.6;cursor:not-allowed}

/* Fiche produit */
.vt-crumb{display:none}
.vt-pg-wrap{display:flex;flex-direction:column}
.vt-pg{position:relative;height:360px;background:var(--soft)}
.vt-pdetail{margin:0 -16px}
.vt-pgm{position:absolute;inset:0}
.vt-pgm img{width:100%;height:100%;object-fit:cover;display:block}
.vt-pgm .vt-ph{position:absolute;inset:0}
.vt-pg-thumbs{display:flex;gap:8px;padding:10px 16px 0;overflow-x:auto}
.vt-pg-thumb{flex:0 0 auto;width:52px;height:52px;border-radius:12px;overflow:hidden;padding:0;border:2px solid transparent;opacity:.75}
.vt-pg-thumb.is-active{border-color:var(--brand);opacity:1}
.vt-pg-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.vt-pg-back{position:absolute;top:14px;left:14px;height:40px;padding:0 14px 0 10px;border-radius:999px;background:rgba(255,255,255,.94);display:flex;align-items:center;gap:6px;font-size:14px;font-weight:600}
.vt-pg-share{position:absolute;top:14px;right:14px}
.vt-pinfo{padding:22px 20px 0;display:flex;flex-direction:column}
.vt-pinfo>*{order:5}
.vt-pcat{order:1;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text)}
.vt-pinfo h1{order:2;font-size:24px;line-height:1.15;font-weight:800;margin-top:6px;overflow-wrap:anywhere}
.vt-prow{order:3;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px}
.vt-pprice{font-size:26px;font-weight:800;color:var(--text)}
.vt-pprice-old{font-size:15px;color:#9A938C;text-decoration:line-through}
.vt-stock{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:#E3F4EA;color:#0B6B3A;font-size:13px;font-weight:600}
.vt-out{background:#FBE7E7;color:#9E1B1B}
.vt-pact{order:4;display:flex;flex-direction:column;gap:14px;margin-top:20px}
.vt-pact .vt-btn{height:52px;border-radius:16px;font-size:16px}
.vt-pact .vt-btn:disabled{opacity:.6;cursor:not-allowed}
.vt-pact .vt-wa{height:48px;border-radius:16px;border:1.5px solid #B9E3C9;background:#F3FBF6;color:#0B6B3A;font-size:15px;font-weight:600}
.vt-extract-btn{align-self:flex-start;margin-top:10px;height:44px;padding:0 18px;border-radius:14px;border:1.5px solid var(--line);background:#fff;color:var(--brand);font-size:14.5px;font-weight:600;display:inline-flex;align-items:center;gap:8px}
.vt-extract-text{font-size:14.5px;line-height:1.65;color:#3A342F;white-space:pre-wrap;overflow-wrap:anywhere}
.vt-before{order:6;margin-top:26px;border:1px solid #EFE9E2;border-radius:20px;background:var(--soft);padding:18px 16px;display:flex;flex-direction:column;gap:16px}
.vt-before h2{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6A625B}
.vt-before .vt-bi{display:flex;gap:14px;align-items:flex-start}
.vt-before .vt-ico{flex:0 0 40px;width:40px;height:40px;border-radius:12px;background:#fff;color:var(--graphic);display:flex;align-items:center;justify-content:center}
.vt-before b{font-size:15px;font-weight:600;display:block}
.vt-before p{font-size:14px;color:#6A625B;margin-top:2px;line-height:1.5}
.vt-pdesc{order:7;margin-top:28px;display:flex;flex-direction:column;gap:10px}
.vt-pdesc h2{font-size:18px;font-weight:700}
.vt-pdesc p{font-size:15.5px;line-height:1.6;color:#4A433D;white-space:pre-wrap;overflow-wrap:anywhere}
.vt-pdesc-more{align-self:flex-start;background:none;border:0;color:var(--brand);font-size:14px;font-weight:700;text-decoration:underline;padding:0}
.vt-pmisc{order:8;margin-top:14px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.vt-related{padding-top:36px}
.vt-related h2{font-size:20px;font-weight:700;margin-bottom:14px}
.vt-rel-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.vt-pfoot{margin-top:40px}

/* Tablette */
@media (min-width:768px){
  .vt-wrap{padding-left:28px;padding-right:28px}
  .vt-only-m{display:none!important}
  .vt-only-d{display:flex!important}
  .vt-header-in{height:72px}
  .vt-nav{display:flex}
  .vt-hdr-cta{display:inline-flex}
  .vt-hero{padding-top:24px}
  .vt-hero-in{border-radius:32px;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);min-height:420px}
  .vt-hero-txt{padding:48px 40px;justify-content:center;gap:18px}
  .vt-hero h1{font-size:40px;line-height:1.06;letter-spacing:-.03em}
  .vt-hero-desc{font-size:17px;-webkit-line-clamp:3}
  .vt-hero-cta .vt-btn{height:54px;font-size:16px}
  .vt-hero-main{flex:0 0 auto;max-width:none;padding:0 22px}
  .vt-hero-wa{background:#fff}
  .vt-hero-vis,.vt-hero-vis.vt-cv{display:flex;order:0;position:relative;min-height:320px;align-items:center;justify-content:center}
  .vt-hero-cover{position:absolute;inset:0;height:100%;aspect-ratio:auto}
  .vt-trust{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:20px}
  .vt-trust.vt-n2{grid-template-columns:repeat(2,minmax(0,1fr))}
  .vt-trust.vt-n1{grid-template-columns:minmax(0,1fr)}
  .vt-trust-i{padding:16px 18px;border-radius:20px}
  .vt-trust-i .vt-ico{flex-basis:44px;width:44px;height:44px}
  .vt-cat{padding-top:56px}
  .vt-sec-head{margin-bottom:22px}
  .vt-sec-head h2{font-size:28px;letter-spacing:-.02em}
  .vt-grid{grid-template-columns:repeat(var(--cols3,3),minmax(0,1fr));gap:28px 20px}
  .vt-list{grid-template-columns:repeat(2,minmax(0,1fr))}
  .vt-media{border-radius:20px}
  .vt-name{font-size:16px}.vt-price{font-size:16px}
  .vt-wa-card{aspect-ratio:4/5;min-height:0;border-radius:20px;padding:22px}
  .vt-row.vt-wa-card{aspect-ratio:auto}
  .vt-feat{flex-direction:row;border-radius:28px;min-height:480px}
  .vt-feat .vt-media{flex:0 0 46%;aspect-ratio:auto}
  .vt-feat-info{flex:1;padding:40px;justify-content:center;gap:14px}
  .vt-feat-info .vt-name{font-size:32px}.vt-feat-info .vt-price{font-size:30px}
  .vt-feat-act{flex-wrap:wrap}
  .vt-feat-act .vt-btn{flex:1 1 auto;min-width:0}
  .vt-steps{margin-top:72px;padding:64px 0}
  .vt-steps h2{font-size:28px;margin-bottom:32px;letter-spacing:-.02em}
  .vt-steps-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
  .vt-step{flex-direction:column;gap:14px;padding:24px;background:#fff;border-radius:24px}
  .vt-step .vt-num{width:44px;height:44px;flex-basis:44px;font-size:17px}
  .vt-step b{font-size:18px}.vt-step p{font-size:15px}
  .vt-comm{padding-top:56px}
  .vt-comm-card{flex-direction:row;align-items:center;gap:22px;padding:30px 34px;border-radius:28px}
  .vt-comm-card .vt-comm-txt{flex:1;display:flex;flex-direction:column;gap:6px}
  .vt-comm-card h2{font-size:24px}
  .vt-footer{margin-top:64px}
  .vt-foot-in{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:36px 40px;padding-top:52px;padding-bottom:0}
  .vt-foot-col-nav,.vt-foot-links{display:flex;flex-direction:column;gap:12px}
  .vt-foot-links a{font-size:15px;opacity:.9}
  .vt-contact-lbl{display:block}
  .vt-foot-cta{flex-direction:column}
  .vt-foot-cta .vt-btn{justify-content:flex-start;padding:0;height:auto;background:none!important;color:#fff!important;border:0!important;font-size:15px;font-weight:400;opacity:.9;flex:0 0 auto}
  .vt-foot-bot{grid-column:1 / -1;flex-direction:row;justify-content:space-between;margin-top:12px;padding:22px 0 28px}
  .vt-foot-desc{max-width:340px}
  .vt-sticky{display:none}
  /* Fiche */
  .vt-crumb{display:flex;align-items:center;gap:8px;padding:24px 0 22px;font-size:14px;color:#6A625B;flex-wrap:wrap}
  .vt-crumb b{color:#1F1B18;font-weight:600}
  .vt-pdetail{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:40px;align-items:start}
  .vt-pg{height:auto;min-height:480px;border-radius:32px;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:32px}
  .vt-pdetail{margin:0}
  .vt-pgm{position:relative;height:520px;display:flex;align-items:center;justify-content:center;width:100%}
  .vt-pgm img{width:auto;max-width:100%;max-height:520px;height:auto;object-fit:contain;border-radius:20px;box-shadow:0 24px 48px -24px rgba(31,27,24,.35)}
  .vt-pgm .vt-ph{position:relative;inset:auto;width:70%;aspect-ratio:4/5;border-radius:20px}
  .vt-pinfo{padding:6px 0 0}
  .vt-pinfo h1{font-size:34px;letter-spacing:-.03em;line-height:1.08}
  .vt-prow{justify-content:flex-start;gap:16px}
  .vt-pprice{font-size:30px}
  .vt-pdesc{margin-top:14px;max-width:520px}
  .vt-pdesc p{font-size:16.5px;line-height:1.65}
  .vt-pact{margin-top:24px}
  .vt-before{margin-top:24px;padding:22px}
  .vt-related{padding-top:64px}
  .vt-related h2{font-size:28px;margin-bottom:24px;letter-spacing:-.02em}
  .vt-rel-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
  .vt-pfoot{margin-top:56px}
}

/* Desktop */
@media (min-width:1024px){
  .vt-wrap{padding-left:40px;padding-right:40px}
  .vt-header-in{height:76px}
  .vt-hero-in{min-height:520px;border-radius:36px}
  .vt-hero-txt{padding:64px 56px;gap:20px}
  .vt-hero h1{font-size:54px}
  .vt-hero-wa{width:auto;padding:0 22px}
  .vt-hero-wa span{display:inline}
  .vt-grid{grid-template-columns:repeat(var(--cols4,4),minmax(0,1fr));gap:28px 24px}
  .vt-feat-act{flex-direction:row;align-items:center;flex-wrap:nowrap}
  .vt-feat-act .vt-btn{flex:0 1 auto;padding:0 28px}
  .vt-foot-in{grid-template-columns:1.5fr 1fr 1fr 1.3fr;gap:48px;padding-top:60px}
  .vt-foot-in.vt-foot-compact{grid-template-columns:1.2fr 1.4fr;gap:48px;padding-top:48px}
  .vt-pdetail{gap:64px}
  .vt-pg{min-height:620px;padding:36px}
  .vt-pgm{height:548px}
  .vt-pgm img{max-height:548px}
  .vt-pinfo h1{font-size:42px}
  .vt-pprice{font-size:34px}
  .vt-rel-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}
  .vt-comm-card{padding:36px 44px}
}
@media (prefers-reduced-motion:no-preference){.vt a,.vt button{transition:background-color .15s,opacity .15s}}
`
