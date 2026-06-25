import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  // MED-3 : rate limit — max 10 vérifications par IP / minute (évite l'énumération)
  const limited = await checkRateLimit(req, { key: 'check-promo', maxRequests: 10, windowMs: 60_000 })
  if (limited) return limited

  const { searchParams } = req.nextUrl
  const shopId = searchParams.get('shopId')?.trim()
  const code   = searchParams.get('code')?.trim().toUpperCase()

  if (!shopId || !code) {
    return NextResponse.json({ valid: false, error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('promo_codes')
    .select('id, discount_pct, max_uses, used_count, expires_at')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .ilike('code', code)
    .single()

  if (!data) {
    return NextResponse.json({ valid: false, error: 'Code invalide ou inactif' })
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Ce code a expiré' })
  }

  if (data.max_uses !== null && data.used_count >= data.max_uses) {
    return NextResponse.json({ valid: false, error: 'Ce code a atteint son nombre maximum d\'utilisations' })
  }

  return NextResponse.json({ valid: true, discount_pct: data.discount_pct, promo_id: data.id })
}
