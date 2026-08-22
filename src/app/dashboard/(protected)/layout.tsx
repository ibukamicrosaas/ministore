import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types'
import { computeTrialStatus, type TrialShopFields } from '@/lib/trial-status'

// Blocage essai expiré, scopé à ce groupe de routes uniquement — /dashboard/upgrade
// (et /dashboard/upgrade/checkout) sont des FRÈRES de (protected), donc hors de ce
// layout : ils ne passent jamais par ce blocage, sans liste d'exceptions à maintenir.
// dashboard/layout.tsx (parent) garde l'auth + le fetch profil/boutique pour toutes
// les routes /dashboard/*, y compris upgrade — inchangé.
export default async function ProtectedDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileResult = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileResult.data as Profile | null
  if (profileResult.error || !profile || !profile.shop_id) redirect('/onboarding')

  const shopResult = await supabase
    .from('shops')
    .select('trial_model, plan, trial_ends_at')
    .eq('id', profile.shop_id)
    .single()

  const shop = shopResult.data as TrialShopFields | null
  if (shopResult.error || !shop) redirect('/onboarding')

  if (computeTrialStatus(shop).trialExpired) redirect('/essai-expire')

  return <>{children}</>
}
