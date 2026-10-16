// Données d'exemple de la boutique fictive "Maison Awa", partagées entre
// MaisonAwaHome.tsx (accueil, hero) et ClientJourney.tsx (parcours "Côté
// client") — une seule constante, jamais deux catalogues qui pourraient
// diverger. Catalogue validé par l'utilisateur le 2026-10-23 (noms/prix
// définitifs, ne plus proposer d'alternative sans qu'il le redemande).
//
// Toute donnée "client" ci-dessous (nom, téléphone, référence de commande)
// est fictive et volontairement reconnaissable comme telle — jamais une
// vraie personne, jamais un vrai numéro, jamais une vraie commande.

export const BRAND = '#A8500A'
export const TINT = '#F3E7DD'
export const SOFT = '#F9F3EE'
export const DARKEST = '#221002'
export const ON_BRAND = '#FFFFFF'

// Dégradés de repli (affichés sous l'<Image>, visibles seulement si le
// fichier venait à manquer).
export const GRAD_PAGNE_ROUGE = 'repeating-linear-gradient(135deg,#be123c 0 8px,#166534 8px 14px,#fff 14px 18px)'
export const GRAD_PAGNE_BLEU = 'repeating-linear-gradient(135deg,#0b1a36 0 8px,#1e3a8a 8px 14px,#60a5fa 14px 18px)'
export const GRAD_AUTRE = 'repeating-radial-gradient(circle at 30% 40%,#c2410c 0 6px,#fbbf24 6px 12px,#1e3a8a 12px 18px)'

export const CATEGORIES = [
  { key: 'pagnes', name: 'Pagnes', src: '/landing-v7/maison-awa/optimized/pagnes.webp', alt: 'Pile de pagnes wax Maison Awa' },
  { key: 'femmes', name: 'Femmes', src: '/landing-v7/maison-awa/optimized/femmes.webp', alt: 'Robe en wax Maison Awa' },
  { key: 'hommes', name: 'Hommes', src: '/landing-v7/maison-awa/optimized/hommes.webp', alt: 'Chemise en wax Maison Awa' },
  { key: 'accessoires', name: 'Accessoires', src: '/landing-v7/maison-awa/optimized/accessoires.webp', alt: 'Sac en wax Maison Awa' },
] as const

// Catalogue définitif (validé 2026-10-23) : noms et prix des 6 produits.
export const PRODUCTS = [
  { key: 'pagne-6m', cat: 'PAGNES', name: 'Pagne WAX Hollantex (6 mètres)', price: '14 000 FCFA', priceValue: 14000, bg: GRAD_PAGNE_ROUGE, src: '/landing-v7/maison-awa/optimized/pagne-wax-hollantex-6m.webp', alt: 'Pagne WAX Hollantex, motif géométrique rose, orange et noir, plié' },
  { key: 'pagne-bleu', cat: 'PAGNES', name: 'Pagne WAX Hollantex', price: '14 000 FCFA', priceValue: 14000, bg: GRAD_PAGNE_BLEU, src: '/landing-v7/maison-awa/optimized/pagne-wax-hollantex.webp', alt: 'Pagne WAX Hollantex, motif floral rouge et or, plié' },
  { key: 'robe', cat: 'FEMMES', name: 'Robe Awa', price: 'À partir de 45 000 FCFA', priceValue: 45000, bg: GRAD_AUTRE, src: '/landing-v7/maison-awa/optimized/femmes.webp', alt: 'Robe longue en wax à manches bouffantes' },
  { key: 'chemise', cat: 'HOMMES', name: 'Chemise wax homme', price: '18 000 FCFA', priceValue: 18000, bg: GRAD_AUTRE, src: '/landing-v7/maison-awa/optimized/chemise.webp', alt: 'Chemise en wax orange et bleu nuit' },
  { key: 'sac', cat: 'ACCESSOIRES', name: 'Sac à main wax', price: '25 000 FCFA', priceValue: 25000, bg: GRAD_AUTRE, src: '/landing-v7/maison-awa/optimized/accessoires.webp', alt: 'Sac à main en wax rouge et jaune' },
  { key: 'pochette', cat: 'ACCESSOIRES', name: 'Pochette wax', price: '12 000 FCFA', priceValue: 12000, bg: GRAD_AUTRE, src: '/landing-v7/maison-awa/optimized/pochette.webp', alt: 'Pochette en wax bleu et jaune' },
] as const

// Produit commandé dans le parcours "Côté client" (ClientJourney.tsx) —
// la 2e entrée du catalogue ("Pagne WAX Hollantex", sans "(6 mètres)"),
// quantité 1, comme validé par l'utilisateur.
export const JOURNEY_PRODUCT = PRODUCTS[1]
export const JOURNEY_QTY = 1
export const JOURNEY_DELIVERY_ZONE = 'Cocody'
export const JOURNEY_DELIVERY_FEE = 1500
export const JOURNEY_TOTAL = JOURNEY_PRODUCT.priceValue * JOURNEY_QTY + JOURNEY_DELIVERY_FEE

// Client fictif — volontairement neutre et reconnaissable comme un exemple.
export const FAKE_CUSTOMER_NAME = 'Aminata K.'
export const FAKE_PHONE_FULL = '07 02 02 02 02'
export const FAKE_PHONE_MASKED = '07 •• •• •• 02'
export const FAKE_ORDER_REF = 'MA-DEMO'
