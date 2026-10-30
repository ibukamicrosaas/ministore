import { createAdminClient } from '@/lib/supabase/admin'
import { sendSMS } from './whatsapp'
import { recordEmailOutcome, type EmailOutcomeContext } from './email-alert'
import type { EmailResult } from './email-result'

/**
 * Point d'entrée des appelants : journalise le résultat d'un e-mail et alerte
 * l'admin par SMS (hors Resend) si le refus est un problème de configuration.
 * La logique est dans email-alert.ts (testée). Ne lève jamais.
 */
export async function reportEmailOutcome(ctx: EmailOutcomeContext, result: EmailResult): Promise<void> {
  try {
    await recordEmailOutcome(
      {
        admin: createAdminClient(),
        phone: process.env.ADMIN_ALERT_PHONE,
        sendSms: sendSMS,
        // Hors production (aperçus Vercel, local), un refus de configuration est
        // attendu : pas de SMS admin.
        alertEnabled: !process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production',
      },
      ctx,
      result,
    )
  } catch (err) {
    console.error('[email] reportEmailOutcome', ctx.label, err instanceof Error ? err.message : err)
  }
}
