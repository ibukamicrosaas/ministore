import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Eye, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ShopHomeLayout } from '@/components/pwa/ShopHomeLayout'
import type { Shop, Product } from '@/types'
import { withEffectiveVariants } from '@/lib/products/effective-variants'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export default async function PreviewPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') redirect('/dashboard')

  // Pas de filtre is_active — c'est le but de la prévisualisation
  // Cast as any pour éviter les erreurs de type sur les colonnes ajoutées après génération des types
  const { data: rawShop } = await (supabase as any)
    .from('shops')
    .select('id, name, description, logo_url, primary_color, city, address, phone_whatsapp, available_days, delivery_options, delivery_zones, country, accept_cash_on_delivery, bictorys_secret_key, stripe_connect_enabled, plan, currency, cover_image_url, about_photo_url, business_category, badges, social_links, opening_hours, product_layout, is_active, trial_ends_at, verification_status, grid_image_ratio')
    .eq('slug', slug)
    .single() as {
      data: (Shop & {
        id: string
        currency?: string | null
        product_layout?: 'list' | 'grid' | null
        social_links?: Record<string, string> | null
        business_category?: string | null
        cover_image_url?: string | null
        opening_hours?: string | null
      }) | null
    }

  if (!rawShop) notFound()

  // Vérification de propriété : l'utilisateur connecté doit être le propriétaire
  if (rawShop.id !== profile.shop_id) notFound()

  const shop = rawShop

  // Même requête que la page publique réelle (Lot B, 2026-09-01) — la
  // prévisualisation doit montrer exactement ce qu'un visiteur voit,
  // ruptures de stock incluses.
  const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  // Variantes effectives (Lot 3 de la bascule, REPRISE.md §76-79) — même règle
  // que la page publique réelle.
  const products = await withEffectiveVariants(supabase, (productsData ?? []) as Product[])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Bandeau prévisualisation */}
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Eye className="h-4 w-4 shrink-0" />
          Mode prévisualisation — seul vous pouvez voir cette page
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Tableau de bord
        </Link>
      </div>

      <ShopHomeLayout shop={shop} products={products} shopSlug={slug} basePath={`/${slug}`} previewMode />
    </div>
  )
}
