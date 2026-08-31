'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateShop, updateShopSlug, uploadShopLogo, updateHideBranding, updateCustomDomain, updateBusinessDesign, uploadCoverImage, uploadAboutPhoto, updateMetaPixelId, updateShopCurrency, verifyAndUpdatePayoutNumbers, updateProductLayout } from '@/lib/actions/settings'
import toast from 'react-hot-toast'
import { Camera, X, Plus, Trash2, Link2, Eye, EyeOff, ExternalLink, CheckCircle2, XCircle, Loader2, Globe, EyeOff as EyeOffIcon, Crown, Sparkles, ChevronDown, Check, CreditCard } from 'lucide-react'
import { isEuCaCountry, CURRENCY_LABEL, getPayoutMethods } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import type { Shop, DeliveryZone } from '@/types'
import { APP_URL } from '@/constants'
import { PinInput } from '@/components/ui/PinInput'
import { canUseCustomDomain, canHideTekkishopFooter } from '@/lib/plan-features'

interface Props {
  shop: Shop
}

const PAYOUT_COUNTRIES = [
  { code: 'SN', flag: '🇸🇳', name: 'Sénégal',       dial: '+221', placeholder: '77 000 00 00' },
  { code: 'CI', flag: '🇨🇮', name: "Côte d'Ivoire",  dial: '+225', placeholder: '07 00 00 00 00' },
  { code: 'BJ', flag: '🇧🇯', name: 'Bénin',          dial: '+229', placeholder: '97 00 00 00' },
  { code: 'TG', flag: '🇹🇬', name: 'Togo',           dial: '+228', placeholder: '90 00 00 00' },
  { code: 'ML', flag: '🇲🇱', name: 'Mali',           dial: '+223', placeholder: '70 00 00 00' },
  { code: 'BK', flag: '🇧🇫', name: 'Burkina Faso',   dial: '+226', placeholder: '70 00 00 00' },
]

const MARKET_COUNTRIES_AFRICA = [
  { code: 'SN', flag: '🇸🇳', name: 'Sénégal' },
  { code: 'CI', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: 'BJ', flag: '🇧🇯', name: 'Bénin' },
  { code: 'TG', flag: '🇹🇬', name: 'Togo' },
  { code: 'ML', flag: '🇲🇱', name: 'Mali' },
  { code: 'BK', flag: '🇧🇫', name: 'Burkina Faso' },
]

const MARKET_COUNTRIES_EU_CA = [
  { code: 'FR', flag: '🇫🇷', name: 'France' },
  { code: 'BE', flag: '🇧🇪', name: 'Belgique' },
  { code: 'LU', flag: '🇱🇺', name: 'Luxembourg' },
  { code: 'CH', flag: '🇨🇭', name: 'Suisse' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada' },
]

const COUNTRY_OPTIONS = [
  // Afrique
  { value: 'SN', label: '🇸🇳 Sénégal' },
  { value: 'CI', label: "🇨🇮 Côte d'Ivoire" },
  { value: 'BJ', label: '🇧🇯 Bénin' },
  { value: 'BK', label: '🇧🇫 Burkina Faso' },
  { value: 'TG', label: '🇹🇬 Togo' },
  { value: 'ML', label: '🇲🇱 Mali' },
  { value: 'CM', label: '🇨🇲 Cameroun' },
  { value: 'GN', label: '🇬🇳 Guinée' },
  { value: 'CD', label: '🇨🇩 RDC' },
  { value: 'GA', label: '🇬🇦 Gabon' },
  { value: 'MG', label: '🇲🇬 Madagascar' },
  { value: 'MA', label: '🇲🇦 Maroc' },
  // Europe & Canada
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'BE', label: '🇧🇪 Belgique' },
  { value: 'LU', label: '🇱🇺 Luxembourg' },
  { value: 'CH', label: '🇨🇭 Suisse' },
  { value: 'CA', label: '🇨🇦 Canada' },
]

const COLOR_PRESETS = [
  { label: 'Bleu ciel',  value: '#0EA5E9' },
  { label: 'Bleu',       value: '#2563EB' },
  { label: 'Violet',     value: '#7C3AED' },
  { label: 'Rose',       value: '#DB2777' },
  { label: 'Vert',       value: '#059669' },
  { label: 'Orange',     value: '#E85D04' },
  { label: 'Rouge',      value: '#DC2626' },
  { label: 'Ardoise',    value: '#475569' },
]

