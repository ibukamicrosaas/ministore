import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types'
import { PromoCodesClient } from './PromoCodesClient'

export const metadata = { title: 'Codes promo — TekkiShop' }

type PromoCode = {
  id: string
  code: string
  discount_pct: number
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export default async function PromoCodesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles').select('shop_id, role').eq('id', user.id).single()
  const profile = profileData as Pick<Profile, 'shop_id' | 'role'> | null
  if (!profile?.shop_id || profile.role !== 'owner') redirect('/dashboard')

  const admin = createAdminClient()
  const { data } = await admin
    .from('promo_codes')
    .select('id, code, discount_pct, max_uses, used_count, expires_at, is_active, created_at')
    .eq('shop_id', profile.shop_id)
    .order('created_at', { ascending: false })

  const codes = (data ?? []) as PromoCode[]

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Codes promo</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Créez des codes de réduction pour vos clients. Ils les saisissent lors de la commande.
        </p>
      </div>
      <PromoCodesClient codes={codes} />
    </div>
  )
}
