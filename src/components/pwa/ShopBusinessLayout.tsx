'use client'

import { Phone, Star, MessageSquare, MessageCircle } from 'lucide-react'
import type { Shop, Product } from '@/types'
import { ProductGrid } from './ProductGrid'
import { ShareButton } from './ShareButton'
import { APP_URL } from '@/constants'

interface Props {
  shop: Shop
  products: Product[]
  shopSlug: string
}

export function ShopBusinessLayout({ shop, products, shopSlug }: Props) {
  // TypeScript peut râler ici si les migrations Business ne sont pas appliquées
  const shopAny = shop as unknown as Record<string, unknown>
  const badges = Array.isArray(shopAny.badges) ? (shopAny.badges as string[]) : []
  const socialLinks = shopAny.social_links && typeof shopAny.social_links === 'object'
    ? (shopAny.social_links as Record<string, string>)
    : {}
  const businessCategory = typeof shopAny.business_category === 'string' ? shopAny.business_category : null
  const coverImageUrl = typeof shopAny.cover_image_url === 'string' ? shopAny.cover_image_url : null

  // Calcul rating simulé (à intégrer avec données réelles d'avis)
  const rating = 4.7
  const reviewCount = 28

  // Boutons d'action
  const whatsappNumber = shop.phone_whatsapp?.replace(/\D/g, '')
  const actionButtons = [
    { icon: Phone, label: 'Appeler', href: `tel:${whatsappNumber}`, show: !!whatsappNumber },
    { icon: MessageCircle, label: 'Écrire', href: `https://wa.me/${whatsappNumber}`, target: '_blank', show: !!whatsappNumber },
  ]

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-white flex flex-col">
      {/* Hero Section */}
      <div className="relative">
        {/* Cover Image */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={shop.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: shop.primary_color }}
            >
              <span className="text-white text-opacity-20 text-center px-4">
                <div className="text-5xl font-bold">{shop.name[0]?.toUpperCase()}</div>
              </span>
            </div>
          )}
        </div>

        {/* Logo Badge en cercle */}
        <div className="absolute -bottom-8 left-4 flex items-end gap-3">
          <div className="relative w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center shrink-0">
            {shop.logo_url ? (
              <img
                src={shop.logo_url}
                alt={shop.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: shop.primary_color }}
              >
                {shop.name[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -- Info Section ---------------------------------------- */}
      <div className="px-4 pt-12 pb-4 space-y-3">
        {/* Nom et bouton partage */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
            {businessCategory && (
              <p className="text-sm text-gray-600 mt-0.5">{businessCategory}</p>
            )}
          </div>
          <ShareButton
            url={`${APP_URL}/${shopSlug}`}
            title={shop.name}
            text={shop.description ?? `Découvrez ${shop.name} — commandez en ligne`}
            primaryColor={shop.primary_color}
          />
        </div>

        {/* Description (après catégorie) */}
        {shop.description && (
          <p className="text-sm text-gray-700 leading-relaxed">{shop.description}</p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-gray-900">{rating}</span>
          <span className="text-xs text-gray-500">({reviewCount} avis)</span>
        </div>
      </div>

      {/* -- Badges Section -------------------------------------- */}
      {badges.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 space-y-2">
          <div className="flex flex-wrap gap-2">
            {badges.map((badge, idx) => (
              <div
                key={idx}
                className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
              >
                ✓ {badge}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -- Social + Action Buttons -------------------------------------- */}
      <div className="px-4 py-3 border-t border-gray-100 space-y-3">
        {/* Social Links */}
        {Object.keys(socialLinks).filter(k => socialLinks[k]).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {socialLinks.instagram && (
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-700 hover:bg-pink-100 transition-colors"
              >
                <span>📷</span>
                Instagram
              </a>
            )}
            {socialLinks.tiktok && (
              <a
                href={socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black transition-colors"
              >
                <span>♪</span>
                TikTok
              </a>
            )}
            {socialLinks.facebook && (
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <span>f</span>
                Facebook
              </a>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {actionButtons
            .filter(b => b.show !== false)
            .map((btn) => (
              <a
                key={btn.label}
                href={btn.href || '#'}
                target={btn.target}
                rel={btn.target === '_blank' ? 'noopener noreferrer' : undefined}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <btn.icon className="h-4 w-4" />
                {btn.label}
              </a>
            ))}
        </div>
      </div>

      {/* -- Catalogue / Produits -------------------------------------- */}
      <div className="px-4 py-6 border-t border-gray-100 flex-1">
        <ProductGrid products={products} shopSlug={shopSlug} primaryColor={shop.primary_color} />
      </div>

      {/* -- CTA Footer ------------------------------------------ */}
      <div className="sticky bottom-0 px-4 py-3 border-t border-gray-100 bg-white">
        <a
          href={`/${shopSlug}/commander`}
          className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: shop.primary_color }}
        >
          <MessageSquare className="h-4 w-4" />
          Commander maintenant
        </a>
      </div>
    </div>
  )
}
