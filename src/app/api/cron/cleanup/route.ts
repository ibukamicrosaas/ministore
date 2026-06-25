import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/auth/verify-cron'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createAdminClient()

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { error, count } = await supabase
    .from('login_attempts')
    .delete({ count: 'exact' })
    .lt('attempted_at', cutoff)

  if (error) {
    console.error('[cron/cleanup]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: count ?? 0 })
}
