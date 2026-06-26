import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { SalonPlanEditor } from './SalonPlanEditor'
import type { SalonAdminData } from './SalonPlanEditor'

export const metadata = { title: 'Modifier la boutique — Admin TekkiShop' }

export default async function AdminShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('shops')
    .select('id, name, slug, plan, trial_ends_at, subscription_ends_at, is_active, phone_whatsapp, city, created_at')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  return <SalonPlanEditor salon={data as unknown as SalonAdminData} />
}
