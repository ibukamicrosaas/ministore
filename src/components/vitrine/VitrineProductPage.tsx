'use client'

import Link from 'next/link'
import { ArrowLeft, Check, MessageCircle, PackageCheck, Truck, Wallet } from 'lucide-react'
import type { Shop, Product } from '@/types'
import { ReportContentLink } from '@/components/pwa/ReportContentLink'
import { ShareButton } from '@/components/pwa/ShareButton'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import { getVitrinePaymentInfo, summarizePayment } from './vitrine-payment'
import { VitrineFooter, VitrineHeader, VitrineRoot, ProductMedia, ProductGallery, ClampedLines, DigitalExtractButton, getPrimaryPhoto, getSortedPhotos, useVitrineTokens } from './vitrine-shared'

interface ShopExtras {
  target_countries?: string[] | null
  currency?: string | null
  social_links?: Record<string, string> | null
}

interface Props {
  shop: Shop & ShopExtras
  /** `product.variants` (déjà sur le type `Product`, colonne jsonb) sert
   * uniquement au garde-fou du prix barré (pas de variantes affichées sur
   * Vitrine dans ce lot) — tel quel dans le harnais (aucun des 8 produits de
   * test n'a de variante), remplacé par les variantes effectives
   * (withEffectiveVariants) côté vraie route de prévisualisation, comme Classique. */
  product: Product & { slug?: string | null; original_price?: number | null; digital_preview_text?: string | null }
  relatedProducts: Product[]
  shopSlug: string
  basePath: string
  /** Prévisualisation propriétaire : Commander est visible mais inerte. */
  previewMode?: boolean
  /** Préfixe de lien produit (concaténé avec l'id), pas une fonction — voir
   * VitrineHomeLayout.tsx pour la raison (limite serveur/client Next.js). */
  productLinkPrefix?: string
  /** Lien d'accueil de la boutique Vitrine (par défaut basePath). */
  homeHref?: string
}

