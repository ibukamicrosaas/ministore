'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TRIAL_DAYS } from '@/constants'
import { getCurrencyForCountry } from '@/lib/utils/country-groups'
import { sendMetaConversionEvent, generateMetaEventId } from '@/lib/meta/conversions-api'
import { CAT_TO_SPECIALTY, makeSlug, type QuizCat, type QuizPays, type Segment, type Canal, type QuizBlocage } from './data'

type AdminClient = ReturnType<typeof createAdminClient>

function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `${digits}@beautydesk.app`
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.startsWith('00') ? `+${digits.slice(2)}` : `+${digits}`
}

// N'considère que les boutiques non-brouillon comme "prises" — cohérent avec
// l'index unique partiel shops_slug_unique_non_draft (migration 070) : un
// brouillon abandonné ne doit jamais bloquer le nom pour quelqu'un d'autre.
async function generateUniqueShopSlug(admin: AdminClient, base: string): Promise<string> {
  let slug = base
  let attempt = 0
  while (attempt < 10) {
    const { data: exists } = await admin.from('shops').select('id').eq('slug', slug).neq('status', 'draft').maybeSingle()
    if (!exists) return slug
    attempt++
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`
  }
  return `${base}-${Date.now()}`
}

interface ShopSegmentation {
  category:        QuizCat
  specialtyOther?: string
  country:         QuizPays
  sellerStage:     Segment
  sellingChannel:  Canal
  painPoint?:      QuizBlocage
}

/**
 * Écran 7 (construction) : crée une boutique en brouillon dès que le quiz est
 * terminé, avant même que le marchand ait un compte. Permet de récupérer un
 * parcours abandonné entre l'écran 7 et l'écran 9 (même session navigateur).
 */
export async function createDraftShop(
  input: ShopSegmentation & { name: string },
): Promise<{ shopId?: string; slug?: string; error?: string }> {
  const trimmed = input.name.trim()
  if (trimmed.length < 2) return { error: 'Nom de boutique trop court.' }

  const admin = createAdminClient()
  const slug = await generateUniqueShopSlug(admin, makeSlug(trimmed))
  const specialty = CAT_TO_SPECIALTY[input.category] ?? 'other'
  const currency = getCurrencyForCountry(input.country)

  const { data: shop, error } = await admin
    .from('shops')
    .insert({
      slug,
      name: trimmed,
      country: input.country,
      currency,
      status: 'draft',
      is_active: false, // ceinture et bretelles : shops_public_read exclut déjà status='draft'
      business_type: 'individual',
      specialty,
      specialty_other: input.category === 'autre' ? (input.specialtyOther?.trim() || null) : null,
      seller_stage: input.sellerStage,
      selling_channel: input.sellingChannel,
      pain_point: input.painPoint,
    })
    .select('id, slug')
    .single()

  if (error || !shop) {
    console.error('[createDraftShop]', error?.message)
    return { error: 'Impossible de créer la boutique.' }
  }
  return { shopId: shop.id, slug: shop.slug }
}

/**
 * Rattache le compte à un brouillon existant s'il est encore valide, sinon crée
 * la boutique directement (parcours de secours si le brouillon a échoué ou expiré).
 *
 * Reste en status='draft' dans les deux cas : une boutique sans produit n'est
 * jamais publique. Le passage à 'trial' (et l'activation) n'a lieu qu'à la
 * publication du premier produit — voir activateTrialShop, appelée à l'écran 10.
 */
async function resolveShop(
  admin: AdminClient,
  draftShopId: string | null | undefined,
  trimmedName: string,
  normalizedPhone: string,
  seg: ShopSegmentation,
): Promise<{ id: string; slug: string } | { error: string }> {
  if (draftShopId) {
    const { data: draft } = await admin
      .from('shops')
      .select('id, slug')
      .eq('id', draftShopId)
      .eq('status', 'draft')
      .maybeSingle()

    if (draft) {
      const { data: updated, error } = await admin
        .from('shops')
        .update({
          name: trimmedName,
          phone_whatsapp: normalizedPhone,
        })
        .eq('id', draft.id)
        .select('id, slug')
        .single()

      if (!error && updated) return { id: updated.id, slug: updated.slug }
    }
  }

  // Brouillon introuvable/déjà récupéré/jamais créé : on crée la boutique maintenant,
  // toujours en brouillon — même logique que createDraftShop.
  const slug = await generateUniqueShopSlug(admin, makeSlug(trimmedName))
  const specialty = CAT_TO_SPECIALTY[seg.category] ?? 'other'
  const currency = getCurrencyForCountry(seg.country)

  const { data: created, error } = await admin
    .from('shops')
    .insert({
      slug,
      name: trimmedName,
      country: seg.country,
      currency,
      status: 'draft',
      is_active: false,
      business_type: 'individual',
      specialty,
      specialty_other: seg.category === 'autre' ? (seg.specialtyOther?.trim() || null) : null,
      seller_stage: seg.sellerStage,
      selling_channel: seg.sellingChannel,
      pain_point: seg.painPoint,
      phone_whatsapp: normalizedPhone,
    })
    .select('id, slug')
    .single()

  if (error || !created) {
    console.error('[resolveShop]', error?.message)
    return { error: 'Impossible de créer la boutique. Réessaie.' }
  }
  return { id: created.id, slug: created.slug }
}

/**
 * Écran 10 (premier produit) : bascule la boutique de 'draft' à 'trial' et
 * l'active publiquement — seulement une fois qu'elle a quelque chose à vendre.
 * Dérive la boutique de la session (comme getOwnerShopId dans lib/actions/products),
 * jamais d'un id transmis par le client.
 */
export async function activateTrialShop(): Promise<{ error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()
  if (!profile?.shop_id) return { error: 'Boutique introuvable.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('shops')
    .update({
      status: 'trial',
      is_active: true,
      trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', profile.shop_id)
    .eq('status', 'draft') // n'écrase pas une boutique déjà active (idempotent)

  if (error) {
    console.error('[activateTrialShop]', error.message)
    return { error: "Impossible d'activer la boutique." }
  }
  return {}
}

/**
 * Écran 9 (compte) : crée le compte auth + récupère/rattache la boutique.
 * Ne redirige pas — le parcours continue vers l'écran 10 (premier produit)
 * puis 11 (boutique en ligne) côté client.
 */
export async function completeSignupFromStart(input: ShopSegmentation & {
  phone:       string
  pin:         string
  name:        string
  draftShopId?: string | null
}): Promise<{ error?: string; shopId?: string; slug?: string }> {
  const { phone, pin, name } = input

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

  await supabase
    .from('profiles')
    .update({ phone: normalizedPhone, role: 'owner' })
    .eq('id', userId)

  const shopResult = await resolveShop(admin, input.draftShopId, trimmed, normalizedPhone, input)
  if ('error' in shopResult) return { error: shopResult.error }
  const { id: shopId, slug: shopSlug } = shopResult

  await supabase
    .from('profiles')
    .update({ shop_id: shopId, onboarding_step: 5, onboarding_completed: true })
    .eq('id', userId)

  await Promise.all([
    sendMetaConversionEvent({ eventName: 'Lead',                 eventId: generateMetaEventId(), phone: normalizedPhone, externalId: userId }),
    sendMetaConversionEvent({ eventName: 'CompleteRegistration', eventId: generateMetaEventId(), phone: normalizedPhone, externalId: userId }),
  ])

  return { shopId, slug: shopSlug }
}

/** Écran 4bis : liste d'attente pour un pays non encore couvert. */
export async function joinWaitlist(input: { country: string; phone: string }): Promise<{ error?: string; success?: boolean }> {
  const country = input.country.trim()
  const phone   = input.phone.trim()

  if (country.length < 2) return { error: 'Indique ton pays.' }
  if (phone.replace(/\D/g, '').length < 6) return { error: 'Numéro invalide.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('waitlist')
    .upsert({ country, phone, source: 'start_flow' }, { onConflict: 'phone,country', ignoreDuplicates: true })

  if (error) {
    console.error('[joinWaitlist]', error.message)
    return { error: "Impossible d'enregistrer ta demande. Réessaie." }
  }
  return { success: true }
}
