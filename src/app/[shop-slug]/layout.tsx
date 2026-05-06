import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
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
    .select('id, name, primary_color, is_active, plan, trial_ends_at')
    .eq('slug', slug)
    .single()

  const shop = data as Pick<Shop, 'id' | 'name' | 'primary_color' | 'is_active' | 'plan' | 'trial_ends_at'> | null
  if (!shop) notFound()

  // Site inactif : plan non payé ou désactivé manuellement
  const isInactive = shop.plan === 'trial' || !shop.is_active

  if (isInactive) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center"
        style={{ '--color-primary': shop.primary_color ?? '#0EA5E9' } as React.CSSProperties}
      >
        <div
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-white text-2xl font-bold shadow-md"
          style={{ backgroundColor: shop.primary_color ?? '#0EA5E9' }}
        >
          {shop.name[0]?.toUpperCase()}
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{shop.name}</h1>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">
          Ce site n'est pas encore actif. Revenez bientôt ou contactez directement le vendeur.
        </p>
        <p className="text-xs text-gray-400">
          Tu es le propriétaire ?{' '}
          <a
            href="/dashboard/upgrade"
            className="font-semibold underline hover:text-gray-600"
            style={{ color: shop.primary_color ?? '#0EA5E9' }}
          >
            Active ton site ici →
          </a>
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
    </div>
  )
}
