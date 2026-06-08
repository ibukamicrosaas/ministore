export type PaymentMethod = 'wave' | 'orange_money' | 'maxit' | 'bictorys'
export type BictorysCountry = 'SN' | 'CI' | 'BK' | 'ML' | 'TG' | 'BJ'

export interface PaymentMethodOption {
  id: PaymentMethod
  label: string
  description: string
  icon: string
  timeEstimate?: string
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
      timeEstimate: 'Instantané',
    },
    {
      id: 'orange_money',
      label: 'Orange Money',
      description: 'Via code USSD',
      icon: '/logo-payments/om_1.svg',
      timeEstimate: '1-2 min',
    },
    {
      id: 'maxit',
      label: 'MaxIt',
      description: 'Paiement instantané',
      icon: '/logo-payments/maxit.webp',
      timeEstimate: 'Instantané',
    },
  ],
  CI: [
    {
      id: 'wave',
      label: 'Wave Money',
      description: 'Paiement instantané',
      icon: '/logo-payments/wave_1.svg',
      timeEstimate: 'Instantané',
    },
    {
      id: 'orange_money',
      label: 'Orange Money',
      description: 'Via code OTP',
      icon: '/logo-payments/om_1.svg',
      timeEstimate: '1-2 min',
    },
  ],
  BK: [
    {
      id: 'wave',
      label: 'Wave Money',
      description: 'Paiement instantané',
      icon: '/logo-payments/wave_1.svg',
      timeEstimate: 'Instantané',
    },
  ],
  ML: [
    {
      id: 'wave',
      label: 'Wave Money',
      description: 'Paiement instantané',
      icon: '/logo-payments/wave_1.svg',
      timeEstimate: 'Instantané',
    },
  ],
  TG: [
    {
      id: 'wave',
      label: 'Wave Money',
      description: 'Paiement instantané',
      icon: '/logo-payments/wave_1.svg',
      timeEstimate: 'Instantané',
    },
  ],
  BJ: [
    {
      id: 'wave',
      label: 'Wave Money',
      description: 'Paiement instantané',
      icon: '/logo-payments/wave_1.svg',
      timeEstimate: 'Instantané',
    },
  ],
}
