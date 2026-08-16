'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendLicenceApplicationEmail } from '@/lib/notifications/email'
import { headers } from 'next/headers'

const NOTIFY_EMAIL = 'ibuka.ndjoli@gmail.com'

interface LicenceApplicationInput {
  country:          string
  fullName:         string
  whatsappPhone:    string
  email:            string
  experience:       string
  acquisitionPlan:  string
}

export async function submitLicenceApplication(
  input: LicenceApplicationInput,
): Promise<{ error?: string }> {
  const country         = input.country?.trim()
  const fullName        = input.fullName?.trim()
  const whatsappPhone   = input.whatsappPhone?.trim()
  const email           = input.email?.trim()
  const experience      = input.experience?.trim()
  const acquisitionPlan = input.acquisitionPlan?.trim()

  if (!country || !fullName || !whatsappPhone || !email || !experience || !acquisitionPlan) {
    return { error: 'Tous les champs sont requis.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Adresse e-mail invalide.' }
  }

  const admin = createAdminClient()

  // Rate limiting basique par IP — même table que checkRateLimit (lib/rate-limit.ts),
  // réimplémenté ici : ce helper attend un NextRequest de route handler, indisponible
  // dans une Server Action (seul `headers()` l'est).
  const h  = await headers()
  const ip = (h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',').at(-1)?.trim() ?? 'unknown').slice(0, 64)
  const identifier  = `licence:${ip}`
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentAttempts } = await admin
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('attempt_type', 'licence')
    .gte('attempted_at', windowStart)
  if ((recentAttempts ?? 0) >= 5) {
    return { error: 'Trop de tentatives. Réessaie dans une heure.' }
  }
  void admin.from('login_attempts').insert({ identifier, attempt_type: 'licence', success: true })

  const { error } = await admin.from('licence_applications' as never).insert({
    country,
    full_name:        fullName,
    whatsapp_phone:   whatsappPhone,
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
