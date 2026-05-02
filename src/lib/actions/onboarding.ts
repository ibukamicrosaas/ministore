'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { DEFAULT_OPENING_HOURS, TRIAL_DAYS } from '@/constants'

async function getOwnerContext() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Non authentifié.', userId: null, salonId: null, supabase: null }
  const { data: profile } = await supabase.from('profiles').select('salon_id, role').eq('id', user.id).single()
  return { error: null, userId: user.id, salonId: profile?.salon_id ?? null, supabase }
}

async function getOwnerSalonId() {
  const { error, salonId, supabase } = await getOwnerContext()
  if (error || !salonId || !supabase) return { error: error ?? 'Pas de salon.', salonId: null, supabase: null }
  return { error: null, salonId, supabase }
}

// ── ÉTAPE 1 — Créer le salon avec le nom ──────────────────────────────────────

export async function startOnboarding(name: string): Promise<{ error?: string; slug?: string }> {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  const trimmed = name.trim()
  if (trimmed.length < 2) return { error: 'Le nom doit faire au moins 2 caractères.' }

  // Vérifier qu'il n'a pas déjà un salon
  const { data: existing } = await supabase.from('profiles').select('salon_id').eq('id', user.id).single()
  if (existing?.salon_id) {
    // Le salon existe déjà, récupérer le slug
    const { data: salon } = await supabase.from('salons').select('slug').eq('id', existing.salon_id).single()
    if (salon) {
      await supabase.from('profiles').update({ onboarding_step: 2 }).eq('id', user.id)
      return { slug: salon.slug }
    }
  }

  // Générer un slug unique
  const baseSlug = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)

  let slug = baseSlug
  let attempt = 0
  while (attempt < 10) {
    const { data: exists } = await supabase.from('salons').select('id').eq('slug', slug).single()
    if (!exists) break
    attempt++
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
  }

  const admin = createAdminClient()
  const { data: salon, error: salonError } = await admin
    .from('salons')
    .insert({
      slug,
      name: trimmed,
      opening_hours: DEFAULT_OPENING_HOURS,
      trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id, slug')
    .single()

  if (salonError || !salon) {
    console.error('[startOnboarding]', salonError?.message)
    return { error: 'Impossible de créer le salon. Réessaie.' }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ salon_id: salon.id, role: 'owner', onboarding_step: 2 })
    .eq('id', user.id)

  if (profileError) {
    console.error('[startOnboarding profile]', profileError.message)
    return { error: 'Salon créé mais liaison échouée.' }
  }

  return { slug: salon.slug }
}

// ── ÉTAPE 2 — Type d'activité + spécialité ────────────────────────────────────

