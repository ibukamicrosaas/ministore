import { createAdminClient } from '@/lib/supabase/admin'

export async function recordCronRun(
  jobName: string,
  status: 'ok' | 'error' = 'ok',
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin
      .from('cron_health' as never)
      .upsert({
        job_name:    jobName,
        last_run:    new Date().toISOString(),
        last_status: status,
        details:     details ?? null,
      } as never, { onConflict: 'job_name' })
  } catch (err) {
    console.error('[cron/health] recordCronRun error:', err)
  }
}
