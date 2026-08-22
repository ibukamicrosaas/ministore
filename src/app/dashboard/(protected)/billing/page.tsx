import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { differenceInDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  CreditCard,
  CalendarDays,
  RefreshCw,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { PLAN_LABELS } from '@/constants'
import { CancelSubscriptionButton } from './CancelSubscriptionButton'

export const metadata = { title: 'Facturation — TekkiShop' }

const PLAN_PRICES: Record<string, number> = {
  decouverte: 2900,
  business:   4900,
  pro:        9900,
}

const PLAN_ANNUAL_PRICES: Record<string, number> = {
  decouverte: 29000,
  business:   49000,
  pro:        99000,
}

const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  trial:      { bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-200' },
  decouverte: { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200' },
  business:   { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200' },
  pro:        { bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200' },
}

const GRACE_PERIOD_DAYS = 3

type SubscriptionTransaction = {
  id: string
  plan_key: string
  status: string
  billing_cycle: 'monthly' | 'annual' | null
  activated_at: string | null
  created_at: string
  payer_phone: string | null
}

export default async function BillingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { shop_id: string | null; role: string } | null
  if (!profile?.shop_id || profile.role !== 'owner') redirect('/dashboard')

  const shopId = profile.shop_id

  const { data: shopData } = await supabase
    .from('shops')
    .select('plan, trial_ends_at, subscription_ends_at')
    .eq('id', shopId)
    .single()

  if (!shopData) redirect('/dashboard')
  const shop = shopData as {
    plan: string
    trial_ends_at: string | null
    subscription_ends_at: string | null
  }

  const { data: cancelData } = await supabase
    .from('shops')
    .select('plan_cancel_at_period_end' as never)
    .eq('id', shopId)
    .single()
  const cancelAtPeriodEnd = cancelData
    ? Boolean((cancelData as unknown as Record<string, unknown>).plan_cancel_at_period_end)
    : false

  // subscription_transactions n'a pas de politique RLS SELECT pour les owners
  const admin = createAdminClient()
  const { data: txData } = await admin
    .from('subscription_transactions' as never)
    .select('id, plan_key, status, billing_cycle, activated_at, created_at, payer_phone')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  const transactions = (txData ?? []) as SubscriptionTransaction[]
  const lastActivated = transactions.find(t => t.status === 'activated') ?? null

  const activatedAt = lastActivated?.activated_at ? new Date(lastActivated.activated_at) : null

  const expiresAt       = shop.subscription_ends_at ? new Date(shop.subscription_ends_at) : null
  const daysUntilExpiry = expiresAt ? differenceInDays(expiresAt, new Date()) : null

  const isExpired     = daysUntilExpiry !== null && daysUntilExpiry < 0
  const isInGrace     = isExpired && daysUntilExpiry! >= -GRACE_PERIOD_DAYS
  const isDeactivated = isExpired && daysUntilExpiry! < -GRACE_PERIOD_DAYS
  const expiresSoon   = !isExpired && daysUntilExpiry !== null && daysUntilExpiry <= 3

  const isTrial       = shop.plan === 'trial'
  const trialEnd      = shop.trial_ends_at ? new Date(shop.trial_ends_at) : null
  const trialDaysLeft = trialEnd ? differenceInDays(trialEnd, new Date()) : null
  const trialExpired  = trialDaysLeft !== null && trialDaysLeft < 0

  const planColor = PLAN_COLORS[shop.plan] ?? PLAN_COLORS.trial

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Facturation</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ton abonnement et tes paiements TekkiShop</p>
      </div>

      {/* Plan actuel */}
      <Card padding="lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${planColor.bg} ${planColor.border}`}>
              <CreditCard className={`h-5 w-5 ${planColor.text}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Plan actuel</p>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold border ${planColor.bg} ${planColor.text} ${planColor.border}`}>
                {PLAN_LABELS[shop.plan] ?? shop.plan}
              </span>
            </div>
          </div>
          {!isTrial && PLAN_PRICES[shop.plan] && (() => {
            const isAnnual = lastActivated?.billing_cycle === 'annual'
            const displayPrice = isAnnual
              ? PLAN_ANNUAL_PRICES[shop.plan]
              : PLAN_PRICES[shop.plan]
            return (
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-gray-900">
                  {displayPrice?.toLocaleString('fr-FR')}
                  <span className="text-sm font-normal text-gray-400 ml-1">FCFA</span>
                </p>
                <p className="text-xs text-gray-400">/ {isAnnual ? 'an' : 'mois'}</p>
                {isAnnual && (
                  <span className="inline-block mt-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    2 mois offerts
                  </span>
                )}
              </div>
            )
          })()}
        </div>

        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          {isTrial ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  Fin de l&apos;essai
                </span>
                <span className="font-medium text-gray-900">
                  {trialEnd ? format(trialEnd, 'd MMMM yyyy', { locale: fr }) : '—'}
                </span>
              </div>
              {!trialExpired && trialDaysLeft !== null && (
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${trialDaysLeft <= 5 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {trialDaysLeft > 0
                    ? `Il te reste ${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''} d'essai.`
                    : "Ton essai se termine aujourd'hui."}
                </div>
              )}
              {trialExpired && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Ton essai gratuit est terminé.
                </div>
              )}
              <Link
                href="/dashboard/upgrade"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E85D04] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                <Zap className="h-4 w-4" />
                Choisir un plan payant
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {activatedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-gray-400" />
                    Actif depuis
                  </span>
                  <span className="font-medium text-gray-900">
                    {format(activatedAt, 'd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
              )}
              {expiresAt ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4 text-gray-400" />
                    {isExpired ? 'Expiré le' : 'Expire le'}
                  </span>
                  <span className={`font-semibold ${isDeactivated || isInGrace ? 'text-red-600' : expiresSoon ? 'text-amber-600' : 'text-gray-900'}`}>
                    {format(expiresAt, 'd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4 text-gray-400" />
                    Date d&apos;expiration
                  </span>
                  <span className="text-gray-400 text-xs">Non définie</span>
                </div>
              )}

              {expiresSoon && !isExpired && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {daysUntilExpiry === 0
                    ? "Ton abonnement expire aujourd'hui."
                    : `Ton abonnement expire dans ${daysUntilExpiry} jour${daysUntilExpiry! > 1 ? 's' : ''}.`}
                </div>
              )}
              {isInGrace && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Abonnement expiré. Renouvelle dans les {GRACE_PERIOD_DAYS + (daysUntilExpiry ?? 0)} jour{(GRACE_PERIOD_DAYS + (daysUntilExpiry ?? 0)) > 1 ? 's' : ''} pour éviter la suspension.
                </div>
              )}
              {isDeactivated && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Ton site est suspendu suite à l&apos;expiration de l&apos;abonnement.
                </div>
              )}

              <Link
                href="/dashboard/upgrade"
                className={`mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isExpired
                    ? 'bg-[#E85D04] text-white hover:opacity-90'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <RefreshCw className="h-4 w-4" />
                {isExpired ? 'Renouveler maintenant' : 'Renouveler / Changer de plan'}
              </Link>

              {!isExpired && (
                <CancelSubscriptionButton
                  cancelAtPeriodEnd={cancelAtPeriodEnd}
                  expiresAt={shop.subscription_ends_at}
                />
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Historique des transactions */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-3">Historique des paiements</p>
        {transactions.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 py-10 text-center">
            <p className="text-sm text-gray-400">Aucun paiement enregistré.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => {
              const isActivated = tx.status === 'activated'
              const isFailed    = tx.status === 'failed'
              const StatusIcon  = isActivated ? CheckCircle : isFailed ? XCircle : Clock
              const statusColor = isActivated ? 'text-green-600' : isFailed ? 'text-red-500' : 'text-amber-500'
              const statusLabel = isActivated ? 'Activé' : isFailed ? 'Échoué' : 'En attente'
              const iconBg      = isActivated ? 'bg-green-100' : isFailed ? 'bg-red-100' : 'bg-amber-100'
              const isAnnualTx = tx.billing_cycle === 'annual'
              const price = isAnnualTx
                ? (PLAN_ANNUAL_PRICES[tx.plan_key] ?? 0)
                : (PLAN_PRICES[tx.plan_key] ?? 0)
              return (
                <div key={tx.id} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${iconBg}`}>
                    <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">
                        Plan {PLAN_LABELS[tx.plan_key] ?? tx.plan_key}
                      </p>
                      {isAnnualTx && (
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 uppercase tracking-wide">
                          Annuel
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(new Date(tx.created_at), 'd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {price > 0 && (
                      <p className="text-sm font-semibold text-gray-900">
                        {price.toLocaleString('fr-FR')} FCFA
                      </p>
                    )}
                    <p className={`text-xs font-medium ${statusColor}`}>{statusLabel}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
