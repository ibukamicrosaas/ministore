import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/auth/verify-cron'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp } from '@/lib/notifications/whatsapp'

// Crons critiques et leur délai max acceptable entre deux exécutions (en heures)
const CRITICAL_JOBS = [
  { name: 'verify-subscription-payments', maxHours: 28 },
  { name: 'trial-expiry',                 maxHours: 28 },
  { name: 'subscription-expiry',          maxHours: 28 },
] as const

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const alertPhone = process.env.ADMIN_ALERT_PHONE
  if (!alertPhone) {
    return NextResponse.json({ warning: 'ADMIN_ALERT_PHONE non configuré' })
  }

  const admin = createAdminClient()
  const now   = Date.now()
  const alerts: string[] = []

  for (const job of CRITICAL_JOBS) {
    const { data } = await admin
      .from('cron_health' as never)
      .select('last_run, last_status')
      .eq('job_name', job.name)
      .single() as unknown as { data: { last_run: string; last_status: string } | null }

    if (!data) {
      alerts.push(`${job.name}: aucune exécution enregistrée`)
      continue
    }

    const hoursSince = (now - new Date(data.last_run).getTime()) / 3600000
    if (hoursSince > job.maxHours) {
      alerts.push(`${job.name}: dernière exécution il y a ${Math.round(hoursSince)}h (max ${job.maxHours}h)`)
    }
    if (data.last_status === 'error') {
      alerts.push(`${job.name}: dernière exécution en erreur`)
    }
  }

  if (alerts.length > 0) {
    const msg = `TekkiShop ALERTE CRON:\n${alerts.join('\n')}`
    await sendWhatsApp(alertPhone, msg)
    console.error('[cron-health-check] Alertes envoyées:', alerts)
  }

  return NextResponse.json({ checked: CRITICAL_JOBS.length, alerts })
}