export function SettingsForm({ shop, section = 'boutique' }: Props & { section?: string }) {
  const router                                  = useRouter()
  const [saving, setSaving]                     = useState(false)
  const [logoUrl, setLogoUrl]                   = useState<string | null>(shop.logo_url)
  const [uploadingLogo, setUploadingLogo]       = useState(false)
  const [primaryColor, setPrimaryColor]         = useState(shop.primary_color ?? '#0EA5E9')
  const [acceptOnlinePayment, setAcceptOnline]  = useState(shop.accept_online_payment ?? true)
  const [acceptCashOnDelivery, setAcceptCash]  = useState(shop.accept_cash_on_delivery ?? true)
  const initDeliveryOpts = (shop.delivery_options ?? { home_delivery: true, store_pickup: true }) as { home_delivery: boolean; store_pickup: boolean }
  const [homeDelivery, setHomeDelivery]         = useState(initDeliveryOpts.home_delivery)
  const [storePickup, setStorePickup]           = useState(initDeliveryOpts.store_pickup)
  const [deliveryZones, setDeliveryZones]       = useState<DeliveryZone[]>(
    Array.isArray(shop.delivery_zones) ? (shop.delivery_zones as unknown as DeliveryZone[]) : []
  )
  const [slug, setSlug]                         = useState(shop.slug)
  const [confirmedSlug, setConfirmedSlug]       = useState(shop.slug)
  const [savingSlug, setSavingSlug]             = useState(false)
  const [slugStatus, setSlugStatus]             = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle')
  const slugTimerRef                            = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Plan Pro
  const isPro                                   = shop.plan === 'pro'
  // Domaine personnalisé + mention TekkiShop masquée : routés par
  // lib/plan-features.ts plutôt que la vérification de plan brute ci-dessus.
  // isPro reste utilisé pour Stripe Connect (choix de clés API, pas un
  // drapeau de fonctionnalité boutique) et la section Design Avancé
  // (bandeau, catégorie, horaires, badges — fusion prévue au lot 3 de la
  // refonte boutiques, pas touchée ici).
  const canCustomizeDomainOrFooter              = canUseCustomDomain(shop.plan) || canHideTekkishopFooter(shop.plan)
  const [hideBranding, setHideBranding]         = useState(shop.hide_branding ?? false)
  const [savingBranding, setSavingBranding]     = useState(false)
  const [customDomain, setCustomDomain]         = useState(shop.custom_domain ?? '')
  const [savingDomain, setSavingDomain]         = useState(false)
  const [domainStatus, setDomainStatus]         = useState<'idle' | 'checking' | 'verified' | 'failed'>('idle')
  const [showSecretKey, setShowSecretKey]       = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Plan Pro - Design personnalisé
  // TypeScript peut râler ici si les migrations ne sont pas appliquées
  const isProPlan                               = shop.plan === 'pro'
  const shopAny = shop as unknown as Record<string, unknown>
  const [coverImageUrl, setCoverImageUrl]       = useState<string | null>((shopAny.cover_image_url as string | null) ?? null)
  const [uploadingCover, setUploadingCover]     = useState(false)
  const [aboutPhotoUrl, setAboutPhotoUrl]       = useState<string | null>((shopAny.about_photo_url as string | null) ?? null)
  const [uploadingAbout, setUploadingAbout]     = useState(false)
  const [businessCategory, setBusinessCategory] = useState((shopAny.business_category as string | null) ?? '')
  const [badges, setBadges]                     = useState<string[]>(
    Array.isArray(shopAny.badges) ? (shopAny.badges as unknown as string[]) : []
  )
  const [socialLinks, setSocialLinks]           = useState<Record<string, string>>(
    shopAny.social_links && typeof shopAny.social_links === 'object' ? (shopAny.social_links as Record<string, string>) : {}
  )
  const [openingHours, setOpeningHours]         = useState((shopAny.opening_hours as string | null) ?? '')
  const [savingBusiness, setSavingBusiness]     = useState(false)
  const coverInputRef                           = useRef<HTMLInputElement>(null)
  const aboutInputRef                           = useRef<HTMLInputElement>(null)
  const [productLayout, setProductLayout]       = useState<'list' | 'grid'>((shopAny.product_layout as 'list' | 'grid' | null) ?? 'list')
  const [savingLayout, setSavingLayout]         = useState(false)

  const [country, setCountry] = useState(shop.country ?? '')

  // Marchés cibles — pays depuis lesquels les clients peuvent commander
  const ALL_MARKET_COUNTRIES = MARKET_COUNTRIES_AFRICA.map(c => c.code)
  const shopAnyMarkets = shop as unknown as Record<string, unknown>
  const [targetCountries, setTargetCountries] = useState<string[]>(() => {
    const val = shopAnyMarkets.target_countries
    return Array.isArray(val) ? (val as string[]) : ALL_MARKET_COUNTRIES
  })

  function toggleMarket(code: string) {
    setTargetCountries(prev =>
      prev.includes(code)
        ? prev.length > 1 ? prev.filter(c => c !== code) : prev // au moins 1 pays
        : [...prev, code]
    )
  }

  // Pays pour les numéros de reversement (limité aux 6 pays Bictorys)
  const initPayoutCountryCode: string = (() => {
    const num = shop.payout_wave_number ?? shop.payout_om_number
    if (num) {
      const found = PAYOUT_COUNTRIES.find(c => num.startsWith(c.dial))
      if (found) return found.code
    }
    return PAYOUT_COUNTRIES.some(c => c.code === shop.country) ? (shop.country ?? 'SN') : 'SN'
  })()
  const [payoutCountry, setPayoutCountry]   = useState(initPayoutCountryCode)
  const [payoutDialOpen, setPayoutDialOpen] = useState(false)
  const payoutDialRef                       = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (payoutDialRef.current && !payoutDialRef.current.contains(e.target as Node)) {
        setPayoutDialOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const selectedPayoutCountry = PAYOUT_COUNTRIES.find(c => c.code === payoutCountry) ?? PAYOUT_COUNTRIES[0]

  // Numéros locaux (sans indicatif) pour les champs Wave et OM
  const stripDial = (full: string | null): string => {
    if (!full) return ''
    const found = PAYOUT_COUNTRIES.find(c => full.startsWith(c.dial))
    return found ? full.slice(found.dial.length) : full
  }
  const [waveLocal, setWaveLocal] = useState(() => stripDial(shop.payout_wave_number ?? null))
  const [omLocal,   setOmLocal]   = useState(() => stripDial(shop.payout_om_number   ?? null))

  // Confirmation mot de passe pour modifier les numéros de reversement
  const [payoutConfirmOpen, setPayoutConfirmOpen] = useState(false)
  const [confirmPassword,   setConfirmPassword]   = useState('')
  const [payoutSaving,      setPayoutSaving]       = useState(false)
  const [payoutSaveError,   setPayoutSaveError]    = useState<string | null>(null)

  async function handlePayoutSave() {
    if (!confirmPassword) return
    setPayoutSaving(true)
    setPayoutSaveError(null)
    const waveNum = waveLocal.trim() ? `${selectedPayoutCountry.dial}${waveLocal.trim()}` : null
    const omNum   = omLocal.trim()   ? `${selectedPayoutCountry.dial}${omLocal.trim()}`   : null
    const result  = await verifyAndUpdatePayoutNumbers(confirmPassword, waveNum, omNum)
    setPayoutSaving(false)
    if (result.error) {
      setPayoutSaveError(result.error)
      return
    }
    toast.success('Numéros de reversement enregistrés ✓')
    setPayoutConfirmOpen(false)
    setConfirmPassword('')
  }

  // Stripe Connect (EU/CA Pro uniquement)
  const isEuCa                              = isEuCaCountry(shop.country ?? null)
  const stripeConnectId                     = (shopAny.stripe_account_id as string | null) ?? null
  const stripeConnectEnabled                = (shopAny.stripe_connect_enabled as boolean | null) ?? false
  const [loadingConnect, setLoadingConnect] = useState(false)
  const [connectError, setConnectError]     = useState<string | null>(null)

  const stripeConnectParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('stripe_connect')
    : null
  const stripeConnectErrorParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('stripe_error')
    : null

  async function handleStripeConnect() {
    setLoadingConnect(true)
    setConnectError(null)
    try {
      const res  = await fetch('/api/stripe/connect/create-link', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setConnectError(data.error ?? 'Erreur lors de la connexion Stripe')
        return
      }
      window.location.href = data.url
    } catch {
      setConnectError('Erreur réseau. Réessayez.')
    } finally {
      setLoadingConnect(false)
    }
  }

  // Meta Pixel
  const metaPixelIdValue = (shop as unknown as Record<string, unknown>).meta_pixel_id
  const [metaPixelId, setMetaPixelId]           = useState<string>(
    typeof metaPixelIdValue === 'string' ? metaPixelIdValue : ''
  )
  const [savingPixel, setSavingPixel]           = useState(false)

  // Devise du shop
  const [shopCurrency, setShopCurrency]         = useState<ShopCurrency>(
    (shopAny.currency as ShopCurrency | null) ?? 'XOF'
  )
  const [savingCurrency, setSavingCurrency]     = useState(false)

  async function handleSaveCurrency() {
    setSavingCurrency(true)
    const result = await updateShopCurrency(shopCurrency)
    setSavingCurrency(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Devise mise à jour ✓')
    }
  }

  // Debounced slug availability check
  useEffect(() => {
    if (slug === confirmedSlug) { setSlugStatus('idle'); return }
    if (slug.length < 2)       { setSlugStatus('idle'); return }

    setSlugStatus('checking')
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current)
    slugTimerRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/shops/check-slug?slug=${encodeURIComponent(slug)}`)
        const data = await res.json() as { available?: boolean; error?: string }
        setSlugStatus(data.available ? 'available' : 'taken')
      } catch {
        setSlugStatus('error')
      }
    }, 500)

    return () => { if (slugTimerRef.current) clearTimeout(slugTimerRef.current) }
  }, [slug, confirmedSlug])

  function sanitizeSlugInput(v: string) {
    return v
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+/, '')
      .slice(0, 50)
  }

  async function handleHideBrandingToggle(value: boolean) {
    setSavingBranding(true)
    const result = await updateHideBranding(value)
    if (result.error) toast.error(result.error)
    else { setHideBranding(value); toast.success(value ? 'Mention TekkiShop masquée ✓' : 'Mention TekkiShop réactivée ✓') }
    setSavingBranding(false)
  }

  async function handleDomainSave() {
    const cleaned = customDomain.trim().toLowerCase()
    setSavingDomain(true)
    const result = await updateCustomDomain(cleaned || null)
    if (result.error) toast.error(result.error)
    else toast.success(cleaned ? 'Domaine enregistré ✓' : 'Domaine supprimé ✓')
    setSavingDomain(false)
  }

  async function handleDomainVerify() {
    if (!customDomain.trim()) return
    setDomainStatus('checking')
    try {
      const res  = await fetch(`/api/shops/verify-domain?domain=${encodeURIComponent(customDomain.trim())}`)
      const data = await res.json() as { verified: boolean; cname?: string; error?: string }
      setDomainStatus(data.verified ? 'verified' : 'failed')
    } catch {
      setDomainStatus('failed')
    }
  }

  async function handleCoverImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    const fd = new FormData()
    fd.append('cover', file)
    const result = await uploadCoverImage(fd)
    if ('error' in result) {
      toast.error(result.error ?? 'Erreur')
    } else {
      setCoverImageUrl(result.url ?? null)
      toast.success('Image de couverture mise à jour ✓')
      window.dispatchEvent(new CustomEvent('shop-updated'))
    }
    setUploadingCover(false)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  async function handleAboutPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAbout(true)
    const fd = new FormData()
    fd.append('about_photo', file)
    const result = await uploadAboutPhoto(fd)
    if ('error' in result) {
      toast.error(result.error ?? 'Erreur')
    } else {
      setAboutPhotoUrl(result.url ?? null)
      toast.success('Photo À propos mise à jour ✓')
      window.dispatchEvent(new CustomEvent('shop-updated'))
    }
    setUploadingAbout(false)
    if (aboutInputRef.current) aboutInputRef.current.value = ''
  }

  async function handleBusinessSave() {
    setSavingBusiness(true)
    const result = await updateBusinessDesign({
      business_category: businessCategory.trim() || null,
      badges: badges.filter(b => b.trim()),
      social_links: Object.fromEntries(
        Object.entries(socialLinks).filter(([_, v]) => v.trim())
      ),
      opening_hours: openingHours.trim() || null,
    })
    if ('error' in result) toast.error(result.error ?? 'Erreur')
    else {
      toast.success('Design Business mis à jour ✓')
      window.dispatchEvent(new CustomEvent('shop-updated'))
    }
    setSavingBusiness(false)
  }

  async function handleMetaPixelSave() {
    setSavingPixel(true)
    const result = await updateMetaPixelId(metaPixelId.trim() || null)
    if ('error' in result) toast.error(result.error ?? 'Erreur')
    else {
      toast.success(metaPixelId ? 'Meta Pixel ID enregistré ✓' : 'Meta Pixel ID supprimé ✓')
      window.dispatchEvent(new CustomEvent('shop-updated'))
    }
    setSavingPixel(false)
  }

  async function handleSlugSave() {
    const trimmed = slug.trim().replace(/-+$/, '')
    if (!trimmed || trimmed.length < 2) {
      toast.error("L'URL doit faire au moins 2 caractères.")
      return
    }
    setSavingSlug(true)
    const result = await updateShopSlug(trimmed)
    if (result.error) {
      toast.error(result.error)
      setSlug(confirmedSlug) // remettre le slug confirmé en cas d'erreur
    } else {
      toast.success('URL mise à jour ✓')
      const newSlug = result.slug ?? trimmed
      setSlug(newSlug)
      setConfirmedSlug(newSlug)
      setSlugStatus('idle')
      router.refresh() // met à jour ShopLinkCard + PWAPreviewPanel côté serveur
    }
    setSavingSlug(false)
  }

  function addZone() {
    setDeliveryZones(prev => [...prev, { id: crypto.randomUUID(), name: '', price: 0 }])
  }

  function updateZone(id: string, patch: Partial<DeliveryZone>) {
    setDeliveryZones(prev => prev.map(z => z.id === id ? { ...z, ...patch } : z))
  }

  function removeZone(id: string) {
    setDeliveryZones(prev => prev.filter(z => z.id !== id))
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const fd = new FormData()
    fd.append('logo', file)
    const result = await uploadShopLogo(fd)
    if ('error' in result) {
      toast.error(result.error ?? 'Erreur')
    } else {
      setLogoUrl(result.url ?? null)
      toast.success('Logo mis à jour ✓')
      window.dispatchEvent(new CustomEvent('shop-updated'))
    }
    setUploadingLogo(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const bictorysKey     = (fd.get('bictorys_secret_key') as string | null)?.trim() || null
    const bictorysWebhook = (fd.get('bictorys_webhook_secret') as string | null)?.trim() || null

    const result = await updateShop({
      name:              (fd.get('name') as string).trim(),
      city:              (fd.get('city') as string).trim(),
      country:           country || null,
      phone_whatsapp:    (fd.get('phone_whatsapp') as string).trim(),
      email:             (fd.get('email') as string | null)?.trim() || undefined,
      address:           (fd.get('address') as string).trim() || undefined,
      description:       (fd.get('description') as string).trim() || undefined,
      primary_color:     primaryColor,
      accept_online_payment:    acceptOnlinePayment,
      accept_cash_on_delivery:  acceptCashOnDelivery,
      target_countries:  targetCountries,
      delivery_options:  { home_delivery: homeDelivery, store_pickup: storePickup },
      delivery_zones:    deliveryZones.filter(z => z.name.trim()),
      ...(shop.plan === 'pro' ? {
        bictorys_secret_key:     bictorysKey,
        bictorys_webhook_secret: bictorysWebhook,
      } : {}),
    })
    if ('error' in result) {
      toast.error(result.error ?? 'Erreur')
    } else {
      toast.success('Paramètres enregistrés ✓')
      window.dispatchEvent(new CustomEvent('shop-updated'))
    }
    setSaving(false)
  }

  return (
    <>
    <form onSubmit={handleSubmit}>
      {/* ── BOUTIQUE ─────────────────────────────────────── */}
      <div className={section !== 'boutique' ? 'hidden' : 'space-y-4'}>
      {/* Logo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la boutique</label>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-16 w-16 rounded-xl object-cover border border-gray-200"
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl text-white text-2xl font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {shop.name[0]?.toUpperCase()}
              </div>
            )}
            {uploadingLogo && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Camera className="h-3.5 w-3.5" />
              {uploadingLogo ? 'Upload...' : 'Changer le logo'}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={async () => {
                  const result = await updateShop({ logo_url: null })
                  if (!('error' in result)) {
                    setLogoUrl(null)
                    window.dispatchEvent(new CustomEvent('shop-updated'))
                  }
                }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
              >
                <X className="h-3 w-3" />
                Supprimer
              </button>
            )}
            <p className="text-xs text-gray-400">JPG, PNG · max 2 Mo</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>
      </div>

      {/* Couleur principale */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Couleur principale</label>
        <div className="flex flex-wrap items-center gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => setPrimaryColor(c.value)}
              className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c.value,
                borderColor:     primaryColor === c.value ? c.value : 'transparent',
                boxShadow:       primaryColor === c.value ? `0 0 0 2px white, 0 0 0 4px ${c.value}` : undefined,
              }}
            />
          ))}
          <div className="flex items-center gap-1.5 ml-1">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-7 w-7 cursor-pointer rounded-full border border-gray-200"
              title="Couleur personnalisée"
            />
            <span className="text-xs text-gray-400 font-mono">{primaryColor}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom de la boutique <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          defaultValue={shop.name}
          required
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ville <span className="text-red-500">*</span>
          </label>
          <input
            name="city"
            defaultValue={shop.city ?? ''}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] bg-white"
          >
            <option value="">— Sélectionner —</option>
            {COUNTRY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          WhatsApp de la boutique <span className="text-red-500">*</span>
        </label>
        <input
          name="phone_whatsapp"
          type="tel"
          defaultValue={shop.phone_whatsapp ?? ''}
          required
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-mail de notification{' '}
          <span className="text-xs font-normal text-gray-400">(optionnel)</span>
        </label>
        <input
          name="email"
          type="email"
          defaultValue={(shop as Shop & { email?: string }).email ?? ''}
          placeholder="vous@exemple.com"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
        />
        <p className="mt-1 text-xs text-gray-400">
          Recevez une copie de chaque nouvelle commande par e-mail, en complément du WhatsApp.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
        <input
          name="address"
          defaultValue={shop.address ?? ''}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          defaultValue={shop.description ?? ''}
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] resize-none"
          placeholder="Décris ton site en quelques mots..."
        />
      </div>

      {/* ── Affichage du catalogue ───────────────────────── */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Affichage des produits</p>
          <p className="text-xs text-gray-500 mt-0.5">Vue par défaut sur ta page d&apos;accueil — le client peut toujours la changer.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'list', label: 'Liste', preview: (
              <div className="space-y-1.5">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-2 w-3/4 rounded bg-gray-200" />
                      <div className="h-2 w-1/2 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            )},
            { value: 'grid', label: 'Grille', preview: (
              <div className="grid grid-cols-2 gap-1.5">
                {[1,2,3,4].map(i => (
                  <div key={i} className="space-y-1">
                    <div className="aspect-square rounded bg-gray-200" />
                    <div className="h-2 w-3/4 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            )},
          ] as const).map(({ value, label, preview }) => {
            const isActive = productLayout === value
            return (
              <button
                key={value}
                type="button"
                onClick={async () => {
                  if (isActive || savingLayout) return
                  setSavingLayout(true)
                  setProductLayout(value)
                  const res = await updateProductLayout(value)
                  if (res.error) {
                    toast.error(res.error)
                    setProductLayout(productLayout)
                  } else {
                    toast.success('Affichage mis à jour.')
                  }
                  setSavingLayout(false)
                }}
                className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                  isActive
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                style={{ '--color-primary': primaryColor } as React.CSSProperties}
              >
                {isActive && (
                  <span
                    className="absolute top-2 right-2 h-4 w-4 rounded-full flex items-center justify-center text-white text-[10px]"
                    style={{ backgroundColor: primaryColor }}
                  >✓</span>
                )}
                <div className="mb-2 pointer-events-none">{preview}</div>
                <p className={`text-xs font-semibold ${isActive ? '' : 'text-gray-600'}`} style={isActive ? { color: primaryColor } : {}}>
                  {label}
                </p>
              </button>
            )
          })}
        </div>
        {savingLayout && (
          <p className="text-xs text-gray-400">Sauvegarde en cours…</p>
        )}
      </div>
      </div>{/* /boutique */}

      {/* ── VENTES ───────────────────────────────────────── */}
      <div className={section !== 'ventes' ? 'hidden' : 'space-y-4'}>

      {/* Paiements mobile money */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-3">
        {/* Toggle Mobile Money */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Paiement Mobile Money</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {acceptOnlinePayment
                ? 'Tes clients peuvent payer en ligne (Wave, OM, Maxit).'
                : 'Le paiement en ligne est désactivé.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAcceptOnline(v => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${acceptOnlinePayment ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}
            style={acceptOnlinePayment ? { backgroundColor: primaryColor } : {}}
            role="switch"
            aria-checked={acceptOnlinePayment}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${acceptOnlinePayment ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Toggle Paiement à la livraison */}
        <div className="flex items-start justify-between gap-4 pt-3 border-t border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">Paiement à la livraison</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {acceptCashOnDelivery
                ? 'Tes clients peuvent payer en cash à la réception.'
                : 'Seul le paiement en ligne est accepté.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAcceptCash(v => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${acceptCashOnDelivery ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}
            style={acceptCashOnDelivery ? { backgroundColor: primaryColor } : {}}
            role="switch"
            aria-checked={acceptCashOnDelivery}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${acceptCashOnDelivery ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {acceptOnlinePayment && !isEuCa && (
          <div className="space-y-3 pt-1 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500">Numéros de reversement</p>
            <p className="text-[11px] text-gray-400">
              Ces numéros servent à recevoir tes reversements de la part de TEKKIShop.
            </p>

            {/* Champ 1 — méthode principale selon pays */}
            <div ref={payoutDialRef}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Numéro {getPayoutMethods(shop.country ?? null)[0]?.label ?? 'Mobile Money principal'}
              </label>
              <div className="relative flex rounded-xl border border-gray-200 bg-white focus-within:border-[var(--color-primary)] transition-colors">
                <button
                  type="button"
                  onClick={() => setPayoutDialOpen(v => !v)}
                  className="flex shrink-0 h-full items-center gap-1 bg-gray-50 px-3 border-r border-gray-200 text-sm font-medium text-gray-700 rounded-l-xl"
                >
                  <span>{selectedPayoutCountry.flag}</span>
                  <span className="font-mono">{selectedPayoutCountry.dial}</span>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
                {payoutDialOpen && (
                  <div className="absolute left-0 top-full mt-1 z-30 w-52 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                    {PAYOUT_COUNTRIES.map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => { setPayoutCountry(c.code); setPayoutDialOpen(false) }}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-gray-50 text-left transition-colors"
                      >
                        <span>{c.flag}</span>
                        <span className="flex-1 text-gray-800 text-xs">{c.name}</span>
                        <span className="font-mono text-gray-500 text-xs">{c.dial}</span>
                        {payoutCountry === c.code && <Check className="h-3.5 w-3.5 text-[var(--color-primary)] shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="tel"
                  value={waveLocal}
                  onChange={e => setWaveLocal(e.target.value)}
                  placeholder={selectedPayoutCountry.placeholder}
                  className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Champ 2 — méthode secondaire si disponible dans le pays */}
            {getPayoutMethods(shop.country ?? null)[1] && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Numéro {getPayoutMethods(shop.country ?? null)[1]!.label} (optionnel)
                </label>
                <div className="flex rounded-xl border border-gray-200 bg-white focus-within:border-[var(--color-primary)] transition-colors">
                  <div className="flex shrink-0 h-full items-center gap-1 bg-gray-50 px-3 border-r border-gray-200 text-sm font-medium text-gray-700 rounded-l-xl select-none">
                    <span>{selectedPayoutCountry.flag}</span>
                    <span className="font-mono">{selectedPayoutCountry.dial}</span>
                  </div>
                  <input
                    type="tel"
                    value={omLocal}
                    onChange={e => setOmLocal(e.target.value)}
                    placeholder={selectedPayoutCountry.placeholder}
                    className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
                  />
                </div>
              </div>
            )}

            {/* Bouton dédié — séparé du formulaire principal pour exiger la confirmation */}
            <button
              type="button"
              onClick={() => { setPayoutSaveError(null); setConfirmPassword(''); setPayoutConfirmOpen(true) }}
              className="w-full rounded-xl border border-[var(--color-primary)] py-2.5 text-sm font-semibold text-[var(--color-primary)] hover:bg-orange-50 transition-colors"
            >
              Enregistrer les numéros de reversement
            </button>
          </div>
        )}
        {acceptOnlinePayment && isEuCa && (
          <div className="pt-1 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Les paiements clients sont gérés directement via ton compte Stripe Connect — les fonds arrivent dans ton compte bancaire automatiquement. TEKKIShop ne collecte pas les paiements EU/CA.
            </p>
          </div>
        )}
      </div>

      {/* Modes de réception */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-900">Modes de réception</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Active les modes de réception que tu proposes à tes clients. Au moins un doit être activé.
          </p>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Livraison à domicile</p>
            <p className="text-xs text-gray-500 mt-0.5">Le client reçoit sa commande chez lui</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (homeDelivery && !storePickup) return // au moins un actif
              setHomeDelivery(v => !v)
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${homeDelivery ? '' : 'bg-gray-200'}`}
            style={homeDelivery ? { backgroundColor: primaryColor } : {}}
            role="switch"
            aria-checked={homeDelivery}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${homeDelivery ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="flex items-start justify-between gap-4 pt-3 border-t border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">Retrait en boutique</p>
            <p className="text-xs text-gray-500 mt-0.5">Le client vient chercher sa commande sur place</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (storePickup && !homeDelivery) return // au moins un actif
              setStorePickup(v => !v)
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${storePickup ? '' : 'bg-gray-200'}`}
            style={storePickup ? { backgroundColor: primaryColor } : {}}
            role="switch"
            aria-checked={storePickup}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${storePickup ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {!homeDelivery && !storePickup && (
          <p className="text-[11px] text-amber-600">Au moins un mode de réception doit être activé.</p>
        )}
      </div>

      {/* Zones de livraison */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Zones de livraison</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Définissez vos zones et le coût associé. Laissez vide pour ne pas proposer de zones.
            </p>
          </div>
          <button
            type="button"
            onClick={addZone}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        </div>

        {deliveryZones.length === 0 && (
          <p className="text-xs text-gray-400 italic">Aucune zone définie — le coût de livraison ne sera pas affiché au checkout.</p>
        )}

        <div className="space-y-2">
          {deliveryZones.map((zone) => (
            <div key={zone.id} className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                value={zone.name}
                onChange={(e) => updateZone(zone.id, { name: e.target.value })}
                placeholder="Ex : Dakar"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300"
              />
              <div className="relative w-24 shrink-0">
                <input
                  type="number"
                  min={0}
                  value={zone.price}
                  onChange={(e) => updateZone(zone.id, { price: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-200 px-2 py-2 pr-10 text-sm outline-none focus:border-gray-300"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">F</span>
              </div>
              <button
                type="button"
                onClick={() => removeZone(zone.id)}
                className="shrink-0 text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Marchés cibles */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900">Marchés cibles</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Choisis les pays depuis lesquels tes clients peuvent passer commande. Seuls les indicatifs sélectionnés apparaîtront sur ton site.
          </p>
        </div>

        {/* Afrique */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Afrique</p>
          <div className="grid grid-cols-2 gap-2">
            {MARKET_COUNTRIES_AFRICA.map(c => {
              const active = targetCountries.includes(c.code)
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => toggleMarket(c.code)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors text-left ${
                    active
                      ? 'border-[var(--color-primary)] bg-sky-50 text-gray-900'
                      : 'border-gray-200 bg-white text-gray-500'
                  }`}
                >
                  <div className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                    active ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-gray-300'
                  }`}>
                    {active && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <span>{c.flag}</span>
                  <span className="text-xs font-medium truncate">{c.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Europe & Canada */}
        <div className="space-y-2 pt-1 border-t border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Europe & Canada</p>
          <div className="grid grid-cols-2 gap-2">
            {MARKET_COUNTRIES_EU_CA.map(c => {
              const active = targetCountries.includes(c.code)
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => toggleMarket(c.code)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors text-left ${
                    active
                      ? 'border-[var(--color-primary)] bg-sky-50 text-gray-900'
                      : 'border-gray-200 bg-white text-gray-500'
                  }`}
                >
                  <div className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                    active ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-gray-300'
                  }`}>
                    {active && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <span>{c.flag}</span>
                  <span className="text-xs font-medium truncate">{c.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {targetCountries.length === 1 && (
          <p className="text-[11px] text-amber-600">Au moins 1 marché doit rester actif.</p>
        )}
      </div>

      {/* Clés Bictorys — visible uniquement pour le plan Pro */}
      {shop.plan === 'pro' && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Paiements directs Bictorys</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Tes clients te paient directement sur ton compte Bictorys — <strong>0% de commission</strong>.
              </p>
            </div>
            <a
              href="https://dashboard.bictorys.com"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1 text-xs text-[var(--color-primary)] hover:opacity-75 transition-opacity mt-0.5"
            >
              <ExternalLink className="h-3 w-3" />
              Mon compte
            </a>
          </div>

          <div className="space-y-3 pt-1 border-t border-sky-100">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Clé secrète API</label>
              <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:border-[var(--color-primary)] transition-colors">
                <input
                  name="bictorys_secret_key"
                  type={showSecretKey ? 'text' : 'password'}
                  defaultValue={shop.bictorys_secret_key ?? ''}
                  className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-transparent outline-none font-mono"
                  placeholder="live_secret-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.xxx..."
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(v => !v)}
                  className="px-3 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                >
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Secret webhook</label>
              <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:border-[var(--color-primary)] transition-colors">
                <input
                  name="bictorys_webhook_secret"
                  type={showWebhookSecret ? 'text' : 'password'}
                  defaultValue={shop.bictorys_webhook_secret ?? ''}
                  className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-transparent outline-none font-mono"
                  placeholder="Secret webhook généré dans ton dashboard Bictorys"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(v => !v)}
                  className="px-3 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                >
                  {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Configure l&apos;URL webhook <span className="font-mono">tekki.shop/api/webhooks/bictorys</span> dans ton dashboard Bictorys.
              </p>
            </div>
          </div>
        </div>
      )}
      </div>{/* /ventes */}

      {section !== 'contenu' && (
        <button
          type="submit"
          disabled={saving}
          className="w-full mt-4 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      )}
    </form>

    {/* ── CONTENU ──────────────────────────────────────────────────────── */}
    <div className={section !== 'contenu' ? 'hidden' : 'space-y-5 mt-4'}>
    {/* ── Design Avancé — bannière/photo restent Pro, le reste passe sur tous les plans (§4.3) ── */}
    <div className="mt-5 space-y-5">
      {isProPlan ? (
      <>
        {/* Image de couverture */}
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm font-medium text-gray-900">Image de couverture</p>
            <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-100 rounded-full px-2 py-0.5">Pro</span>
          </div>
          <p className="text-xs text-gray-500">
            Bannière visible en haut de ton site (idéal : 1200x400px)
          </p>

          <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video border border-amber-200">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-sm text-gray-400">Aucune image</span>
              </div>
            )}
            {uploadingCover && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5" />
            {uploadingCover ? 'Upload...' : 'Changer l\'image'}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverImageChange}
          />
        </div>

        {/* Photo À propos */}
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm font-medium text-gray-900">Photo &laquo;&nbsp;À propos&nbsp;&raquo;</p>
            <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-100 rounded-full px-2 py-0.5">Pro</span>
          </div>
          <p className="text-xs text-gray-500">
            Photo de ton équipe, de ta boutique ou de toi — visible dans la section &laquo;&nbsp;À propos&nbsp;&raquo;
          </p>

          <div className="relative rounded-lg overflow-hidden bg-gray-100 h-32 border border-amber-200">
            {aboutPhotoUrl ? (
              <img
                src={aboutPhotoUrl}
                alt="À propos"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-sm text-gray-400">Aucune photo</span>
              </div>
            )}
            {uploadingAbout && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => aboutInputRef.current?.click()}
            disabled={uploadingAbout}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5" />
            {uploadingAbout ? 'Upload...' : 'Choisir une photo'}
          </button>
          <input
            ref={aboutInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAboutPhotoChange}
          />
        </div>
      </>
      ) : (
        /* Teaser — seules la bannière et la photo « À propos » restent Pro */
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm font-semibold text-gray-700">Bannière et photo « À propos »</p>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Personnalise ta page d&apos;accueil avec une bannière et une photo — disponible avec le plan Pro.
          </p>
          <a
            href="/dashboard/upgrade"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            <Sparkles className="h-3 w-3" /> Découvrir le plan Pro
          </a>
        </div>
      )}

        {/* Catégorie métier */}
        <div className="rounded-xl border border-gray-200 p-4 space-y-3">
          <label className="block text-sm font-medium text-gray-900">Domaine d'activité</label>
          <input
            type="text"
            value={businessCategory}
            onChange={e => setBusinessCategory(e.target.value)}
            placeholder="Ex: Électroménager, Mode, Restaurant..."
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-amber-300 transition-colors"
          />
          <p className="text-xs text-gray-400">Décris ce que tu vends (visible sur la page de ton shop)</p>
        </div>

        {/* Horaires d'ouverture */}
        <div className="rounded-xl border border-gray-200 p-4 space-y-3">
          <label className="block text-sm font-medium text-gray-900">Horaires d&apos;ouverture</label>
          <textarea
            value={openingHours}
            onChange={e => setOpeningHours(e.target.value)}
            rows={3}
            placeholder={"Lun-Ven : 8h-20h\nSamedi : 9h-18h\nDimanche : Fermé"}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-amber-300 transition-colors resize-none"
          />
          <p className="text-xs text-gray-400">Affiché sur la page de ton shop (laisse vide pour ne pas afficher)</p>
        </div>

        {/* Badges / Certifications */}
        <div className="rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-900">Badges & Certifications</label>
            <button
              type="button"
              onClick={() => setBadges(prev => [...prev, ''])}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </button>
          </div>
          <div className="space-y-2">
            {badges.map((badge, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={badge}
                  onChange={e => setBadges(prev => {
                    const next = [...prev]
                    next[idx] = e.target.value
                    return next
                  })}
                  placeholder="Ex: Livraison gratuite, Paiement sécurisé..."
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setBadges(prev => prev.filter((_, i) => i !== idx))}
                  className="shrink-0 text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {badges.length === 0 && (
            <p className="text-xs text-gray-400 italic">Aucun badge — ajoute tes certifications ou avantages</p>
          )}
        </div>

        {/* Liens sociaux */}
        <div className="rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-900">Liens sociaux</p>
          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Instagram</label>
              <div className="flex items-center rounded-lg border border-gray-200 px-3 py-2 bg-white gap-2">
                <div className="h-4 w-4 text-pink-500 shrink-0 text-xs font-bold">📷</div>
                <input
                  type="url"
                  value={socialLinks.instagram || ''}
                  onChange={e => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                  placeholder="https://instagram.com/..."
                  className="flex-1 text-sm bg-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">TikTok</label>
              <div className="flex items-center rounded-lg border border-gray-200 px-3 py-2 bg-white gap-2">
                <div className="h-4 w-4 text-gray-900 shrink-0 text-xs font-bold">♪</div>
                <input
                  type="url"
                  value={socialLinks.tiktok || ''}
                  onChange={e => setSocialLinks(prev => ({ ...prev, tiktok: e.target.value }))}
                  placeholder="https://tiktok.com/@..."
                  className="flex-1 text-sm bg-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Facebook</label>
              <div className="flex items-center rounded-lg border border-gray-200 px-3 py-2 bg-white gap-2">
                <div className="h-4 w-4 text-blue-600 shrink-0 text-xs font-bold">f</div>
                <input
                  type="url"
                  value={socialLinks.facebook || ''}
                  onChange={e => setSocialLinks(prev => ({ ...prev, facebook: e.target.value }))}
                  placeholder="https://facebook.com/..."
                  className="flex-1 text-sm bg-transparent outline-none"
                />
              </div>
            </div>

          </div>
          <p className="text-xs text-gray-400">Laisse vide pour ne pas afficher le lien</p>
        </div>

        {/* Bouton sauvegarde */}
        <button
          type="button"
          onClick={handleBusinessSave}
          disabled={savingBusiness}
          className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
        >
          {savingBusiness ? 'Enregistrement...' : 'Enregistrer le design personnalisé'}
        </button>
    </div>

    {/* URL du site — section séparée (hors du form principal) */}
    <div className="mt-5 rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-gray-400 shrink-0" />
        <p className="text-sm font-medium text-gray-900">URL de ton site</p>
      </div>
      <p className="text-xs text-gray-500">
        La partie après <span className="font-mono">tekki.shop/</span>. Attention, changer l'URL rend l'ancien lien inaccessible.
      </p>
      <div className={`flex items-center rounded-xl border bg-white overflow-hidden transition-colors ${
        slugStatus === 'available' ? 'border-green-400' :
        slugStatus === 'taken'    ? 'border-red-400'   :
        'border-gray-200 focus-within:border-gray-300'
      }`}>
        <span className="shrink-0 pl-3 text-xs font-medium text-gray-400 select-none whitespace-nowrap">
          {APP_URL.replace('https://', '').replace('http://', '')}/
        </span>
        <input
          value={slug}
          onChange={e => setSlug(sanitizeSlugInput(e.target.value))}
          onKeyDown={e => e.key === 'Enter' && handleSlugSave()}
          className="flex-1 min-w-0 px-1 py-2.5 text-sm text-gray-900 bg-transparent outline-none font-mono"
          maxLength={50}
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <div className="pr-3 shrink-0">
          {slugStatus === 'checking'  && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          {slugStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {slugStatus === 'taken'     && <XCircle className="h-4 w-4 text-red-500" />}
        </div>
      </div>
      {slugStatus === 'available' && (
        <p className="text-xs text-green-600">Cette URL est disponible ✓</p>
      )}
      {slugStatus === 'taken' && (
        <p className="text-xs text-red-500">Cette URL est déjà utilisée.</p>
      )}
      <button
        type="button"
        onClick={handleSlugSave}
        disabled={savingSlug || slug === confirmedSlug || slugStatus === 'taken' || slugStatus === 'checking'}
        className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {savingSlug ? 'Enregistrement...' : 'Modifier l\'URL'}
      </button>
    </div>

    {/* ── Domaine personnalisé + mention TekkiShop ────────────────────────── */}
    {canCustomizeDomainOrFooter ? (
      <>
        {/* Domaine personnalisé */}
        <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-purple-500 shrink-0" />
            <p className="text-sm font-medium text-gray-900">Domaine personnalisé</p>
            <span className="ml-auto text-[10px] font-bold text-purple-600 bg-purple-100 rounded-full px-2 py-0.5">Pro</span>
          </div>
          <p className="text-xs text-gray-500">
            Remplace <span className="font-mono">tekki.shop/{confirmedSlug}</span> par ton propre domaine.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={customDomain}
              onChange={e => { setCustomDomain(e.target.value.toLowerCase().replace(/\s/g, '')); setDomainStatus('idle') }}
              placeholder="boutique.mondomaine.com"
              className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-mono outline-none focus:border-purple-300 transition-colors"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={handleDomainSave}
              disabled={savingDomain}
              className="shrink-0 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {savingDomain ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>

          {/* Instructions DNS */}
          {(() => {
            const d = customDomain.trim().toLowerCase()
            const parts = d.split('.')
            // Apex domain : seulement 2 parties (ex: viensonsconnait.com)
            const isApex = parts.length === 2
            const isWww  = d.startsWith('www.') && parts.length === 3
            const dnsType  = isApex ? 'A' : 'CNAME'
            const dnsHost  = isApex ? '@' : (isWww ? 'www' : parts[0])
            const dnsValue = isApex ? '216.150.1.1' : 'cname.vercel-dns.com'
            return (
              <div className="rounded-xl border border-purple-200 bg-white p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-700">📋 Configuration DNS requise</p>
                <div className="space-y-2 text-xs text-gray-500">
                  <p>
                    <span className="font-semibold text-gray-700">1. Ajoute cet enregistrement DNS</span> chez ton registrar (OVH, Namecheap, Cloudflare, LWS…) :
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs font-mono bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-600 font-semibold">Type</span>
                  <span className="text-gray-800 font-semibold">{dnsType}</span>
                  <span className="text-gray-600">Nom / Hôte</span>
                  <span className="text-gray-800 break-all font-semibold">{d ? dnsHost : 'exemple'}</span>
                  <span className="text-gray-600">Valeur / Cible</span>
                  <span className="text-gray-800 break-all font-semibold">{dnsValue}</span>
                </div>
                {isApex && (
                  <p className="text-[10px] text-orange-600 bg-orange-50 rounded-lg px-2 py-1.5">
                    ℹ️ Domaine racine détecté — utilise un enregistrement <strong>A</strong> (pas CNAME). Certains registrars l'appellent <strong>&quot;@&quot;</strong> ou <strong>laissent le champ Hôte vide</strong>.
                  </p>
                )}
                <div className="space-y-1 text-xs text-gray-500 pt-1 border-t border-gray-200">
                  <p><span className="font-semibold text-gray-700">2. Attends la propagation DNS</span> (5 min à 48h selon le registrar)</p>
                  <p><span className="font-semibold text-gray-700">3. Clique sur &quot;Vérifier la connexion&quot;</span> pour confirmer</p>
                  <p><span className="text-gray-400">💡 Besoin d'aide ? Contact support@tekki.shop ou WhatsApp 📞</span></p>
                </div>
              </div>
            )
          })()}

          {/* Vérification DNS */}
          {shop.custom_domain && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDomainVerify}
                disabled={domainStatus === 'checking'}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {domainStatus === 'checking' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {domainStatus === 'verified' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                {domainStatus === 'failed'   && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                {domainStatus === 'idle'     && <Globe className="h-3.5 w-3.5 text-gray-400" />}
                Vérifier la connexion
              </button>
              {domainStatus === 'verified' && <p className="text-xs text-green-600 font-medium">DNS configuré correctement ✓</p>}
              {domainStatus === 'failed'   && <p className="text-xs text-red-500">DNS introuvable — vérifie chez ton registrar.</p>}
            </div>
          )}

          {/* Statut activation */}
          {shop.custom_domain && (
            <div className={`rounded-lg p-2.5 text-xs ${
              domainStatus === 'verified'
                ? 'bg-green-50 border border-green-200'
                : domainStatus === 'failed'
                  ? 'bg-orange-50 border border-orange-200'
                  : 'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`font-semibold ${
                domainStatus === 'verified'
                  ? 'text-green-700'
                  : domainStatus === 'failed'
                    ? 'text-orange-700'
                    : 'text-blue-700'
              }`}>
                {domainStatus === 'verified'
                  ? '✓ DNS configuré correctement. Ton domaine est prêt.'
                  : domainStatus === 'failed'
                    ? '⏳ Enregistrement DNS non trouvé. Vérifie ta configuration ou réessaie dans quelques heures (propagation en cours).'
                    : '📌 Ajoute l\'enregistrement DNS ci-dessus, puis clique sur "Vérifier la connexion".'}
              </p>
            </div>
          )}
        </div>

        {/* Masquer la mention TekkiShop */}
        <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <EyeOffIcon className="h-4 w-4 text-purple-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Masquer la mention TekkiShop</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Retire le lien «&nbsp;Toi aussi, ouvre ta boutique…&nbsp;» en bas de ton site.
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-purple-600 bg-purple-100 rounded-full px-2 py-0.5">Pro</span>
            </div>
            <button
              type="button"
              disabled={savingBranding}
              onClick={() => handleHideBrandingToggle(!hideBranding)}
              className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${hideBranding ? 'bg-purple-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${hideBranding ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </>
    ) : (
      /* Teaser pour les plans inférieurs */
      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-sm font-semibold text-gray-700">Fonctionnalités Pro</p>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Le plan Pro te permet d'utiliser ton propre domaine et de retirer la mention TekkiShop de ton site.
        </p>
        <a
          href="/dashboard/upgrade"
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
        >
          <Crown className="h-3 w-3" /> Passer au plan Pro
        </a>
      </div>
    )}

    {/* Meta Pixel (Facebook Pixel) */}
    <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 text-blue-600 shrink-0 flex items-center justify-center text-xs font-bold">f</div>
        <p className="text-sm font-medium text-gray-900">Meta Pixel (Facebook Pixel)</p>
      </div>
      <p className="text-xs text-gray-500">
        Trackez les conversions, optimisez vos campagnes publicitaires et créez des audiences personnalisées.
      </p>

      <div className="space-y-3 pt-2 border-t border-blue-100">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Meta Pixel ID</label>
          <input
            type="text"
            value={metaPixelId}
            onChange={e => setMetaPixelId(e.target.value.replace(/\D/g, ''))}
            placeholder="Ex: 123456789012345"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-mono outline-none focus:border-blue-300 transition-colors"
            maxLength={18}
          />
          <p className="text-[11px] text-gray-400 mt-1.5">
            15-18 chiffres • Trouve-le dans ton Meta Business Suite (Events Manager)
          </p>
        </div>

        <div className="rounded-lg bg-white p-3 space-y-2 text-xs text-gray-600">
          <p className="font-semibold text-gray-700">Nous trackons automatiquement :</p>
          <ul className="space-y-1 ml-2">
            <li>✓ Page View — chaque visite</li>
            <li>✓ View Content — consultation produit</li>
            <li>✓ Add to Cart — ajout au panier</li>
            <li>✓ Purchase — commande confirmée</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={handleMetaPixelSave}
          disabled={savingPixel}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {savingPixel ? 'Enregistrement...' : metaPixelId ? 'Mettre à jour Pixel' : 'Enregistrer Pixel'}
        </button>

        {metaPixelId && (
          <button
            type="button"
            onClick={() => setMetaPixelId('')}
            className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
          >
            Supprimer le Pixel
          </button>
        )}
      </div>

      <p className="text-[11px] text-blue-600">
        💡 Besoin d'aide ? Consulte la <a href="https://developers.facebook.com/docs/facebook-pixel" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">documentation Meta Pixel</a>
      </p>
    </div>

    </div>{/* /contenu */}

    {/* ── VENTES (suite) ───────────────────────────────────────────────── */}
    <div className={section !== 'ventes' ? 'hidden' : 'mt-4 space-y-4'}>
    {/* ── Devise du shop ─────────────────────────────────────────────────── */}
    <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
      <h3 className="text-sm font-bold text-gray-900">Devise de la boutique</h3>
      <p className="text-xs text-gray-500">
        Choisissez la devise dans laquelle vos prix seront affichés pour vos clients.
        Un marchand en France souhaitant vendre sur les marchés africains peut choisir FCFA.
      </p>
      <div className="flex gap-3">
        <select
          value={shopCurrency}
          onChange={e => setShopCurrency(e.target.value as ShopCurrency)}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
        >
          {(Object.entries(CURRENCY_LABEL) as [ShopCurrency, string][]).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
        <button
          onClick={() => { void handleSaveCurrency() }}
          disabled={savingCurrency}
          className="shrink-0 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {savingCurrency ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>

    {/* ── Stripe Connect — plan Pro uniquement ────────────────────────────── */}
    {isPro && (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-sky-500" />
          <h3 className="text-sm font-bold text-gray-900">Paiements par carte bancaire</h3>
        </div>
        <p className="text-xs text-gray-500">
          Connectez votre compte Stripe pour recevoir les paiements par carte de vos clients directement sur votre boutique.
          TEKKIShop ne prélève aucune commission sur les paiements Stripe.
        </p>

        {stripeConnectParam === 'connected' && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700">Compte Stripe connecté ! Vos clients peuvent payer par carte.</p>
          </div>
        )}

        {stripeConnectParam === 'pending' && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Loader2 className="h-4 w-4 text-amber-500 mt-0.5 animate-spin" />
            <p className="text-xs text-amber-700">Votre compte Stripe est en cours de validation. Revenez dans quelques heures.</p>
          </div>
        )}

        {stripeConnectParam === 'incomplete' && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <XCircle className="h-4 w-4 text-amber-500 mt-0.5" />
            <p className="text-xs text-amber-700">Vérification incomplète. Cliquez sur le bouton pour finaliser votre compte Stripe.</p>
          </div>
        )}

        {stripeConnectErrorParam && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <XCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-600">Erreur lors de la connexion Stripe. Réessayez ou contactez le support.</p>
          </div>
        )}

        {connectError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{connectError}</p>
        )}

        <div className="flex items-center gap-3">
          <div className={`flex h-2.5 w-2.5 rounded-full ${stripeConnectEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-600">
            {stripeConnectEnabled
              ? 'Compte Stripe actif — paiements par carte activés'
              : stripeConnectId
                ? 'Compte Stripe créé, en attente de validation'
                : 'Compte Stripe non connecté'
            }
          </span>
        </div>

        <button
          onClick={() => { void handleStripeConnect() }}
          disabled={loadingConnect}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loadingConnect
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <CreditCard className="h-4 w-4" />
          }
          {loadingConnect
            ? 'Redirection...'
            : stripeConnectId
              ? 'Gérer mon compte Stripe'
              : 'Connecter mon compte Stripe'
          }
        </button>
      </div>
    )}
    </div>{/* /ventes-ext */}

    {/* ── Modal confirmation mot de passe — numéros de reversement ─────── */}
    {payoutConfirmOpen && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Confirmer la modification</h2>
            <button
              type="button"
              onClick={() => setPayoutConfirmOpen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
            <p className="text-xs text-amber-800">
              Pour la sécurité de tes fonds, confirme ton code PIN avant de modifier les numéros de reversement.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2 text-center">Code PIN (6 chiffres)</label>
            <PinInput
              key={payoutConfirmOpen ? 'open' : 'closed'}
              name="payout-confirm-pin"
              length={6}
              onChange={setConfirmPassword}
            />
          </div>

          {payoutSaveError && (
            <p className="text-xs text-red-600 font-medium">{payoutSaveError}</p>
          )}

          <button
            type="button"
            onClick={handlePayoutSave}
            disabled={payoutSaving || !confirmPassword}
            className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
          >
            {payoutSaving ? 'Vérification...' : 'Confirmer et enregistrer'}
          </button>
        </div>
      </div>
    )}
    </>
  )
}
