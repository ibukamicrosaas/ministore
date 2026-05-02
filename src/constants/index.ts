export const APP_NAME = 'Sheka'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sheka.store'

// Réservations
export const PENDING_EXPIRY_MINUTES = 30
export const MAX_BOOKING_DURATION_MINUTES = 480
export const SLOT_GRANULARITY_MINUTES = 30
export const REMINDER_HOURS_BEFORE = 24

// Paiements
export const DEFAULT_DEPOSIT_PERCENTAGE = 50
export const DEFAULT_CANCELLATION_HOURS = 24
export const DEFAULT_CURRENCY = 'XOF'
export const SHEKA_COMMISSION_RATE = 3   // % prélevé sur les paiements en ligne
export const PAYOUT_MIN_AMOUNT = 2000   // montant minimum pour déclencher un retrait (FCFA)

// Plans
export const TRIAL_DAYS = 14
export const PLAN_LIMITS = {
  trial: { maxStaff: 3 },
  starter: { maxStaff: 3 },
  pro: { maxStaff: Infinity },
  multi: { maxStaff: Infinity },
} as const

// Couleurs
export const DEFAULT_PRIMARY_COLOR = '#E85D04'

// Horaires par défaut pour un nouveau salon
export const DEFAULT_OPENING_HOURS = {
  monday:    { open: '09:00', close: '19:00', closed: false },
  tuesday:   { open: '09:00', close: '19:00', closed: false },
  wednesday: { open: '09:00', close: '19:00', closed: false },
  thursday:  { open: '09:00', close: '19:00', closed: false },
  friday:    { open: '09:00', close: '19:00', closed: false },
  saturday:  { open: '09:00', close: '18:00', closed: false },
  sunday:    { open: '09:00', close: '18:00', closed: true },
}

// Catégories de services
export const SERVICE_CATEGORIES = [
  { value: 'coiffure', label: 'Coiffure' },
  { value: 'beaute', label: 'Beauté' },
  { value: 'soin', label: 'Soin' },
  { value: 'onglerie', label: 'Onglerie' },
  { value: 'maquillage', label: 'Maquillage' },
  { value: 'autre', label: 'Autre' },
] as const

// Statuts de réservation avec labels
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending:   'En attente',
  confirmed: 'Confirmée',
  present:   'Présente',
  completed: 'Terminée',
  cancelled: 'Annulée',
  no_show:   'Absent',
}

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  present:   'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show:   'bg-gray-100 text-gray-800',
}

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
