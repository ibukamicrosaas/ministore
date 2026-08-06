import {
  AFRICA_PHONE_COUNTRIES, EU_CA_PHONE_COUNTRIES, ALL_PHONE_COUNTRIES,
  getCurrencyForCountry, getCurrencySymbol, toBictorysCountry,
} from '@/lib/utils/country-groups'
import { getPaymentMethodsByCountry } from '@/lib/payments/bictorys'

// ── Catégories (Q2) ─────────────────────────────────────────────────────────────
// ⚠️ Liste provisoire reprise telle quelle de la maquette v4, en attendant la
// validation du classement réel (GROUP BY specialty) par l'équipe produit.
export type QuizCat = 'mode' | 'beaute' | 'cheveux' | 'chaussures' | 'alimentaire' | 'digital' | 'electro' | 'autre'

export const CAT_LABEL: Record<QuizCat, string> = {
  mode:        'Mode & vêtements',
  beaute:      'Cosmétiques & soins',
  cheveux:     'Cheveux & perruques',
  chaussures:  'Chaussures & sacs',
  alimentaire: 'Alimentaire',
  digital:     'Produits digitaux',
  electro:     'Électronique',
  autre:       'Autre chose',
}

// Placeholder pour le nom du premier produit (écran 10), selon la catégorie choisie
export const CAT_EXAMPLE: Record<QuizCat, string> = {
  mode:        'Robe wax grande taille',
  beaute:      'Huile de karité pure',
  cheveux:     'Perruque lace frontale',
  chaussures:  'Sac en cuir artisanal',
  alimentaire: 'Bissap artisanal 1 L',
  digital:     'Guide PDF — 30 recettes',
  electro:     'Écouteurs sans fil',
  autre:       'Mon premier produit',
}

// Correspondance catégorie /start → valeur stockée dans shops.specialty.
// 'cheveux' est stocké dans sa propre valeur 'hair' dès maintenant — le fusionner
// avec 'beauty' aurait rendu impossible de mesurer combien de boutiques en
// relèvent, ce qui est précisément ce que Q2 doit permettre de savoir.
// 'chaussures' reste fusionné dans 'fashion', comme le sont déjà les 331 lignes
// existantes en base : décision déjà actée, en attente du classement complet
// pour savoir si ça vaut la peine de les séparer.
export const CAT_TO_SPECIALTY: Record<QuizCat, string> = {
  mode:        'fashion',
  beaute:      'beauty',
  cheveux:     'hair',
  chaussures:  'fashion',
  alimentaire: 'food',
  digital:     'digital',
  electro:     'electronics',
  autre:       'other',
}

export const PREUVES_CAT: Record<QuizCat, string> = {
  mode:        "Bon choix. La mode est l'une des <b>catégories les plus vendues sur TekkiShop</b>. Tes clientes pourront voir tailles et couleurs, et commander sans te poser 10 questions.",
  beaute:      "Excellent. Les vendeuses de cosmétiques reçoivent souvent leurs <b>premières commandes en quelques jours</b> — leurs clientes rachètent régulièrement.",
  cheveux:     "Top choix. Photos par modèle, longueurs et textures affichées : <b>fini les mêmes questions en boucle</b> sur WhatsApp.",
  chaussures:  "Top. Photos par modèle, pointures en stock visibles : <b>fini le « il reste quelle pointure ? »</b> en boucle sur WhatsApp.",
  alimentaire: "Miam. Menus, prix et zones de livraison affichés : tes clients <b>commandent directement</b>, toi tu cuisines.",
  digital:     "Malin. Ebooks, guides, formations : le client paie et <b>reçoit son fichier automatiquement</b>. Tu n'envoies plus rien à la main.",
  electro:     "Excellent choix. Accessoires, gadgets, électronique : tes clients voient le stock disponible et <b>commandent directement</b> sans avoir à te déranger pour chaque question.",
  autre:       "Parfait. Quoi que tu vendes, ta boutique l'affiche proprement avec photos et prix.",
}

// ── Q3 — « Où en es-tu aujourd'hui ? » : segmente (A/B/C) ET donne le canal de partage ──
export type QuizEtat  = 'wa' | 'social' | 'phys' | 'peu' | 'debut'
export type Segment   = 'A' | 'B' | 'C'
export type Canal     = 'whatsapp' | 'social' | 'physique'

export interface EtatOption {
  value: QuizEtat
  seg:   Segment
  canal: Canal
  label: string
  proof: string
}

export const ETATS: EtatOption[] = [
  { value: 'wa',    seg: 'A', canal: 'whatsapp', label: 'Je vends déjà sur WhatsApp',
    proof: "Tes clients sont déjà dans ton téléphone. Un lien dans ton statut, et ils commandent sans t'écrire." },
  { value: 'social', seg: 'A', canal: 'social',   label: 'Je vends sur Instagram ou TikTok',
    proof: "Tes abonnés te suivent déjà. Un lien dans ta bio, et ils passent de spectateurs à acheteurs." },
  { value: 'phys',   seg: 'A', canal: 'physique', label: 'Je vends en boutique ou au marché',
    proof: "Tes clients pourront commander toute la semaine, pas seulement le jour où ils passent devant toi." },
  { value: 'peu',    seg: 'B', canal: 'whatsapp', label: "J'ai des produits, mais peu de clients",
    proof: "Tu as déjà le plus dur : de vrais produits. Ce qu'il te manque, c'est de la visibilité — on va s'en occuper." },
  { value: 'debut',  seg: 'C', canal: 'whatsapp', label: "Je démarre, je n'ai encore rien vendu",
    proof: "Tout le monde commence quelque part. On va y aller une action à la fois, sans rien te demander de compliqué." },
]

