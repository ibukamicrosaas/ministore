'use client'

import { useState, useRef } from 'react'
import { updateShop, uploadShopLogo } from '@/lib/actions/settings'
import toast from 'react-hot-toast'
import { Camera, X } from 'lucide-react'
import type { Shop } from '@/types'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    const result = await updateShop({
      name:              (fd.get('name') as string).trim(),
      city:              (fd.get('city') as string).trim(),
      phone_whatsapp:    (fd.get('phone_whatsapp') as string).trim(),
      address:           (fd.get('address') as string).trim() || undefined,
      description:       (fd.get('description') as string).trim() || undefined,
      primary_color:     primaryColor,
      accept_online_payment: acceptOnlinePayment,
      payout_wave_number: (fd.get('payout_wave_number') as string).trim() || null,
      payout_om_number:  (fd.get('payout_om_number') as string).trim() || null,
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Paiement Mobile Money</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {acceptOnlinePayment
                ? 'Tes clients peuvent payer en ligne (Wave, OM, Maxit).'
                : 'Seul le paiement à la livraison / sur place est proposé.'}
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
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${acceptOnlinePayment ? 'translate-x-5' : 'translate-x-0'}`}
            />
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

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
      >
        {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
      </button>
    </form>
  )
}
