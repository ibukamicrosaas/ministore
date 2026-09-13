'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

// Une Server Action importée par un composant client est un endpoint POST
// public, indépendant du garde de /admin/layout.tsx — même mécanisme que
// admin.ts (audit sécurité §109, finding élevé #6). Seules les deux fonctions
// marquées "Admin :" ci-dessous en ont besoin — getMyNotifications/
// markNotificationsRead sont du self-service marchand légitime.
async function assertAdmin(): Promise<string | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_USER_IDS.includes(user.id)) return 'Accès non autorisé.'
  return null
}

async function requireAdmin(): Promise<void> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_USER_IDS.includes(user.id)) throw new Error('Unauthorized')
}

export type NotificationType = 'info' | 'warning' | 'promo' | 'success'

export interface ShopNotification {
  id: string
  shop_id: string
  title: string
  body: string
  type: NotificationType
  read_at: string | null
  created_at: string
}

// ─── Admin : envoyer une notification à une liste de boutiques ──────────────

export async function sendNotificationToShops(payload: {
  shopIds: string[]
  title: string
  body: string
  type: NotificationType
}): Promise<{ sent: number; error?: string }> {
  const authError = await assertAdmin()
  if (authError) return { sent: 0, error: authError }

  if (!payload.shopIds.length) return { sent: 0, error: 'Aucune boutique cible.' }
  if (!payload.title.trim() || !payload.body.trim()) return { sent: 0, error: 'Titre et message requis.' }

  const admin = createAdminClient()

  const rows = payload.shopIds.map(shopId => ({
    shop_id: shopId,
    title:   payload.title.trim(),
    body:    payload.body.trim(),
    type:    payload.type,
  }))

  const { error } = await admin
    .from('shop_notifications' as never)
    .insert(rows as never)

  if (error) return { sent: 0, error: (error as { message: string }).message }
  return { sent: rows.length }
}

// ─── Admin : récupérer les boutiques par plan (pour ciblage) ────────────────

export async function getShopIdsByPlan(
  plans: string[],
): Promise<string[]> {
  await requireAdmin()

  const admin = createAdminClient()
  const { data } = await admin
    .from('shops')
    .select('id')
    .in('plan', plans)
  return (data ?? []).map((r: { id: string }) => r.id)
}

// ─── Dashboard utilisateur : lire ses notifications ─────────────────────────

export async function getMyNotifications(): Promise<ShopNotification[]> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profileData } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()
  if (!profileData?.shop_id) return []

  const shopData = { id: profileData.shop_id }

  const admin = createAdminClient()
  const { data } = await admin
    .from('shop_notifications' as never)
    .select('id, shop_id, title, body, type, read_at, created_at')
    .eq('shop_id', shopData.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return ((data ?? []) as ShopNotification[])
}

// ─── Dashboard utilisateur : marquer comme lu ───────────────────────────────

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (!ids.length) return
  const admin = createAdminClient()
  await admin
    .from('shop_notifications' as never)
    .update({ read_at: new Date().toISOString() } as never)
    .in('id', ids)
    .is('read_at', null)
  revalidatePath('/dashboard')
}