// ── Q5 — « Qu'est-ce qui te bloque le plus ? » — universel, quel que soit le segment ──
export type QuizBlocage = 'clients' | 'auto' | 'gestion' | 'paiement'

export interface BlocageOption {
  value: QuizBlocage
  label: string
  sous:  string
  proof: string
}

export const BLOCAGES: BlocageOption[] = [
  { value: 'clients',  label: 'Trouver et attirer des clients',
    sous:  'Je ne sais pas à qui vendre, ni comment les faire venir',
    proof: 'Ta boutique génère des visuels prêts à publier, et ton Assistant IA te propose quoi poster, à qui, et quand.' },
  { value: 'auto',     label: 'Vendre même quand je ne suis pas là',
    sous:  'Sans moi, rien ne se passe : je dois répondre à chaque message',
    proof: 'Ton client choisit, commande et paie tout seul. Tu découvres la commande quand tu reprends ton téléphone.' },
  { value: 'gestion',  label: 'Gérer mes commandes et mes livraisons',
    sous:  "Mes commandes partent dans tous les sens et je m'y perds",
    proof: 'Chaque commande arrive au même endroit, avec le nom, le numéro et l’adresse du client, prête pour ton livreur.' },
  { value: 'paiement', label: 'Me faire payer sans casse-tête',
    sous:  'Mes clients veulent payer autrement, et je ne peux pas toujours accepter',
    proof: "Wave, Orange Money, MTN, Moov, carte ou paiement à la livraison : ton client choisit, et l'argent arrive chez toi." },
]

// ── Écran 6 — Révélation (par segment) ──────────────────────────────────────────
// Le titre n'est PAS ici : il est composé en JSX directement dans le composant
// (le nom de la boutique, saisi par l'utilisateur, ne doit jamais transiter par
// du HTML injecté). `texte` reste un texte HTML statique, entièrement défini par
// le développeur — sûr à utiliser avec dangerouslySetInnerHTML.
export const REVEAL: Record<Segment, { texte: string }> = {
  A: { texte: "Tu as déjà des clients. Les vendeurs comme toi font leur première vente sur TekkiShop <b>en moins de 48 heures</b> — il suffit de leur envoyer un lien." },
  B: { texte: "Ta boutique ne se contente pas d'exister : ton <b>Assistant IA</b> te donne un plan d'acquisition, une action par jour, jusqu'à ta première vente." },
  C: { texte: "Une seule action à la fois, jamais deux. Tu n'as rien à savoir d'avance, et ton <b>Assistant IA</b> répond à tes questions quand tu bloques." },
}

export const PREP: Record<QuizBlocage, string[]> = {
  clients:  ['Ton plan d’acquisition sur 7 jours', 'Des visuels prêts à publier', 'Ton Assistant IA en première page'],
  auto:     ['Commande et paiement enchaînés sans toi', 'Confirmation envoyée automatiquement', 'Ta boutique ouverte 24 h/24'],
  gestion:  ['Toutes tes commandes dans un seul écran', 'Adresses et numéros déjà remplis', 'Statuts de livraison à jour'],
  paiement: ['Tes moyens de paiement déjà branchés', 'Le paiement à la livraison activé', 'Le retrait sur ton mobile money'],
}

// ── Écran 11 — Partage, selon le canal déclaré en Q3 ────────────────────────────
export const PARTAGE: Record<Canal, { titre: string; sous: string }> = {
  whatsapp: { titre: 'Partager sur WhatsApp',      sous: 'Publie ton lien en statut ou envoie-le à tes contacts' },
  social:   { titre: 'Mettre le lien dans ma bio', sous: 'Copie ton lien pour Instagram ou TikTok' },
  physique: { titre: 'Imprimer mon QR code',       sous: 'À coller sur ta vitrine, ton stand ou tes emballages' },
}

// ── Pays (Q4) — source unique : country-groups.ts, pas de duplication ───────────
export type QuizPays = typeof ALL_PHONE_COUNTRIES[number]['code']

export function getCountryEntry(code: QuizPays) {
  return ALL_PHONE_COUNTRIES.find(c => c.code === code) ?? AFRICA_PHONE_COUNTRIES[0]
}

export const AFRICA_QUIZ_COUNTRIES = AFRICA_PHONE_COUNTRIES
export const DIASPORA_QUIZ_COUNTRIES = EU_CA_PHONE_COUNTRIES

/** Devise affichée pour un pays donné — jamais en dur, toujours dérivée. */
export function getCurrencyLabel(code: QuizPays): string {
  return getCurrencySymbol(getCurrencyForCountry(code))
}

function joinFr(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`
}

/**
 * Moyens de paiement à afficher pour un pays donné (Q4, écran 7, écran 8).
 * Afrique : dérivé de la config Bictorys réelle (via le mapping BF→BK partagé).
 * Europe/Canada : carte bancaire uniquement (pas de mobile money Bictorys là-bas).
 */
export function getPaymentInfo(code: QuizPays): { labels: string[]; text: string } {
  const bictorysCode = toBictorysCountry(code)
  if (bictorysCode) {
    const labels = getPaymentMethodsByCountry(bictorysCode).map(m => m.label)
    if (labels.length > 0) return { labels, text: joinFr(labels) }
  }
  return { labels: ['Carte bancaire'], text: 'carte bancaire' }
}

export function makeSlug(nom: string): string {
  return nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'ma-boutique'
}
