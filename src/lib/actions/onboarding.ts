'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { TRIAL_DAYS } from '@/constants'
import { sendMetaConversionEvent, generateMetaEventId } from '@/lib/meta/conversions-api'
import { getCurrencyForCountry } from '@/lib/utils/country-groups'
import { assertProductLimit } from '@/lib/actions/product-limit'

async function getOwnerContext() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Non authentifié.', userId: null, shopId: null, supabase: null }
  const { data: profile } = await supabase.from('profiles').select('shop_id, role').eq('id', user.id).single()
  return { error: null, userId: user.id, shopId: profile?.shop_id ?? null, supabase }
}

async function getOwnerShopId() {
  const { error, shopId, supabase } = await getOwnerContext()
  if (error || !shopId || !supabase) return { error: error ?? 'Pas de boutique.', shopId: null, supabase: null }
  return { error: null, shopId, supabase }
}

// ── ÉTAPE 1 — Créer la boutique avec le nom ──────────────────────────────────

export async function startOnboarding(name: string, country?: string): Promise<{ error?: string; slug?: string; metaEventId?: string }> {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  const trimmed = name.trim()
  if (trimmed.length < 2) return { error: 'Le nom doit faire au moins 2 caractères.' }

  const { data: existing } = await supabase.from('profiles').select('shop_id').eq('id', user.id).single()
  if (existing?.shop_id) {
    const { data: shop } = await supabase.from('shops').select('slug').eq('id', existing.shop_id).single()
    if (shop) {
      await supabase.from('profiles').update({ onboarding_step: 2 }).eq('id', user.id)
      return { slug: shop.slug }
    }
  }

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
    const { data: exists } = await supabase.from('shops').select('id').eq('slug', slug).single()
    if (!exists) break
    attempt++
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
  }

  const admin = createAdminClient()
  const currency = country ? getCurrencyForCountry(country) : undefined
  const { data: shop, error: shopError } = await admin
    .from('shops')
    .insert({
      slug,
      name: trimmed,
      trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      ...(country ? { country, currency } : {}),
    })
    .select('id, slug')
    .single()

  if (shopError || !shop) {
    console.error('[startOnboarding]', shopError?.message)
    return { error: 'Impossible de créer la boutique. Réessaie.' }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ shop_id: shop.id, role: 'owner', onboarding_step: 2 })
    .eq('id', user.id)

  if (profileError) {
    console.error('[startOnboarding profile]', profileError.message)
    return { error: 'Boutique créée mais liaison échouée.' }
  }

  const metaEventId = generateMetaEventId()
  await sendMetaConversionEvent({
    eventName: 'Lead',
    eventId: metaEventId,
    phone: user.user_metadata?.phone,
    externalId: user.id,
  })

  return { slug: shop.slug, metaEventId }
}

// ── ÉTAPE 2 — Type d'activité + spécialité ────────────────────────────────────

export async function saveOnboardingType(input: {
  businessType: string
  specialty: string
  specialtyCustom?: string
}): Promise<{ error?: string }> {
  const { error: authError, shopId, supabase } = await getOwnerShopId()
  if (authError || !shopId || !supabase) return { error: authError ?? 'Erreur.' }

  const { error } = await supabase
    .from('shops')
    .update({
      business_type: input.businessType,
      specialty: input.specialty,
      specialty_custom: input.specialtyCustom?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shopId)

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

// ── ÉTAPE 3 — Informations de la boutique ─────────────────────────────────────

export async function saveOnboardingInfo(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase.from('profiles').select('shop_id, role').eq('id', user.id).single()
  if (!profile?.shop_id) return { error: 'Boutique introuvable.' }

  const city        = (formData.get('city') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() || null
  const whatsapp    = (formData.get('whatsapp') as string)?.trim() || null

  const { error } = await supabase
    .from('shops')
    .update({
      ...(city        ? { city }                        : {}),
      ...(description ? { description }                 : {}),
      ...(whatsapp    ? { phone_whatsapp: whatsapp }    : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.shop_id)

  if (error) {
    console.error('[saveOnboardingInfo]', error.message)
    return { error: 'Impossible de sauvegarder.' }
  }

  const logo = formData.get('logo') as File | null
  if (logo && logo.size > 0) {
    if (logo.size > 2 * 1024 * 1024) return { error: 'Le logo doit faire moins de 2 Mo.' }
    if (!logo.type.startsWith('image/')) return { error: 'Le logo doit être une image.' }

    const ext = logo.name.split('.').pop() ?? 'jpg'
    const path = `${profile.shop_id}/logo.${ext}`
    const admin = createAdminClient()

    const { error: uploadError } = await admin.storage
      .from('shop-logos')
      .upload(path, logo, { upsert: true, contentType: logo.type })

    if (!uploadError) {
      const { data: { publicUrl } } = admin.storage.from('shop-logos').getPublicUrl(path)
      await supabase
        .from('shops')
        .update({ logo_url: publicUrl })
        .eq('id', profile.shop_id)
    }
  }

  await supabase.from('profiles').update({ onboarding_step: 4 }).eq('id', user.id)
  return {}
}

// ── ÉTAPE 4 — Premier produit ─────────────────────────────────────────────────

export async function saveOnboardingProduct(input: {
  name: string
  price: number
  description?: string
  photo_url?: string
}): Promise<{ error?: string }> {
  const { error: authError, shopId, supabase } = await getOwnerShopId()
  if (authError || !shopId || !supabase) return { error: authError ?? 'Erreur.' }

  if (!input.name.trim()) return { error: 'Le nom du produit est obligatoire.' }
  if (input.price < 0) return { error: 'Le prix doit être positif.' }

  const limitCheck = await assertProductLimit(shopId, 1)
  if (limitCheck.error) return { error: limitCheck.error }

  // Quand une photo est fournie, on la place dans photos[] ET photo_url
  // (le dashboard lit photos[], le mini-site lit les deux)
  const photoEntry = input.photo_url
    ? [{ url: input.photo_url, is_primary: true }]
    : []

  const { error } = await supabase.from('products').insert({
    shop_id: shopId,
    name: input.name.trim(),
    price: input.price,
    description: input.description?.trim() || null,
    photo_url: input.photo_url ?? null,
    photos: photoEntry,
    is_active: true,
  })

  if (error) {
    console.error('[saveOnboardingProduct]', error.message)
    return { error: 'Impossible de créer le produit.' }
  }

  const ctx = await getOwnerContext()
  if (ctx.userId && ctx.supabase) {
    await ctx.supabase.from('profiles').update({ onboarding_step: 5 }).eq('id', ctx.userId)
  }
  revalidatePath('/dashboard/products')
  return {}
}

// ── COMPLÉTION ────────────────────────────────────────────────────────────────

export async function completeOnboarding(): Promise<{ metaEventId?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data: profile } = await supabase.from('profiles').select('shop_id').eq('id', user.id).single()
  if (!profile?.shop_id) return {}

  const now = new Date().toISOString()
  await Promise.all([
    supabase
      .from('shops')
      .update({ onboarding_completed: true, onboarding_completed_at: now })
      .eq('id', profile.shop_id),
    supabase
      .from('profiles')
      .update({ onboarding_step: 5, onboarding_completed: true })
      .eq('id', user.id),
  ])

  const metaEventId = generateMetaEventId()
  await sendMetaConversionEvent({
    eventName: 'CompleteRegistration',
    eventId: metaEventId,
    phone: user.user_metadata?.phone,
    externalId: user.id,
  })

  revalidatePath('/dashboard')
  return { metaEventId }
}

// ── SKIP une étape ────────────────────────────────────────────────────────────

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
