import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Toaster } from 'react-hot-toast'
import type { Profile, Shop } from '@/types'
import Link from 'next/link'
import { getFreeOrdersSummary } from '@/lib/orders/free-orders-summary'
import { computeTrialStatus } from '@/lib/trial-status'

export const metadata: Metadata = { robots: { index: false, follow: false } }

const ADMIN_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

export default async function DashboardLayout({
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
  if (profileResult.error || !profile) redirect('/login')

  if (!profile.shop_id) redirect('/onboarding')

  const shopResult = await supabase
    .from('shops')
    .select('*')
    .eq('id', profile.shop_id)
    .single()

  const shop = shopResult.data as Shop | null
  if (shopResult.error || !shop) redirect('/onboarding')

  // Unread notifications count
  const adminClient = createAdminClient()
  const { count: unreadCount } = await adminClient
    .from('shop_notifications' as never)
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shop.id)
    .is('read_at', null) as unknown as { count: number | null }

  const isAdmin    = ADMIN_IDS.includes(user.id)
  // Le blocage "essai expiré" est décidé par dashboard/(protected)/layout.tsx,
  // scopé pour exclure /dashboard/upgrade (sibling, hors de ce groupe) — voir
  // REPRISE.md pour le détail. Ce layout partagé garde seulement les bannières.
  const { isTrial, trialWarning, trialLeft } = computeTrialStatus(shop)
  const isPaid     = !isTrial

  // Banners abonnement payant
  const subEnd      = (shop as Shop & { subscription_ends_at?: string | null }).subscription_ends_at
    ? new Date((shop as Shop & { subscription_ends_at?: string | null }).subscription_ends_at!)
    : null
  const subLeft     = subEnd
    ? Math.ceil((subEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const subExpired  = isPaid && subLeft !== null && subLeft <= 0
  const subWarning7 = isPaid && subLeft !== null && subLeft > 3  && subLeft <= 7
  const subWarning3 = isPaid && subLeft !== null && subLeft > 0  && subLeft <= 3

  // Calcul de la bannière de renouvellement (une seule, la plus urgente)
  const renewalBanner = (() => {
    if (subExpired) return (
      <div className="flex items-center gap-3 bg-red-600 px-4 py-2.5 shrink-0">
        <span className="shrink-0 rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-white">
          Expiré
        </span>
        <p className="flex-1 text-sm font-medium text-white">
          Votre abonnement est expiré — votre boutique est suspendue.
        </p>
        <Link
          href="/dashboard/upgrade"
          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
        >
          Renouveler →
        </Link>
      </div>
    )
    if (subWarning3) return (
      <div className="flex items-center gap-3 bg-orange-500 px-4 py-2.5 shrink-0">
        <span className="shrink-0 rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-white">
          {subLeft} jour{subLeft! > 1 ? 's' : ''}
        </span>
        <p className="flex-1 text-sm font-medium text-white">
          Votre abonnement expire bientôt. Renouvelez maintenant pour ne pas interrompre vos ventes.
        </p>
        <Link
          href="/dashboard/upgrade"
          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-orange-600 hover:bg-orange-50 transition-colors"
        >
          Renouveler →
        </Link>
      </div>
    )
    if (subWarning7) return (
      <div className="flex items-center gap-3 bg-amber-500 px-4 py-2.5 shrink-0">
        <span className="shrink-0 rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-white">
          {subLeft} jours
        </span>
        <p className="flex-1 text-sm font-medium text-white">
          Votre abonnement expire dans {subLeft} jours.
        </p>
        <Link
          href="/dashboard/upgrade"
          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 transition-colors"
        >
          Renouveler →
        </Link>
      </div>
    )
    if (isTrial && trialWarning) return (
      <div className="flex items-center gap-3 bg-amber-500 px-4 py-2.5 shrink-0">
        <span className="shrink-0 rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-white">
          {trialLeft} jour{trialLeft! > 1 ? 's' : ''}
        </span>
        <p className="flex-1 text-sm font-medium text-white">
          Votre boutique n&apos;est pas encore active. Choisissez un plan pour commencer à vendre.
        </p>
        <Link
          href="/dashboard/upgrade"
          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 transition-colors"
        >
          Activer →
        </Link>
      </div>
    )
    return null
  })()

  // Bandeau permanent §7 — essai free_orders expiré, sur toutes les pages du
  // tableau de bord (indépendant de l'écran cas A/B, refermable lui, qui ne
  // s'affiche qu'à l'accueil).
  let expiredBanner: React.ReactNode = null
  if (shop.trial_model === 'free_orders' && shop.status === 'expired') {
    const { heldCount } = await getFreeOrdersSummary(supabase, shop.id)
    expiredBanner = (
      <div className="flex items-center gap-3 bg-gray-800 px-4 py-2.5 shrink-0">
        <p className="flex-1 text-sm font-medium text-white">
          {heldCount > 0
            ? `${heldCount} commande${heldCount > 1 ? 's' : ''} retenue${heldCount > 1 ? 's' : ''}, en attente que tu actives un plan.`
            : 'Ta boutique reste visible, mais elle ne peut plus recevoir de commandes.'}
        </p>
        <Link
          href="/dashboard/upgrade"
          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-gray-800 hover:bg-gray-100 transition-colors"
        >
          Activer →
        </Link>
      </div>
    )
  }

  return (
    <>
      <DashboardShell shop={shop} profile={profile} unreadNotifications={unreadCount ?? 0} isAdmin={isAdmin} renewalBanner={renewalBanner} isTrial={isTrial} expiredBanner={expiredBanner}>
        {children}
      </DashboardShell>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: '14px' },
        }}
      />
    </>
  )
}
