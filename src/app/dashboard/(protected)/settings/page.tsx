import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader } from '@/components/ui/Card'
import { SettingsForm } from './SettingsForm'
import { ChangePinForm } from './ChangePinForm'
import { DeleteAccountButton } from './DeleteAccountButton'
import { CancelSubscriptionButton } from '@/app/dashboard/(protected)/billing/CancelSubscriptionButton'
import { ShopLinkCard } from '@/components/dashboard/ShopLinkCard'
import { PWAPreviewPanel } from '@/components/dashboard/PWAPreviewPanel'
import { ActivationChecker } from './ActivationChecker'
import { SettingsTabNav } from './SettingsTabNav'
import { CheckCircle2, AlertCircle, MessageSquare, ChevronRight, Zap, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { APP_URL } from '@/constants'
import type { Profile, Shop } from '@/types'

export const metadata = { title: 'Paramètres — TekkiShop' }

type Props = {
  searchParams: Promise<{ tab?: string }>
}

export default async function SettingsPage({ searchParams }: Props) {
  const { tab = 'boutique' } = await searchParams

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
    .select('*')
    .eq('id', profile.shop_id)
    .single()

  const shop = shopData as Shop | null
  if (!shop) redirect('/dashboard')

  // plan_cancel_at_period_end n'est pas dans les types générés — requête séparée
  const { data: cancelData } = await supabase
    .from('shops')
    .select('plan_cancel_at_period_end, subscription_ends_at' as never)
    .eq('id', profile.shop_id)
    .single()
  const shopExtra = cancelData as { plan_cancel_at_period_end: boolean; subscription_ends_at: string | null } | null

  const isActivePlan = shop.plan !== 'trial'
  const planLabel    = shop.plan === 'decouverte' ? 'Découverte'
    : shop.plan === 'business' ? 'Business'
    : shop.plan === 'pro' ? 'Pro'
    : shop.plan

  // Tabs qui affichent la colonne de prévisualisation à droite
  const showPreview = tab === 'boutique' || tab === 'contenu'

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gère les informations de ton site</p>
      </div>

      {/* Navigation par onglets */}
      <SettingsTabNav activeTab={tab} />

      <div className="lg:flex lg:items-start lg:gap-8">

        {/* Colonne principale */}
        <div className="flex-1 min-w-0">

          {/* ── Onglets Boutique / Ventes / Contenu → SettingsForm ── */}
          <div className={tab === 'compte' ? 'hidden' : ''}>
            {/* Lien boutique mobile — visible seulement sur Boutique */}
            {tab === 'boutique' && (
              <div className="lg:hidden mb-4">
                <ShopLinkCard shopSlug={shop.slug} appUrl={APP_URL} />
              </div>
            )}
            <Card>
              <SettingsForm shop={shop} section={tab} />
            </Card>
          </div>

          {/* ── Onglet Compte ── */}
          <div className={tab !== 'compte' ? 'hidden' : 'space-y-5'}>

            {/* Plan */}
            <div className={`flex items-start gap-3 rounded-xl border p-4 ${isActivePlan ? 'border-emerald-100 bg-emerald-50' : 'border-orange-100 bg-orange-50'}`}>
              {isActivePlan ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-semibold ${isActivePlan ? 'text-emerald-700' : 'text-orange-700'}`}>
                  {isActivePlan ? `Plan ${planLabel} — Site actif` : 'Site non activé'}
                </p>
                <p className={`text-xs mt-0.5 ${isActivePlan ? 'text-emerald-600' : 'text-orange-600'}`}>
                  {isActivePlan
                    ? 'Ton site est visible et tes clients peuvent passer commande.'
                    : 'Active ton site pour recevoir tes premières commandes.'}
                </p>
                {isActivePlan && (
                  <div className="mt-2">
                    <Link
                      href="/dashboard/billing"
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      Gérer la facturation
                    </Link>
                  </div>
                )}
                {!isActivePlan && (
                  <div className="flex flex-col gap-0.5">
                    <Link
                      href="/dashboard/upgrade"
                      className="inline-flex items-center gap-1 mt-2 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors w-fit"
                    >
                      <Zap className="h-3 w-3" /> Activer mon site
                    </Link>
                    <ActivationChecker />
                  </div>
                )}
              </div>
            </div>

            {/* Annulation abonnement */}
            {isActivePlan && shopExtra && (
              <Card>
                <p className="text-sm font-semibold text-gray-900 mb-1">Abonnement</p>
                <p className="text-xs text-gray-500 mb-3">Ton accès reste actif jusqu'à la fin de la période payée.</p>
                <CancelSubscriptionButton
                  cancelAtPeriodEnd={shopExtra.plan_cancel_at_period_end}
                  expiresAt={shopExtra.subscription_ends_at}
                />
              </Card>
            )}

            {/* Sécurité */}
            <Card>
              <CardHeader
                title="Sécurité"
                description="Modifie ton code PIN de connexion"
              />
              <div className="mt-1 mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gray-400 shrink-0" />
                <p className="text-xs text-gray-500">Ton code PIN contient 6 chiffres. Ne le communique jamais.</p>
              </div>
              <ChangePinForm />
            </Card>

            {/* Logs de notifications */}
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

            {/* Zone de danger */}
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-red-700">Zone de danger</p>
                <p className="text-xs text-red-500 mt-0.5">La suppression du compte est définitive et irréversible.</p>
              </div>
              <DeleteAccountButton shopName={shop.name} />
            </div>

          </div>
        </div>

        {/* Colonne droite — aperçu desktop (Boutique + Contenu uniquement) */}
        {showPreview && (
          <div className="hidden lg:block w-72 shrink-0 sticky top-6 space-y-4">
            <PWAPreviewPanel shopSlug={shop.slug} appUrl={APP_URL} />
            <ShopLinkCard shopSlug={shop.slug} appUrl={APP_URL} />
          </div>
        )}

      </div>
    </div>
  )
}
