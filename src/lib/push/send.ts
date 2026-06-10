import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

function getWebPush() {
  const publicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const email      = process.env.VAPID_EMAIL ?? 'admin@tekkishop.com'

  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys not configured')
  }
  webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey)
  return webpush
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
}

export async function sendPushToShop(shopId: string, payload: PushPayload): Promise<void> {
  const admin = createAdminClient()
  const { data: subs } = await admin
    .from('push_subscriptions' as never)
    .select('id, endpoint, p256dh, auth')
    .eq('shop_id', shopId) as unknown as {
      data: { id: string; endpoint: string; p256dh: string; auth: string }[] | null
    }

  if (!subs?.length) return

  let wp: ReturnType<typeof getWebPush>
  try {
    wp = getWebPush()
  } catch {
    console.warn('[push] VAPID not configured — skipping push notifications')
    return
  }

  const notification = JSON.stringify({
    title:  payload.title,
    body:   payload.body,
    icon:   payload.icon ?? '/favicon.png',
    badge:  '/favicon.png',
    data:   { url: payload.url ?? '/dashboard/orders' },
  })

  const staleIds: string[] = []

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await wp.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification,
          { TTL: 60 }
        )
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          // Abonnement expiré ou invalide — supprimer
          staleIds.push(sub.id)
        } else {
          console.error('[push] send error:', err)
        }
      }
    })
  )

  if (staleIds.length > 0) {
    await admin
      .from('push_subscriptions' as never)
      .delete()
      .in('id', staleIds)
  }
}
