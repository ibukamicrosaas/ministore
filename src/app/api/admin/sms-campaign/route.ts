import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/notifications/whatsapp'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

export async function POST(req: NextRequest) {
  // 1. Session admin
  const supabaseUser = await createServerClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as { message?: string; shopIds?: string[] }
  const { message, shopIds } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message requis' }, { status: 400 })
  }
  if (!Array.isArray(shopIds) || shopIds.length === 0) {
    return NextResponse.json({ error: 'Aucune boutique sélectionnée' }, { status: 400 })
  }
  if (shopIds.length > 500) {
    return NextResponse.json({ error: 'Maximum 500 boutiques par campagne' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: shops } = await supabase
    .from('shops')
    .select('id, phone_whatsapp')
    .in('id', shopIds)

  const rows = (shops ?? []) as { id: string; phone_whatsapp: string | null }[]

  let sent = 0, failed = 0, skipped = 0

  for (const shop of rows) {
    if (!shop.phone_whatsapp) { skipped++; continue }
    try {
      const result = await sendSMS(shop.phone_whatsapp, message.trim())
      if (result.success) { sent++ } else { failed++ }
    } catch {
      failed++
    }
  }

  return NextResponse.json({ sent, failed, skipped })
}
