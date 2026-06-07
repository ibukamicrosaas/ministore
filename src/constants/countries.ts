export const COUNTRIES = [
  { code: 'SN', label: 'Sénégal' },
  { code: 'CI', label: 'Côte d\'Ivoire' },
  { code: 'BK', label: 'Burkina Faso' },
  { code: 'ML', label: 'Mali' },
  { code: 'TG', label: 'Togo' },
  { code: 'BJ', label: 'Bénin' },
] as const

export type CountryCode = typeof COUNTRIES[number]['code']
