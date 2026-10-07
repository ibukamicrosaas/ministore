import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/auth/verify-cron'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp } from '@/lib/notifications/whatsapp'
import { sendCronAlertEmail } from '@/lib/notifications/email'

// Crons critiques et leur délai max acceptable entre deux exécutions (en heures)
const CRITICAL_JOBS = [
  { name: 'verify-subscription-payments', maxHours: 28 },
  { name: 'trial-expiry',                 maxHours: 28 },
  { name: 'subscription-expiry',          maxHours: 28 },
] as const

// Nom sous lequel ce job s'auto-enregistre désormais dans cron_health (Lot 2,
// PLAN-MIGRATIONS.md B15) — nécessaire pour mémoriser, par job surveillé, la
// date du dernier e-mail d'alerte envoyé (dédoublonnage par jour calendaire UTC).
const SELF_JOB_NAME = 'cron-health-check'

// Exclusion explicite : ce job s'auto-enregistre désormais dans cron_health,
// mais ne doit jamais se vérifier lui-même — sinon il se déclarerait en
// retard dès son propre passage suivant. Filtre actif, pas une simple absence
// du tableau CRITICAL_JOBS (qui est écrit à la main et ne le contient déjà
// pas) — protège contre un ajout futur par erreur.
const JOBS_TO_CHECK = CRITICAL_JOBS.filter(j => (j.name as string) !== SELF_JOB_NAME)

