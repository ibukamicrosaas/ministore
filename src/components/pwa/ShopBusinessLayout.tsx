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
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.117.6c-.786.3-1.455.717-2.1 1.362-.645.645-1.062 1.314-1.362 2.1-.267.788-.468 1.658-.528 2.936C.015 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.528 2.936.3.786.717 1.455 1.362 2.1.645.645 1.314 1.062 2.1 1.362.788.267 1.658.468 2.936.528C8.333 23.985 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.261 2.936-.528.786-.3 1.455-.717 2.1-1.362.645-.645 1.062-1.314 1.362-2.1.267-.788.468-1.658.528-2.936.057-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.261-2.148-.528-2.936-.3-.786-.717-1.455-1.362-2.1-.645-.645-1.314-1.062-2.1-1.362-.788-.267-1.658-.468-2.936-.528C15.667.015 15.26 0 12 0zm0 2.16c3.203 0 3.585.009 4.849.070 1.171.054 1.805.244 2.227.406.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.352 1.056.406 2.227.061 1.264.07 1.645.07 4.849 0 3.203-.009 3.584-.07 4.849-.054 1.171-.242 1.806-.406 2.228-.217.562-.477.96-.896 1.382-.42.419-.819.679-1.381.896-.422.164-1.056.352-2.227.406-1.265.061-1.645.07-4.849.07-3.204 0-3.584-.009-4.849-.07-1.171-.054-1.805-.242-2.228-.406-.562-.217-.96-.477-1.382-.896-.419-.42-.679-.82-.896-1.382-.164-.422-.352-1.056-.406-2.227-.061-1.265-.07-1.645-.07-4.849 0-3.204.009-3.585.07-4.849.054-1.171.242-1.806.406-2.228.217-.562.477-.96.896-1.381.42-.419.82-.679 1.382-.896.422-.164 1.056-.352 2.227-.406 1.264-.061 1.645-.07 4.849-.07zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
                </svg>
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
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.6915026,4.04944396 C15.8956502,2.81946707 14.4564272,2 12.7972098,2 L12.7972098,8.43192629 C11.6514288,8.43192629 10.5089231,7.99638814 9.64344156,7.13091159 C8.77798304,6.26545305 8.34244489,5.12291938 8.34244489,3.97714424 L2.37593525,10.9337723 L2.37593525,17.8903865 C2.37593525,20.4724451 4.17393145,22.5818016 6.65770999,22.9313905 C7.01692063,23.0103306 7.37936533,23.0498022 7.74357849,23.0498022 C8.10798163,23.0498022 8.47041633,23.0103306 8.82962697,22.9313905 C11.3134055,22.5818016 13.1114017,20.4724451 13.1114017,17.8903865 L13.1114017,11.1635023 C13.9915803,11.8742779 15.0623825,12.3090417 16.2068733,12.3090417 C17.3513642,12.3090417 18.4227704,11.8742779 19.3024449,11.1635023 L19.3024449,17.8903865 C19.3024449,20.4724451 21.1004411,22.5818016 23.5842197,22.9313905 C23.9433303,23.0103306 24.305775,23.0498022 24.6699882,23.0498022 C25.0343913,23.0498022 25.3968360,23.0103306 25.7560466,22.9313905 L25.7560466,17.8903865 C25.7560466,16.5833769 25.3468893,15.3597984 24.6102813,14.4021725 L24.6102813,4.04944396 Z"/>
                </svg>
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
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
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
