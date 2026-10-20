'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight, LayoutGrid, List, MapPin, MessageCircle, Truck, Wallet } from 'lucide-react'
import type { Shop, Product } from '@/types'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import { getPlanFeatures } from '@/lib/plan-features'
import { getStep3, getVitrinePaymentInfo, summarizePayment } from './vitrine-payment'
import { parseCommunityLink } from './vitrine-community'
import Image from 'next/image'
import { VitrineFooter, VitrineHeader, VitrineRoot, ProductMedia, getPrimaryPhoto, useVitrineTokens } from './vitrine-shared'

// Même exclusion que vitrine-shared.tsx : SVG (déjà vectoriel) et GIF (perdrait
// son animation en passant par l'optimiseur) restent en <img> brut.
function isOptimizableImage(url: string): boolean {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? ''
  return ext !== 'svg' && ext !== 'gif'
}

// Champs boutique pas encore présents dans les types Supabase générés —
// même limitation pré-existante que ShopHomeLayout.tsx (cast local, pas de
// régénération de types dans ce lot).
interface ShopExtras {
  cover_image_url?: string | null
  target_countries?: string[] | null
  currency?: string | null
  product_layout?: 'list' | 'grid' | null
  social_links?: Record<string, string> | null
}

interface DeliveryZone { id: string; name: string; price: number }

export interface VitrineHomeProps {
  shop: Shop & ShopExtras
  products: Product[]
  shopSlug: string
  basePath: string
  /** Prévisualisation propriétaire : le bouton Commander est visible mais inerte. */
  previewMode?: boolean
  /** Préfixe de lien produit (concaténé avec l'id) — une chaîne et non un callback
   * (limite serveur/client Next.js). Par défaut : `${basePath}/produit/`. */
  productLinkPrefix?: string
  /** Accroche du marchand. N'existe PAS en base : prop optionnelle, simulée par les fixtures du harnais. */
  tagline?: string | null
  /** Lien communauté/chaîne WhatsApp. N'existe PAS en base : fixtures du harnais uniquement. */
  communityUrl?: string | null
  /** Hero sans couverture (96 % des boutiques) — deux pistes à comparer : logo ou mosaïque des photos produits. */
  heroVariant?: 'logo' | 'mosaic'
  /** PROPOSITION, non décidée : bande Livraison/Paiement/Question compacte (une
   * ligne défilable) au lieu de 3 cartes empilées — fixtures du harnais seulement. */
  trustLayout?: 'stacked' | 'row'
  /** PROPOSITION, non décidée : hauteur du hero réduite quand il n'y a ni
   * couverture ni logo (monogramme seul) — fixtures du harnais seulement. */
  heroShort?: boolean
  /** PROPOSITION, non décidée : produit unique avec un seul bouton de commande
   * (retire « Voir le détail ») et un bandeau image réduit sans photo. */
  featuredCompact?: boolean
  /** PROPOSITION, non décidée : vrai « Voir plus » (page de `paginateSize`
   * produits, puis +N à chaque clic) au lieu d'un catalogue entier d'un bloc. */
  paginate?: boolean
  paginateSize?: number
  /** PROPOSITION, non décidée : hero mobile plein cadre avec la couverture en
   * fond (voile sombre + texte par-dessus, comme Main.dc.html) au lieu de la
   * couverture en colonne séparée. Sans effet si la boutique n'a pas de
   * couverture réelle. Desktop inchangé (toujours en 2 colonnes). */
  heroCoverStyle?: 'side' | 'fullbleed'
}

// Une description n'entre dans le hero que si elle ne contient ni contact ni lien
// (même nettoyage que l'ancienne accroche dérivée) — le pied de page l'affiche en entier.
function heroBlurb(description?: string | null): string | null {
  const text = description?.replace(/\s+/g, ' ').trim()
  if (!text) return null
  const digits = text.replace(/[\s.\-]/g, '')
  if (/\d{7,}/.test(digits) || text.includes('@') || /https?:\/\/|www\./i.test(text)) return null
  return text
}

