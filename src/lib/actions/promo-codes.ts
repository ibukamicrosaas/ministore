'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function getOwnerShopId() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.', shopId: null }
  const { data: profile } = await supabase
    .from('profiles').select('shop_id, role').eq('id', user.id).single()
  if (!profile?.shop_id || profile.role !== 'owner')
    return { error: 'Accès non autorisé.', shopId: null }
  return { error: null, shopId: profile.shop_id as string }
}

export async function createPromoCode(input: {
  code: string
  discount_pct: number
  max_uses: number | null
  expires_at: string | null
}): Promise<{ error?: string }> {
  const { error: authError, shopId } = await getOwnerShopId()
  if (authError || !shopId) return { error: authError ?? 'Erreur.' }

  const code = input.code.trim().toUpperCase().replace(/\s+/g, '')
  if (!code || code.length < 2 || code.length > 30)
    return { error: 'Le code doit faire entre 2 et 30 caractères.' }
  if (!/^[A-Z0-9_-]+$/.test(code))
    return { error: 'Le code ne peut contenir que des lettres, chiffres, - et _.' }
  if (input.discount_pct < 1 || input.discount_pct > 100)
    return { error: 'La réduction doit être entre 1% et 100%.' }

  const admin = createAdminClient()
  const { error } = await admin.from('promo_codes').insert({
    shop_id:      shopId,
    code,
    discount_pct: input.discount_pct,
    max_uses:     input.max_uses,
    expires_at:   input.expires_at,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Ce code existe déjà pour votre boutique.' }
    console.error('[createPromoCode]', error.message)
    return { error: 'Impossible de créer le code.' }
  }

  revalidatePath('/dashboard/promo-codes')
  return {}
}

export async function togglePromoCode(id: string, isActive: boolean): Promise<{ error?: string }> {
  const { error: authError, shopId } = await getOwnerShopId()
  if (authError || !shopId) return { error: authError ?? 'Erreur.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('promo_codes')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('shop_id', shopId)

  if (error) return { error: 'Impossible de modifier le code.' }
  revalidatePath('/dashboard/promo-codes')
  return {}
}

export async function deletePromoCode(id: string): Promise<{ error?: string }> {
  const { error: authError, shopId } = await getOwnerShopId()
  if (authError || !shopId) return { error: authError ?? 'Erreur.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('promo_codes')
    .delete()
    .eq('id', id)
    .eq('shop_id', shopId)

  if (error) return { error: 'Impossible de supprimer le code.' }
  revalidatePath('/dashboard/promo-codes')
  return {}
}
