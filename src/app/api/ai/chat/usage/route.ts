import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PLAN_LIMITS: Record<string, number> = {
  trial:      20,
  decouverte: 20,
  business:   50,
  pro:        Infinity,
}

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id) {
    return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data: shop } = await admin
    .from('shops')
    .select('id, plan')
    .eq('id', profile.shop_id)
    .single()

  if (!shop) {
    return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
  }

  const limit = PLAN_LIMITS[shop.plan ?? 'trial'] ?? 20
  const today = new Date().toISOString().slice(0, 10)

  const { data: usage } = await admin
    .from('ai_chat_usage' as never)
    .select('message_count')
    .eq('shop_id', shop.id)
    .eq('date', today)
    .maybeSingle() as { data: { message_count: number } | null }

  const used = usage?.message_count ?? 0
  const remaining = limit === Infinity ? null : Math.max(0, limit - used)

  return NextResponse.json({
    used,
    limit: limit === Infinity ? null : limit,
    remaining,
    plan: shop.plan,
  })
}
