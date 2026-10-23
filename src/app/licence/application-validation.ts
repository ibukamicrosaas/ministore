export const OTHER_COUNTRY_VALUE = 'Autre pays (à préciser ci-dessous)'

export const LICENCE_APPLICATION_LIMITS = {
  country: 100,
  otherCountry: 80,
  fullName: 120,
  whatsappPhone: 40,
  email: 254,
  experience: 4000,
  acquisitionPlan: 4000,
  financing: 2000,
} as const

export interface ValidatedLicenceApplication {
  country: string
  fullName: string
  whatsappPhone: string
  email: string
  experience: string
  acquisitionPlan: string
  financing: string
}

export type LicenceApplicationValidation =
  | { data: ValidatedLicenceApplication }
  | { error: string }

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/

/** Validate untrusted Server Action input before it reaches Supabase or email. */
export function validateLicenceApplicationInput(
  input: unknown,
  allowedCountries: readonly string[],
): LicenceApplicationValidation {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { error: 'Formulaire invalide. Vérifiez les informations saisies.' }
  }

  const record = input as Record<string, unknown>
  const read = (key: string, label: string, max: number): string | { error: string } => {
    const raw = record[key]
    if (typeof raw !== 'string') return { error: `Le champ « ${label} » est requis.` }
    const value = raw.trim()
    if (!value) return { error: `Le champ « ${label} » est requis.` }
    if (value.length > max) return { error: `Le champ « ${label} » est trop long (maximum ${max} caractères).` }
    return value
  }

  const countryResult = read('country', 'Pays', LICENCE_APPLICATION_LIMITS.country)
  if (typeof countryResult !== 'string') return countryResult
  if (!allowedCountries.includes(countryResult)) {
    return { error: 'Choisissez un pays proposé dans la liste.' }
  }

  let country = countryResult
  if (countryResult === OTHER_COUNTRY_VALUE) {
    const otherCountryResult = read('otherCountry', 'Pays à préciser', LICENCE_APPLICATION_LIMITS.otherCountry)
    if (typeof otherCountryResult !== 'string') return otherCountryResult
    if (CONTROL_CHARACTERS.test(otherCountryResult)) {
      return { error: 'Le nom du pays contient des caractères non valides.' }
    }
    country = `Autre pays : ${otherCountryResult}`
  }

  const fullName = read('fullName', 'Nom complet', LICENCE_APPLICATION_LIMITS.fullName)
  if (typeof fullName !== 'string') return fullName
  if (CONTROL_CHARACTERS.test(fullName)) return { error: 'Le nom contient des caractères non valides.' }

  const whatsappPhone = read('whatsappPhone', 'Numéro WhatsApp', LICENCE_APPLICATION_LIMITS.whatsappPhone)
  if (typeof whatsappPhone !== 'string') return whatsappPhone
  if (CONTROL_CHARACTERS.test(whatsappPhone)) return { error: 'Le numéro WhatsApp contient des caractères non valides.' }

  const email = read('email', 'Adresse e-mail', LICENCE_APPLICATION_LIMITS.email)
  if (typeof email !== 'string') return email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Adresse e-mail invalide.' }
  }

  const experience = read('experience', 'Parcours', LICENCE_APPLICATION_LIMITS.experience)
  if (typeof experience !== 'string') return experience

  const acquisitionPlan = read('acquisitionPlan', 'Plan d’acquisition', LICENCE_APPLICATION_LIMITS.acquisitionPlan)
  if (typeof acquisitionPlan !== 'string') return acquisitionPlan

  const financing = read('financing', 'Financement', LICENCE_APPLICATION_LIMITS.financing)
  if (typeof financing !== 'string') return financing

  return {
    data: { country, fullName, whatsappPhone, email, experience, acquisitionPlan, financing },
  }
}
