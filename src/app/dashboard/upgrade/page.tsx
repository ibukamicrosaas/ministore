import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle2, MessageCircle, Zap } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Profile, Shop } from '@/types'

export const metadata = { title: 'Choisir un plan — TekkiShop' }

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: '4 900',
    description: 'Idéal pour démarrer',
    features: [
      'Produits illimités',
      'Commandes illimitées',
      'Mini site marchand en ligne',
      'Paiements Wave & Orange Money',
      'Notifications WhatsApp',
      '3% de commission sur les paiements en ligne',
    ],
    highlighted: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '9 900',
    description: 'Le plus populaire',
    features: [
      'Tout ce qui est inclus dans Starter',
      'Export CSV des commandes',
      'Rapports de revenus avancés',
      'Support prioritaire',
      '3% de commission sur les paiements en ligne',
    ],
    highlighted: true,
  },
  {
    key: 'multi',
    name: 'Multi-boutique',
    price: '19 900',
    description: 'Pour les groupes',
    features: [
      "Jusqu'à 5 boutiques",
      'Tout ce qui est inclus dans Pro',
      'Tableau de bord centralisé',
      '3% de commission sur les paiements en ligne',
    ],
    highlighted: false,
  },
]

export default async function UpgradePage() {
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

  const { data: salonData } = await supabase
    .from('shops')
    .select('name, plan, trial_ends_at')
    .eq('id', profile.shop_id)
    .single()

  const shop = salonData as Pick<Shop, 'name' | 'plan' | 'trial_ends_at'> | null
  if (!shop) redirect('/dashboard')

  const isActivePlan = shop.plan && shop.plan !== 'trial'
  const trialEnd = shop.trial_ends_at ? new Date(shop.trial_ends_at) : null
  const daysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0
  const trialEndFormatted = trialEnd
    ? format(trialEnd, 'd MMMM yyyy', { locale: fr })
    : null

  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? ''
  const waMessage = encodeURIComponent(
    `Bonjour TekkiShop ! Je suis propriétaire de la boutique "${shop.name}" et je souhaite activer mon abonnement.`
  )
  const waLink = supportPhone
    ? `https://wa.me/${supportPhone.replace(/\D/g, '')}?text=${waMessage}`
    : null

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Choisir un plan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Active ton site pour continuer à recevoir des commandes</p>
      </div>

      {/* Statut actuel */}
      {!isActivePlan && (
        <div className={`rounded-xl border p-4 ${daysLeft > 0 ? 'border-orange-100 bg-orange-50' : 'border-red-100 bg-red-50'}`}>
          <p className={`text-sm font-semibold ${daysLeft > 0 ? 'text-orange-700' : 'text-red-700'}`}>
            {daysLeft > 0
              ? `Essai gratuit — ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`
              : 'Essai expiré'}
          </p>
          {trialEndFormatted && (
            <p className={`text-xs mt-0.5 ${daysLeft > 0 ? 'text-orange-600' : 'text-red-600'}`}>
              {daysLeft > 0 ? `Expire le ${trialEndFormatted}` : `Expiré le ${trialEndFormatted}`}
            </p>
          )}
        </div>
      )}

      {isActivePlan && (
        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-700">Plan actif — {shop.plan}</p>
          <p className="text-xs text-green-600 mt-0.5">Ton site est actif et peut recevoir des commandes.</p>
        </div>
      )}

      {/* Grille des plans */}
      <div className="space-y-3">
        {PLANS.map(plan => (
          <div
            key={plan.key}
            className={`rounded-xl border p-4 ${plan.highlighted ? 'border-[var(--color-primary)] bg-sky-50' : 'border-gray-200 bg-white'}`}
          >
            {plan.highlighted && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-semibold text-white">
                  <Zap className="h-3 w-3" />
                  Recommandé
                </span>
              </div>
            )}

            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{plan.name}</h3>
                <p className="text-xs text-gray-500">{plan.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-gray-900">{plan.price}</p>
                <p className="text-xs text-gray-500">FCFA/mois</p>
              </div>
            </div>

            <ul className="space-y-1.5">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-700">
                  <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${plan.highlighted ? 'text-[var(--color-primary)]' : 'text-gray-400'}`} />
                  {f}
                </li>
              ))}
            </ul>

            {waLink && (
              <a
                href={`https://wa.me/${supportPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Bonjour TekkiShop ! Je souhaite activer le plan ${plan.name} pour ma boutique "${shop.name}".`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-opacity active:opacity-80 ${
                  plan.highlighted
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'border border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                Activer ce plan
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Note */}
      <p className="text-xs text-gray-400 text-center">
        Activation par WhatsApp · Sans carte bancaire · Paiement par Mobile Money
      </p>

      <Link href="/dashboard/settings" className="block text-center text-xs text-gray-500 hover:text-gray-700">
        ← Retour aux paramètres
      </Link>
    </div>
  )
}
