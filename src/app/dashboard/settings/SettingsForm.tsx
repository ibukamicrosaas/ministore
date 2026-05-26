'use client'

import { useState, useRef, useEffect } from 'react'
import { updateShop, updateShopSlug, uploadShopLogo } from '@/lib/actions/settings'
import toast from 'react-hot-toast'
import { Camera, X, Plus, Trash2, Link2, Eye, EyeOff, ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { Shop, DeliveryZone } from '@/types'
import { APP_URL } from '@/constants'

interface Props {
  shop: Shop
}

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

export function SettingsForm({ shop }: Props) {
  const [saving, setSaving]                     = useState(false)
  const [logoUrl, setLogoUrl]                   = useState<string | null>(shop.logo_url)
  const [uploadingLogo, setUploadingLogo]       = useState(false)
  const [primaryColor, setPrimaryColor]         = useState(shop.primary_color ?? '#0EA5E9')
  const [acceptOnlinePayment, setAcceptOnline]  = useState(shop.accept_online_payment ?? true)
  const [acceptCashOnDelivery, setAcceptCash]  = useState(shop.accept_cash_on_delivery ?? true)
  const [deliveryZones, setDeliveryZones]       = useState<DeliveryZone[]>(
    Array.isArray(shop.delivery_zones) ? (shop.delivery_zones as unknown as DeliveryZone[]) : []
  )
  const [slug, setSlug]                         = useState(shop.slug)
  const [savingSlug, setSavingSlug]             = useState(false)
  const [slugStatus, setSlugStatus]             = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle')
  const slugTimerRef                            = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showSecretKey, setShowSecretKey]       = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debounced slug availability check
  useEffect(() => {
    if (slug === shop.slug) { setSlugStatus('idle'); return }
    if (slug.length < 2)   { setSlugStatus('idle'); return }

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
  }, [slug, shop.slug])

  function sanitizeSlugInput(v: string) {
    return v
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+/, '')
      .slice(0, 50)
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
      setSlug(shop.slug) // remettre l'ancien slug en cas d'erreur
    } else {
      toast.success('URL mise à jour ✓')
      if (result.slug) setSlug(result.slug)
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
      phone_whatsapp:    (fd.get('phone_whatsapp') as string).trim(),
      address:           (fd.get('address') as string).trim() || undefined,
      description:       (fd.get('description') as string).trim() || undefined,
      primary_color:     primaryColor,
      accept_online_payment:    acceptOnlinePayment,
      accept_cash_on_delivery:  acceptCashOnDelivery,
      payout_wave_number: (fd.get('payout_wave_number') as string).trim() || null,
      payout_om_number:  (fd.get('payout_om_number') as string).trim() || null,
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
    <form onSubmit={handleSubmit} className="space-y-4">
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

        {acceptOnlinePayment && (
          <div className="space-y-3 pt-1 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500">Numéros de reversement</p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Numéro Wave</label>
              <input
                name="payout_wave_number"
                type="tel"
                defaultValue={shop.payout_wave_number ?? ''}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
                placeholder="+221 77 000 00 00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Numéro Orange Money</label>
              <input
                name="payout_om_number"
                type="tel"
                defaultValue={shop.payout_om_number ?? ''}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
                placeholder="+221 77 000 00 00"
              />
            </div>
          </div>
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
                  placeholder="sk_live_..."
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
                  placeholder="whsec_..."
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

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
      >
        {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
      </button>
    </form>

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
        disabled={savingSlug || slug === shop.slug || slugStatus === 'taken' || slugStatus === 'checking'}
        className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {savingSlug ? 'Enregistrement...' : 'Modifier l\'URL'}
      </button>
    </div>
    </>
  )
}
