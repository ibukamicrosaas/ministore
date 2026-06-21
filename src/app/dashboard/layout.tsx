import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Toaster } from 'react-hot-toast'
import type { Profile, Shop } from '@/types'
import Link from 'next/link'

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

  // ── Blocage complet : période de configuration expirée ──────────────────────
  if (trialExpired) {
    const color = (shop as Shop & { primary_color?: string }).primary_color ?? '#0EA5E9'
    const logoUrl = (shop as Shop & { logo_url?: string }).logo_url

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo boutique */}
        <div className="mb-6">
          {logoUrl ? (
            <img src={logoUrl} alt={shop.name} className="h-20 w-20 rounded-2xl object-cover shadow-md" />
          ) : (
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-md"
              style={{ backgroundColor: color }}
            >
              {shop.name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Message */}
        <div className="text-center max-w-sm mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{shop.name}</h1>
          <p className="text-base font-semibold text-gray-700 mb-2">Votre période de configuration est terminée.</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Pour que votre boutique soit visible par vos clients et commencer à recevoir des commandes,
            choisissez un plan d'abonnement.
          </p>
        </div>

        {/* CTA principal */}
        <Link
          href="/dashboard/upgrade"
          className="mb-4 flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: color }}
        >
          Activer ma boutique →
        </Link>

        {/* Lien secondaire : aperçu du site */}
        <Link
          href={`/preview/${shop.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
        >
          Voir l&apos;aperçu de ma boutique
        </Link>

        <p className="text-xs text-gray-400 mt-4">
          Vos produits et données sont conservés.{' '}
          <Link href="/login" className="underline hover:text-gray-600">Se déconnecter</Link>
        </p>
      </div>
    )
  }

  return (
    <>
      {/* ── Période de configuration (essai) ─────────────────── */}
      {isTrial && trialWarning && (
        <div className="bg-amber-500 text-white text-center px-4 py-2.5 text-sm font-medium">
          Votre boutique n&apos;est pas encore active. Il vous reste {trialLeft} jour{trialLeft! > 1 ? 's' : ''} pour choisir un plan.{' '}
          <Link href="/dashboard/upgrade" className="underline font-bold hover:opacity-80">
            Activer maintenant →
          </Link>
        </div>
      )}

      {/* ── Abonnement payant ─────────────────────────────────── */}
      {subExpired && (
        <div className="bg-red-600 text-white text-center px-4 py-2.5 text-sm font-medium">
          Votre abonnement est expiré — votre boutique est suspendue.{' '}
          <Link href="/dashboard/upgrade" className="underline font-bold hover:opacity-80">
            Renouveler →
          </Link>
        </div>
      )}
      {subWarning3 && (
        <div className="bg-red-500 text-white text-center px-4 py-2.5 text-sm font-medium">
          Votre abonnement expire dans {subLeft} jour{subLeft! > 1 ? 's' : ''} !{' '}
          <Link href="/dashboard/upgrade" className="underline font-bold hover:opacity-80">
            Renouveler maintenant →
          </Link>
        </div>
      )}
      {subWarning7 && (
        <div className="bg-amber-500 text-white text-center px-4 py-2.5 text-sm font-medium">
          Votre abonnement expire dans {subLeft} jours.{' '}
          <Link href="/dashboard/upgrade" className="underline font-bold hover:opacity-80">
            Renouveler →
          </Link>
        </div>
      )}

      <DashboardShell shop={shop} profile={profile} unreadNotifications={unreadCount ?? 0} isAdmin={isAdmin}>
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
