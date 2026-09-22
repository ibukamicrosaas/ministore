import { createAdminClient } from '@/lib/supabase/admin'
import { sendSMS, buildStockBackMessage } from '@/lib/notifications/whatsapp'
import { sendStockBackEmail } from '@/lib/notifications/email'
import { APP_URL } from '@/constants'

export const STOCK_ALERT_MAX_AGE_DAYS = 30
const MAX_AGE_DAYS = STOCK_ALERT_MAX_AGE_DAYS

type NotifyResult = { smsSent: number; smsFailed: number; emailSent: number; emailFailed: number; errored?: boolean }

// Point d'envoi unique des alertes "retour en stock" (REPRISE.md §152) :
// appelé à la fois par updateProduct (retour de stock fait à la main depuis le
// formulaire produit) et par le cron notify-stock-back (tous les autres
// chemins qui remettent du stock : annulation, expiration de commande...).
//
// Deux canaux, deux réservations INDÉPENDANTES (notified_at pour le SMS,
// email_notified_at pour l'e-mail — REPRISE.md §152 Phase 2). Chaque canal est
// réclamé, envoyé et — en cas d'échec — libéré séparément : un SMS "réussi"
// (accepté par Lafricamobile, ce qui ne prouve pas une remise) ne doit jamais
// empêcher un e-mail en échec réel d'être retenté, et inversement un e-mail
// réussi ne doit jamais faire repartir un SMS déjà accepté. Deux exécutions
// concurrentes (action + cron) ne peuvent pas non plus envoyer deux fois le
// même message sur le même canal au même client : la réclamation elle-même
// est l'UPDATE (WHERE ... IS NULL), atomique par ligne.
export async function notifyStockAlertSubscribers(
  productId: string,
): Promise<NotifyResult> {
  const admin = createAdminClient()
  const empty: NotifyResult = { smsSent: 0, smsFailed: 0, emailSent: 0, emailFailed: 0 }

  // slug/primary_color/logo_url pas encore dans les types Supabase générés —
  // même contournement que partout ailleurs sur products/shops
  // (lib/actions/products.ts).
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
    return { ...empty, errored: true }
  }
  if (!product || !product.is_active || !(typeof product.stock_count === 'number' && product.stock_count > 0)) {
    return empty
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop, error: shopError } = await (admin.from('shops') as any)
    .select('name, slug, primary_color, logo_url')
    .eq('id', product.shop_id)
    .maybeSingle() as {
      data: { name: string; slug: string; primary_color: string | null; logo_url: string | null } | null
      error: { message: string } | null
    }
  if (shopError) {
    console.error('[stock-back] lecture boutique', product.shop_id, shopError.message)
    return { ...empty, errored: true }
  }
  if (!shop) return empty

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alertsTable = () => (admin as any).from('stock_alerts')
  const productUrl = `${APP_URL}/${shop.slug}/produit/${product.slug ?? productId}`
  // Commune aux deux canaux : une vieille attente (> 30 jours) ne mérite pas
  // plus un e-mail automatique surgi de nulle part qu'un SMS — même
  // raisonnement que la Phase 1.
  const since = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  let errored = false

  // ── Canal SMS (inchangé depuis la Phase 1, hormis le champ dédié) ──
  // Uniquement les numéros déjà au format international (+…) — les
  // inscriptions antérieures au formulaire à indicatif (REPRISE.md §152) sont
  // stockées en format local : les envoyer produirait un numéro faux (un
  // simple "+" est préfixé à l'envoi), elles sont ignorées ici et rattrapées
  // à la main par les marchands (§154).
  const { data: claimedSms, error: smsClaimError } = await alertsTable()
    .update({ notified_at: now })
    .eq('product_id', productId)
    .is('notified_at', null)
    .gte('created_at', since)
    .like('phone', '+%')
    .select('id, phone')
  if (smsClaimError) {
    console.error('[stock-back] réservation SMS', productId, smsClaimError.message)
    errored = true
  }

  let smsSent = 0
  let smsFailed = 0
  if (claimedSms && claimedSms.length > 0) {
    const message = buildStockBackMessage({ shopName: shop.name, productName: product.name, productUrl })
    for (const alert of claimedSms as { id: string; phone: string }[]) {
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
      if (logError) console.error('[stock-back] journalisation SMS', alert.id, logError.message)

      if (result.success) {
        smsSent++
      } else {
        smsFailed++
        await alertsTable().update({ notified_at: null }).eq('id', alert.id)
      }
    }
  }

  // ── Canal e-mail (nouveau, Phase 2) — réservation et retry indépendants du SMS ──
  const { data: claimedEmail, error: emailClaimError } = await alertsTable()
    .update({ email_notified_at: now })
    .eq('product_id', productId)
    .is('email_notified_at', null)
    .not('email', 'is', null)
    .gte('created_at', since)
    .select('id, email')
  if (emailClaimError) {
    console.error('[stock-back] réservation e-mail', productId, emailClaimError.message)
    errored = true
  }

  let emailSent = 0
  let emailFailed = 0
  if (claimedEmail && claimedEmail.length > 0) {
    for (const alert of claimedEmail as { id: string; email: string }[]) {
      const result = await sendStockBackEmail({
        toEmail:     alert.email,
        shopName:    shop.name,
        shopColor:   shop.primary_color,
        shopLogoUrl: shop.logo_url,
        productName: product.name,
        productUrl,
      })

      const { error: logError } = await admin.from('notification_logs').insert({
        shop_id:           product.shop_id,
        order_id:          null,
        recipient_email:   alert.email,
        notification_type: 'stock_back',
        channel:           'email',
        message:           `"${product.name}" de nouveau disponible — ${productUrl}`,
        status:            result.success ? 'sent' : 'failed',
        error_message:     result.error ?? null,
      } as never)
      if (logError) console.error('[stock-back] journalisation e-mail', alert.id, logError.message)

      if (result.success) {
        emailSent++
      } else {
        emailFailed++
        await alertsTable().update({ email_notified_at: null }).eq('id', alert.id)
      }
    }
  }

  return { smsSent, smsFailed, emailSent, emailFailed, ...(errored ? { errored: true } : {}) }
}
