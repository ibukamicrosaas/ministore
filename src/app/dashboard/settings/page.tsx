import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader } from '@/components/ui/Card'
import { SettingsForm } from './SettingsForm'
import { SalonLinkCard } from '@/components/dashboard/SalonLinkCard'
import { PWAPreviewPanel } from '@/components/dashboard/PWAPreviewPanel'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CheckCircle2, AlertCircle, MessageSquare, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { OpeningHoursForm } from './OpeningHoursForm'
import { APP_URL } from '@/constants'
import type { OpeningHours } from '@/types'
import type { Profile, Salon } from '@/types'

export const metadata = { title: 'Paramètres — Sheka' }

export default async function SettingsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'salon_id' | 'role'> | null
  if (!profile?.salon_id || profile.role !== 'owner') redirect('/dashboard')

  const { data: salonData } = await supabase
    .from('salons')
    .select('*')
    .eq('id', profile.salon_id)
    .single()

  const salon = salonData as Salon | null
  if (!salon) redirect('/dashboard')

  const trialEnd = salon.trial_ends_at ? new Date(salon.trial_ends_at) : null
  const now = new Date()
  const isTrialActive = trialEnd ? trialEnd > now : false
  const daysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez les informations de votre salon</p>
      </div>

      {/* Layout 2 colonnes sur desktop */}
      <div className="lg:flex lg:items-start lg:gap-8">

        {/* Colonne gauche — paramètres */}
        <div className="flex-1 space-y-5 min-w-0">

          {/* Plan & essai */}
          <div className={`flex items-start gap-3 rounded-xl border p-4 ${isTrialActive ? 'border-orange-100 bg-orange-50' : 'border-red-100 bg-red-50'}`}>
            {isTrialActive ? (
              <CheckCircle2 className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-semibold ${isTrialActive ? 'text-orange-700' : 'text-red-700'}`}>
                {isTrialActive ? `Essai gratuit — ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}` : 'Essai expiré'}
              </p>
              <p className={`text-xs mt-0.5 ${isTrialActive ? 'text-orange-600' : 'text-red-600'}`}>
                {trialEnd
                  ? `${isTrialActive ? 'Expire le' : 'Expiré le'} ${format(trialEnd, 'd MMMM yyyy', { locale: fr })}`
                  : 'Aucune information de plan disponible'}
              </p>
              {!isTrialActive && (
                <Link
                  href="/dashboard/upgrade"
                  className="inline-block mt-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
                >
                  Choisir un plan →
                </Link>
              )}
            </div>
          </div>

          {/* Lien de réservation — mobile only (desktop → panneau droite) */}
          <div className="lg:hidden">
            <SalonLinkCard salonSlug={salon.slug} appUrl={APP_URL} />
          </div>

          {/* Infos salon */}
          <Card>
            <CardHeader
              title="Informations du salon"
              description="Ces informations sont visibles par vos clientes"
            />
            <div className="mt-4">
              <SettingsForm salon={salon} />
            </div>
          </Card>

          {/* Horaires */}
          <Card>
            <CardHeader
              title="Horaires d'ouverture"
              description="Jours et créneaux disponibles à la réservation"
            />
            <div className="mt-4">
              <OpeningHoursForm initialHours={(salon.opening_hours as unknown as OpeningHours) ?? {}} />
            </div>
          </Card>

          {/* Logs notifications */}
          <Link
            href="/dashboard/notifications"
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <MessageSquare className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Logs de notifications</p>
                <p className="text-xs text-gray-500">Historique des messages WhatsApp envoyés</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
          </Link>
        </div>

        {/* Colonne droite — aperçu PWA (desktop only) */}
        <div className="hidden lg:block w-72 shrink-0 sticky top-6 space-y-4">
          <PWAPreviewPanel salonSlug={salon.slug} appUrl={APP_URL} />
          <SalonLinkCard salonSlug={salon.slug} appUrl={APP_URL} />
        </div>

      </div>
    </div>
  )
}
