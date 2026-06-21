import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Eye, ArrowLeft, MessageCircle, MapPin, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { ProductGrid } from '@/components/pwa/ProductGrid'
import { ShopBusinessLayout } from '@/components/pwa/ShopBusinessLayout'
import type { Shop, Product } from '@/types'
import type { ShopCurrency } from '@/lib/utils/country-groups'

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
    .select('id, name, description, logo_url, primary_color, city, address, phone_whatsapp, available_days, delivery_options, plan, currency, cover_image_url, about_photo_url, business_category, badges, social_links, is_active, trial_ends_at')
    .eq('slug', slug)
    .single() as { data: (Shop & { id: string; currency?: string | null }) | null }

  if (!rawShop) notFound()

  // Vérification de propriété : l'utilisateur connecté doit être le propriétaire
  if (rawShop.id !== profile.shop_id) notFound()

  const shop = rawShop as unknown as Shop & { currency?: string | null }
  const color    = shop.primary_color ?? '#0EA5E9'
  const currency = (shop.currency ?? 'XOF') as ShopCurrency

  const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .or('stock_count.is.null,stock_count.gt.0')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  const products = (productsData ?? []) as Product[]
  const waLink   = shop.phone_whatsapp
    ? `https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}`
    : null

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ '--color-primary': color } as React.CSSProperties}
    >
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

      {/* Contenu de la boutique */}
      {shop.plan === 'pro' ? (
        <ShopBusinessLayout shop={shop} products={products} shopSlug={slug} />
      ) : (
        <div className="max-w-lg mx-auto">
          <header style={{ backgroundColor: color }} className="relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full opacity-10 bg-white" />
            <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full opacity-10 bg-white" />

            <div className="relative px-5 pt-10 pb-6">
              <div className="flex items-end gap-4">
                <div className="shrink-0">
                  {shop.logo_url ? (
                    <img
                      src={shop.logo_url}
                      alt={shop.name}
                      className="h-20 w-20 rounded-2xl object-cover shadow-lg ring-4 ring-white/20"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-white text-3xl font-bold shadow-lg ring-4 ring-white/20">
                      {shop.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <h1 className="text-xl font-bold text-white leading-tight truncate">{shop.name}</h1>
                  {(shop.address || shop.city) && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {shop.address?.trim() || shop.city}
                    </p>
                  )}
                </div>
              </div>

              {shop.description && (
                <p className="mt-3 text-sm text-white/90 leading-relaxed line-clamp-2">{shop.description}</p>
              )}

              <div className="mt-4 flex gap-2">
                <span
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold bg-white shadow-md cursor-not-allowed opacity-80"
                  style={{ color }}
                  title="Disponible une fois le site activé"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Commander
                </span>
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contact
                  </a>
                )}
              </div>
            </div>
          </header>

          <div className="bg-gray-50 min-h-[calc(100vh-260px)]">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <ShoppingBag className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">Aucun produit ajouté pour le moment.</p>
                <Link
                  href="/dashboard/products"
                  className="mt-4 text-sm font-semibold underline"
                  style={{ color }}
                >
                  Ajouter des produits →
                </Link>
              </div>
            ) : (
              <ProductGrid
                products={products}
                shopSlug={slug}
                primaryColor={color}
                currency={currency}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
