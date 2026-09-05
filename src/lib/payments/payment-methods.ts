export type PaymentMethod = 'wave' | 'orange_money' | 'maxit' | 'mtn_money' | 'moov_money' | 'mobicash' | 'togocell' | 'bictorys'
export type BictorysCountry = 'SN' | 'CI' | 'BK' | 'ML' | 'TG' | 'BJ'

export interface PaymentMethodOption {
  id: PaymentMethod
  label: string
  description: string
  icon: string
}

export function getCountryFromPhone(phone: string): BictorysCountry | null {
  if (!phone) return null
  if (phone.startsWith('+221')) return 'SN'
  if (phone.startsWith('+225')) return 'CI'
  if (phone.startsWith('+226')) return 'BK'
  if (phone.startsWith('+223')) return 'ML'
  if (phone.startsWith('+228')) return 'TG'
  if (phone.startsWith('+229')) return 'BJ'
  return null
}

export const PAYMENT_METHODS_BY_COUNTRY: Record<BictorysCountry, PaymentMethodOption[]> = {
  SN: [
    { id: 'wave',         label: 'Wave',         description: 'Paiement instantané',         icon: '/logo-payments/wave_1.svg' },
    { id: 'maxit',        label: 'MaxIt',         description: 'Paiement instantané',         icon: '/logo-payments/maxit.webp' },
  ],
  CI: [
    { id: 'wave',         label: 'Wave',         description: 'Paiement instantané',          icon: '/logo-payments/wave_1.svg' },
    { id: 'orange_money', label: 'Orange Money',  description: 'Via code OTP (#144*82#)',      icon: '/logo-payments/om_1.svg' },
    { id: 'mtn_money',    label: 'MTN Money',     description: 'Paiement push mobile',        icon: '/logo-payments/mtn_1.svg' },
    { id: 'moov_money',   label: 'Moov Money',    description: 'Paiement push mobile',        icon: '/logo-payments/moov_1.svg' },
  ],
  BK: [
    { id: 'wave',         label: 'Wave',         description: 'Paiement instantané',              icon: '/logo-payments/wave_1.svg' },
    { id: 'orange_money', label: 'Orange Money',  description: 'Via code OTP (*144*4*6*montant#)', icon: '/logo-payments/om_1.svg' },
    { id: 'moov_money',   label: 'Moov Money',    description: 'Paiement push mobile',            icon: '/logo-payments/moov_1.svg' },
  ],
  ML: [
    { id: 'orange_money', label: 'Orange Money',  description: 'Paiement push mobile',        icon: '/logo-payments/om_1.svg' },
    { id: 'mobicash',     label: 'Mobicash',      description: 'Paiement push mobile',        icon: '/logo-payments/mobicash.png' },
  ],
  TG: [
    { id: 'moov_money',   label: 'Flooz',    description: 'Flooz (Moov Togo) — push sur ton téléphone',  icon: '/logo-payments/flooz.png' },
    { id: 'togocell',     label: 'T-Money',  description: 'T-Money (Togocel) — push sur ton téléphone',  icon: '/logo-payments/tmoney.png' },
  ],
  BJ: [
    { id: 'mtn_money',    label: 'MTN Money',     description: 'Paiement push mobile',        icon: '/logo-payments/mtn_1.svg' },
    { id: 'moov_money',   label: 'Moov Money',    description: 'Paiement push mobile',        icon: '/logo-payments/moov_1.svg' },
  ],
}

const BICTORYS_COUNTRIES: BictorysCountry[] = ['SN', 'CI', 'BK', 'ML', 'TG', 'BJ']

function isBictorysCountry(value: string): value is BictorysCountry {
  return (BICTORYS_COUNTRIES as string[]).includes(value)
}

/**
 * Agrège les moyens de paiement affichables pour une boutique ciblant
 * plusieurs marchés. Le pays de la boutique passe en premier (s'il est
 * un pays Bictorys valide), puis les marchés ciblés dans leur ordre
 * stocké. Déduplication par id de méthode : le premier pays rencontré
 * fixe le libellé/description affichés (ex. "Orange Money" a 3 textes
 * OTP différents selon CI/BK/ML, "Moov Money" s'appelle "Flooz" au Togo
 * — on ne peut pas fusionner ces variantes, on choisit la première).
 * Sans target_countries (boutique mono-pays), comportement inchangé.
 */
export function getPaymentMethodsForTargetCountries(
  shopCountry: BictorysCountry | null,
  targetCountries: string[] | null | undefined
): PaymentMethodOption[] {
  if (!targetCountries || targetCountries.length === 0) {
    return shopCountry ? (PAYMENT_METHODS_BY_COUNTRY[shopCountry] ?? []) : []
  }

  const orderedCountries: BictorysCountry[] = []
  if (shopCountry && isBictorysCountry(shopCountry)) {
    orderedCountries.push(shopCountry)
  }
  for (const country of targetCountries) {
    if (isBictorysCountry(country) && !orderedCountries.includes(country)) {
      orderedCountries.push(country)
    }
  }

  const seen = new Set<PaymentMethod>()
  const result: PaymentMethodOption[] = []
  for (const country of orderedCountries) {
    for (const method of PAYMENT_METHODS_BY_COUNTRY[country]) {
      if (!seen.has(method.id)) {
        seen.add(method.id)
        result.push(method)
      }
    }
  }
  return result
}
