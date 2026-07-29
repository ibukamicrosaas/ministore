import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const body = await req.json() as { adminReference?: string }
  const adminReference = body.adminReference?.trim() || null

  const admin = createAdminClient()

  const { data: payout, error: fetchErr } = await (admin
    .from('country_manager_payouts' as never)
    .select('id, status, amount, country')
    .eq('id' as never, id)
    .single() as unknown as Promise<{
      data: { id: string; status: string; amount: number; country: string } | null
      error: Error | null
    }>)

  if (fetchErr || !payout) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  }
  if (payout.status !== 'pending') {
    return NextResponse.json({ error: `Demande déjà traitée (${payout.status})` }, { status: 400 })
  }

  const { error } = await (admin
    .from('country_manager_payouts' as never)
    .update({
      status:          'paid',
      paid_at:         new Date().toISOString(),
      admin_reference: adminReference,
      updated_at:      new Date().toISOString(),
    } as never)
    .eq('id' as never, id) as unknown as Promise<{ error: Error | null }>)

  if (error) {
    console.error('[admin/cm-payouts/complete]', error.message)
    return NextResponse.json({ error: 'Impossible de mettre à jour la demande' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
