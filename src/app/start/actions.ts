'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { TRIAL_DAYS } from '@/constants'
import { getCurrencyForCountry } from '@/lib/utils/country-groups'
import { sendMetaConversionEvent, generateMetaEventId } from '@/lib/meta/conversions-api'
import { CAT_TO_SPECIALTY } from './data'

function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `${digits}@beautydesk.app`
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.startsWith('00') ? `+${digits.slice(2)}` : `+${digits}`
}

export async function signUpFromStart(input: {
  phone:    string
  pin:      string
  name:     string
  country:  string  // QuizPays: 'SN' | 'CI' | 'BJ' | 'TG' | 'ML' | 'BF'
  category: string  // QuizCat
  painPoint: string // QuizDouleur
}): Promise<{ error?: string }> {
  const { phone, pin, name, country, category } = input

  if (!phone?.trim() || !pin?.trim()) return { error: 'Numéro et code PIN requis.' }
  if (!/^\d{6}$/.test(pin))           return { error: 'Le code PIN doit contenir 6 chiffres.' }
  if (!name?.trim() || name.trim().length < 2) return { error: 'Nom de boutique trop court.' }

  const admin           = createAdminClient()
  const normalizedPhone = normalizePhone(phone)
  const email           = phoneToEmail(phone)

  // Rate limit : max 3 créations par numéro par heure
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: signupCount } = await admin
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', email)
    .eq('attempt_type', 'signup')
    .gte('attempted_at', windowStart)

  if ((signupCount ?? 0) >= 3) {
    return { error: 'Trop de tentatives. Réessayez dans 1 heure.' }
  }

  const supabase = await createServerClient()

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password: pin,
    options: { data: { phone: normalizedPhone } },
  })

  void admin.from('login_attempts').insert({ identifier: email, attempt_type: 'signup', success: !signUpError })

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes('already registered')) {
      return { error: 'Un compte existe déjà avec ce numéro. Connecte-toi depuis la page d\'accueil.' }
    }
    return { error: 'Impossible de créer le compte. Réessaie.' }
  }

  if (!data.user) return { error: 'Erreur lors de la création du compte.' }

  const userId  = data.user.id
  const trimmed = name.trim()

  // Profil : phone + role
  await supabase
    .from('profiles')
    .update({ phone: normalizedPhone, role: 'owner' })
    .eq('id', userId)

  // Slug unique pour la boutique
  const baseSlug = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'boutique'

  let slug    = baseSlug
  let attempt = 0
  while (attempt < 10) {
    const { data: exists } = await admin.from('shops').select('id').eq('slug', slug).single()
    if (!exists) break
    attempt++
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
  }

  const specialty = (CAT_TO_SPECIALTY as Record<string, string>)[category] ?? 'other'
  const currency  = getCurrencyForCountry(country)

  const { data: shop, error: shopError } = await admin
    .from('shops')
    .insert({
      slug,
      name:                    trimmed,
      country,
      currency,
      business_type:           'individual',
      specialty,
      phone_whatsapp:          normalizedPhone,
      trial_ends_at:           new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      onboarding_completed:    true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .select('id, slug')
    .single()

  if (shopError || !shop) {
    console.error('[signUpFromStart shop]', shopError?.message)
    return { error: 'Impossible de créer la boutique. Réessaie.' }
  }

  // Lier la boutique au profil + marquer l'onboarding terminé
  await supabase
    .from('profiles')
    .update({ shop_id: shop.id, onboarding_step: 5, onboarding_completed: true })
    .eq('id', userId)

  // Événements Meta (Lead + CompleteRegistration)
  await Promise.all([
    sendMetaConversionEvent({ eventName: 'Lead',                 eventId: generateMetaEventId(), phone: normalizedPhone, externalId: userId }),
    sendMetaConversionEvent({ eventName: 'CompleteRegistration', eventId: generateMetaEventId(), phone: normalizedPhone, externalId: userId }),
  ])

  redirect('/dashboard?welcome=start')
}
