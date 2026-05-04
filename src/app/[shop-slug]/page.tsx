import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, MapPin, ShoppingBag } from 'lucide-react'
import { ProductGrid } from '@/components/pwa/ProductGrid'
import type { Shop, Product } from '@/types'
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
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-start gap-4">
          {shop.logo_url ? (
            <img
              src={shop.logo_url}
              alt={shop.name}
              className="h-16 w-16 rounded-2xl object-cover shrink-0 shadow-sm"
            />
          ) : (
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white text-2xl font-bold shadow-sm"
              style={{ backgroundColor: color }}
            >
              {shop.name[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{shop.name}</h1>
            {shop.city && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3 shrink-0" />
                {shop.city}
              </p>
            )}
            {shop.description && (
              <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">{shop.description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Link
            href={`/${slug}/commander`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            <ShoppingBag className="h-4 w-4" />
            Commander
          </Link>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              Contacter
            </a>
          )}
        </div>
      </header>

      <div className="border-t border-gray-100" />

      {/* Catalogue */}
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
  )
}
