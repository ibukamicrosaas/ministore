export type CountryGroup = 'africa' | 'europe' | 'canada'
export type ShopCurrency = 'XOF' | 'EUR' | 'CAD'

const EU_COUNTRIES  = ['FR', 'BE', 'LU', 'CH'] as const
const CA_COUNTRIES  = ['CA'] as const

export function getCountryGroup(countryCode: string | null | undefined): CountryGroup {
  if (!countryCode) return 'africa'
  if ((EU_COUNTRIES as readonly string[]).includes(countryCode)) return 'europe'
  if ((CA_COUNTRIES as readonly string[]).includes(countryCode)) return 'canada'
  return 'africa'
}

export function isEuCaCountry(countryCode: string | null | undefined): boolean {
  const g = getCountryGroup(countryCode)
  return g === 'europe' || g === 'canada'
}

export function getCurrencyForCountry(countryCode: string | null | undefined): ShopCurrency {
  const g = getCountryGroup(countryCode)
  if (g === 'europe') return 'EUR'
  if (g === 'canada') return 'CAD'
  return 'XOF'
}

// Prix Pro en centimes Stripe (100 centimes = 1 unité monétaire)
export const PRO_PRICES: Record<ShopCurrency, { monthly: number; annual: number; label: string; labelAnnual: string }> = {
  XOF: { monthly: 990000, annual: 9900000, label: '9 900 FCFA/mois',  labelAnnual: '99 000 FCFA/an'   },
  EUR: { monthly:   1490, annual:   14900, label: '14,90 €/mois',     labelAnnual: '149 €/an'          },
  CAD: { monthly:   1990, annual:   19900, label: '19,90 CAD/mois',   labelAnnual: '199 CAD/an'        },
}

// Prix en EUR (centimes) pour paiement carte bancaire — tous pays, tous plans
export const PLAN_EUR_PRICES: Record<string, { monthly: number; annual: number; monthlyLabel: string; annualLabel: string }> = {
  decouverte: { monthly:  490, annual:  4900, monthlyLabel: '4,90 €',  annualLabel: '49 €'  },
  business:   { monthly:  790, annual:  7900, monthlyLabel: '7,90 €',  annualLabel: '79 €'  },
  pro:        { monthly: 1490, annual: 14900, monthlyLabel: '14,90 €', annualLabel: '149 €' },
}

// Pays EU/CA avec indicatifs téléphoniques
export const EU_CA_PHONE_COUNTRIES = [
  { code: 'FR', flag: '🇫🇷', dial: '+33',  name: 'France',      placeholder: '6 00 00 00 00' },
  { code: 'BE', flag: '🇧🇪', dial: '+32',  name: 'Belgique',    placeholder: '470 00 00 00'  },
  { code: 'LU', flag: '🇱🇺', dial: '+352', name: 'Luxembourg',  placeholder: '621 000 000'   },
  { code: 'CH', flag: '🇨🇭', dial: '+41',  name: 'Suisse',      placeholder: '76 000 00 00'  },
  { code: 'CA', flag: '🇨🇦', dial: '+1',   name: 'Canada',      placeholder: '514 000 0000'  },
] as const

// Pays africains avec indicatifs (référence centrale)
export const AFRICA_PHONE_COUNTRIES = [
  { code: 'SN', flag: '🇸🇳', dial: '+221', name: 'Sénégal',       placeholder: '77 000 00 00'    },
  { code: 'CI', flag: '🇨🇮', dial: '+225', name: "Côte d'Ivoire", placeholder: '07 00 00 00 00'  },
  { code: 'TG', flag: '🇹🇬', dial: '+228', name: 'Togo',          placeholder: '90 00 00 00'     },
  { code: 'BJ', flag: '🇧🇯', dial: '+229', name: 'Bénin',         placeholder: '97 00 00 00'     },
  { code: 'BF', flag: '🇧🇫', dial: '+226', name: 'Burkina Faso',  placeholder: '70 00 00 00'     },
  { code: 'ML', flag: '🇲🇱', dial: '+223', name: 'Mali',          placeholder: '70 00 00 00'     },
] as const

export const ALL_PHONE_COUNTRIES = [
  ...AFRICA_PHONE_COUNTRIES,
  ...EU_CA_PHONE_COUNTRIES,
] as const

/**
 * Formate un montant dans la devise du shop.
 * Les prix sont stockés en unités d'affichage (ex: 14.90 pour 14,90€ ; 5000 pour 5000 FCFA).
 */
