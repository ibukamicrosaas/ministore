'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { OrderStatus } from '@/types'

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

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  pending:   'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready:     'delivered',
  delivered: null,
  cancelled: null,
}

export async function advanceOrderStatus(orderId: string) {
  const { error: authError, shopId, supabase } = await getOwnerShopId()
  if (authError || !shopId || !supabase) return { error: authError ?? 'Erreur.' }

  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .eq('shop_id', shopId)
    .single()

  if (!order) return { error: 'Commande introuvable.' }

  const nextStatus = STATUS_TRANSITIONS[order.status as OrderStatus]
  if (!nextStatus) return { error: 'Statut final atteint.' }

  const { error } = await supabase
    .from('orders')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('shop_id', shopId)

  if (error) {
    console.error('[advanceOrderStatus]', error.message)
    return { error: 'Impossible de mettre à jour le statut.' }
  }

  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return { success: true, newStatus: nextStatus }
}

export async function cancelOrder(orderId: string, reason?: string) {
  const { error: authError, shopId, supabase } = await getOwnerShopId()
  if (authError || !shopId || !supabase) return { error: authError ?? 'Erreur.' }

  const { error } = await supabase
    .from('orders')
    .update({
      status:              'cancelled',
      cancelled_by:        'shop',
      cancellation_reason: reason?.trim() || null,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('shop_id', shopId)
    .in('status', ['pending', 'confirmed', 'preparing'])

  if (error) {
    console.error('[cancelOrder]', error.message)
    return { error: 'Impossible d\'annuler la commande.' }
  }

  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return { success: true }
}

export async function updateOrderNotes(orderId: string, notes: string) {
  const { error: authError, shopId, supabase } = await getOwnerShopId()
  if (authError || !shopId || !supabase) return { error: authError ?? 'Erreur.' }

  const { error } = await supabase
    .from('orders')
    .update({ internal_notes: notes.trim() || null, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('shop_id', shopId)

  if (error) return { error: 'Impossible de mettre à jour les notes.' }

  revalidatePath(`/dashboard/orders/${orderId}`)
  return { success: true }
}
