import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import type { Shop } from '@/types'

export const revalidate = 60

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ 'shop-slug': string }>
}) {
  const { 'shop-slug': slug } = await params
  const supabase = await createServerClient()

  const { data } = await supabase
    .from('shops')
    .select('id, name, logo_url, primary_color, is_active, plan, trial_ends_at, hide_branding, phone_whatsapp, previous_slug')
    .eq('slug', slug)
    .single()

  let shop = data as Pick<Shop, 'id' | 'name' | 'logo_url' | 'primary_color' | 'is_active' | 'plan' | 'trial_ends_at' | 'hide_branding' | 'phone_whatsapp'> & { previous_slug?: string | null } | null

  // Slug introuvable — vérifier si c'est un ancien slug renommé
  if (!shop) {
    const { data: renamed } = await supabase
      .from('shops')
      .select('slug')
      .eq('previous_slug', slug)
      .single()

    if (renamed?.slug) redirect(`/${renamed.slug}`)
    notFound()
  }

  const color = shop.primary_color ?? '#0EA5E9'

  // Site inactif : plan essai (jamais activé) ou abonnement expiré/désactivé
  const isTrial    = shop.plan === 'trial'
  const isInactive = isTrial || !shop.is_active

  if (isInactive) {
    const waLink = shop.phone_whatsapp
      ? `https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}`
      : null

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        {/* Logo ou initiale */}
        {shop.logo_url ? (
          <img
            src={shop.logo_url}
            alt={shop.name}
            className="h-20 w-20 rounded-2xl object-cover shadow-md mb-5"
          />
        ) : (
          <div
            className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl text-white text-3xl font-bold shadow-md"
            style={{ backgroundColor: color }}
          >
            {shop.name[0]?.toUpperCase()}
          </div>
        )}

        {/* Icône cadenas */}
        <div className="mb-4 text-4xl select-none">🔒</div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">{shop.name}</h1>

        <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">
          {isTrial
            ? 'Cette boutique n\'est pas encore active. Revenez bientôt !'
            : 'Cette boutique a temporairement suspendu ses ventes en ligne.'}
        </p>

        {/* Bouton WhatsApp */}
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#20bb5a] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contacter la boutique
          </a>
        )}

        <p className="text-xs text-gray-400">
          Si vous êtes le propriétaire,{' '}
          <a
            href="/dashboard/upgrade"
            className="font-semibold underline hover:text-gray-600"
            style={{ color }}
          >
            réactivez votre abonnement
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ '--color-primary': shop.primary_color ?? '#0EA5E9' } as React.CSSProperties}
    >
      {children}
      {!shop.hide_branding && (
        <footer className="max-w-lg mx-auto px-4 py-6 text-center">
          <a
            href="/"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Toi aussi, ouvre ta boutique en 5 min avec{' '}
            <span className="font-semibold text-gray-500">TekkiShop</span>{' '}
            <span aria-hidden>→</span>
          </a>
        </footer>
      )}
    </div>
  )
}