export function formatPrice(amount: number, currency: ShopCurrency | null | undefined): string {
  const cur = currency ?? 'XOF'
  if (cur === 'EUR') {
    return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
  }
  if (cur === 'CAD') {
    return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD`
  }
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

/**
 * Convertit un prix en unités d'affichage vers des centimes pour Stripe.
 * XOF est une devise sans décimales — Stripe l'accepte tel quel.
 * EUR et CAD doivent être multipliés par 100.
 */
export function toStripeAmount(amount: number, currency: ShopCurrency): number {
  if (currency === 'XOF') return Math.round(amount)
  return Math.round(amount * 100)
}

export const CURRENCY_LABEL: Record<ShopCurrency, string> = {
  XOF: 'FCFA (Franc CFA)',
  EUR: '€ (Euro)',
  CAD: 'CAD (Dollar canadien)',
}

export type PayoutMethodKey = 'wave' | 'orange_money' | 'mtn' | 'moov' | 'tmoney' | 'flooz' | 'airtel' | 'mvola' | 'mobicash' | 'maxit'

export interface PayoutMethod {
  label: string
  key:   PayoutMethodKey
  /** Colonne DB utilisée pour stocker le numéro ('payout_wave_number' | 'payout_om_number') */
  col:   'payout_wave_number' | 'payout_om_number'
}

/**
 * Méthodes de retrait disponibles par pays.
 * 'payout_wave_number' = slot 1, 'payout_om_number' = slot 2.
 * Les noms de colonnes sont des clés de stockage internes — seuls les labels comptent côté UI.
 */
export const PAYOUT_METHODS_BY_COUNTRY: Record<string, PayoutMethod[]> = {
  SN: [
    { label: 'Wave',         key: 'wave',         col: 'payout_wave_number' },
    { label: 'Orange Money', key: 'orange_money',  col: 'payout_om_number'   },
  ],
  CI: [
    { label: 'Wave',         key: 'wave',         col: 'payout_wave_number' },
    { label: 'Orange Money', key: 'orange_money',  col: 'payout_om_number'   },
  ],
  ML: [
    { label: 'Orange Money', key: 'orange_money', col: 'payout_wave_number' },
    { label: 'Mobicash',     key: 'mobicash',     col: 'payout_om_number'   },
  ],
  BF: [
    { label: 'Orange Money', key: 'orange_money',  col: 'payout_wave_number' },
    { label: 'Moov Money',   key: 'moov',          col: 'payout_om_number'   },
  ],
  BJ: [
    { label: 'MTN Mobile Money', key: 'mtn',  col: 'payout_wave_number' },
    { label: 'Moov Money',       key: 'moov', col: 'payout_om_number'   },
  ],
  TG: [
    { label: 'T-Money', key: 'tmoney', col: 'payout_wave_number' },
    { label: 'Flooz',   key: 'flooz',  col: 'payout_om_number'   },
  ],
  CM: [
    { label: 'MTN Mobile Money', key: 'mtn',         col: 'payout_wave_number' },
    { label: 'Orange Money',     key: 'orange_money', col: 'payout_om_number'   },
  ],
  GN: [
    { label: 'Orange Money',     key: 'orange_money', col: 'payout_wave_number' },
    { label: 'MTN Mobile Money', key: 'mtn',          col: 'payout_om_number'   },
  ],
  CD: [
    { label: 'Airtel Money', key: 'airtel', col: 'payout_wave_number' },
    { label: 'Orange Money', key: 'orange_money', col: 'payout_om_number' },
  ],
  GA: [
    { label: 'Airtel Money', key: 'airtel', col: 'payout_wave_number' },
    { label: 'Moov Money',   key: 'moov',   col: 'payout_om_number'   },
  ],
  MG: [
    { label: 'MVola (Telma)', key: 'mvola',        col: 'payout_wave_number' },
    { label: 'Orange Money',  key: 'orange_money', col: 'payout_om_number'   },
  ],
}

/** Retourne les méthodes de payout disponibles pour un pays. */
export function getPayoutMethods(countryCode: string | null | undefined): PayoutMethod[] {
  if (!countryCode) return PAYOUT_METHODS_BY_COUNTRY.SN
  return PAYOUT_METHODS_BY_COUNTRY[countryCode] ?? PAYOUT_METHODS_BY_COUNTRY.SN
}

/** Retourne le label de devise court pour affichage dans les formulaires (ex: "FCFA", "€", "CAD"). */
export function getCurrencySymbol(currency: ShopCurrency | null | undefined): string {
  if (currency === 'EUR') return '€'
  if (currency === 'CAD') return 'CAD'
  return 'FCFA'
}
