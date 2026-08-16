export const APP_NAME = 'TekkiShop'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tekki.shop'

// Commandes
export const PENDING_EXPIRY_MINUTES = 30
export const REMINDER_HOURS_BEFORE  = 24

// Paiements
export const DEFAULT_DEPOSIT_PERCENTAGE  = 50
export const DEFAULT_CURRENCY            = 'XOF'
// Commission sur les paiements en ligne : voir lib/billing/commission.ts
// (taux par pays, jamais un taux plat unique — supprimé d'ici le 2026-08-16).
export const PAYOUT_MIN_AMOUNT           = 2000 // montant minimum pour déclencher un retrait (FCFA)

// Modèle "boutique publique + 3 commandes offertes" (trial_model='free_orders' uniquement).
// FREE_ORDERS n'est qu'un affichage par défaut avant que la boutique existe (écran 11 de
// /start) — la vraie limite appliquée est shops.free_orders_quota (voir migration 072),
// pour permettre une restitution manuelle par le support sans redéploiement.
export const FREE_ORDERS               = 3
// N'affecte PAS TRIAL_DAYS (modèle legacy, inchangé) — uniquement activateTrialShop.
export const FREE_ORDERS_TRIAL_DAYS    = 14
export const TRIAL_EXTENSION_DAYS      = 7
export const HELD_ORDER_NOTICE_HOURS   = 48
// Passé de 3 à 1 le 2026-08-13 : le rappel client à 48h (notify-held-orders)
// dépend du même canal SMS que le reste de la plateforme, confirmé non
// délivré (REPRISE.md §15/§16) — sans ce message, la fermeture du bouton est
// la seule protection contre une file de clients jamais recontactés.
// Ne compte que les commandes retenues avec au moins un produit physique
// (getHeldPhysicalOrderCount, src/lib/orders/held-orders.ts) — une commande
// digitale retenue est livrée normalement, elle ne laisse personne attendre.
export const MAX_HELD_ORDERS           = 1

// Plans
export const TRIAL_DAYS            = 30
export const SUBSCRIPTION_DAYS     = 31 // durée d'un abonnement mensuel (en jours)
export const PLAN_LIMITS = {
  trial:      { maxProducts: 10  },
  decouverte: { maxProducts: 10  },
  business:   { maxProducts: 100 },
  pro:        { maxProducts: Infinity },
} as const

export const PLAN_LABELS: Record<string, string> = {
  trial:      'Essai gratuit',
  decouverte: 'Découverte',
  business:   'Business',
  pro:        'Pro',
}

// Couleurs
export const DEFAULT_PRIMARY_COLOR = '#0EA5E9'

// Jours de livraison disponibles par défaut (lundi-samedi)
export const DEFAULT_AVAILABLE_DAYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
] as const

// Jours de la semaine
export const DAYS_OF_WEEK = [
  { key: 'monday',    label: 'Lundi' },
  { key: 'tuesday',   label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday',  label: 'Jeudi' },
  { key: 'friday',    label: 'Vendredi' },
  { key: 'saturday',  label: 'Samedi' },
  { key: 'sunday',    label: 'Dimanche' },
] as const

// Statuts de commande
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending:   'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready:     'Prête',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  completed: 'Complétée',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready:     'bg-sky-100 text-sky-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-violet-100 text-violet-800',
}

// Catégories de produits (personnalisables par la boutique)
export const DEFAULT_PRODUCT_CATEGORIES = [
  { value: 'alimentation',  label: 'Alimentation' },
  { value: 'vetements',     label: 'Vêtements' },
  { value: 'beaute',        label: 'Beauté & Soins' },
  { value: 'electronique',  label: 'Électronique' },
  { value: 'maison',        label: 'Maison & Déco' },
  { value: 'artisanat',     label: 'Artisanat' },
  { value: 'autre',         label: 'Autre' },
] as const

// Commande
export const MAX_ITEMS_PER_ORDER = 5
export const MAX_QUANTITY_PER_ITEM = 5
export const ORDER_DELIVERY_WINDOW_DAYS = 14
