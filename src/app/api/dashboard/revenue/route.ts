import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getDateRange, type RevenuePeriod } from '@/lib/dashboard/date-range'

export async function GET(req: NextRequest) {
  const period = (req.nextUrl.searchParams.get('period') ?? 'today') as RevenuePeriod

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id) return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })

  const { from } = getDateRange(period)

  let query = supabase
    .from('orders')
    .select('total_price, status, payment_type')
    .eq('shop_id', profile.shop_id)
    .not('status', 'in', '("pending","cancelled")')

  if (from) query = query.gte('created_at', from)

  // Pour 'yesterday', exclure ce qui est >= aujourd'hui
  if (period === 'yesterday') {
    const now = new Date()
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
    query = query.lt('created_at', todayStart)
  }

  const { data } = await query

  // Argent réellement collecté :
  // — paiement en ligne (Wave, OM, Stripe) : dès 'confirmed' (webhook déclenché)
  // — paiement à la livraison / en boutique : uniquement à 'delivered'
  // — produit digital : 'completed'
  const ONLINE_TYPES = ['online_full', 'online_deposit']
  const PROGRESSING  = ['confirmed', 'preparing', 'ready', 'delivered']

  const paid = (data ?? []).filter(o =>
    o.status === 'completed' ||
    o.status === 'delivered' ||
    (ONLINE_TYPES.includes(o.payment_type ?? '') && PROGRESSING.includes(o.status ?? ''))
  )

  const revenue = paid.reduce((s, o) => s + (o.total_price ?? 0), 0)
  const count   = paid.length

  return NextResponse.json({ revenue, count })
}
