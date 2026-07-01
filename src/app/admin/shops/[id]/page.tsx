import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { SalonPlanEditor } from './SalonPlanEditor'
import type { SalonAdminData } from './SalonPlanEditor'

export const metadata = { title: 'Modifier la boutique — Admin TekkiShop' }

export default async function AdminShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data, error }, { data: revenueRows }] = await Promise.all([
    supabase
      .from('shops')
      .select('id, name, slug, plan, trial_ends_at, subscription_ends_at, is_active, phone_whatsapp, city, created_at')
      .eq('id', id)
      .single(),
    supabase
      .from('orders')
      .select('total_price')
      .eq('shop_id', id)
      .in('payment_type', ['online_full', 'online_deposit'])
      .not('status', 'in', '("pending","cancelled")'),
  ])

  if (error || !data) notFound()

  const onlineRevenue = ((revenueRows ?? []) as { total_price: number }[])
    .reduce((s, o) => s + (o.total_price ?? 0), 0)

  return <SalonPlanEditor salon={data as unknown as SalonAdminData} onlineRevenue={onlineRevenue} />
}
