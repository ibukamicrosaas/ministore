'use client'

import { Phone, MessageCircle, Clock, ShoppingBag, MapPin, Truck, Wallet, Search } from 'lucide-react'
import type { Shop, Product } from '@/types'
import { ProductGrid } from './ProductGrid'
import { ShareButton } from './ShareButton'
import { APP_URL } from '@/constants'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import { getPlanFeatures } from '@/lib/plan-features'
import { PAYMENT_METHODS_BY_COUNTRY, type BictorysCountry } from '@/lib/payments/payment-methods'

// Champs boutique pas encore présents dans les types Supabase générés
// (database.ts n'a pas été régénéré depuis leur ajout en base) — même
// limitation pré-existante que le reste du code boutique publique.
interface ShopExtras {
  badges?: string[] | null
  social_links?: Record<string, string> | null
  business_category?: string | null
  cover_image_url?: string | null
  opening_hours?: string | null
  product_layout?: 'list' | 'grid' | null
  verification_status?: string | null
  grid_image_ratio?: 'square' | 'portrait' | null
}

interface DeliveryZone { id: string; name: string; price: number }

interface Props {
  shop: Shop & ShopExtras
  products: Product[]
  shopSlug: string
  basePath: string
  /** Mode prévisualisation marchand : le bouton Commander est visible mais inerte,
   * la boutique n'étant pas forcément activée/publique. */
  previewMode?: boolean
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

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.117.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12c0 3.259.014 3.668.072 4.948.061 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24c3.259 0 3.668-.014 4.948-.072 1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.689.072-4.948 0-3.259-.013-3.667-.072-4.947-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.013 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.54V6.77a4.85 4.85 0 0 1-1.07-.08z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function ShopLogo({ shop, size = 'md' }: { shop: Shop; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-7 w-7 rounded-md text-xs',
    md: 'w-20 h-20 rounded-full text-2xl',
    lg: 'w-24 h-24 rounded-full text-3xl',
  }
  return shop.logo_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={shop.logo_url} alt={shop.name} className={`${sizeClasses[size]} object-cover`} />
  ) : (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center font-bold text-white`}
      style={{ backgroundColor: shop.primary_color ?? '#0EA5E9' }}
    >
      {shop.name[0]?.toUpperCase()}
    </div>
  )
}

export function ShopHomeLayout({ shop, products, shopSlug, basePath, previewMode = false }: Props) {
  const badges         = Array.isArray(shop.badges) ? shop.badges : []
  const socialLinks    = shop.social_links ?? {}
  const businessCategory = shop.business_category ?? null
  const coverImageUrl    = shop.cover_image_url ?? null
  const openingHours     = shop.opening_hours ?? null
  const whatsappNumber   = shop.phone_whatsapp?.replace(/\D/g, '')
  const hasSocial        = Object.values(socialLinks).some(Boolean)
  const color            = shop.primary_color ?? '#0EA5E9'
  const currency         = (shop as unknown as { currency?: string }).currency as ShopCurrency | undefined
  const cityOrAddress    = shop.city?.trim() || shop.address?.trim() || null
  const contextLine      = [businessCategory, cityOrAddress].filter(Boolean).join(' · ') || null
  const waLink           = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null
  const commanderHref    = `${basePath}/commander`

  // Photo de couverture réelle : un drapeau de plan (Pro aujourd'hui) ET une
  // donnée réelle du marchand — les deux conditions cumulatives.
  const hasRealCoverPhoto = getPlanFeatures(shop.plan).coverImage && !!coverImageUrl

  // Bande de couleur --brand pour les plans sans la fonctionnalité couverture
  // (Découverte/Business aujourd'hui) — pilotée par le plan, jamais par la
  // présence de cover_image_url (structurellement absent pour ces plans,
  // aucune UI d'upload n'existe) : ce n'est pas un repli sur donnée
  // manquante, c'est le traitement normal de ces plans. Une vraie couleur du
  // marchand affichée différemment, pas un contenu inventé (Règle B interdit
  // un faux fond photographique, pas une couleur réelle).
  const showColorBand = !getPlanFeatures(shop.plan).coverImage

  // Zone de couverture présente, quelle que soit sa nature (photo ou
  // dégradé) — pilote le chevauchement de la carte d'identité et la position
  // du bouton de partage. Donnée/plan absents des deux côtés → la page
  // démarre directement sur la carte d'identité, sans espace résiduel (§4.2).
  const hasCover = hasRealCoverPhoto || showColorBand

  // Bascule Vague 3 (§36/§49/§51) : donnée réelle, plus un rendu inconditionnel
  // par plan. Grandfathering déjà exécuté (migration 096) pour les boutiques
  // Pro qui affichaient déjà ce badge avant qu'il ne devienne conditionnel.
  const showVerifiedBadge = shop.verification_status === 'verified'

  const actionButtons = [
    { icon: Phone,         label: 'Appeler', href: `tel:${whatsappNumber}`, show: !!whatsappNumber },
    { icon: MessageCircle, label: 'Écrire',  href: waLink ?? '#', target: '_blank', show: !!waLink },
  ]

  // ── Bande de faits (§4.4) — Retour/échange non construite, aucun champ de
  // réglage n'existe encore pour une politique marchand (voir REPRISE.md §51).
  const deliveryZones = Array.isArray(shop.delivery_zones) ? (shop.delivery_zones as unknown as DeliveryZone[]) : []
  const hasDelivery   = deliveryZones.length > 0

  const shopCountry    = shop.country as BictorysCountry | undefined
  const onlineMethods  = shopCountry ? (PAYMENT_METHODS_BY_COUNTRY[shopCountry] ?? []) : []
  const acceptsCash    = shop.accept_cash_on_delivery ?? true
  const hasOnlineCard  = onlineMethods.length > 0 || !!shop.bictorys_secret_key || !!shop.stripe_connect_enabled
  const hasPayment     = hasOnlineCard || acceptsCash
  const paymentLabel   = [
    ...onlineMethods.map(m => m.label),
    ...(onlineMethods.length === 0 && hasOnlineCard ? ['Carte bancaire'] : []),
    ...(acceptsCash ? ['Paiement à la livraison'] : []),
  ].join(', ')

  const facts = [
    hasDelivery && {
      icon: Truck,
      title: cityOrAddress ? `Livraison à ${cityOrAddress}` : 'Livraison',
      sub: 'Tarif calculé selon ta zone, affiché avant de payer',
    },
    hasPayment && {
      icon: Wallet,
      title: 'Paiement',
      sub: paymentLabel,
    },
    openingHours && {
      icon: Clock,
      title: 'Horaires',
      sub: openingHours,
    },
  ].filter(Boolean) as { icon: typeof Truck; title: string; sub: string }[]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: shop.name,
    description: shop.description ?? undefined,
    url: `${APP_URL}/${shopSlug}`,
    logo: shop.logo_url ?? undefined,
    image: shop.logo_url ?? undefined,
    telephone: shop.phone_whatsapp ?? undefined,
    address: shop.address ? {
      '@type': 'PostalAddress',
      streetAddress: shop.address,
      addressLocality: shop.city ?? undefined,
    } : undefined,
    hasOfferCatalog: products.length > 0 ? {
      '@type': 'OfferCatalog',
      name: `Produits ${shop.name}`,
      numberOfItems: products.length,
    } : undefined,
  }

  return (
    <div className="max-w-lg mx-auto lg:max-w-none min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Barre supérieure fixe mobile — logo + recherche (maquette). Le bouton
          recherche est une simple ancre vers le champ existant dans ProductGrid ;
          prévu pour tous les plans, pas seulement Pro. À terme, ce bouton pourra
          être remplacé par un menu hamburger — pas construit maintenant. ── */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 h-14 gap-3">
        <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-white shrink-0">
          <ShopLogo shop={shop} size="sm" />
        </div>
        <span className="font-bold text-sm text-gray-900 truncate flex-1 min-w-0 flex items-center gap-1">
          {shop.name}
          {showVerifiedBadge && <VerifiedBadge />}
        </span>
        <a
          href="#product-search"
          aria-label="Rechercher un produit"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 shrink-0"
        >
          <Search className="h-4 w-4" />
        </a>
      </div>

      {/* ── Desktop sticky nav ── */}
      <div className="hidden lg:flex sticky top-0 z-50 items-center bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="w-full max-w-6xl mx-auto px-12 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-white">
              <ShopLogo shop={shop} size="sm" />
            </div>
            <span className="font-bold text-sm text-gray-900 truncate max-w-[180px]">{shop.name}</span>
            {showVerifiedBadge && <VerifiedBadge />}
          </div>
          <div className="flex-1" />
          {/* Social icons dans le nav desktop */}
          {socialLinks.instagram && (
            <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"
               className="text-pink-500 hover:text-pink-600 transition-colors">
              <InstagramIcon className="h-4 w-4" />
            </a>
          )}
          {socialLinks.tiktok && (
            <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer"
               className="text-gray-900 hover:text-black transition-colors">
              <TikTokIcon className="h-4 w-4" />
            </a>
          )}
          {socialLinks.facebook && (
            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer"
               className="text-blue-600 hover:text-blue-700 transition-colors">
              <FacebookIcon className="h-4 w-4" />
            </a>
          )}
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors shrink-0">
              <MessageCircle className="h-4 w-4" />
              Contact
            </a>
          )}
          {previewMode ? (
            <span
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shrink-0 opacity-80 cursor-not-allowed"
              style={{ backgroundColor: color }}
              title="Disponible une fois le site activé"
            >
              <ShoppingBag className="h-4 w-4" />
              Commander
            </span>
          ) : (
            <a
              href={commanderHref}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shrink-0 transition-opacity hover:opacity-90"
              style={{ backgroundColor: color }}
            >
              <ShoppingBag className="h-4 w-4" />
              Commander
            </a>
          )}
        </div>
      </div>

      {/* ── Cover — photo réelle (Pro) ou dégradé --brand (autres plans), voir hasCover ── */}
      {hasCover && (
        <div className="relative">
          <div className="relative w-full h-[104px] lg:h-[168px] overflow-hidden">
            {hasRealCoverPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverImageUrl!} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `radial-gradient(120% 160% at 20% 0%, color-mix(in srgb, ${color} 24%, #fff) 0%, transparent 60%), linear-gradient(105deg, color-mix(in srgb, ${color} 14%, #fff), transparent 70%)`,
                }}
              />
            )}
          </div>
          <div className="absolute top-3 right-3 z-10">
            <ShareButton
              url={`${APP_URL}/${shopSlug}`}
              title={shop.name}
              text={shop.description ?? `Découvrez ${shop.name} — commandez en ligne`}
              primaryColor={color}
            />
          </div>
        </div>
      )}

      {/* ── Contenu principal ── */}
      <div className="lg:max-w-6xl lg:mx-auto lg:px-12 lg:py-8">
        <div className="lg:flex lg:gap-8 lg:items-start">

          {/* ── Sidebar desktop / Info mobile ── */}
          <div className="lg:w-72 lg:shrink-0 lg:sticky lg:top-20">

            {/* Carte d'identité — logo à côté du nom/catégorie, chevauche la couverture sur mobile (§4.3 de la maquette) */}
            <div className={`${hasCover ? '-mt-8 mx-4 mb-2 rounded-2xl bg-white shadow-lg border border-gray-100 relative z-10 px-4 pt-4' : 'px-4 pt-4'} pb-4 lg:mx-0 lg:mt-0 lg:rounded-none lg:bg-transparent lg:shadow-none lg:border-0 lg:px-0 lg:pt-0 space-y-3`}>
              <div className="flex items-start gap-3">
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center ring-1 ring-gray-100 shrink-0">
                  <ShopLogo shop={shop} size="md" />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900 leading-tight">{shop.name}</h1>
                    {showVerifiedBadge && <VerifiedBadge />}
                  </div>
                  {contextLine && (
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                      {!businessCategory && <MapPin className="h-3.5 w-3.5 shrink-0" />}
                      {contextLine}
                    </p>
                  )}
                </div>
                {/* ShareButton — seulement si pas de couverture (sinon il est déjà dans la couverture) */}
                {!hasCover && (
                  <ShareButton
                    url={`${APP_URL}/${shopSlug}`}
                    title={shop.name}
                    text={shop.description ?? `Découvrez ${shop.name} — commandez en ligne`}
                    primaryColor={color}
                  />
                )}
              </div>

              {shop.description && (
                <p className="text-sm text-gray-600 leading-relaxed">{shop.description}</p>
              )}

              {actionButtons.some(b => b.show) && (
                <div className="grid grid-cols-2 gap-2">
                  {actionButtons.filter(b => b.show).map((btn) => (
                    <a
                      key={btn.label}
                      href={btn.href}
                      target={(btn as { target?: string }).target}
                      rel={(btn as { target?: string }).target === '_blank' ? 'noopener noreferrer' : undefined}
                      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <btn.icon className="h-4 w-4" />
                      {btn.label}
                    </a>
                  ))}
                </div>
              )}

              {/* Réseaux sociaux — icônes seules, pas de libellé (§ maquette) */}
              {hasSocial && (
                <div className="flex gap-2">
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                       className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors">
                      <InstagramIcon className="h-[18px] w-[18px]" />
                    </a>
                  )}
                  {socialLinks.tiktok && (
                    <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                       className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors">
                      <TikTokIcon className="h-[18px] w-[18px]" />
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                       className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors">
                      <FacebookIcon className="h-[18px] w-[18px]" />
                    </a>
                  )}
                </div>
              )}

              {/* Mentions du marchand — données libres, tous plans */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Pas de bouton Commander ici — desktop le porte déjà dans la nav sticky
                du haut (ci-dessus) ; mobile le porte dans la barre collante en bas
                (voir fin de fichier). Un bloc inline existait ici avant, sans
                distinction de breakpoint : doublon avec la nav desktop, supprimé
                entièrement plutôt que masqué (bug analogue au 2.1 de la fiche
                produit — vérifié qu'un seul Commander existe à tout moment). */}

            {/* Bande de faits (§4.4) — défilement horizontal sur mobile (maquette),
                empilement vertical conservé sur desktop (colonne latérale étroite,
                une grille 3 colonnes n'y tiendrait pas) — disparaît si rien à montrer */}
            {facts.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-4 lg:flex-col lg:overflow-visible lg:px-0">
                {facts.map(f => (
                  <div key={f.title} className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-3 py-2.5 shrink-0 w-[220px] lg:w-full">
                    <f.icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color }} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700">{f.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{f.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Catalogue ── */}
          <div className="border-t border-gray-100 lg:border-t-0 lg:border-l lg:flex-1 lg:min-w-0">
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
                shopSlug={shopSlug}
                primaryColor={color}
                currency={currency}
                defaultView={shop.product_layout ?? 'list'}
                imageRatio={shop.grid_image_ratio ?? 'square'}
              />
            )}
          </div>

        </div>
      </div>

      {/* ── Espaceur mobile — réserve la hauteur réelle de la barre collante
          ci-dessous (73px mesurés en conditions réelles, safe-area=0, +4px de
          marge trouvée nécessaire au test — chevauchement sous-pixel de
          1,25px mesuré à 73px exactement, page courte scrollée en bas —
          plus l'inset dynamique du device réel via calc/env), pour que le
          dernier produit ou le footer TekkiShop (ShopBranding, rendu après ce
          composant dans layout.tsx) ne passe jamais dessous. Même principe
          que ProductStickyCtaManager.tsx (bug 2.2) mais mesure statique ici,
          pas de useLayoutEffect : le contenu de la barre ne varie jamais. ── */}
      <div className="h-[calc(77px+env(safe-area-inset-bottom))] lg:hidden" aria-hidden />

      {/* ── Barre collante mobile — Commander + WhatsApp (icône seule). Seul
          bouton Commander sur mobile (desktop garde celui de la nav du haut) —
          voir le commentaire plus haut sur la suppression du bloc inline. ── */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {previewMode ? (
          <span
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white opacity-80 cursor-not-allowed"
            style={{ backgroundColor: color }}
            title="Disponible une fois le site activé"
          >
            <ShoppingBag className="h-4 w-4" />
            Commander
          </span>
        ) : (
          <a
            href={commanderHref}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            <ShoppingBag className="h-4 w-4" />
            Commander
          </a>
        )}
        {/* Bouton WhatsApp — structure prévue pour être remplacée par un chat IA
            plus tard (plan Marques), pas construit maintenant : pas de logique
            de bascule, juste ce commentaire pour la prochaine session. */}
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Écrire sur WhatsApp"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        )}
      </div>

    </div>
  )
}
