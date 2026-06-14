import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import type { Profile, Shop } from '@/types'
import { UpgradePlans, type Plan } from './UpgradePlans'
import { PaymentVerifier } from './PaymentVerifier'

export const metadata = { title: 'Choisir un plan — TekkiShop' }

const PLANS: Plan[] = [
  {
    key:          'decouverte',
    name:         'Découverte',
    price:        '2 900',
    priceInt:     2900,
    annualPrice:  29000,
    description:  'Pour commencer simplement',
    promo:        null,
    features: [
      'Boutique en ligne immédiatement',
      "Jusqu'à 10 produits actifs",
      'Paiements Wave & Orange Money',
      'Paiement à la livraison',
      'Suivi des commandes en temps réel',
      '3% de commission sur paiements en ligne',
    ],
    highlighted: false,
  },
  {
    key:          'business',
    name:         'Business',
    price:        '4 900',
    priceInt:     4900,
    annualPrice:  49000,
    description:  'Le plus populaire',
    promo:        '🎁 1 MOIS OFFERT — OFFRE DE LANCEMENT',
    features: [
      'Tout du plan Découverte',
      'Produits illimités',
      'Confirmations WhatsApp automatiques aux clients',
      'Rappels J-1 avant livraison',
      'Alertes retour en stock pour tes clients',
      'Codes promo & réductions',
      'Dashboard optimisé sur mobile',
      '3% de commission sur paiements en ligne',
    ],
    highlighted: true,
  },
  {
    key:          'pro',
    name:         'Pro',
    price:        '9 900',
    priceInt:     9900,
    annualPrice:  99000,
    description:  'Pour les boutiques ambitieuses',
    promo:        null,
    features: [
      'Tout du plan Business',
      '0% de commission sur paiements en ligne',
      'Domaine personnalisé (tonsite.com)',
      'Section "À propos" avec photo de boutique',
      'Statistiques avancées & analyses',
      'Export CSV de tes commandes',
      'Meta Pixel (suivi Facebook/Instagram Ads)',
      'Support prioritaire WhatsApp',
    ],
    highlighted: false,
  },
]

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
    .select('name, plan, is_active')
    .eq('id', profile.shop_id)
    .single()

  const shop = shopData as Pick<Shop, 'name' | 'plan' | 'is_active'> | null
  if (!shop) redirect('/dashboard')

  const { success, plan: activatedPlan, error } = await searchParams

  // Lire le txn depuis le cookie (fallback si sessionStorage perdu après redirection mobile)
  const cookieStore = await cookies()
  const cookieTxn   = cookieStore.get('pending_sub_txn')?.value ?? null
  const cookiePlan  = cookieStore.get('pending_sub_plan')?.value ?? null
  const serverTxn   = (success && activatedPlan && cookiePlan === activatedPlan) ? cookieTxn : null

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Choisir un plan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Active ton site pour recevoir des commandes</p>
      </div>

      {/* Vérification + activation au retour du paiement */}
      {success && activatedPlan && (
        <PaymentVerifier
          activatedPlan={activatedPlan}
          shopIsActive={shop.is_active ?? false}
          serverTxn={serverTxn}
        />
      )}

      {/* Erreur de paiement */}
      {error && !success && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">Paiement annulé ou échoué.</p>
          <p className="text-xs text-red-600 mt-0.5">Tu peux réessayer ci-dessous.</p>
        </div>
      )}

      <UpgradePlans plans={PLANS} currentPlan={shop.plan} />

      <p className="text-xs text-gray-400 text-center">
        Sans carte bancaire · Paiement sécurisé par Bictorys · Wave, Orange Money, MaxIt
      </p>

      <Link href="/dashboard/settings" className="block text-center text-xs text-gray-500 hover:text-gray-700">
        ← Retour aux paramètres
      </Link>
    </div>
  )
}
