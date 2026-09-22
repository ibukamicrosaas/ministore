import { createAdminClient } from '@/lib/supabase/admin'
import { sendSMS, buildStockBackMessage } from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'

export const STOCK_ALERT_MAX_AGE_DAYS = 30
const MAX_AGE_DAYS = STOCK_ALERT_MAX_AGE_DAYS

// Point d'envoi unique des alertes "retour en stock" (REPRISE.md §152) :
// appelé à la fois par updateProduct (retour de stock fait à la main depuis le
// formulaire produit) et par le cron notify-stock-back (tous les autres
// chemins qui remettent du stock : annulation, expiration de commande...).
//
// Chaque inscription est "réservée" (notified_at posé) AVANT l'envoi, puis
// libérée si l'envoi échoue : deux exécutions concurrentes (action + cron) ne
// peuvent donc jamais envoyer deux fois le même SMS au même client, et un échec
// reste réessayable par le cron.
export async function notifyStockAlertSubscribers(
  productId: string,
): Promise<{ sent: number; failed: number; errored?: boolean }> {
  const admin = createAdminClient()

  // slug pas encore dans les types Supabase générés — même contournement que
  // partout ailleurs sur products (lib/actions/products.ts).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product, error: productError } = await (admin.from('products') as any)
    .select('name, slug, stock_count, shop_id, is_active')
    .eq('id', productId)
    .maybeSingle() as {
      data: { name: string; slug: string | null; stock_count: number | null; shop_id: string; is_active: boolean } | null
      error: { message: string } | null
    }
  // Une erreur de lecture n'est pas "rien à faire" : elle est journalisée et
  // remontée au cron (qui la consigne dans cron_health) au lieu d'être avalée.
  if (productError) {
    console.error('[stock-back] lecture produit', productId, productError.message)
    return { sent: 0, failed: 0, errored: true }
  }
  if (!product || !product.is_active || !(typeof product.stock_count === 'number' && product.stock_count > 0)) {
    return { sent: 0, failed: 0 }
  }

  const { data: shop, error: shopError } = await admin
    .from('shops')
    .select('name, slug')
    .eq('id', product.shop_id)
    .maybeSingle()
  if (shopError) {
    console.error('[stock-back] lecture boutique', product.shop_id, shopError.message)
    return { sent: 0, failed: 0, errored: true }
  }
  if (!shop) return { sent: 0, failed: 0 }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alertsTable = () => (admin as any).from('stock_alerts')

  // Deux garde-fous communs à l'action et au cron : (1) pas d'inscription de plus
  // de 30 jours — un numéro invalide ne doit pas être réessayé indéfiniment, et
  // une vieille attente ne mérite plus un SMS automatique sorti de nulle part ;
  // (2) uniquement des numéros déjà au format international (+…). Les
  // inscriptions antérieures au formulaire à indicatif (REPRISE.md §152) sont
  // stockées en format local : les envoyer produirait un numéro faux (un simple
  // "+" est préfixé à l'envoi), elles sont donc ignorées ici et rattrapées à la
  // main par les marchands.
  const since = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data: pending, error: pendingError } = await alertsTable()
    .select('id, phone')
    .eq('product_id', productId)
    .is('notified_at', null)
    .gte('created_at', since)
    .like('phone', '+%')
  if (pendingError) {
    console.error('[stock-back] lecture inscriptions', productId, pendingError.message)
    return { sent: 0, failed: 0, errored: true }
  }
  if (!pending || pending.length === 0) return { sent: 0, failed: 0 }

  const now = new Date().toISOString()
  const { data: claimed, error: claimError } = await alertsTable()
    .update({ notified_at: now })
    .in('id', pending.map((a: { id: string }) => a.id))
    .is('notified_at', null)
    .select('id, phone')
  if (claimError) {
    console.error('[stock-back] réservation inscriptions', productId, claimError.message)
    return { sent: 0, failed: 0, errored: true }
  }
  if (!claimed || claimed.length === 0) return { sent: 0, failed: 0 }

  const message = buildStockBackMessage({
    shopName:   shop.name,
    productName: product.name,
    productUrl: `${APP_URL}/${shop.slug}/produit/${product.slug ?? productId}`,
  })

  let sent = 0
  let failed = 0
  for (const alert of claimed as { id: string; phone: string }[]) {
    const result = await sendSMS(alert.phone, message)

    const { error: logError } = await admin.from('notification_logs').insert({
      shop_id:           product.shop_id,
      order_id:          null,
      recipient_phone:   alert.phone,
      notification_type: 'stock_back',
      channel:           'sms',
      message,
      status:            result.success ? 'sent' : 'failed',
      error_message:     result.error ?? null,
    } as never)
    if (logError) console.error('[stock-back] journalisation', alert.id, logError.message)

    if (result.success) {
      sent++
    } else {
      failed++
      await alertsTable().update({ notified_at: null }).eq('id', alert.id)
    }
  }

  return { sent, failed }
}
