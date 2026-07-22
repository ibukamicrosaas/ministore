'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// ── Auth helper ──────────────────────────────────────────────────────────────
// Vérifie que l'utilisateur courant est bien country manager.
// Retourne { userId, country, name } ou redirige vers /dashboard.
export async function requireCountryManager() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: cm } = await (admin
    .from('country_managers' as never)
    .select('country, name')
    .eq('user_id' as never, user.id)
    .single() as unknown as Promise<{ data: { country: string; name: string } | null }>)

  if (!cm) redirect('/dashboard')

  return { userId: user.id, country: cm.country, name: cm.name }
}

// ── KPIs ─────────────────────────────────────────────────────────────────────
export async function getCountryKPIs(country: string) {
  const admin = createAdminClient()

  const [
    { count: totalShops },
    { count: activeShops },
    { count: trialShops },
    { data: recentOrders },
  ] = await Promise.all([
    admin.from('shops').select('id', { count: 'exact', head: true }).eq('country', country),
    admin.from('shops').select('id', { count: 'exact', head: true }).eq('country', country).eq('is_active', true),
    admin.from('shops').select('id', { count: 'exact', head: true }).eq('country', country).eq('plan', 'trial'),
    admin
      .from('orders')
      .select('id, total_price, created_at')
      .in('shop_id',
        admin.from('shops').select('id').eq('country', country) as unknown as string[]
      )
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .in('status', ['confirmed', 'preparing', 'ready', 'delivered', 'completed']),
  ])

  const ordersThisMonth = recentOrders?.length ?? 0
  const revenueThisMonth = recentOrders?.reduce((s, o) => s + (o.total_price ?? 0), 0) ?? 0

  return {
    totalShops:      totalShops      ?? 0,
    activeShops:     activeShops     ?? 0,
    trialShops:      trialShops      ?? 0,
    ordersThisMonth,
    revenueThisMonth,
  }
}

// ── Shops list ────────────────────────────────────────────────────────────────
export async function getCountryShops(country: string) {
  const admin = createAdminClient()

  const { data } = await admin
    .from('shops')
    .select('id, name, slug, logo_url, plan, is_active, phone_whatsapp, city, created_at, primary_color')
    .eq('country', country)
    .order('created_at', { ascending: false })

  return data ?? []
}

// ── Product counts per shop ───────────────────────────────────────────────────
export async function getShopProductCounts(shopIds: string[]) {
  if (shopIds.length === 0) return {}
  const admin = createAdminClient()

  const { data } = await admin
    .from('products')
    .select('shop_id')
    .in('shop_id', shopIds)
    .eq('is_active', true)

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.shop_id] = (counts[row.shop_id] ?? 0) + 1
  }
  return counts
}
