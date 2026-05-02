import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Toaster } from 'react-hot-toast'
import type { Profile, Salon } from '@/types'
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

  if (!profile.salon_id) redirect('/onboarding')

  const salonResult = await supabase
    .from('salons')
    .select('*')
    .eq('id', profile.salon_id)
    .single()

  const salon = salonResult.data as Salon | null
  if (salonResult.error || !salon) redirect('/onboarding')

  // Calcul de l'alerte trial
  const isTrial = salon.plan === 'trial'
  const trialEnd = salon.trial_ends_at ? new Date(salon.trial_ends_at) : null
  const daysLeft = trialEnd
    ? Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const trialExpired = isTrial && daysLeft !== null && daysLeft <= 0
  const trialWarning = isTrial && daysLeft !== null && daysLeft > 0 && daysLeft <= 7

  return (
    <>
      {/* Banner alerte essai */}
      {isTrial && trialExpired && (
        <div className="bg-red-600 text-white text-center px-4 py-2.5 text-sm font-medium">
          ⛔ Votre essai gratuit est terminé — votre mini site est suspendu.{' '}
          <Link href="/dashboard/upgrade" className="underline font-bold hover:opacity-80">
            Choisir un plan →
          </Link>
        </div>
      )}
      {isTrial && trialWarning && (
        <div className="bg-amber-500 text-white text-center px-4 py-2.5 text-sm font-medium">
          ⚠️ Votre essai expire dans {daysLeft} jour{daysLeft! > 1 ? 's' : ''}.{' '}
          <Link href="/dashboard/upgrade" className="underline font-bold hover:opacity-80">
            Choisir un plan →
          </Link>
        </div>
      )}

      <DashboardShell salon={salon} profile={profile}>
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