export async function saveOnboardingType(input: {
  businessType: 'independent' | 'salon'
  specialty: 'hair' | 'nails' | 'makeup' | 'beauty' | 'fashion' | 'other'
  specialtyCustom?: string
}): Promise<{ error?: string }> {
  const { error: authError, salonId, supabase } = await getOwnerSalonId()
  if (authError || !salonId || !supabase) return { error: authError ?? 'Erreur.' }

  const { error } = await supabase
    .from('salons')
    .update({
      business_type: input.businessType,
      specialty: input.specialty,
      specialty_custom: input.specialtyCustom?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', salonId)

  if (error) {
    console.error('[saveOnboardingType]', error.message)
    return { error: 'Impossible de sauvegarder.' }
  }

  const ctx = await getOwnerContext()
  if (ctx.userId && ctx.supabase) {
    await ctx.supabase.from('profiles').update({ onboarding_step: 3 }).eq('id', ctx.userId)
  }

  return {}
}

// ── ÉTAPE 3 — Informations du salon ───────────────────────────────────────────

export async function saveOnboardingInfo(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase.from('profiles').select('salon_id, role').eq('id', user.id).single()
  if (!profile?.salon_id) return { error: 'Salon introuvable.' }

  const city = (formData.get('city') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() || null
  const whatsapp = (formData.get('whatsapp') as string)?.trim() || null

  const { error } = await supabase
    .from('salons')
    .update({
      ...(city ? { city } : {}),
      ...(description ? { description } : {}),
      ...(whatsapp ? { phone_whatsapp: whatsapp } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.salon_id)

  if (error) {
    console.error('[saveOnboardingInfo]', error.message)
    return { error: 'Impossible de sauvegarder.' }
  }

  // Upload logo si fourni
  const logo = formData.get('logo') as File | null
  if (logo && logo.size > 0) {
    if (logo.size > 2 * 1024 * 1024) return { error: 'Le logo doit faire moins de 2 Mo.' }
    if (!logo.type.startsWith('image/')) return { error: 'Le logo doit être une image.' }

    const ext = logo.name.split('.').pop() ?? 'jpg'
    const path = `${profile.salon_id}/logo.${ext}`
    const admin = createAdminClient()

    const { error: uploadError } = await admin.storage
      .from('salon-logos')
      .upload(path, logo, { upsert: true, contentType: logo.type })

    if (!uploadError) {
      const { data: { publicUrl } } = admin.storage.from('salon-logos').getPublicUrl(path)
      await supabase
        .from('salons')
        .update({ logo_url: publicUrl })
        .eq('id', profile.salon_id)
    }
  }

  await supabase.from('profiles').update({ onboarding_step: 4 }).eq('id', user.id)
  return {}
}

// ── ÉTAPE 4 — Première prestation ────────────────────────────────────────────

export async function saveOnboardingService(input: {
  name: string
  duration_minutes: number
  price: number
}): Promise<{ error?: string }> {
  const { error: authError, salonId, supabase } = await getOwnerSalonId()
  if (authError || !salonId || !supabase) return { error: authError ?? 'Erreur.' }

  if (!input.name.trim()) return { error: 'Le nom de la prestation est obligatoire.' }
  if (input.price < 0) return { error: 'Le prix doit être positif.' }

  const { error } = await supabase.from('services').insert({
    salon_id: salonId,
    name: input.name.trim(),
    duration_minutes: input.duration_minutes,
    price: input.price,
    is_active: true,
  })

  if (error) {
    console.error('[saveOnboardingService]', error.message)
    return { error: 'Impossible de créer la prestation.' }
  }

  const ctx = await getOwnerContext()
  if (ctx.userId && ctx.supabase) {
    await ctx.supabase.from('profiles').update({ onboarding_step: 5 }).eq('id', ctx.userId)
  }
  revalidatePath('/dashboard/services')
  return {}
}

// ── COMPLÉTION ────────────────────────────────────────────────────────────────

export async function completeOnboarding(): Promise<void> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase.from('profiles').select('salon_id').eq('id', user.id).single()
  if (!profile?.salon_id) return

  const now = new Date().toISOString()
  await Promise.all([
    supabase
      .from('salons')
      .update({ onboarding_completed: true, onboarding_completed_at: now })
      .eq('id', profile.salon_id),
    supabase
      .from('profiles')
      .update({ onboarding_step: 5, onboarding_completed: true })
      .eq('id', user.id),
  ])

  revalidatePath('/dashboard')
}

// ── SKIP une étape (3 ou 4) ───────────────────────────────────────────────────

export async function skipOnboardingStep(step: 3 | 4): Promise<{ error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  await supabase
    .from('profiles')
    .update({ onboarding_step: step === 4 ? 5 : step + 1 })
    .eq('id', user.id)
  return {}
}

// ── LEGACY — conservé pour compatibilité ─────────────────────────────────────

export async function onboardingCreateService(input: {
  name: string
  duration_minutes: number
  price: number
}) {
  return saveOnboardingService(input)
}

export async function onboardingCreateStaff(input: {
  first_name: string
  last_name?: string
}) {
  const { error: authError, salonId, supabase } = await getOwnerSalonId()
  if (authError || !salonId || !supabase) return { error: authError ?? 'Erreur.' }

  if (!input.first_name.trim()) return { error: 'Le prénom est obligatoire.' }

  const { error } = await supabase.from('staff').insert({
    salon_id: salonId,
    first_name: input.first_name.trim(),
    last_name: input.last_name?.trim() || '',
    remuneration_type: 'commission',
    commission_rate: 0,
    is_active: true,
  })

  if (error) {
    console.error('[onboardingCreateStaff]', error.message)
    return { error: "Impossible d'ajouter l'employée." }
  }

  revalidatePath('/dashboard/staff')
  return { success: true }
}