export function VitrineProductPage({ shop, product, relatedProducts, shopSlug, basePath, previewMode = false, productLinkPrefix, homeHref }: Props) {
  const tokens = useVitrineTokens(shop.primary_color)
  const payment = getVitrinePaymentInfo(shop)
  const currency = (shop.currency as ShopCurrency | undefined) ?? 'XOF'
  const whatsappNumber = shop.phone_whatsapp?.replace(/\D/g, '') || null
  const waLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null
  const waQuestion = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(product.name)}` : null
  const photos = getSortedPhotos(product)
  const linkPrefix = productLinkPrefix ?? `${basePath}/produit/`
  const home = homeHref ?? basePath
  const commanderHref = `${basePath}/commander?product=${product.id}`
  const category = product.category?.trim() || null

  // Mêmes conditions que Classique (src/app/[shop-slug]/produit/[id]/page.tsx:427-437) :
  // pas de prix barré pour un produit avec variantes (le prix dépend alors de
  // la variante choisie, le barré serait trompeur).
  const hasVariants = Array.isArray(product.variants) && (product.variants as unknown[]).length > 0
  const originalPrice = product.original_price
  const showStruckPrice = !hasVariants && typeof originalPrice === 'number' && originalPrice > product.price

  const showExtract = product.product_type === 'digital' && !!product.digital_preview_text?.trim()

  // « En stock » uniquement si le stock est réel : un nombre positif. stock_count
  // null = stock non suivi (pas une donnée de stock) → aucun badge, ni "en stock"
  // ni "rupture". 0 = rupture.
  const stockCount = product.stock_count
  const soldOut = stockCount === 0
  const showInStockBadge = typeof stockCount === 'number' && stockCount > 0

  const deliveryZones = Array.isArray(shop.delivery_zones) ? (shop.delivery_zones as unknown[]) : []
  const hasDelivery = deliveryZones.length > 0
  const paymentSummary = summarizePayment(payment)

  return (
    <VitrineRoot tokens={tokens}>
      <VitrineHeader
        shop={shop}
        homeHref={home}
        shareUrl={previewMode ? '#' : `https://tekki.shop/${shopSlug}/produit/${product.slug ?? product.id}`}
        shareTitle={product.name}
        brand={tokens.brand}
        waLink={waLink}
      />

      <main className="vt-wrap">
        {/* Fil d'Ariane (tablette/desktop) : catégorie seulement si elle existe, non cliquable (pas de pages catégories) */}
        <nav className="vt-crumb" aria-label="Fil d'Ariane">
          <Link href={home} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ArrowLeft size={16} aria-hidden="true" />{shop.name}</Link>
          {category && (<><span aria-hidden="true">/</span><span>{category}</span></>)}
          <span aria-hidden="true">/</span>
          <b aria-current="page">{product.name}</b>
        </nav>

        <Link href={home} className="vt-pg-back vt-only-m"><ArrowLeft size={18} aria-hidden="true" />{shop.name}</Link>

        <div className="vt-pdetail">
          <div className="vt-pg-wrap">
            <div className="vt-pg">
              <ProductGallery photos={photos} alt={product.name} />
            </div>
          </div>

          <div className="vt-pinfo">
            {category && <span className="vt-pcat">{category}</span>}
            <div className="vt-ptitle-row">
              <h1>{product.name}</h1>
              <div className="vt-only-d">
                <ShareButton url={previewMode ? '#' : `https://tekki.shop/${shopSlug}/produit/${product.slug ?? product.id}`} title={product.name} primaryColor={tokens.brand} />
              </div>
            </div>
            <div className="vt-prow">
              <span className="vt-pprice">{formatPrice(product.price, currency)}</span>
              {showStruckPrice && <span className="vt-pprice-old">{formatPrice(originalPrice as number, currency)}</span>}
              {showInStockBadge && <span className="vt-stock"><Check size={15} aria-hidden="true" />En stock</span>}
              {soldOut && <span className="vt-stock vt-out">Rupture de stock</span>}
            </div>

            <div className="vt-pact">
              {previewMode ? (
                <button type="button" disabled aria-disabled="true" data-testid="commander-cta-inert" onClick={e => e.preventDefault()} className="vt-btn vt-btn-brand">
                  Commander (aperçu)
                </button>
              ) : !soldOut ? (
                <Link href={commanderHref} className="vt-btn vt-btn-brand">Commander</Link>
              ) : null}
              {waQuestion && (
                <a href={waQuestion} target="_blank" rel="noopener noreferrer" className="vt-btn vt-wa">
                  <MessageCircle size={18} aria-hidden="true" />Poser une question sur WhatsApp
                </a>
              )}
            </div>

            {/* Avant de commander — uniquement des données réelles, lien de suivi conservé */}
            <section className="vt-before" aria-labelledby="vt-before-h">
              <h2 id="vt-before-h">Avant de commander</h2>
              {payment.hasAnyPayment && (
                <div className="vt-bi">
                  <span className="vt-ico"><Wallet size={20} aria-hidden="true" /></span>
                  <div><b>Paiement</b><p>{paymentSummary}.</p></div>
                </div>
              )}
              {hasDelivery && (
                <div className="vt-bi">
                  <span className="vt-ico"><Truck size={20} aria-hidden="true" /></span>
                  <div><b>Livraison ou retrait</b><p>À choisir à l&apos;étape suivante.</p></div>
                </div>
              )}
              <div className="vt-bi">
                <span className="vt-ico"><PackageCheck size={20} aria-hidden="true" /></span>
                <div><b>Suivi de commande</b><p>Tu reçois un lien de suivi par SMS/e-mail dès que ta commande est confirmée.</p></div>
              </div>
            </section>

            {product.description && (
              <section className="vt-pdesc">
                <ClampedLines text={product.description} maxLines={6} />
              </section>
            )}

            {showExtract && <DigitalExtractButton text={product.digital_preview_text!.trim()} productName={product.name} />}

            <div className="vt-pmisc">
              <ReportContentLink shopId={shop.id} productId={product.id} />
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="vt-related">
            <h2>À découvrir aussi</h2>
            <div className="vt-rel-grid">
              {relatedProducts.slice(0, 4).map(rp => (
                <Link key={rp.id} href={`${linkPrefix}${rp.id}`} className="vt-card">
                  <ProductMedia photo={getPrimaryPhoto(rp)} alt={rp.name} />
                  <div className="vt-meta">
                    <b className="vt-name">{rp.name}</b>
                    <span className="vt-price">{formatPrice(rp.price, currency)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="vt-pfoot">
        <VitrineFooter shop={shop} homeHref={home} waNumber={whatsappNumber} waLink={waLink} payment={payment} compact />
      </div>
    </VitrineRoot>
  )
}

