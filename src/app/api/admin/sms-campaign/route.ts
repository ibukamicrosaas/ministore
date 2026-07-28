import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/notifications/whatsapp'

export const maxDuration = 300

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

const BATCH_SIZE = 10

async function sendBatch(
  batch: { id: string; phone_whatsapp: string | null }[],
  message: string,
): Promise<{ sent: number; failed: number; skipped: number }> {
  let sent = 0, failed = 0, skipped = 0
  await Promise.allSettled(
    batch.map(async (shop) => {
      if (!shop.phone_whatsapp) { skipped++; return }
      try {
        const result = await sendSMS(shop.phone_whatsapp, message)
        if (result.success) { sent++ } else { failed++ }
      } catch {
        failed++
      }
    })
  )
  return { sent, failed, skipped }
}

export async function POST(req: NextRequest) {
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

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const result = await sendBatch(batch, message.trim())
    sent    += result.sent
    failed  += result.failed
    skipped += result.skipped
  }

  return NextResponse.json({ sent, failed, skipped })
}
