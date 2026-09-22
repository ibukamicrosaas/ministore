import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/auth/verify-cron'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyStockAlertSubscribers, STOCK_ALERT_MAX_AGE_DAYS } from '@/lib/notifications/stock-back'
import { recordCronRun } from '@/lib/cron/health'

// Filet de sécurité des alertes "retour en stock" (REPRISE.md §152) : le
// déclencheur immédiat de updateProduct ne couvre que le retour de stock fait à
// la main depuis le formulaire produit. Ce balayage quotidien rattrape tous les
// autres chemins (annulation ou expiration de commande, import...) et les envois
// qui ont échoué, SMS et e-mail indépendamment (Phase 2, §152) : la logique de
// réclamation/retry par canal vit dans notifyStockAlertSubscribers.
const MAX_AGE_DAYS = STOCK_ALERT_MAX_AGE_DAYS

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // ?shop_id=xxx — restreint le traitement à une boutique précise, pour tester
  // sans effet de bord sur le reste de la base (REPRISE.md §131/§132).
  const shopId = req.nextUrl.searchParams.get('shop_id')

  const since = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  // Un produit est candidat si AU MOINS UN des deux canaux est encore en
  // attente pour lui — sinon un SMS déjà envoyé masquerait un e-mail encore
  // à tenter (ou l'inverse). La logique fine (format du numéro, réservation
  // par canal) reste dans notifyStockAlertSubscribers ; cette requête ne sert
  // qu'à lister les produits à examiner.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any).from('stock_alerts')
    .select('product_id')
    .gte('created_at', since)
    .or('notified_at.is.null,and(email.not.is.null,email_notified_at.is.null)')
  if (shopId) query = query.eq('shop_id', shopId)

  const { data, error } = await query
  if (error) {
    console.error('[cron/notify-stock-back]', error.message)
    void recordCronRun('notify-stock-back', 'error', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const productIds = [...new Set(((data ?? []) as { product_id: string }[]).map(a => a.product_id))]
  let smsSent = 0
  let smsFailed = 0
  let emailSent = 0
  let emailFailed = 0
  let errors = 0
  for (const productId of productIds) {
    const result = await notifyStockAlertSubscribers(productId)
    smsSent += result.smsSent
    smsFailed += result.smsFailed
    emailSent += result.emailSent
    emailFailed += result.emailFailed
    if (result.errored) errors++
  }

  const summary = { products: productIds.length, smsSent, smsFailed, emailSent, emailFailed, errors }
  void recordCronRun('notify-stock-back', errors > 0 ? 'error' : 'ok', summary)
  return NextResponse.json(summary)
}
