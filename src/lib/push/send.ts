import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

function getWebPush() {
  const publicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const email      = process.env.VAPID_EMAIL ?? 'admin@tekkishop.com'

  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys not configured')
  }
  // VAPID_EMAIL vaut déjà "mailto:..." en production — préfixer sans condition
  // produisait un sujet JWT doublement préfixé ("mailto:mailto:..."), rejeté
  // par Apple (403 BadJwtToken sur web.push.apple.com) mais toléré par FCM,
  // d'où un échec silencieux spécifique aux abonnés iOS/Safari uniquement.
  const subject = email.startsWith('mailto:') ? email : `mailto:${email}`
  webpush.setVapidDetails(subject, publicKey, privateKey)
  return webpush
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
}

// Les deux seuls usages actuels de sendPushToShop — pas de valeur générique
// "autre" : chaque appelant doit dire honnêtement ce qu'il notifie, comme le
// SMS/WhatsApp le fait déjà via notification_type.
export type PushNotificationType = 'new_order_shop' | 'delivery_confirmed'

// push_endpoint n'existe pas encore dans les types Supabase générés
// (database.ts jamais régénéré depuis la migration 100) — même limitation
// pré-existante que grid_image_ratio ailleurs dans ce dépôt.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logPush(admin: ReturnType<typeof createAdminClient>, rows: any[]) {
  if (rows.length === 0) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('notification_logs') as any).insert(rows)
}

export async function sendPushToShop(
  shopId: string,
  payload: PushPayload,
  orderId: string | null,
  notificationType: PushNotificationType,
): Promise<void> {
  const admin = createAdminClient()
  const { data: subs } = await admin
    .from('push_subscriptions' as never)
    .select('id, endpoint, p256dh, auth')
    .eq('shop_id', shopId) as unknown as {
      data: { id: string; endpoint: string; p256dh: string; auth: string }[] | null
    }

  const message = `${payload.title} — ${payload.body}`

  if (!subs?.length) {
    await logPush(admin, [{
      shop_id: shopId, order_id: orderId, notification_type: notificationType,
      channel: 'push', message, status: 'failed',
      error_message: 'Aucun abonnement push enregistré',
    }])
    return
  }

  let wp: ReturnType<typeof getWebPush>
  try {
    wp = getWebPush()
  } catch {
    // Panne de configuration globale (toutes boutiques concernées), pas
    // propre à cette commande — pas de ligne par commande dans ce cas,
    // ça inonderait la table sans rien ajouter tant que ce n'est pas corrigé.
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logs: any[] = []

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await wp.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification,
          { TTL: 60 }
        )
        logs.push({
          shop_id: shopId, order_id: orderId, notification_type: notificationType,
          channel: 'push', message, status: 'sent', push_endpoint: sub.endpoint,
        })
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        const isStale = status === 404 || status === 410
        if (isStale) {
          // Abonnement expiré ou invalide — supprimer
          staleIds.push(sub.id)
        } else {
          console.error('[push] send error:', err)
        }
        logs.push({
          shop_id: shopId, order_id: orderId, notification_type: notificationType,
          channel: 'push', message, status: 'failed', push_endpoint: sub.endpoint,
          error_message: isStale
            ? `Abonnement expiré (HTTP ${status}) — supprimé`
            : (err instanceof Error ? err.message : String(err)),
        })
      }
    })
  )

  await logPush(admin, logs)

  if (staleIds.length > 0) {
    await admin
      .from('push_subscriptions' as never)
      .delete()
      .in('id', staleIds)
  }
}
