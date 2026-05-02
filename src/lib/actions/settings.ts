'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { DEFAULT_OPENING_HOURS, TRIAL_DAYS } from '@/constants'
import type { UpdateSalonInput } from '@/types'

export async function uploadSalonLogo(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.salon_id || profile.role !== 'owner') return { error: 'Accès non autorisé.' }

  const file = formData.get('logo') as File | null
  if (!file || file.size === 0) return { error: 'Aucun fichier sélectionné.' }
  if (file.size > 2 * 1024 * 1024) return { error: 'Le fichier doit faire moins de 2 Mo.' }
  if (!file.type.startsWith('image/')) return { error: 'Le fichier doit être une image.' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${profile.salon_id}/logo.${ext}`
  const admin = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from('salon-logos')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    console.error('[uploadSalonLogo]', uploadError.message)
    return { error: 'Impossible de télécharger le logo.' }
  }

  const { data: { publicUrl } } = admin.storage.from('salon-logos').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('salons')
    .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', profile.salon_id)

  if (updateError) {
    console.error('[uploadSalonLogo update]', updateError.message)
    return { error: 'Logo téléchargé mais mise à jour échouée.' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true, url: publicUrl }
}

export async function createSalon(formData: FormData) {
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
    return { error: 'Le nom du salon, la ville et le numéro WhatsApp sont obligatoires.' }
  }

  // Générer un slug unique depuis le nom
  const baseSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)

  // Vérifier l'unicité du slug
  let slug = baseSlug
  let attempt = 0
  while (attempt < 10) {
    const { data: existing } = await supabase
      .from('salons')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!existing) break
    attempt++
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
  }

  const admin = createAdminClient()
  const { data: salon, error } = await admin
    .from('salons')
    .insert({
      slug,
      name,
      city,
      country,
      phone_whatsapp: phoneWhatsapp,
      opening_hours: DEFAULT_OPENING_HOURS,
      trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createSalon]', error.message)
    return { error: 'Impossible de créer le salon. Réessaie.' }
  }

  // Lier le profil au salon
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ salon_id: salon.id, role: 'owner' })
    .eq('id', user.id)

  if (profileError) {
    console.error('[createSalon profile]', profileError.message)
    return { error: 'Salon créé mais liaison au profil échouée.' }
  }

  redirect('/onboarding/setup')
}

export async function updateSalon(data: UpdateSalonInput) {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Non authentifié.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.salon_id || profile.role !== 'owner') {
    return { error: 'Accès non autorisé.' }
  }

  const { opening_hours, ...rest } = data
  const { error } = await supabase
    .from('salons')
    .update({
      ...rest,
      ...(opening_hours !== undefined ? { opening_hours: opening_hours as import('@/types/database').Json } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.salon_id)

  if (error) {
    console.error('[updateSalon]', error.message)
    return { error: 'Impossible de mettre à jour le salon.' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