export function VitrineHomeLayout({
  shop, products, shopSlug, basePath, previewMode = false, productLinkPrefix, tagline, communityUrl, heroVariant = 'logo',
  trustLayout = 'stacked', heroShort = false, featuredCompact = false, paginate = false, paginateSize = 12,
  heroCoverStyle = 'side',
}: VitrineHomeProps) {
  const tokens = useVitrineTokens(shop.primary_color)
  const payment = getVitrinePaymentInfo(shop)
  const currency = (shop.currency as ShopCurrency | undefined) ?? 'XOF'
  const whatsappNumber = shop.phone_whatsapp?.replace(/\D/g, '') || null
  const waLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null
  const linkPrefix = productLinkPrefix ?? `${basePath}/produit/`
  const commanderHref = (productId?: string) => `${basePath}/commander${productId ? `?product=${productId}` : ''}`
  const community = parseCommunityLink(communityUrl)

  const deliveryZones = Array.isArray(shop.delivery_zones) ? (shop.delivery_zones as unknown as DeliveryZone[]) : []
  const hasDelivery = deliveryZones.length > 0
  const title = tagline?.trim() || shop.name
  const blurb = heroBlurb(shop.description)
  const city = shop.city?.trim() || null
  const step3 = getStep3(payment)
  const paymentSummary = summarizePayment(payment)
  const hasCover = getPlanFeatures(shop.plan).coverImage && !!shop.cover_image_url

  const photos = products.map(getPrimaryPhoto).filter((p): p is string => !!p).slice(0, 3)

  const trustCount = [hasDelivery, payment.hasAnyPayment, !!waLink].filter(Boolean).length

  return (
    <VitrineRoot tokens={tokens}>
      <VitrineHeader
        shop={shop}
        homeHref={basePath}
        shareUrl={previewMode ? '#' : `https://tekki.shop/${shopSlug}`}
        shareTitle={shop.name}
        brand={tokens.brand}
        waLink={waLink}
      />

      <main>
        {/* Hero — jamais de fausse photo : couverture réelle (plan Pro) sinon dégradé de la couleur boutique */}
        <section className="vt-hero">
          <div className="vt-wrap">
            <div className={`vt-hero-in${!hasCover && heroShort ? ' vt-hero-in--short' : ''}${hasCover && heroCoverStyle === 'fullbleed' ? ' vt-hero-in--fullbleed' : ''}`}>
              {hasCover && heroCoverStyle === 'fullbleed' && (
                <>
                  {isOptimizableImage(shop.cover_image_url!) ? (
                    <Image src={shop.cover_image_url!} alt="" fill sizes="100vw" className="vt-hero-fb-img vt-only-m" style={{ objectFit: 'cover' }} priority aria-hidden="true" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shop.cover_image_url!} alt="" className="vt-hero-fb-img vt-only-m" aria-hidden="true" />
                  )}
                  <div className="vt-hero-fb-veil vt-only-m" aria-hidden="true" />
                </>
              )}
              <div className="vt-hero-txt">
                {city && (
                  <span className="vt-badge"><MapPin size={15} aria-hidden="true" />{city}</span>
                )}
                <h1>{title}</h1>
                {blurb && <p className="vt-hero-desc">{blurb}</p>}
                <div className="vt-hero-cta">
                  <a href="#catalogue" className="vt-btn vt-btn-brand vt-hero-main">
                    Voir les produits<ArrowRight size={19} aria-hidden="true" />
                  </a>
                  {waLink && (
                    <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label="Écrire sur WhatsApp" className="vt-btn vt-hero-wa">
                      <MessageCircle size={20} aria-hidden="true" /><span>Écrire sur WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {hasCover ? (
                <div className="vt-hero-vis vt-cv" style={{ position: 'relative', aspectRatio: '16/9' }}>
                  {isOptimizableImage(shop.cover_image_url!) ? (
                    <Image src={shop.cover_image_url!} alt="" fill sizes="(max-width:767px) 100vw, 45vw" style={{ objectFit: 'cover' }} priority />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shop.cover_image_url!} alt="" className="vt-hero-cover" />
                  )}
                </div>
              ) : heroVariant === 'mosaic' && photos.length > 0 ? (
                <div className="vt-hero-vis" aria-hidden="true">
                  <div className={`vt-mosaic vt-m${photos.length}`}>
                    {photos.map((src, i) => (
                      <div key={i} className="vt-mosaic-item" style={{ position: 'relative' }}>
                        {isOptimizableImage(src) ? (
                          <Image src={src} alt="" fill sizes="25vw" style={{ objectFit: 'cover' }} loading="lazy" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="vt-hero-vis" aria-hidden="true">
                  {shop.logo_url ? (
                    isOptimizableImage(shop.logo_url) ? (
                      <div className="vt-vis-logo" style={{ position: 'relative', overflow: 'hidden' }}>
                        <Image src={shop.logo_url} alt="" fill sizes="200px" style={{ objectFit: 'cover' }} loading="lazy" />
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={shop.logo_url} alt="" className="vt-vis-logo" />
                    )
                  ) : (
                    <div className="vt-vis-mono">{shop.name[0]?.toUpperCase()}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Réassurance — uniquement des faits réels */}
        {trustCount > 0 && (
          <section className="vt-wrap">
            <div className={`vt-trust vt-n${trustCount}${trustLayout === 'row' ? ' vt-trust--row' : ''}`}>
              {hasDelivery && (
                <div className="vt-trust-i">
                  <span className="vt-ico"><Truck size={20} aria-hidden="true" /></span>
                  <div><b>Livraison ou retrait</b><span>Tu choisis à la commande</span></div>
                </div>
              )}
              {payment.hasAnyPayment && (
                <div className="vt-trust-i">
                  <span className="vt-ico"><Wallet size={20} aria-hidden="true" /></span>
                  <div><b>Paiement</b><span>{paymentSummary}</span></div>
                </div>
              )}
              {waLink && (
                <div className="vt-trust-i">
                  <span className="vt-ico"><MessageCircle size={20} aria-hidden="true" /></span>
                  <div><b>Une question ?</b><span>Écris-nous sur WhatsApp</span></div>
                </div>
              )}
            </div>
          </section>
        )}

        <Catalogue
          products={products}
          defaultLayout={shop.product_layout === 'list' ? 'list' : 'grid'}
          currency={currency}
          linkPrefix={linkPrefix}
          waLink={waLink}
          previewMode={previewMode}
          commanderHref={commanderHref}
          featuredCompact={featuredCompact}
          paginate={paginate}
          paginateSize={paginateSize}
        />

        {/* Commander, c'est simple — étape 3 dépend des moyens réellement affichés */}
        <section id="etapes" className="vt-steps">
          <div className="vt-wrap">
            <h2>Commander, c&apos;est simple</h2>
            <div className="vt-steps-grid">
              {[
                { n: 1, h: 'Choisis ton article', p: 'Sélectionne la quantité puis appuie sur Commander.' },
                { n: 2, h: 'Dis-nous où te joindre', p: 'Ton nom, ton numéro et ton quartier. Une minute suffit.' },
                { n: 3, h: step3.title, p: step3.text },
              ].map(s => (
                <div key={s.n} className="vt-step">
                  <span className="vt-num" aria-hidden="true">{s.n}</span>
                  <div><b>{s.h}</b><p>{s.p}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Communauté — masquée si le lien est absent ou invalide */}
        {community && (
          <section id="communaute" className="vt-comm">
            <div className="vt-wrap">
              <div className="vt-comm-card">
                <span className="vt-wa-ic"><MessageCircle size={24} aria-hidden="true" /></span>
                <div className="vt-comm-txt">
                  <h2>Rejoindre la communauté</h2>
                  <p>Retrouve {shop.name} sur WhatsApp.</p>
                </div>
                <a href={community.href} target="_blank" rel="noopener noreferrer" className="vt-btn vt-btn-wa">
                  {community.kind === 'channel' ? 'Suivre la chaîne WhatsApp' : 'Rejoindre sur WhatsApp'}
                </a>
              </div>
            </div>
          </section>
        )}
      </main>

      <VitrineFooter shop={shop} homeHref={basePath} waNumber={whatsappNumber} waLink={waLink} payment={payment} hasCommunity={!!community} />

      {/* Barre fixe mobile — Commander inerte en prévisualisation. Pas de
          bouton Commander (ni de barre du tout, si aucun contact non plus)
          si la boutique n'a aucun produit : rien à commander. */}
      {(products.length > 0 || waLink) && (
        <div className="vt-sticky vt-only-m" style={{ display: 'flex' }}>
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label="Écrire sur WhatsApp" className="vt-wa-sq">
              <MessageCircle size={24} aria-hidden="true" />
            </a>
          )}
          {products.length > 0 && (
            previewMode ? (
              <button type="button" disabled aria-disabled="true" data-testid="commander-cta-inert" onClick={e => e.preventDefault()} className="vt-btn vt-btn-brand">
                Commander (aperçu)
              </button>
            ) : (
              <Link href={commanderHref()} className="vt-btn vt-btn-brand">Commander</Link>
            )
          )}
        </div>
      )}
    </VitrineRoot>
  )
}

interface CatalogueProps {
  products: Product[]
  defaultLayout: 'grid' | 'list'
  currency: ShopCurrency
  linkPrefix: string
  waLink: string | null
  previewMode: boolean
  commanderHref: (productId?: string) => string
  /** PROPOSITION, non décidée : produit unique compact (un seul bouton, bandeau réduit sans photo). */
  featuredCompact?: boolean
  /** PROPOSITION, non décidée : vrai « Voir plus » au lieu du catalogue entier d'un bloc. */
  paginate?: boolean
  paginateSize?: number
}

function Catalogue({ products, defaultLayout, currency, linkPrefix, waLink, previewMode, commanderHref, featuredCompact = false, paginate = false, paginateSize = 12 }: CatalogueProps) {
  // État local côté acheteur ; valeur initiale = réglage product_layout du marchand.
  const [layout, setLayout] = useState<'grid' | 'list'>(defaultLayout)
  // PROPOSITION (d) : combien de produits sont actuellement montrés — un seul
  // palier d'état, incrémenté par le bouton « Voir plus » (pas un proxy
  // comme au tour précédent : les produits suivants sont réellement ajoutés
  // au DOM au clic, pas simplement absents de la requête).
  const [shown, setShown] = useState(paginate ? paginateSize : Infinity)
  const n = products.length
  const canToggle = n >= 2
  const showWaCard = !!waLink && n >= 2 && n <= 3
  const cells = n + (showWaCard ? 1 : 0)
  const visibleProducts = products.slice(0, shown)
  const hasMore = paginate && shown < n

  return (
    <section id="catalogue" className="vt-wrap vt-cat">
      <div className="vt-sec-head">
        <h2>Nos produits<span className="vt-count">{n} produit{n > 1 ? 's' : ''}</span></h2>
        {canToggle && (
          <div role="group" aria-label="Affichage des produits" className="vt-toggle">
            <button type="button" aria-label="Affichage en grille" aria-pressed={layout === 'grid'} onClick={() => setLayout('grid')}>
              <LayoutGrid size={19} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Affichage en liste" aria-pressed={layout === 'list'} onClick={() => setLayout('list')}>
              <List size={19} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {n === 0 ? (
        <div className="vt-empty">Aucun produit publié pour le moment.</div>
      ) : n === 1 ? (
        <FeaturedProduct product={products[0]} currency={currency} linkPrefix={linkPrefix} previewMode={previewMode} commanderHref={commanderHref} compact={featuredCompact} />
      ) : layout === 'list' ? (
        <div className="vt-list">
          {visibleProducts.map(p => (
            <Link key={p.id} href={`${linkPrefix}${p.id}`} className="vt-row">
              <ProductMedia photo={getPrimaryPhoto(p)} alt={p.name} />
              <div className="vt-meta">
                {p.category && <span className="vt-cap">{p.category}</span>}
                <b className="vt-name">{p.name}</b>
                <span className="vt-price">{formatPrice(p.price, currency)}</span>
              </div>
              <ChevronRight size={20} className="vt-chev" aria-hidden="true" />
            </Link>
          ))}
          {!hasMore && showWaCard && <WaCard waLink={waLink!} row />}
        </div>
      ) : (
        <div
          className="vt-grid"
          style={{ ['--cols3' as string]: Math.min(3, cells), ['--cols4' as string]: Math.min(4, cells) }}
        >
          {visibleProducts.map(p => (
            <Link key={p.id} href={`${linkPrefix}${p.id}`} className="vt-card">
              <ProductMedia photo={getPrimaryPhoto(p)} alt={p.name} />
              <div className="vt-meta">
                {p.category && <span className="vt-cap">{p.category}</span>}
                <b className="vt-name">{p.name}</b>
                <span className="vt-price">{formatPrice(p.price, currency)}</span>
              </div>
            </Link>
          ))}
          {!hasMore && showWaCard && <WaCard waLink={waLink!} mobileWide={n === 2} />}
        </div>
      )}

      {hasMore && (
        <div className="vt-more-wrap">
          <button type="button" className="vt-btn vt-btn-line vt-more-btn" onClick={() => setShown(s => Math.min(n, s + paginateSize))}>
            Voir plus ({n - shown} restants)
          </button>
        </div>
      )}
    </section>
  )
}

function WaCard({ waLink, mobileWide, row }: { waLink: string; mobileWide?: boolean; row?: boolean }) {
  return (
    <a
      href={waLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`vt-wa-card${mobileWide ? ' vt-wa-card--mwide' : ''}${row ? ' vt-row' : ''}`}
    >
      <span className="vt-wa-ic"><MessageCircle size={24} aria-hidden="true" /></span>
      <span className="vt-wa-txt">
        <b>Tu cherches autre chose ?</b>
        <span className="vt-sub">Une question, une demande particulière ? Écris-nous.</span>
        <span className="vt-link">Écrire sur WhatsApp</span>
      </span>
    </a>
  )
}

/** Boutique à un seul produit : le produit est mis en vedette (jamais une demi-carte avec un vide à côté). */
function FeaturedProduct({ product, currency, linkPrefix, previewMode, commanderHref, compact = false }: {
  product: Product; currency: ShopCurrency; linkPrefix: string; previewMode: boolean; commanderHref: (id?: string) => string
  /** PROPOSITION, non décidée : un seul bouton (retire « Voir le détail », déjà
   * redondant avec cette carte qui montre déjà l'essentiel) + bandeau réduit
   * sans photo (au lieu du grand carré 1:1 actuel). */
  compact?: boolean
}) {
  const soldOut = product.stock_count === 0
  const hasPhoto = !!getPrimaryPhoto(product)
  return (
    <article className={`vt-feat${compact && !hasPhoto ? ' vt-feat--compact-photo' : ''}`}>
      <Link href={`${linkPrefix}${product.id}`} aria-label={product.name} style={{ display: 'contents' }}>
        <ProductMedia photo={getPrimaryPhoto(product)} alt={product.name} />
      </Link>
      <div className="vt-feat-info">
        {product.category && <span className="vt-cap">{product.category}</span>}
        <h3 className="vt-name">{product.name}</h3>
        <span className="vt-price">{formatPrice(product.price, currency)}</span>
        {product.description && <p className="vt-feat-desc">{product.description}</p>}
        <div className="vt-feat-act">
          {previewMode ? (
            <button type="button" disabled aria-disabled="true" data-testid="commander-cta-inert-feature" className="vt-btn vt-btn-brand" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
              Commander (aperçu)
            </button>
          ) : !soldOut ? (
            <Link href={commanderHref(product.id)} className="vt-btn vt-btn-brand">Commander</Link>
          ) : null}
          {!compact && <Link href={`${linkPrefix}${product.id}`} className="vt-btn vt-btn-line">Voir le détail</Link>}
        </div>
      </div>
    </article>
  )
}

