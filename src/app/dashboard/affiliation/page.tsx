import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { APP_URL } from '@/constants'
import type { Profile } from '@/types'
import { AffiliationClient } from './AffiliationClient'

export const metadata = { title: 'Affiliation — TekkiShop' }

// Commissions par plan (FCFA)
export const AFFILIATION_COMMISSIONS: Record<string, number> = {
  decouverte: 1000,
  business:   2000,
  pro:        4000,
}

export default async function AffiliationPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'shop_id' | 'role'> | null
  if (!profile?.shop_id || profile.role !== 'owner') redirect('/dashboard')

  const admin = createAdminClient()

  // Récupérer le ref_code de la boutique (colonne ajoutée par migration 018)
  const { data: shopData } = await admin
    .from('shops')
    .select('ref_code, slug')
    .eq('id', profile.shop_id)
    .single()

  // Fallback : si la migration n'est pas encore appliquée, dériver le code du shop_id
  const shopId  = profile.shop_id
  const refCode = (shopData as { ref_code?: string | null; slug?: string } | null)?.ref_code
    ?? shopId.replace(/-/g, '').slice(0, 8).toUpperCase()

  const referralLink = `${APP_URL.replace(/^http:\/\//, 'https://')}/?ref=${refCode}`

  // Statistiques de parrainage (table referral_commissions — migration 018)
  let totalEarned    = 0
  let availableBalance = 0
  let referredCount  = 0
  let commissions: {
    id: string
    plan: string
    commission_amount: number
    status: string
    created_at: string
  }[] = []

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: commsData } = await (admin as any)
      .from('referral_commissions')
      .select('id, plan, commission_amount, status, created_at')
      .eq('referrer_shop_id', shopId)
      .order('created_at', { ascending: false })

    if (commsData) {
      commissions    = commsData as typeof commissions
      referredCount  = commissions.length
      totalEarned    = commissions.reduce((s, c) => s + c.commission_amount, 0)
      availableBalance = commissions
        .filter(c => c.status === 'pending')
        .reduce((s, c) => s + c.commission_amount, 0)
    }
  } catch {
    // table pas encore créée — stats à zéro
  }

  return (
    <AffiliationClient
      refCode={refCode}
      referralLink={referralLink}
      totalEarned={totalEarned}
      availableBalance={availableBalance}
      referredCount={referredCount}
      commissions={commissions}
      commissionRates={AFFILIATION_COMMISSIONS}
    />
  )
}
