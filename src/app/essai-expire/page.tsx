import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Shop } from '@/types'
import { computeTrialStatus } from '@/lib/trial-status'

export const metadata: Metadata = { robots: { index: false, follow: false } }

// Écran de blocage plein page pour une boutique dont l'essai est expiré.
// Volontairement HORS de src/app/dashboard/ : nested sous /dashboard, cette
// page hériterait de DashboardShell (nav, sidebar) — exactement le chrome que
// cet écran ne doit pas avoir. C'est src/middleware.ts qui redirige ici, avec
// /dashboard/upgrade comme seule sortie possible de ce blocage.
export default async function EssaiExpirePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileResult = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileResult.data as Profile | null
  if (profileResult.error || !profile || !profile.shop_id) redirect('/login')

  const shopResult = await supabase
    .from('shops')
    .select('*')
    .eq('id', profile.shop_id)
    .single()

  const shop = shopResult.data as Shop | null
  if (shopResult.error || !shop) redirect('/login')

  // Accès direct (favori, historique) alors que l'essai n'est plus expiré :
  // pas de raison de rester bloqué ici, retour au tableau de bord normal.
  if (!computeTrialStatus(shop).trialExpired) redirect('/dashboard')

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
