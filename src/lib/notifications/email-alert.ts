// Alerte admin quand Resend refuse d'envoyer pour une raison de configuration.
// Ne passe jamais par Resend (c'est lui qui est en cause) : SMS Lafricamobile
// vers ADMIN_ALERT_PHONE. Sans dépendance applicative (pas d'alias '@/') pour
// être testable avec `node --test`.
//
// Dédoublonnage sans migration : une ligne `cron_health` dédiée mémorise la
// date de la dernière alerte (même table et même principe que le dédoublonnage
// des alertes cron de cron-health-check). Une seule alerte par fenêtre, quel que
// soit le nombre d'e-mails refusés pendant ce temps.

import type { EmailResult } from './email-result'

/** Retire toute adresse e-mail d'un texte destiné aux journaux. */
export function redactEmails(text: string): string {
  return text.replace(/[^\s<>"'(),;:]+@[^\s<>"'(),;:]+/g, '[e-mail]')
}

export const ALERT_JOB_NAME = 'email-config-alert'
export const ALERT_WINDOW_MS = 6 * 60 * 60 * 1000

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminLike = { from: (table: string) => any }

export type AlertOutcome = 'sent' | 'deduplicated' | 'no_phone' | 'sms_failed' | 'read_failed'

export function buildEmailConfigAlertMessage(error: string): string {
  const reason = error.replace(/\s+/g, ' ').trim().slice(0, 80)
  return `TekkiShop ALERTE E-MAIL: Resend refuse les envois (${reason}). Les clients ne recoivent plus leurs e-mails ni leurs liens. A corriger dans Resend/DNS.`
}

export async function alertAdminOnEmailConfigError(
  deps: {
    admin: AdminLike
    phone: string | undefined
    sendSms: (to: string, message: string) => Promise<{ success: boolean; error?: string }>
    now?: number
  },
  error: string,
): Promise<AlertOutcome> {
  const now = deps.now ?? Date.now()

  const { data, error: readError } = await deps.admin
    .from('cron_health')
    .select('details')
    .eq('job_name', ALERT_JOB_NAME)
    .maybeSingle()

  // Une erreur de lecture ne prouve pas qu'aucune alerte n'est partie : comme
  // cron-health-check, on s'abstient plutôt que de risquer de répéter l'alerte.
  if (readError) {
    console.error('[email-alert] lecture cron_health', readError.message)
    return 'read_failed'
  }

  const last = data?.details?.last_alert_at as string | undefined
  if (last && now - new Date(last).getTime() < ALERT_WINDOW_MS) return 'deduplicated'

  if (!deps.phone) {
    console.error('[email-alert] ADMIN_ALERT_PHONE non configuré — alerte non envoyée:', error)
    return 'no_phone'
  }

  const sms = await deps.sendSms(deps.phone, buildEmailConfigAlertMessage(error))
  if (!sms.success) {
    // Non mémorisée : le prochain refus retentera l'alerte.
    console.error('[email-alert] SMS admin en échec:', sms.error)
    return 'sms_failed'
  }

  const iso = new Date(now).toISOString()
  const { error: writeError } = await deps.admin
    .from('cron_health')
    .upsert(
      { job_name: ALERT_JOB_NAME, last_run: iso, last_status: 'error', details: { last_alert_at: iso, last_error: error.slice(0, 200) } },
      { onConflict: 'job_name' },
    )
  if (writeError) console.error('[email-alert] mémorisation de l\'alerte', writeError.message)

  return 'sent'
}

// Types de notification_logs déjà autorisés par la contrainte (migrations
// 100/106/109) : aucun type dédié aux e-mails ni aux alertes admin n'existe,
// on rattache donc l'e-mail à ce qu'il notifie réellement, avec channel='email'.
export type EmailLogType = 'order_confirmation' | 'new_order_shop'

export type EmailOutcomeContext = {
  /** Sans boutique (candidature licence, invitation CM) : pas de ligne de journal. */
  shopId?: string | null
  orderId?: string | null
  type?: EmailLogType
  toEmail: string
  label: string
}

/**
 * Journalise le résultat d'un envoi (notification_logs) et, si Resend a refusé
 * pour une raison de configuration, prévient l'admin (au plus une fois par
 * fenêtre). Ne lève jamais : un échec de journal ne doit pas casser le flux de
 * commande ou de paiement qui l'appelle.
 */
export async function recordEmailOutcome(
  deps: {
    admin: AdminLike
    phone: string | undefined
    sendSms: (to: string, message: string) => Promise<{ success: boolean; error?: string }>
    /** Faux hors production (aperçus, local) : pas de SMS admin. */
    alertEnabled: boolean
    now?: number
  },
  ctx: EmailOutcomeContext,
  result: EmailResult,
): Promise<void> {
  try {
    if (ctx.shopId && ctx.type) {
      const { error } = await deps.admin.from('notification_logs').insert({
        shop_id:           ctx.shopId,
        order_id:          ctx.orderId ?? null,
        recipient_email:   ctx.toEmail,
        notification_type: ctx.type,
        channel:           'email',
        message:           ctx.label,
        status:            result.success ? 'sent' : 'failed',
        error_message:     result.error ?? null,
      })
      if (error) console.error('[email] journalisation', ctx.label, error.message)
    }

    if (!result.success) {
      // Ligne de classement pour les journaux Vercel : sans adresse e-mail.
      console.error(
        `[email] refus classé ${result.configError ? 'configuration' : 'passager'} — ${ctx.label} — erreur Resend: ${result.errorName ?? 'inconnue'} — ${redactEmails(result.error ?? '').slice(0, 160)} — alerte admin ${result.configError && deps.alertEnabled ? 'autorisée' : 'non déclenchée'}`,
      )
    }

    if (!result.success && result.configError && deps.alertEnabled) {
      await alertAdminOnEmailConfigError(
        { admin: deps.admin, phone: deps.phone, sendSms: deps.sendSms, now: deps.now },
        result.error ?? 'refus Resend',
      )
    }
  } catch (err) {
    console.error('[email] recordEmailOutcome', ctx.label, err instanceof Error ? err.message : err)
  }
}
