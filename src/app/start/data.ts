export type QuizCat     = 'mode' | 'beaute' | 'chaussures' | 'alimentaire' | 'digital' | 'electronique' | 'maison' | 'autre'
export type QuizCanal   = 'whatsapp' | 'instagram' | 'physique' | 'debut'
export type QuizPays    = 'SN' | 'CI' | 'BJ' | 'TG' | 'ML' | 'BF'
export type QuizDouleur = 'clients' | 'livraison' | 'paiement' | 'chiffres'

// Emojis utilisés uniquement pour l'aperçu de la carte boutique (écran 7)
export const CAT_EMO: Record<QuizCat, string> = {
  mode:        '👗',
  beaute:      '💄',
  chaussures:  '👟',
  alimentaire: '🍲',
  digital:     '📚',
  electronique:'📱',
  maison:      '🏠',
  autre:       '🛍️',
}

export const CAT_LABEL: Record<QuizCat, string> = {
  mode:         'Mode & vêtements',
  beaute:       'Cosmétiques & beauté',
  chaussures:   'Chaussures & sacs',
  alimentaire:  'Alimentaire',
  digital:      'Produits digitaux',
  electronique: 'Électronique',
  maison:       'Maison & Déco',
  autre:        'Autre chose',
}

// Maps /start categories → onboarding specialty values
export const CAT_TO_SPECIALTY: Record<QuizCat, string> = {
  mode:         'fashion',
  beaute:       'beauty',
  chaussures:   'fashion',
  alimentaire:  'food',
  digital:      'services',
  electronique: 'electronics',
  maison:       'home',
  autre:        'other',
}

export const PREUVES_CAT: Record<QuizCat, string> = {
  mode:         "Bon choix 👗 La mode est la <b>catégorie n°1 sur TEKKIShop</b>. Tes clientes pourront voir tailles et couleurs, et commander sans te poser 10 questions.",
  beaute:       "Excellent 💄 Les vendeuses de cosmétiques reçoivent souvent leurs <b>premières commandes en quelques jours</b> — leurs clientes rachètent régulièrement.",
  chaussures:   "Top 👟 Photos par modèle, pointures en stock visibles : <b>fini le « il reste quelle pointure ? »</b> en boucle sur WhatsApp.",
  alimentaire:  "Miam 🍲 Menus, prix et zones de livraison affichés : tes clients <b>commandent directement</b>, toi tu cuisines.",
  digital:      "Malin 📚 Ebooks, guides, formations : le client paie et <b>reçoit son fichier automatiquement</b>. Tu n'envoies plus rien à la main.",
  electronique: "Excellent choix 📱 Accessoires, gadgets, électronique... tes clients voient le stock disponible et <b>commandent directement</b> sans avoir à te déranger pour chaque question.",
  maison:       "Très bonne niche 🏠 Déco, mobilier, articles de maison : les <b>photos font vendre</b>. Ta boutique met tes produits en valeur bien mieux qu'un simple post WhatsApp.",
  autre:        "Parfait 📦 Quoi que tu vendes, ta boutique l'affiche proprement avec photos et prix. <b>+1 000 marchands</b> de tous secteurs sont déjà là.",
}

export const PREUVES_CANAL: Record<QuizCanal, string> = {
  whatsapp:  "Parfait 💬 Ta boutique est <b>faite pour WhatsApp</b> : un seul lien dans ton statut, et tes clients voient tout, commandent et paient tout seuls — même quand tu dors.",
  instagram: "Génial 📸 Mets le lien de ta boutique en bio : tes abonnés passent de « j'aime » à <b>« j'achète »</b> sans t'écrire en DM.",
  physique:  "Excellente base 🏪 Ta boutique en ligne devient ta <b>deuxième vitrine, ouverte 24h/24</b> — tes clients du quartier commandent même quand c'est fermé.",
  debut:     "C'est le meilleur moment 🌱 Tu démarres <b>directement avec les bons outils</b>, sans passer par le chaos des commandes dans les DM.",
}

export interface PaysData {
  name:        string
  flag:        string
  dialCode:    string
  shopCountry: string  // code ISO utilisé dans la table shops
  paieText:    string
  badges:      string[]
}

export const PAYS_DATA: Record<QuizPays, PaysData> = {
  SN: { name: 'Sénégal',       flag: '🇸🇳', dialCode: '+221', shopCountry: 'SN', paieText: 'Wave et MaxIt',                            badges: ['Wave', 'MaxIt'] },
  CI: { name: "Côte d'Ivoire", flag: '🇨🇮', dialCode: '+225', shopCountry: 'CI', paieText: 'Wave, Orange Money, MTN Money et Moov',    badges: ['Wave', 'Orange Money', 'MTN Money', 'Moov'] },
  BJ: { name: 'Bénin',         flag: '🇧🇯', dialCode: '+229', shopCountry: 'BJ', paieText: 'MTN Money et Moov Money',                  badges: ['MTN Money', 'Moov Money'] },
  TG: { name: 'Togo',          flag: '🇹🇬', dialCode: '+228', shopCountry: 'TG', paieText: 'Flooz et T-Money',                         badges: ['Flooz', 'T-Money'] },
  ML: { name: 'Mali',          flag: '🇲🇱', dialCode: '+223', shopCountry: 'ML', paieText: 'Orange Money et Mobicash',                 badges: ['Orange Money', 'Mobicash'] },
  BF: { name: 'Burkina Faso',  flag: '🇧🇫', dialCode: '+226', shopCountry: 'BF', paieText: 'Wave, Orange Money et Moov Money',         badges: ['Wave', 'Orange Money', 'Moov Money'] },
}

export const PREUVES_DOULEUR: Record<QuizDouleur, string> = {
  clients:   "On s'en occupe ensemble 🧲 Ta boutique génère des <b>visuels prêts à publier</b> pour tes statuts et réseaux, et ton <b>Assistant IA</b> te conseille pour vendre plus.",
  livraison: "C'est réglé 🛵 Chaque commande part sur le <b>WhatsApp de ton livreur en 1 clic</b>. Il confirme la livraison en 1 clic, et ton tableau de bord se met à jour automatiquement.",
  paiement:  "Bonne nouvelle 💸 Tes paiements mobile money sont encaissés en ligne et <b>tu retires ton argent instantanément</b> — pas besoin d'attendre 24 ou 48h.",
  chiffres:  "On a pensé à toi 🧮 Ton <b>Assistant IA</b> connaît les chiffres de TA boutique : demande-lui « combien j'ai gagné ce mois ? » et il te répond simplement.",
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
