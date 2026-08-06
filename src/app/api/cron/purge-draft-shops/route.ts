import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/auth/verify-cron'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('purge_draft_shops')

  if (error) {
    console.error('[cron/purge-draft-shops]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ purged: data })
}
