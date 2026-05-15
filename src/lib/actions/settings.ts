'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { TRIAL_DAYS } from '@/constants'
import { encryptApiKey } from '@/lib/crypto/encrypt'
import type { UpdateShopInput } from '@/types'

export async function uploadShopLogo(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') return { error: 'Accès non autorisé.' }

  const file = formData.get('logo') as File | null
  if (!file || file.size === 0) return { error: 'Aucun fichier sélectionné.' }
  if (file.size > 2 * 1024 * 1024) return { error: 'Le fichier doit faire moins de 2 Mo.' }
  if (!file.type.startsWith('image/')) return { error: 'Le fichier doit être une image.' }

  const ALLOWED_MIME: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  }
  const ext = ALLOWED_MIME[file.type]
  if (!ext) return { error: 'Format non autorisé. Utilise JPG, PNG ou WebP.' }

  // Timestamp dans le path pour invalider le cache CDN à chaque upload
  const path = `${profile.shop_id}/logo-${Date.now()}.${ext}`
  const admin = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from('shop-logos')
    .upload(path, file, { upsert: false, contentType: file.type })

  if (uploadError) {
    console.error('[uploadShopLogo]', uploadError.message)
    return { error: 'Impossible de télécharger le logo.' }
  }

  const { data: { publicUrl } } = admin.storage.from('shop-logos').getPublicUrl(path)

  // Récupérer le slug pour revalider la page publique
  const { data: shopData } = await supabase.from('shops').select('slug').eq('id', profile.shop_id).single()

  const { error: updateError } = await supabase
    .from('shops')
    .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', profile.shop_id)

  if (updateError) {
    console.error('[uploadShopLogo update]', updateError.message)
    return { error: 'Logo téléchargé mais mise à jour échouée.' }
  }

  revalidatePath('/dashboard/settings')
  if (shopData?.slug) revalidatePath(`/${shopData.slug}`)
  return { success: true, url: publicUrl }
}

export async function createShop(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Non authentifié.' }
  }

  const name = (formData.get('name') as string)?.trim()
  const city = (formData.get('city') as string)?.trim()
  const phoneWhatsapp = (formData.get('phone_whatsapp') as string)?.trim()
  const country = (formData.get('country') as string)?.trim() || 'SN'

  if (!name || !city || !phoneWhatsapp) {
    return { error: 'Le nom de la boutique, la ville et le numéro WhatsApp sont obligatoires.' }
  }

  const baseSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)

  let slug = baseSlug
  let attempt = 0
  while (attempt < 10) {
    const { data: existing } = await supabase
      .from('shops')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!existing) break
    attempt++
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
  }

  const admin = createAdminClient()
  const { data: shop, error } = await admin
    .from('shops')
    .insert({
      slug,
      name,
      city,
      country,
      phone_whatsapp: phoneWhatsapp,
      trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createShop]', error.message)
    return { error: 'Impossible de créer la boutique. Réessaie.' }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ shop_id: shop.id, role: 'owner' })
    .eq('id', user.id)

  if (profileError) {
    console.error('[createShop profile]', profileError.message)
    return { error: 'Boutique créée mais liaison au profil échouée.' }
  }

  redirect('/onboarding/setup')
}

export async function updateShopSlug(newSlug: string): Promise<{ error?: string; slug?: string }> {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') return { error: 'Accès non autorisé.' }

  // Sanitiser le slug
  const sanitized = newSlug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)

  if (!sanitized || sanitized.length < 2) return { error: "L'URL doit contenir au moins 2 caractères." }

  // Récupérer l'ancien slug pour revalider
  const { data: shopMeta } = await supabase.from('shops').select('slug').eq('id', profile.shop_id).single()
  const oldSlug = shopMeta?.slug

  if (sanitized === oldSlug) return { slug: sanitized }

  // Vérifier l'unicité
  const { data: existing } = await supabase.from('shops').select('id').eq('slug', sanitized).single()
  if (existing) return { error: 'Cette URL est déjà utilisée. Choisis-en une autre.' }

  const { error } = await supabase
    .from('shops')
    .update({ slug: sanitized, updated_at: new Date().toISOString() })
    .eq('id', profile.shop_id)

  if (error) {
    console.error('[updateShopSlug]', error.message)
    return { error: "Impossible de modifier l'URL." }
  }

  revalidatePath('/dashboard/settings')
  if (oldSlug) revalidatePath(`/${oldSlug}`)
  revalidatePath(`/${sanitized}`)
  return { slug: sanitized }
}

export async function updateShop(data: UpdateShopInput) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Non authentifié.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') {
    return { error: 'Accès non autorisé.' }
  }

  // Récupérer le slug pour revalider la page publique
  const { data: shopMeta } = await supabase.from('shops').select('slug').eq('id', profile.shop_id).single()

  // Chiffrer les clés Bictorys avant de les écrire en DB
  const payload: Record<string, unknown> = { ...data as Record<string, unknown> }
  if (typeof payload.bictorys_secret_key === 'string' && payload.bictorys_secret_key) {
    payload.bictorys_secret_key = encryptApiKey(payload.bictorys_secret_key)
  }
  if (typeof payload.bictorys_webhook_secret === 'string' && payload.bictorys_webhook_secret) {
    payload.bictorys_webhook_secret = encryptApiKey(payload.bictorys_webhook_secret)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('shops')
    .update({ ...(payload as any), updated_at: new Date().toISOString() })
    .eq('id', profile.shop_id)

  if (error) {
    console.error('[updateShop]', error.message)
    return { error: 'Impossible de mettre à jour la boutique.' }
  }

  revalidatePath('/dashboard/settings')
  if (shopMeta?.slug) revalidatePath(`/${shopMeta.slug}`)
  return { success: true }
}
