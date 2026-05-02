import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('payouts')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) {
    console.error('[admin/payouts/complete]', error.message)
    return NextResponse.json({ error: 'Impossible de mettre à jour' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
