import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export type RevenuePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'semester' | 'year' | 'all'

export function getDateRange(period: RevenuePeriod): { from: string | null } {
  const now  = new Date()
  const y = now.getUTCFullYear(), m = now.getUTCMonth(), d = now.getUTCDate()

  switch (period) {
    case 'today':
      return { from: new Date(Date.UTC(y, m, d)).toISOString() }
    case 'yesterday':
      return { from: new Date(Date.UTC(y, m, d - 1)).toISOString() }
    case 'week': {
      const dow = (now.getUTCDay() + 6) % 7 // lundi = 0
      return { from: new Date(Date.UTC(y, m, d - dow)).toISOString() }
    }
    case 'month':
      return { from: new Date(Date.UTC(y, m, 1)).toISOString() }
    case 'quarter':
      return { from: new Date(Date.UTC(y, m - 2, 1)).toISOString() }
    case 'semester':
      return { from: new Date(Date.UTC(y, m - 5, 1)).toISOString() }
    case 'year':
      return { from: new Date(Date.UTC(y, 0, 1)).toISOString() }
    case 'all':
      return { from: null }
  }
}

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
