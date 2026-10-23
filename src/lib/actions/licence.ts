'use server'

import { createHmac } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendLicenceApplicationEmail } from '@/lib/notifications/email'
import {
  OTHER_COUNTRY_VALUE,
  validateLicenceApplicationInput,
} from '@/app/licence/application-validation'
import { WAITLIST_COUNTRIES, WAITLIST_SUFFIX, OPEN_COUNTRIES } from '@/app/licence/prices'
import { headers } from 'next/headers'

const NOTIFY_EMAIL = 'ibuka.ndjoli@gmail.com'

interface LicenceApplicationInput {
  country: string
  otherCountry?: string
  fullName: string
  whatsappPhone: string
  email: string
  experience: string
  acquisitionPlan: string
  financing: string
}

const ALLOWED_COUNTRIES = [
  ...OPEN_COUNTRIES.map(country => country.name),
  ...WAITLIST_COUNTRIES.map(country => `${country.name}${WAITLIST_SUFFIX}`),
  OTHER_COUNTRY_VALUE,
]

export async function submitLicenceApplication(
  input: LicenceApplicationInput,
): Promise<{ error?: string }> {
  const validation = validateLicenceApplicationInput(input, ALLOWED_COUNTRIES)
  if ('error' in validation) return validation

  const { country, fullName, whatsappPhone, email, experience, acquisitionPlan: acquisitionPlanText, financing } = validation.data

  // Pas de colonne dédiée : le financement reste ajouté à acquisition_plan pour
  // garder la compatibilité avec les candidatures déjà enregistrées.
  const acquisitionPlan = `${acquisitionPlanText}\n\nFinancement : ${financing}`
  const admin = createAdminClient()

  // Vercel fournit x-real-ip. Sans cette valeur, regrouper les demandes sous
  // « unknown » plutôt que d'accepter une IP de x-forwarded-for falsifiable.
  const requestHeaders = await headers()
  const ip = (requestHeaders.get('x-real-ip')?.trim() || 'unknown').slice(0, 64)
  const ipHash = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '')
    .update(ip)
    .digest('hex')
  const { data: rateLimitAllowed, error: rateLimitError } = await admin.rpc(
    'try_consume_licence_application_slot',
    { p_ip_hash: ipHash },
  )

  if (rateLimitError) {
    console.error('[submitLicenceApplication] rate limit failed:', rateLimitError.message)
    return { error: 'Le formulaire est momentanément indisponible. Réessaie plus tard.' }
  }
  if (!rateLimitAllowed) {
    return { error: 'Trop de tentatives. Réessaie dans une heure.' }
  }

  const { error } = await admin.from('licence_applications' as never).insert({
    country,
    full_name: fullName,
    whatsapp_phone: whatsappPhone,
    email,
    experience,
    acquisition_plan: acquisitionPlan,
  } as never)

  if (error) {
    console.error('[submitLicenceApplication]', error.message)
    return { error: 'Impossible d\'envoyer ta candidature. Réessaie.' }
  }

  await sendLicenceApplicationEmail({
    toEmail: NOTIFY_EMAIL,
    country,
    fullName,
    whatsappPhone,
    email,
    experience,
    acquisitionPlan,
  })

  return {}
}
