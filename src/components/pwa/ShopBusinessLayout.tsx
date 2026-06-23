'use client'

import { Phone, MessageSquare, MessageCircle, Clock } from 'lucide-react'
import type { Shop, Product } from '@/types'
import { ProductGrid } from './ProductGrid'
import { ShareButton } from './ShareButton'
import { APP_URL } from '@/constants'
import type { ShopCurrency } from '@/lib/utils/country-groups'

interface Props {
  shop: Shop
  products: Product[]
  shopSlug: string
}

// Badge "compte vérifié" bleu, style Instagram/X
function VerifiedBadge() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none">
      <circle cx="12" cy="12" r="12" fill="#1D9BF0" />
      <path
        d="M10.5 17L5.5 12L6.92 10.58L10.5 14.17L17.08 7.58L18.5 9L10.5 17Z"
        fill="white"
      />
    </svg>
  )
}

// Instagram SVG (Simple Icons)
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.117.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12c0 3.259.014 3.668.072 4.948.061 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24c3.259 0 3.668-.014 4.948-.072 1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.689.072-4.948 0-3.259-.013-3.667-.072-4.947-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.013 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

// TikTok SVG (Simple Icons — path 100 % dans le viewBox 0 0 24 24)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.54V6.77a4.85 4.85 0 0 1-1.07-.08z" />
    </svg>
  )
}

// Facebook SVG
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export function ShopBusinessLayout({ shop, products, shopSlug }: Props) {
  const shopAny = shop as unknown as Record<string, unknown>
  const badges = Array.isArray(shopAny.badges) ? (shopAny.badges as string[]) : []
  const socialLinks = shopAny.social_links && typeof shopAny.social_links === 'object'
    ? (shopAny.social_links as Record<string, string>)
    : {}
  const businessCategory = typeof shopAny.business_category === 'string' ? shopAny.business_category : null
  const coverImageUrl = typeof shopAny.cover_image_url === 'string' ? shopAny.cover_image_url : null

  const openingHours = typeof shopAny.opening_hours === 'string' ? shopAny.opening_hours : null

  const whatsappNumber = shop.phone_whatsapp?.replace(/\D/g, '')
  const actionButtons = [
    { icon: Phone,         label: 'Appeler', href: `tel:${whatsappNumber}`,                 show: !!whatsappNumber },
    { icon: MessageCircle, label: 'Écrire',  href: `https://wa.me/${whatsappNumber}`, target: '_blank', show: !!whatsappNumber },
  ]

  const hasSocial = Object.values(socialLinks).some(Boolean)

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-white flex flex-col">

      {/* ── Cover + Logo ── */}
      <div className="relative">
        <div className="relative w-full aspect-video bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
          {coverImageUrl ? (
            <img src={coverImageUrl} alt={shop.name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: shop.primary_color ?? '#0EA5E9' }}
            >
              <span className="text-white/20 text-6xl font-bold select-none">
                {shop.name[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
        {/* Logo rond */}
        <div className="absolute -bottom-8 left-4">
          <div className="relative w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: shop.primary_color ?? '#0EA5E9' }}
              >
                {shop.name[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Infos principales ── */}
      <div className="px-4 pt-12 pb-4 space-y-2.5">
        {/* Nom + badge vérifié + partage */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{shop.name}</h1>
              <VerifiedBadge />
            </div>
            {businessCategory && (
              <p className="text-sm text-gray-500 mt-0.5 truncate">{businessCategory}</p>
            )}
            {shop.description && (
              <p className="text-sm text-gray-600 leading-relaxed mt-1">{shop.description}</p>
            )}
          </div>
          <ShareButton
            url={`${APP_URL}/${shopSlug}`}
            title={shop.name}
            text={shop.description ?? `Découvrez ${shop.name} — commandez en ligne`}
            primaryColor={shop.primary_color}
          />
        </div>

        {/* Badges de confiance (remplacement des étoiles fictives) */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {badges.map((badge, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
              >
                <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0" fill="currentColor">
                  <path d="M10.5 3L4.5 9 1.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Horaires d'ouverture */}
        {openingHours && (
          <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
            <Clock className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{openingHours}</p>
          </div>
        )}
      </div>

      {/* ── Réseaux sociaux + boutons d'action ── */}
      {(hasSocial || actionButtons.some(b => b.show)) && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {hasSocial && (
            <div className="flex flex-wrap gap-2">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-pink-100 px-3 py-2 text-xs font-semibold text-pink-600 hover:from-purple-100 hover:to-pink-100 transition-colors"
                >
                  <InstagramIcon className="h-4 w-4" />
                  Instagram
                </a>
              )}
              {socialLinks.tiktok && (
                <a
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black transition-colors"
                >
                  <TikTokIcon className="h-4 w-4" />
                  TikTok
                </a>
              )}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <FacebookIcon className="h-4 w-4" />
                  Facebook
                </a>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {actionButtons.filter(b => b.show).map((btn) => (
              <a
                key={btn.label}
                href={btn.href || '#'}
                target={(btn as { target?: string }).target}
                rel={(btn as { target?: string }).target === '_blank' ? 'noopener noreferrer' : undefined}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <btn.icon className="h-4 w-4" />
                {btn.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Catalogue ── */}
      {/* Pas de px-4 ici : ProductGrid gère ses propres marges internes */}
      <div className="border-t border-gray-100 flex-1">
        <ProductGrid products={products} shopSlug={shopSlug} primaryColor={shop.primary_color} currency={(shop as unknown as { currency?: string }).currency as ShopCurrency | undefined} />
      </div>

      {/* ── CTA sticky ── */}
      <div className="sticky bottom-0 px-4 py-3 border-t border-gray-100 bg-white">
        <a
          href={`/${shopSlug}/commander`}
          className="flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: shop.primary_color ?? '#0EA5E9' }}
        >
          <MessageSquare className="h-4 w-4" />
          Commander maintenant
        </a>
      </div>
    </div>
  )
}