type JobHealthRow = { last_run: string; last_status: string }
type SelfHealthRow = { details: { email_alerts?: Record<string, string> } | null }

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Découplage demandé : l'absence de ADMIN_ALERT_PHONE ne saute plus que
  // l'envoi SMS lui-même — l'alerte e-mail, l'auto-enregistrement et la purge
  // login_attempts s'exécutent toujours. Aucun autre changement de
  // comportement du SMS (même message, même condition d'envoi sinon).
  const alertPhone = process.env.ADMIN_ALERT_PHONE
  const warning: string | undefined = alertPhone ? undefined : 'ADMIN_ALERT_PHONE non configuré — SMS ignoré, e-mail/auto-enregistrement/purge exécutés quand même'
  if (!alertPhone) {
    console.log('[cron-health-check] ADMIN_ALERT_PHONE non configuré — alerte SMS ignorée ce passage-ci')
  }

  const admin = createAdminClient()
  const now   = Date.now()
  const alerts: string[] = []
  // Jobs dont la lecture cron_health elle-même a échoué (erreur Supabase, pas
  // une absence de ligne) — à ne jamais déclarer en alerte (ni SMS ni e-mail) :
  // une erreur de lecture ne prouve rien sur l'état réel du job, contrairement
  // à une ligne absente ou périmée. Signalé à part dans la réponse JSON.
  const uncheckable: string[] = []

  // Détails par job en alerte — nécessaires pour l'e-mail de secours
  // (texte exact validé dans PLAN-MIGRATIONS.md B15), construits dans la
  // même boucle que le SMS existant pour ne pas requêter deux fois cron_health.
  const jobsInAlert = new Map<string, { lastRun: string | null; lastStatus: string | null; maxHours: number; hoursSince: number | null }>()

  for (const job of JOBS_TO_CHECK) {
    const { data, error } = await admin
      .from('cron_health' as never)
      .select('last_run, last_status')
      .eq('job_name', job.name)
      .maybeSingle() as unknown as { data: JobHealthRow | null; error: { message: string } | null }

    if (error) {
      console.error('[cron-health-check] échec lecture cron_health', job.name, error.message)
      uncheckable.push(job.name)
      continue
    }

    if (!data) {
      alerts.push(`${job.name}: aucune exécution enregistrée`)
      jobsInAlert.set(job.name, { lastRun: null, lastStatus: null, maxHours: job.maxHours, hoursSince: null })
      continue
    }

    let inAlert = false
    const hoursSince = (now - new Date(data.last_run).getTime()) / 3600000
    if (hoursSince > job.maxHours) {
      alerts.push(`${job.name}: dernière exécution il y a ${Math.round(hoursSince)}h (max ${job.maxHours}h)`)
      inAlert = true
    }
    if (data.last_status === 'error') {
      alerts.push(`${job.name}: dernière exécution en erreur`)
      inAlert = true
    }
    if (inAlert) {
      jobsInAlert.set(job.name, { lastRun: data.last_run, lastStatus: data.last_status, maxHours: job.maxHours, hoursSince })
    }
  }

  if (alerts.length > 0) {
    if (alertPhone) {
      const msg = `TekkiShop ALERTE CRON:\n${alerts.join('\n')}`
      await sendWhatsApp(alertPhone, msg)
      console.error('[cron-health-check] Alertes envoyées:', alerts)
    } else {
      console.error('[cron-health-check] Alertes détectées mais SMS ignoré (ADMIN_ALERT_PHONE absent):', alerts)
    }
  }

  // ── Lecture de l'état existant (toujours, même sans ADMIN_ALERT_EMAIL ce
  // passage-ci) : ne jamais perdre les entrées déjà enregistrées. ──
  const { data: selfRow, error: selfReadError } = await admin
    .from('cron_health' as never)
    .select('details')
    .eq('job_name', SELF_JOB_NAME)
    .maybeSingle() as unknown as { data: SelfHealthRow | null; error: { message: string } | null }

  if (selfReadError) {
    console.error('[cron-health-check] échec lecture auto-enregistrement', selfReadError.message)
  }

  const emailAlerts: Record<string, string> = { ...(selfRow?.details?.email_alerts ?? {}) }
  let anyEmailSendFailed = false

  // ── Alerte de secours par e-mail, par job, au plus une fois par jour
  // calendaire UTC (pas une fenêtre glissante de 24h — voir B15 pour la
  // justification). Canal additionnel, jamais à la place du SMS : son
  // absence ou son échec ne bloquent jamais le reste de la fonction. ──
  const alertEmail = process.env.ADMIN_ALERT_EMAIL
  if (!alertEmail) {
    console.log('[cron-health-check] ADMIN_ALERT_EMAIL non configuré — alerte e-mail de secours ignorée ce passage-ci')
  } else {
    const todayUTC = new Date(now).toISOString().slice(0, 10)

    for (const [jobName, info] of jobsInAlert) {
      const lastSentDay = emailAlerts[jobName]?.slice(0, 10)
      if (lastSentDay === todayUTC) continue // déjà alerté aujourd'hui pour ce job

      try {
        const result = await sendCronAlertEmail({
          to:         alertEmail,
          jobName,
          lastRun:    info.lastRun,
          lastStatus: info.lastStatus,
          maxHours:   info.maxHours,
          hoursSince: info.hoursSince,
        })
        if (result.success) {
          emailAlerts[jobName] = new Date(now).toISOString()
        } else {
          // Jamais l'adresse complète dans les logs — seul le nom du job et l'erreur Resend.
          console.error('[cron-health-check] échec envoi e-mail alerte', jobName, result.error)
          anyEmailSendFailed = true
        }
      } catch (err) {
        console.error('[cron-health-check] exception envoi e-mail alerte', jobName, err instanceof Error ? err.message : err)
        anyEmailSendFailed = true
      }
    }
  }

  // ── Auto-enregistrement — un seul UPSERT final, après la boucle d'e-mails
  // ci-dessus, pas un par job (évite les écritures intermédiaires inutiles).
  // Sauté si la lecture de l'état existant a échoué : emailAlerts serait
  // reconstruit à partir de rien (repart de {} faute d'avoir pu lire
  // l'existant), et l'écrire effacerait toute entrée déjà enregistrée pour
  // d'autres jobs. Mieux vaut laisser la ligne telle qu'elle est que
  // l'écraser sur un état qu'on n'a pas pu lire correctement. ──
  if (selfReadError) {
    console.error('[cron-health-check] auto-enregistrement sauté — lecture de l\'état existant en échec, écriture refusée pour ne pas effacer les entrées déjà présentes')
  } else {
    // last_status honnête : 'error' si un envoi d'e-mail a échoué dans ce
    // passage (le seul traitement propre à ce job qui puisse échouer) —
    // jamais 'ok' inconditionnel comme avant.
    const { error: selfUpsertError } = await admin
      .from('cron_health' as never)
      .upsert({
        job_name:    SELF_JOB_NAME,
        last_run:    new Date(now).toISOString(),
        last_status: anyEmailSendFailed ? 'error' : 'ok',
        details:     { email_alerts: emailAlerts },
      } as never, { onConflict: 'job_name' })

    if (selfUpsertError) {
      console.error('[cron-health-check] échec auto-enregistrement', selfUpsertError.message)
    }
  }

  // Purge des entrées login_attempts de plus de 7 jours (évite la dégradation silencieuse)
  const cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: purged } = await admin
    .from('login_attempts')
    .delete({ count: 'exact' })
    .lt('attempted_at', cutoff)

  console.log(`[cron-health-check] Purge login_attempts: ${purged ?? 0} lignes supprimées`)

  return NextResponse.json({ checked: JOBS_TO_CHECK.length, alerts, uncheckable, purged: purged ?? 0, ...(warning ? { warning } : {}) })
}
