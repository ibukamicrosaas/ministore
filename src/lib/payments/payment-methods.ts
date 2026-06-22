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
    { id: 'moov_money',   label: 'Moov Money',    description: 'Paiement push mobile',  icon: '/logo-payments/moov_1.svg' },
    { id: 'togocell',     label: 'Togocell',      description: 'Paiement push mobile',  icon: '/logo-payments/togocell.jpg' },
  ],
  BJ: [
    { id: 'mtn_money',    label: 'MTN Money',     description: 'Paiement push mobile',        icon: '/logo-payments/mtn_1.svg' },
    { id: 'moov_money',   label: 'Moov Money',    description: 'Paiement push mobile',        icon: '/logo-payments/moov_1.svg' },
  ],
}
