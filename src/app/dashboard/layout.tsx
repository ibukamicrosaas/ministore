import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Toaster } from 'react-hot-toast'
import type { Profile, Shop } from '@/types'
import Link from 'next/link'

export const metadata: Metadata = { robots: { index: false, follow: false } }

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

  const isTrial    = shop.plan === 'trial'
  const isPaid     = !isTrial

  // Banners essai gratuit
  const trialEnd     = shop.trial_ends_at ? new Date(shop.trial_ends_at) : null
  const trialLeft    = trialEnd
    ? Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const trialExpired = isTrial && trialLeft !== null && trialLeft <= 0
  const trialWarning = isTrial && trialLeft !== null && trialLeft > 0 && trialLeft <= 7

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

  return (
    <>
      {/* ── Essai gratuit ─────────────────────────────────────── */}
      {isTrial && trialExpired && (
        <div className="bg-red-600 text-white text-center px-4 py-2.5 text-sm font-medium">
          ⛔ Votre essai gratuit est terminé — votre boutique est suspendue.{' '}
          <Link href="/dashboard/upgrade" className="underline font-bold hover:opacity-80">
            Choisir un plan →
          </Link>
        </div>
      )}
      {isTrial && trialWarning && (
        <div className="bg-amber-500 text-white text-center px-4 py-2.5 text-sm font-medium">
          ⚠️ Votre essai expire dans {trialLeft} jour{trialLeft! > 1 ? 's' : ''}.{' '}
          <Link href="/dashboard/upgrade" className="underline font-bold hover:opacity-80">
            Choisir un plan →
          </Link>
        </div>
      )}

      {/* ── Abonnement payant ─────────────────────────────────── */}
      {subExpired && (
        <div className="bg-red-600 text-white text-center px-4 py-2.5 text-sm font-medium">
          ⛔ Votre abonnement est expiré — votre boutique est suspendue.{' '}
          <Link href="/dashboard/upgrade" className="underline font-bold hover:opacity-80">
            Renouveler →
          </Link>
        </div>
      )}
      {subWarning3 && (
        <div className="bg-red-500 text-white text-center px-4 py-2.5 text-sm font-medium">
          🔴 Votre abonnement expire dans {subLeft} jour{subLeft! > 1 ? 's' : ''} !{' '}
          <Link href="/dashboard/upgrade" className="underline font-bold hover:opacity-80">
            Renouveler maintenant →
          </Link>
        </div>
      )}
      {subWarning7 && (
        <div className="bg-amber-500 text-white text-center px-4 py-2.5 text-sm font-medium">
          ⚠️ Votre abonnement expire dans {subLeft} jours.{' '}
          <Link href="/dashboard/upgrade" className="underline font-bold hover:opacity-80">
            Renouveler →
          </Link>
        </div>
      )}

      <DashboardShell shop={shop} profile={profile} unreadNotifications={unreadCount ?? 0}>
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
