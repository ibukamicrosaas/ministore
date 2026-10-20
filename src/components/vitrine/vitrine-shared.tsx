'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, MessageCircle, Package, Phone } from 'lucide-react'
import { ShareButton } from '@/components/pwa/ShareButton'
import { ReportContentLink } from '@/components/pwa/ReportContentLink'
import { Modal } from '@/components/ui/Modal'
import type { Product } from '@/types'
import { deriveVitrineTokens, type VitrineTokens } from './vitrine-contrast'
import type { VitrinePaymentInfo } from './vitrine-payment'
import { safeHttpUrl } from './vitrine-community'
import { VITRINE_CSS } from './vitrine-styles'
import { vitrineFont } from './vitrine-fonts'

export function vitrineVars(tokens: VitrineTokens): CSSProperties {
  return {
    '--brand': tokens.brand, '--on-brand': tokens.onBrand, '--tint': tokens.tint, '--soft': tokens.soft,
    '--line': tokens.line, '--darkest': tokens.darkest, '--text': tokens.textOnLight, '--graphic': tokens.graphicOnLight,
  } as CSSProperties
}

export function useVitrineTokens(color?: string | null) {
  return deriveVitrineTokens(color ?? '#0EA5E9')
}

export function VitrineRoot({ tokens, children }: { tokens: VitrineTokens; children: React.ReactNode }) {
  return (
    <div className={`vt ${vitrineFont.variable}`} style={vitrineVars(tokens)}>
      <style dangerouslySetInnerHTML={{ __html: VITRINE_CSS }} />
      {children}
    </div>
  )
}

// SVG/GIF exclus de next/image volontairement : un SVG n'a rien à optimiser
// (déjà vectoriel, et de toute façon exclu à l'upload produit — voir
// products.ts), un GIF animé perdrait son animation si next/image le
// retraite en AVIF/WebP statique. Les deux restent en <img> brut.
function isOptimizableImage(url: string): boolean {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? ''
  return ext !== 'svg' && ext !== 'gif'
}

export function getPrimaryPhoto(product: Product): string | null {
  if (Array.isArray(product.photos) && product.photos.length > 0) {
    const photos = product.photos as unknown as { url: string; is_primary?: boolean }[]
    return photos.find(p => p.is_primary)?.url ?? photos[0]?.url ?? null
  }
  return product.photo_url
}

/** Toutes les photos d'un produit, primaire d'abord — pour la galerie à vignettes (fiche produit uniquement). */
export function getSortedPhotos(product: Product): { url: string; is_primary?: boolean }[] {
  if (Array.isArray(product.photos) && product.photos.length > 0) {
    const photos = product.photos as unknown as { url: string; is_primary?: boolean }[]
    return [...photos].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
  }
  return product.photo_url ? [{ url: product.photo_url }] : []
}

/**
 * Image produit ; sans photo : placeholder propre (jamais un rectangle vide).
 * `sizes` par défaut pensé pour une carte de grille (2 colonnes mobile, 3
 * tablette, 4 desktop — vitrine-styles.ts:~270-327) ; les appelants dans un
 * autre contexte (liste, produit vedette) passent leur propre valeur.
 */
