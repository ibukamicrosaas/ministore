import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MessageCircle, MapPin, ShoppingBag } from 'lucide-react'
import { ProductGrid } from '@/components/pwa/ProductGrid'
import type { Shop, Product } from '@/types'

export const revalidate = 60
import type { Metadata } from 'next'

type Props = { params: Promise<{ 'shop-slug': string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'shop-slug': slug } = await params
  const supabase = await createServerClient()
  const { data } = await supabase.from('shops').select('name, description').eq('slug', slug).single()
  if (!data) return {}
  const shop = data as Pick<Shop, 'name' | 'description'>
  return {
    title: shop.name,
    description: shop.description ?? `Boutique ${shop.name} — commandez en ligne`,
  }
}

export default async function ShopPage({ params }: Props) {
  const { 'shop-slug': slug } = await params
  const supabase = await createServerClient()

  const { data: shopData } = await supabase
    .from('shops')
    .select('id, name, description, logo_url, primary_color, city, phone_whatsapp, available_days, delivery_options')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!shopData) notFound()
  const shop = shopData as Pick<Shop, 'id' | 'name' | 'description' | 'logo_url' | 'primary_color' | 'city' | 'phone_whatsapp' | 'available_days' | 'delivery_options'>
  const color = shop.primary_color ?? '#0EA5E9'

  const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  const products = (productsData ?? []) as Product[]

  const waLink = shop.phone_whatsapp
    ? `https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}`
    : null

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <header style={{ backgroundColor: color }} className="relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full opacity-10 bg-white" />

        <div className="relative px-5 pt-10 pb-6">
          <div className="flex items-end gap-4">
            {/* Logo */}
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
              {shop.city && (
                <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {shop.city}
                </p>
              )}
            </div>
          </div>

          {shop.description && (
            <p className="mt-3 text-sm text-white/90 leading-relaxed line-clamp-2">{shop.description}</p>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <a
              href={`/${slug}/commander`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold bg-white shadow-md transition-opacity hover:opacity-90"
              style={{ color }}
            >
              <ShoppingBag className="h-4 w-4" />
              Commander
            </a>
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

      {/* Catalogue */}
      <div className="bg-gray-50 min-h-[calc(100vh-260px)]">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <ShoppingBag className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">Aucun produit disponible pour le moment.</p>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-1.5 text-sm font-medium text-[#25D366]"
              >
                <MessageCircle className="h-4 w-4" />
                Nous contacter
              </a>
            )}
          </div>
        ) : (
          <ProductGrid
            products={products}
            shopSlug={slug}
            primaryColor={color}
          />
        )}
      </div>
    </div>
  )
}
