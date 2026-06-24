'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { CreateProductInput, UpdateProductInput, ProductPhoto } from '@/types'
import { slugify } from '@/lib/utils/slugify'
import { sendSMS, buildStockBackMessage } from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'

async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  shopId: string,
  name: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(name)
  if (!base) return ''

  const check = async (candidate: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabase.from('products') as any).select('id').eq('shop_id', shopId).eq('slug', candidate)
    if (excludeId) q = q.neq('id', excludeId)
    const { data } = await q.maybeSingle()
    return !data
  }

  if (await check(base)) return base
  for (let i = 2; i <= 20; i++) {
    const candidate = `${base}-${i}`
    if (await check(candidate)) return candidate
  }
  return `${base}-${Date.now()}`
}

async function getOwnerShopId() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Non authentifié.', shopId: null, shopSlug: null, supabase: null }
  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.shop_id || profile.role !== 'owner') {
    return { error: 'Accès non autorisé.', shopId: null, shopSlug: null, supabase: null }
  }
  const { data: shop } = await supabase
    .from('shops')
    .select('slug')
    .eq('id', profile.shop_id)
    .single()
  return { error: null, shopId: profile.shop_id as string, shopSlug: shop?.slug as string | null, supabase }
}

export async function createProduct(input: CreateProductInput) {
  const { error: authError, shopId, shopSlug, supabase } = await getOwnerShopId()
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

  const productSlug = input.slug?.trim()
    ? input.slug.trim()
    : await generateUniqueSlug(supabase, shopId, input.name)

  // Photo principale en tête de tableau — la galerie affiche photos[0] en premier
  const sortedPhotos = [...(input.photos ?? [])].sort((a, b) =>
    (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('products') as any).insert({
    shop_id:            shopId,
    name:               input.name.trim(),
    description:        input.description?.trim() || null,
    price:              input.price,
    category:           input.category?.trim() || null,
    photos:             sortedPhotos,
    photo_url:          sortedPhotos.find(p => p.is_primary)?.url ?? sortedPhotos[0]?.url ?? null,
    video_url:          input.video_url ?? null,
    image_ratio:        input.image_ratio ?? 'square',
    deposit_percentage: input.deposit_percentage ?? null,
    variants:           input.variants?.length ? input.variants : null,
    stock_count:        input.stock_count ?? null,
    display_order:      (maxOrder?.display_order ?? 0) + 1,
    is_active:             true,
    is_featured:           input.is_featured ?? false,
    customization_enabled: input.customization_enabled ?? false,
    customization_label:   input.customization_label?.trim() || null,
    slug:                  productSlug || null,
    meta_title:            input.meta_title?.trim() || null,
    meta_description:      input.meta_description?.trim() || null,
    delivery_delay:        input.delivery_delay?.trim() || null,
    badges:                (input.badges ?? []).filter(Boolean),
    original_price:        input.original_price ?? null,
  }).select('id').single() as { data: { id: string } | null; error: Error | null }

  if (error) {
    console.error('[createProduct]', error.message)
    return { error: 'Impossible de créer le produit.' }
  }

  revalidatePath('/dashboard/products')
  if (shopSlug) revalidatePath(`/${shopSlug}`)
  return { success: true, id: data?.id }
}

async function notifyStockAlertSubscribers(
  productId: string,
  productName: string,
  shopName: string,
  shopSlug: string,
) {
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: alerts } = await (admin as any).from('stock_alerts')
      .select('id, phone')
      .eq('product_id', productId)
      .is('notified_at', null)

    if (!alerts || alerts.length === 0) return

    const productUrl = `${APP_URL}/${shopSlug}/produit/${productId}`
    const message = buildStockBackMessage({ shopName, productName, productUrl })

    const notifiedIds: string[] = []
    await Promise.allSettled(
      alerts.map(async (alert: { id: string; phone: string }) => {
        const result = await sendSMS(alert.phone, message)
        if (result.success) notifiedIds.push(alert.id)
      })
    )

    if (notifiedIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('stock_alerts')
        .update({ notified_at: new Date().toISOString() })
        .in('id', notifiedIds)
    }
  } catch (err) {
    console.error('[notifyStockAlertSubscribers]', err)
  }
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const { error: authError, shopId, shopSlug, supabase } = await getOwnerShopId()
  if (authError || !shopId || !supabase) return { error: authError ?? 'Erreur.' }

  // Snapshot du stock actuel pour détecter un retour en stock
  let previousStockCount: number | null = null
  if (input.stock_count !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: current } = await (supabase.from('products') as any)
      .select('stock_count, name')
      .eq('id', id)
      .eq('shop_id', shopId)
      .single()
    previousStockCount = current?.stock_count ?? null
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (input.name !== undefined)               updates.name               = input.name.trim()
  if (input.description !== undefined)        updates.description        = input.description?.trim() || null
  if (input.price !== undefined)              updates.price              = input.price
  if (input.category !== undefined)           updates.category           = input.category?.trim() || null
  if (input.photos !== undefined) {
    // Photo principale en tête — la galerie affiche photos[0] en premier
    const sortedPhotos = [...input.photos].sort((a, b) =>
      (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
    )
    updates.photos    = sortedPhotos
    updates.photo_url = sortedPhotos.find(p => p.is_primary)?.url ?? sortedPhotos[0]?.url ?? null
  }
  if (input.video_url !== undefined)          updates.video_url          = input.video_url ?? null
  if (input.image_ratio !== undefined)        updates.image_ratio        = input.image_ratio ?? 'square'
  if (input.deposit_percentage !== undefined) updates.deposit_percentage = input.deposit_percentage
  if (input.variants !== undefined)           updates.variants           = input.variants?.length ? input.variants : null
  if (input.stock_count !== undefined)        updates.stock_count        = input.stock_count
  if (input.is_active !== undefined)          updates.is_active          = input.is_active
  if (input.is_featured !== undefined)             updates.is_featured             = input.is_featured
  if (input.customization_enabled !== undefined)   updates.customization_enabled   = input.customization_enabled
  if (input.customization_label !== undefined)     updates.customization_label     = input.customization_label?.trim() || null
  if (input.meta_title !== undefined)              updates.meta_title              = input.meta_title?.trim() || null
  if (input.meta_description !== undefined)        updates.meta_description        = input.meta_description?.trim() || null
  if (input.delivery_delay !== undefined)     updates.delivery_delay     = input.delivery_delay?.trim() || null
  if (input.badges !== undefined)             updates.badges             = (input.badges ?? []).filter(Boolean)
  if (input.original_price !== undefined)     updates.original_price     = input.original_price ?? null

  if (input.slug !== undefined) {
    const newSlug = input.slug?.trim() || null
    updates.slug = newSlug
    // If slug is being cleared, auto-generate from current name
    if (!newSlug && input.name) {
      updates.slug = await generateUniqueSlug(supabase, shopId, input.name, id)
    } else if (newSlug) {
      // Validate uniqueness manually — DB constraint will catch it, but give a nicer error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: conflict } = await (supabase.from('products') as any)
        .select('id').eq('shop_id', shopId).eq('slug', newSlug).neq('id', id).maybeSingle()
      if (conflict) return { error: 'Ce slug est déjà utilisé par un autre produit.' }
    }
  }

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
  if (shopSlug) {
    revalidatePath(`/${shopSlug}`)
    revalidatePath(`/${shopSlug}/produit/${id}`)
    if (updates.slug) revalidatePath(`/${shopSlug}/produit/${updates.slug}`)
  }

  // Retour en stock : notifier les abonnés aux alertes (fire-and-forget)
  const newStock = input.stock_count
  if (
    previousStockCount === 0 &&
    typeof newStock === 'number' && newStock > 0 &&
    shopSlug
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: shopData } = await (supabase.from('shops') as any)
      .select('name')
      .eq('id', shopId)
      .single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: productData } = await (supabase.from('products') as any)
      .select('name')
      .eq('id', id)
      .single()
    if (shopData?.name && productData?.name) {
      void notifyStockAlertSubscribers(id, productData.name, shopData.name, shopSlug)
    }
  }

  return { success: true }
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const { error: authError, shopId, shopSlug, supabase } = await getOwnerShopId()
  if (authError || !shopId || !supabase) return { error: authError ?? 'Erreur.' }

  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('shop_id', shopId)

  if (error) return { error: 'Impossible de modifier le statut.' }

  revalidatePath('/dashboard/products')
  if (shopSlug) revalidatePath(`/${shopSlug}`)
  return { success: true }
}

export async function deleteProduct(id: string) {
  const { error: authError, shopId, shopSlug, supabase } = await getOwnerShopId()
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
  if (shopSlug) revalidatePath(`/${shopSlug}`)
  return { success: true }
}

export async function uploadProductPhoto(formData: FormData): Promise<{ error?: string; url?: string }> {
  const { error: authError, shopId } = await getOwnerShopId()
  if (authError || !shopId) return { error: authError ?? 'Erreur.' }

  const file = formData.get('photo') as File | null
  if (!file || file.size === 0) return { error: 'Aucun fichier sélectionné.' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Le fichier doit faire moins de 5 Mo.' }

  // Whitelist stricte — SVG exclu (risque XSS via scripts inline)
  const ALLOWED_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
    'image/gif':  'gif',
  }
  const ext = ALLOWED_MIME[file.type]
  if (!ext) return { error: 'Format non autorisé. Utilise JPG, PNG, WebP ou GIF.' }

  // Nom aléatoire — ne jamais utiliser le nom fourni par le client
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
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
  const { error: authError, shopId, shopSlug, supabase } = await getOwnerShopId()
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
  if (shopSlug) revalidatePath(`/${shopSlug}`)
  return { success: true }
}
