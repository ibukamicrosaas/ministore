'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  sendSMS,
  buildOrderStatusMessage,
  buildOrderCancelledMessage,
} from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'
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
    .select(`
      status, delivery_type, delivery_date,
      clients(phone, whatsapp, first_name),
      shops!inner(name, slug)
    `)
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

  // SMS au client pour les transitions pertinentes (pas pour delivered)
  const o = order as unknown as {
    status: string
    delivery_type: 'home_delivery' | 'store_pickup'
    delivery_date: string | null
    clients: { phone: string; whatsapp: string | null; first_name: string } | null
    shops: { name: string; slug: string } | null
  }
  const clientPhone = o.clients?.whatsapp ?? o.clients?.phone
  const shopName    = o.shops?.name ?? ''

  if (clientPhone && shopName && nextStatus !== 'delivered') {
    const msg = buildOrderStatusMessage({
      shopName,
      clientName:   o.clients?.first_name ?? '',
      newStatus:    nextStatus as 'confirmed' | 'preparing' | 'ready' | 'delivered',
      deliveryType: o.delivery_type,
      deliveryDate: o.delivery_date ?? undefined,
      orderRef:     orderId,
    })
    if (msg) {
      sendSMS(clientPhone, msg).catch(err =>
        console.error('[advanceOrderStatus] SMS failed:', err)
      )
    }
  }

  return { success: true, newStatus: nextStatus }
}

export async function cancelOrder(orderId: string, reason?: string) {
  const { error: authError, shopId, supabase } = await getOwnerShopId()
  if (authError || !shopId || !supabase) return { error: authError ?? 'Erreur.' }

  const { data: order } = await supabase
    .from('orders')
    .select(`
      status,
      clients(phone, whatsapp),
      shops!inner(name)
    `)
    .eq('id', orderId)
    .eq('shop_id', shopId)
    .single()

  if (!order) return { error: 'Commande introuvable.' }

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

  // SMS d'annulation au client
  const o = order as unknown as {
    clients: { phone: string; whatsapp: string | null } | null
    shops: { name: string } | null
  }
  const clientPhone = o.clients?.whatsapp ?? o.clients?.phone
  const shopName    = o.shops?.name ?? ''
  if (clientPhone && shopName) {
    const msg = buildOrderCancelledMessage({ shopName, orderRef: orderId, reason })
    sendSMS(clientPhone, msg).catch(err =>
      console.error('[cancelOrder] SMS failed:', err)
    )
  }

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
