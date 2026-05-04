import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest) {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('expire_pending_orders')

  if (error) {
    console.error('[cron/expire-pending]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ expired: data })
}
