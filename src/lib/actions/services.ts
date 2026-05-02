'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { CreateServiceInput, UpdateServiceInput } from '@/types'

async function getOwnerSalonId() {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Non authentifié.' as string, salonId: null, supabase: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.salon_id || profile.role !== 'owner') {
    return { error: 'Accès non autorisé.', salonId: null, supabase: null }
  }

  return { error: null, salonId: profile.salon_id, supabase }
}

export async function createService(input: CreateServiceInput) {
  const { error: authError, salonId, supabase } = await getOwnerSalonId()
  if (authError || !salonId || !supabase) return { error: authError ?? 'Erreur.' }

  if (!input.name?.trim()) return { error: 'Le nom du service est obligatoire.' }
  if (!input.price || input.price < 0) return { error: 'Le prix doit être positif.' }
  if (!input.duration_minutes || input.duration_minutes <= 0) return { error: 'La durée doit être positive.' }

  const { data, error } = await supabase
    .from('services')
    .insert({ ...input, salon_id: salonId })
    .select('id')
    .single()

  if (error) {
    console.error('[createService]', error.message)
    return { error: 'Impossible de créer le service.' }
  }

  revalidatePath('/dashboard/services')
  return { id: data.id }
}

export async function updateService(id: string, input: UpdateServiceInput) {
  const { error: authError, salonId, supabase } = await getOwnerSalonId()
  if (authError || !salonId || !supabase) return { error: authError ?? 'Erreur.' }

  const { error } = await supabase
    .from('services')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('salon_id', salonId)

  if (error) {
    console.error('[updateService]', error.message)
    return { error: 'Impossible de mettre à jour le service.' }
  }

  revalidatePath('/dashboard/services')
  revalidatePath(`/dashboard/services/${id}`)
  return { success: true }
}

export async function deleteService(id: string) {
  const { error: authError, salonId, supabase } = await getOwnerSalonId()
  if (authError || !salonId || !supabase) return { error: authError ?? 'Erreur.' }

  const { error } = await supabase
    .from('services')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('salon_id', salonId)

  if (error) {
    console.error('[deleteService]', error.message)
    return { error: 'Impossible de désactiver la prestation.' }
  }

  revalidatePath('/dashboard/services')
  return { success: true }
}

export async function hardDeleteService(id: string) {
  const { error: authError, salonId, supabase } = await getOwnerSalonId()
  if (authError || !salonId || !supabase) return { error: authError ?? 'Erreur.' }

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('salon_id', salonId)

  if (error) {
    console.error('[hardDeleteService]', error.message)
    return { error: 'Impossible de supprimer la prestation.' }
  }

  revalidatePath('/dashboard/services')
  return { success: true }
}

export async function uploadServicePhoto(serviceId: string, formData: FormData) {
  const { error: authError, salonId, supabase } = await getOwnerSalonId()
  if (authError || !salonId || !supabase) return { error: authError ?? 'Erreur.' }

  const file = formData.get('photo') as File | null
  if (!file || file.size === 0) return { error: 'Aucun fichier sélectionné.' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Le fichier doit faire moins de 5 Mo.' }
  if (!file.type.startsWith('image/')) return { error: 'Le fichier doit être une image.' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${salonId}/${serviceId}.${ext}`
  const admin = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from('service-photos')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    console.error('[uploadServicePhoto]', uploadError.message)
    return { error: 'Impossible de télécharger la photo.' }
  }

  const { data: { publicUrl } } = admin.storage.from('service-photos').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('services')
    .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', serviceId)
    .eq('salon_id', salonId)

  if (updateError) {
    console.error('[uploadServicePhoto update]', updateError.message)
    return { error: 'Photo téléchargée mais mise à jour échouée.' }
  }

  revalidatePath('/dashboard/services')
  revalidatePath(`/dashboard/services/${serviceId}`)
  return { success: true, url: publicUrl }
}

export async function reorderServices(orderedIds: string[]) {
  const { error: authError, salonId, supabase } = await getOwnerSalonId()
  if (authError || !salonId || !supabase) return { error: authError ?? 'Erreur.' }

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('services')
      .update({ display_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('salon_id', salonId)
  )

  await Promise.all(updates)
  revalidatePath('/dashboard/services')
  return { success: true }
}
