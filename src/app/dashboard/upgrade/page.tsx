import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import type { Profile, Shop } from '@/types'
import { UpgradePlans } from './UpgradePlans'
import { PaymentVerifier } from './PaymentVerifier'
import { getPlansForCountry } from '@/lib/billing/plans'

export const metadata = { title: 'Choisir un plan — TekkiShop' }

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; plan?: string; error?: string }>
}) {
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

  const { data: shopData } = await supabase
    .from('shops')
    .select('name, plan, is_active, country, subscription_ends_at')
    .eq('id', profile.shop_id)
    .single()

  const shop = shopData as Pick<Shop, 'name' | 'plan' | 'is_active'> & { country?: string; subscription_ends_at?: string | null } | null
  if (!shop) redirect('/dashboard')

  const { success, plan: activatedPlan, error } = await searchParams

  const cookieStore = await cookies()
  const cookieTxn   = cookieStore.get('pending_sub_txn')?.value ?? null
  const cookiePlan  = cookieStore.get('pending_sub_plan')?.value ?? null
  const serverTxn   = (success && activatedPlan && cookiePlan === activatedPlan) ? cookieTxn : null

  // Détecter EU/CA et sélectionner les plans appropriés
  const shopCountry = shop.country ?? null
  const { plans, isEuCa } = getPlansForCountry(shopCountry)

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Choisir un plan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Active ton site pour recevoir des commandes</p>
      </div>

      {success && activatedPlan && (
        <PaymentVerifier
          activatedPlan={activatedPlan}
          shopIsActive={shop.is_active ?? false}
          serverTxn={serverTxn}
        />
      )}

      {error && !success && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">Paiement annulé ou échoué.</p>
          <p className="text-xs text-red-600 mt-0.5">Tu peux réessayer ci-dessous.</p>
        </div>
      )}

      <UpgradePlans
        plans={plans}
        currentPlan={shop.plan}
        isEuCa={isEuCa}
        showCardOption={!isEuCa}
        subscriptionEndsAt={shop.subscription_ends_at ?? null}
      />

      <p className="text-xs text-gray-400 text-center">
        {isEuCa
          ? 'Paiement sécurisé par carte bancaire via Stripe · Sans engagement'
          : 'Paiement par mobile money (Wave, Orange Money, MaxIt) ou par carte bancaire en €'
        }
      </p>

      <Link href="/dashboard/settings" className="block text-center text-xs text-gray-500 hover:text-gray-700">
        ← Retour aux paramètres
      </Link>
    </div>
  )
}