export function ProductMedia({
  photo, alt, className = 'vt-media', sizes = '(max-width:767px) 50vw, (max-width:1023px) 33vw, 25vw', priority = false,
}: { photo: string | null; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  return (
    <div className={className} style={{ position: 'relative' }}>
      {photo ? (
        isOptimizableImage(photo) ? (
          <Image src={photo} alt={alt} fill sizes={sizes} style={{ objectFit: 'cover' }} priority={priority} loading={priority ? undefined : 'lazy'} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={alt} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )
      ) : (
        <div className="vt-ph" role="img" aria-label={`${alt} — pas de photo`}>
          <Package size={40} strokeWidth={1.4} aria-hidden="true" />
        </div>
      )}
    </div>
  )
}

/**
 * Galerie fiche produit : grande photo + bande de vignettes cliquables (vignette
 * active surlignée dans la couleur de marque). Écrite dans le style Vitrine
 * (img simple + classes vt-*, pas next/image ni Tailwind) plutôt que réutilisée
 * depuis src/components/pwa/ProductGallery.tsx, qui dépend de next/image, de
 * classes Tailwind (couleurs/espacements Classique) et embarque la vidéo produit
 * — hors périmètre ici. Bandeau de vignettes masqué si une seule photo (ou
 * aucune), comme demandé.
 */
export function ProductGallery({ photos, alt }: { photos: { url: string; is_primary?: boolean }[]; alt: string }) {
  const [active, setActive] = useState(0)
  const current = photos[active] ?? null

  return (
    <>
      <div className="vt-pgm">
        {current ? (
          isOptimizableImage(current.url) ? (
            <Image
              src={current.url}
              alt={`${alt} ${active + 1}/${photos.length}`}
              fill
              sizes="(max-width:767px) 100vw, 50vw"
              priority={active === 0}
              loading={active === 0 ? undefined : 'lazy'}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt={`${alt} ${active + 1}/${photos.length}`} loading={active === 0 ? undefined : 'lazy'} />
          )
        ) : (
          <div className="vt-ph" role="img" aria-label={`${alt} — pas de photo`}>
            <Package size={40} strokeWidth={1.4} aria-hidden="true" />
          </div>
        )}
      </div>
      {photos.length > 1 && (
        <div className="vt-pg-thumbs" role="tablist" aria-label={`Photos de ${alt}`}>
          {photos.map((p, i) => (
            <button
              key={p.url + i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Photo ${i + 1}`}
              className={`vt-pg-thumb${i === active ? ' is-active' : ''}`}
              onClick={() => setActive(i)}
              style={{ position: 'relative' }}
            >
              {isOptimizableImage(p.url) ? (
                <Image src={p.url} alt="" fill sizes="52px" style={{ objectFit: 'cover' }} loading="lazy" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/**
 * « Lire un extrait » (produits digitaux). Réutilise la fenêtre modale partagée
 * (src/components/ui/Modal — Radix, neutre, déjà utilisée ailleurs dans le
 * dépôt, sans couleur de marque Classique) plutôt que
 * src/components/pwa/DigitalPreviewModal.tsx, dont le bouton déclencheur est
 * codé en violet Tailwind (couleur de marque Classique, pas celle du
 * marchand) — seule la fenêtre (structure, accessibilité clavier/focus) est
 * reprise, le déclencheur est redessiné dans le style Vitrine (var(--brand)).
 */
export function DigitalExtractButton({ text, productName }: { text: string; productName: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="vt-extract-btn" onClick={() => setOpen(true)}>
        <BookOpen size={17} aria-hidden="true" />
        Lire un extrait
      </button>
      <Modal open={open} onOpenChange={setOpen} title="Extrait" description={productName}>
        <p className="vt-extract-text">{text}</p>
      </Modal>
    </>
  )
}

/** Texte limité à `maxLines` lignes, sur toutes les tailles d'écran, bascule « Voir plus »/« Voir moins ». */
export function ClampedLines({ text, maxLines, className, moreClassName = 'vt-pdesc-more' }: { text: string; maxLines: number; className?: string; moreClassName?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || expanded) return
    const measure = () => setOverflowing(el.scrollHeight > el.clientHeight + 1)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [text, expanded])

  return (
    <>
      <p
        ref={ref}
        className={className}
        style={expanded ? undefined : { display: '-webkit-box', WebkitLineClamp: maxLines, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {text}
      </p>
      {(overflowing || expanded) && (
        <button type="button" className={moreClassName} aria-expanded={expanded} onClick={() => setExpanded(v => !v)}>
          {expanded ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </>
  )
}

export function InstagramIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.117.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12c0 3.259.014 3.668.072 4.948.061 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24c3.259 0 3.668-.014 4.948-.072 1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.689.072-4.948 0-3.259-.013-3.667-.072-4.947-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.013 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
}
export function TikTokIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.54V6.77a4.85 4.85 0 0 1-1.07-.08z" /></svg>
}
export function FacebookIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
}

export function ShopLogo({ shop, className = 'vt-logo' }: { shop: { name: string; logo_url?: string | null }; className?: string }) {
  if (shop.logo_url) {
    if (!isOptimizableImage(shop.logo_url)) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={shop.logo_url} alt={shop.name} className={className} />
    }
    return (
      <div className={className} style={{ position: 'relative', overflow: 'hidden' }}>
        <Image src={shop.logo_url} alt={shop.name} fill sizes="52px" style={{ objectFit: 'cover' }} loading="lazy" />
      </div>
    )
  }
  return <div className="vt-mono" aria-hidden="true">{shop.name[0]?.toUpperCase()}</div>
}

interface HeaderProps {
  shop: { name: string; logo_url?: string | null }
  homeHref: string
  shareUrl: string
  shareTitle: string
  brand: string
  waLink: string | null
}

/** En-tête : sans recherche ni lien Catégories (fonctions exclues du thème). */
export function VitrineHeader({ shop, homeHref, shareUrl, shareTitle, brand, waLink }: HeaderProps) {
  return (
    <header className="vt-header">
      <div className="vt-wrap vt-header-in">
        <Link href={homeHref} className="vt-brand" aria-label={`${shop.name} — accueil`}>
          <ShopLogo shop={shop} />
          <b>{shop.name}</b>
        </Link>
        <nav className="vt-nav" aria-label="Navigation">
          <a href={`${homeHref}#catalogue`}>Produits</a>
          <a href={`${homeHref}#etapes`}>Commander</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="vt-only-m" style={{ display: 'flex' }}>
          <ShareButton url={shareUrl} title={shareTitle} primaryColor={brand} />
        </div>
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="vt-btn vt-btn-brand vt-hdr-cta">
            <MessageCircle size={19} aria-hidden="true" />Nous écrire
          </a>
        )}
      </div>
    </header>
  )
}

/** Texte limité à 3 lignes sur mobile, « Lire la suite » déplie sur place (rien n'est perdu). */
export function ClampedText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || expanded) return
    const measure = () => setOverflowing(el.scrollHeight > el.clientHeight + 1)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [text, expanded])

  return (
    <>
      <p ref={ref} className={`${className ?? ''} vt-clamp${expanded ? '' : ' is-clamped'}`}>{text}</p>
      {(overflowing || expanded) && (
        <button type="button" className="vt-more vt-only-m" aria-expanded={expanded} onClick={() => setExpanded(v => !v)}>
          {expanded ? 'Réduire' : 'Lire la suite'}
        </button>
      )}
    </>
  )
}

function PaymentLogos({ payment }: { payment: VitrinePaymentInfo }) {
  return (
    <div className="vt-pay">
      {payment.allItems.map(item =>
        item.logo ? (
          <span key={item.label} className="vt-paylogo">
            <Image src={item.logo} alt={item.label} width={48} height={40} sizes="48px" />
          </span>
        ) : (
          <span key={item.label} className="vt-paypill">{item.label}</span>
        )
      )}
    </div>
  )
}

interface FooterProps {
  shop: {
    id: string
    name: string
    logo_url?: string | null
    description?: string | null
    city?: string | null
    social_links?: Record<string, string> | null
  }
  homeHref: string
  waNumber: string | null
  waLink: string | null
  payment: VitrinePaymentInfo
  /** Fiche produit : pas de colonnes Boutique/Contact. */
  compact?: boolean
  hasCommunity?: boolean
}

export function VitrineFooter({ shop, homeHref, waNumber, waLink, payment, compact = false, hasCommunity = false }: FooterProps) {
  const links = shop.social_links ?? {}
  const socials = [
    { key: 'instagram', label: 'Instagram', href: safeHttpUrl(links.instagram), Icon: InstagramIcon },
    { key: 'tiktok', label: 'TikTok', href: safeHttpUrl(links.tiktok), Icon: TikTokIcon },
    { key: 'facebook', label: 'Facebook', href: safeHttpUrl(links.facebook), Icon: FacebookIcon },
  ].filter(s => s.href)
  const description = shop.description?.trim()

  return (
    <footer id="contact" className="vt-footer vt-darkzone">
      <div className={`vt-wrap vt-foot-in${compact ? ' vt-foot-compact' : ''}`}>
        <div className="vt-foot-brand">
          <div className="vt-foot-id">
            <ShopLogo shop={shop} />
            <div>
              <b>{shop.name}</b>
              {shop.city && <small>{shop.city}</small>}
            </div>
          </div>
          {description && <ClampedText text={description} className="vt-foot-desc" />}
          {(socials.length > 0 || waLink) && (
            <div>
              <span className="vt-foot-lbl vt-only-m">Suis-nous</span>
              <div className="vt-soc">
                {socials.map(({ key, label, href, Icon }) => (
                  <a key={key} href={href!} target="_blank" rel="noopener noreferrer" aria-label={label}><Icon /></a>
                ))}
                {waLink && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><MessageCircle size={21} aria-hidden="true" /></a>
                )}
              </div>
            </div>
          )}
        </div>

        {!compact && (
          <>
            <div className="vt-foot-col-nav">
              <span className="vt-foot-lbl">Boutique</span>
              <div className="vt-foot-links">
                <a href={`${homeHref}#catalogue`}>Produits</a>
                <a href={`${homeHref}#etapes`}>Commander en 3 étapes</a>
                {hasCommunity && <a href={`${homeHref}#communaute`}>Communauté WhatsApp</a>}
              </div>
            </div>
            {(waNumber || shop.city) && (
              <div>
                <span className="vt-foot-lbl vt-contact-lbl">Contact</span>
                <div className="vt-foot-cta">
                  {waNumber && (
                    <a href={`tel:${waNumber}`} className="vt-btn" style={{ border: '1px solid rgba(255,255,255,.3)' }}>
                      <Phone size={18} aria-hidden="true" />Appeler
                    </a>
                  )}
                  {waLink && (
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="vt-btn" style={{ background: '#fff', color: '#1F1B18' }}>
                      <MessageCircle size={18} aria-hidden="true" />Écrire
                    </a>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {payment.allItems.length > 0 && (
          <div>
            <span className="vt-foot-lbl">Moyens de paiement acceptés</span>
            <PaymentLogos payment={payment} />
          </div>
        )}

        <div className="vt-foot-bot">
          <ReportContentLink shopId={shop.id} className="text-white/70" />
          <a href="https://tekki.shop">Créée avec <b>TEKKIShop</b> ↗</a>
        </div>
      </div>
    </footer>
  )
}

