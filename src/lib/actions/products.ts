'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { CreateProductInput, UpdateProductInput, ProductPhoto } from '@/types'

async function getOwnerShopId() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Non authentifié.', shopId: null, supabase: null }
  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.shop_id || profile.role !== 'owner') {
    return { error: 'Accès non autorisé.', shopId: null, supabase: null }
  }
  return { error: null, shopId: profile.shop_id as string, supabase }
}

export async function createProduct(input: CreateProductInput) {
  const { error: authError, shopId, supabase } = await getOwnerShopId()
  if (authError || !shopId || !supabase) return { error: authError ?? 'Erreur.' }

  if (!input.name?.trim()) return { error: 'Le nom est obligatoire.' }
  if (input.price < 0) return { error: 'Le prix doit être positif.' }

  const { data: maxOrder } = await supabase
    .from('products')
    .select('display_order')
    .eq('shop_id', shopId)
    .order('display_order', { ascending: false })
    .limit(1)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('products') as any).insert({
    shop_id:            shopId,
    name:               input.name.trim(),
    description:        input.description?.trim() || null,
    price:              input.price,
    category:           input.category?.trim() || null,
    photos:             input.photos ?? [],
    photo_url:          input.photos?.[0]?.url ?? null,
    video_url:          input.video_url ?? null,
    deposit_percentage: input.deposit_percentage ?? null,
    variants:           input.variants?.length ? input.variants : null,
    stock_count:        input.stock_count ?? null,
    display_order:      (maxOrder?.display_order ?? 0) + 1,
    is_active:          true,
  }).select('id').single() as { data: { id: string } | null; error: Error | null }

  if (error) {
    console.error('[createProduct]', error.message)
    return { error: 'Impossible de créer le produit.' }
  }

  revalidatePath('/dashboard/products')
  return { success: true, id: data?.id }
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const { error: authError, shopId, supabase } = await getOwnerShopId()
  if (authError || !shopId || !supabase) return { error: authError ?? 'Erreur.' }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (input.name !== undefined)               updates.name               = input.name.trim()
  if (input.description !== undefined)        updates.description        = input.description?.trim() || null
  if (input.price !== undefined)              updates.price              = input.price
  if (input.category !== undefined)           updates.category           = input.category?.trim() || null
  if (input.photos !== undefined) {
    updates.photos    = input.photos
    updates.photo_url = input.photos[0]?.url ?? null
  }
  if (input.video_url !== undefined)          updates.video_url          = input.video_url ?? null
  if (input.deposit_percentage !== undefined) updates.deposit_percentage = input.deposit_percentage
  if (input.variants !== undefined)           updates.variants           = input.variants?.length ? input.variants : null
  if (input.stock_count !== undefined)        updates.stock_count        = input.stock_count
  if (input.is_active !== undefined)          updates.is_active          = input.is_active

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('products')
    .update(updates as any)
    .eq('id', id)
    .eq('shop_id', shopId)

  if (error) {
    console.error('[updateProduct]', error.message)
    return { error: 'Impossible de mettre à jour le produit.' }
  }

  revalidatePath('/dashboard/products')
  revalidatePath(`/dashboard/products/${id}`)
  return { success: true }
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const { error: authError, shopId, supabase } = await getOwnerShopId()
  if (authError || !shopId || !supabase) return { error: authError ?? 'Erreur.' }

  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('shop_id', shopId)

  if (error) return { error: 'Impossible de modifier le statut.' }

  revalidatePath('/dashboard/products')
  return { success: true }
}

export async function deleteProduct(id: string) {
  const { error: authError, shopId, supabase } = await getOwnerShopId()
  if (authError || !shopId || !supabase) return { error: authError ?? 'Erreur.' }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('shop_id', shopId)

  if (error) {
    console.error('[deleteProduct]', error.message)
    return { error: 'Impossible de supprimer le produit.' }
  }

  revalidatePath('/dashboard/products')
  return { success: true }
}

export async function uploadProductPhoto(formData: FormData): Promise<{ error?: string; url?: string }> {
  const { error: authError, shopId } = await getOwnerShopId()
  if (authError || !shopId) return { error: authError ?? 'Erreur.' }

  const file = formData.get('photo') as File | null
  if (!file || file.size === 0) return { error: 'Aucun fichier sélectionné.' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Le fichier doit faire moins de 5 Mo.' }
  if (!file.type.startsWith('image/')) return { error: 'Le fichier doit être une image.' }

  const ext  = file.name.split('.').pop() ?? 'jpg'
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `${shopId}/${name}`
  const admin = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from('product-photos')
    .upload(path, file, { upsert: false, contentType: file.type })

  if (uploadError) {
    console.error('[uploadProductPhoto]', uploadError.message)
    return { error: 'Impossible de télécharger la photo.' }
  }

  const { data: { publicUrl } } = admin.storage.from('product-photos').getPublicUrl(path)
  return { url: publicUrl }
}

export async function reorderProducts(ids: string[]) {
  const { error: authError, shopId, supabase } = await getOwnerShopId()
  if (authError || !shopId || !supabase) return { error: authError ?? 'Erreur.' }

  await Promise.all(
    ids.map((id, index) =>
      supabase
        .from('products')
        .update({ display_order: index, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('shop_id', shopId)
    )
  )

  revalidatePath('/dashboard/products')
  return { success: true }
}
