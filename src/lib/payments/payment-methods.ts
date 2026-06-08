export type PaymentMethod = 'wave' | 'orange_money' | 'maxit' | 'mtn_money' | 'bictorys'
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
    {
      id: 'wave',
      label: 'Wave Money',
      description: 'Paiement instantané',
      icon: '/logo-payments/wave_1.svg',
    },
    {
      id: 'orange_money',
      label: 'Orange Money',
      description: 'Via code USSD',
      icon: '/logo-payments/om_1.svg',
    },
    {
      id: 'maxit',
      label: 'MaxIt',
      description: 'Paiement instantané',
      icon: '/logo-payments/maxit.webp',
    },
  ],
  CI: [
    {
      id: 'wave',
      label: 'Wave Money',
      description: 'Paiement instantané',
      icon: '/logo-payments/wave_1.svg',
    },
    {
      id: 'orange_money',
      label: 'Orange Money',
      description: 'Via code OTP',
      icon: '/logo-payments/om_1.svg',
    },
    {
      id: 'mtn_money',
      label: 'MTN Money',
      description: 'Paiement mobile',
      icon: '/logo-payments/mtn_1.svg',
    },
  ],
  BK: [
    {
      id: 'wave',
      label: 'Wave Money',
      description: 'Paiement instantané',
      icon: '/logo-payments/wave_1.svg',
    },
  ],
  ML: [
    {
      id: 'wave',
      label: 'Wave Money',
      description: 'Paiement instantané',
      icon: '/logo-payments/wave_1.svg',
    },
  ],
  TG: [
    {
      id: 'wave',
      label: 'Wave Money',
      description: 'Paiement instantané',
      icon: '/logo-payments/wave_1.svg',
    },
  ],
  BJ: [
    {
      id: 'wave',
      label: 'Wave Money',
      description: 'Paiement instantané',
      icon: '/logo-payments/wave_1.svg',
    },
  ],
}
