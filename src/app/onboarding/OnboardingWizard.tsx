'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Copy, CheckCheck, Camera, ImagePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  startOnboarding,
  saveOnboardingType,
  saveOnboardingInfo,
  saveOnboardingProduct,
  skipOnboardingStep,
  completeOnboarding,
} from '@/lib/actions/onboarding'
import { uploadShopLogo } from '@/lib/actions/settings'
import { uploadProductPhoto } from '@/lib/actions/products'
import { APP_URL } from '@/constants'

// ── Données métier ────────────────────────────────────────────────────────────

type Specialty = 'food' | 'fashion' | 'beauty' | 'crafts' | 'electronics' | 'home' | 'other'
type BusinessType = 'individual' | 'business'

const SPECIALTIES: { value: Specialty; icon: string; label: string }[] = [
  { value: 'food',        icon: '🍽️', label: 'Alimentation' },
  { value: 'fashion',     icon: '👗', label: 'Mode & Vêtements' },
  { value: 'beauty',      icon: '💄', label: 'Beauté & Cosmétiques' },
  { value: 'crafts',      icon: '🎨', label: 'Artisanat' },
  { value: 'electronics', icon: '📱', label: 'Électronique' },
  { value: 'home',        icon: '🏡', label: 'Maison & Déco' },
  { value: 'other',       icon: '✨', label: 'Autre' },
]

const PRODUCT_SUGGESTIONS: Record<Specialty, string[]> = {
  food:        ['Thiéboudienne', 'Attiéké poulet', 'Jus de bissap', 'Pain de mil', 'Gâteau au wax'],
  fashion:     ['Robe wax', 'Boubou brodé', 'Ensemble ankara', 'Foulard en soie', 'Sac à main'],
  beauty:      ['Savon karité', 'Huile de coco', 'Crème éclaircissante', 'Shampoing naturel', 'Parfum local'],
  crafts:      ['Tableau africain', 'Sculpture bois', 'Bijou fait main', 'Panier tressé', 'Poterie'],
  electronics: ['Écouteurs Bluetooth', 'Chargeur solaire', 'Batterie externe', 'Câble USB-C', 'Coque téléphone'],
  home:        ['Coussin wax', 'Bougie parfumée', 'Nappe brodée', 'Miroir décoratif', 'Vase artisanal'],
  other:       ['Mon produit phare', 'Service sur mesure', 'Pack découverte'],
}

const DESC_PLACEHOLDERS: Record<Specialty, string> = {
  food:        'Ex : Cuisine africaine maison. Livraison disponible sur Dakar. Commandez à l\'avance...',
  fashion:     'Ex : Créations en tissu wax et bazin. Tenues sur mesure et prêt-à-porter...',
  beauty:      'Ex : Produits cosmétiques 100% naturels, fabriqués localement sans produits chimiques...',
  crafts:      'Ex : Artisan créateur. Pièces uniques faites main, sur commande ou en stock...',
  electronics: 'Ex : Accessoires et matériel électronique. Garantie incluse, livraison rapide...',
  home:        'Ex : Décoration intérieure africaine. Pièces uniques pour sublimer votre intérieur...',
  other:       'Décrivez votre boutique en quelques mots...',
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface WizardProps {
  initialStep: 1 | 2 | 3 | 4 | 5
  userPhone: string | null
  salon: { name: string; slug: string; business_type: string | null; specialty: string | null } | null
  initialName?: string
}

export function OnboardingWizard({ initialStep, userPhone, salon, initialName }: WizardProps) {
  const router = useRouter()

  const [step, setStep]     = useState<1 | 2 | 3 | 4 | 5>(initialStep)
  const [saving, setSaving] = useState(false)

  // Step 1 — pré-rempli depuis la landing page si aucun salon existant
  const [shopName, setShopName] = useState(salon?.name ?? initialName ?? '')

  // Step 2
  const [businessType, setBusinessType] = useState<BusinessType>(
    (salon?.business_type as BusinessType | null) ?? 'individual'
  )
  const [specialty, setSpecialty] = useState<Specialty>(
    (salon?.specialty as Specialty | null) ?? 'other'
  )

  // Step 3
  const [shopSlug, setShopSlug]   = useState(salon?.slug ?? '')
  const [city, setCity]           = useState('')
  const [whatsapp, setWhatsapp]   = useState(userPhone ?? '')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl]     = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef              = useRef<HTMLInputElement>(null)

  // Step 4
  const [productName, setProductName]       = useState('')
  const [productPrice, setProductPrice]     = useState('')
  const [productDesc, setProductDesc]       = useState('')
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null)
  const [uploadingProductImg, setUploadingProductImg] = useState(false)
  const productFileRef = useRef<HTMLInputElement>(null)

  // Step 5
  const [copied, setCopied] = useState(false)

  const shopUrl = shopSlug ? `${APP_URL}/${shopSlug}` : null

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleStep1() {
    if (!shopName.trim() || shopName.trim().length < 2) {
      toast.error('Le nom doit faire au moins 2 caractères.')
      return
    }
    setSaving(true)
    const result = await startOnboarding(shopName.trim())
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    if (result.slug) setShopSlug(result.slug)
    setStep(2)
  }

  async function handleStep2() {
    setSaving(true)
    const result = await saveOnboardingType({ businessType, specialty })
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    setStep(3)
  }

  async function handleStep3() {
    setSaving(true)
    const fd = new FormData()
    if (city)        fd.append('city', city)
    if (whatsapp)    fd.append('whatsapp', whatsapp)
    if (description) fd.append('description', description)
    const result = await saveOnboardingInfo(fd)
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    setStep(4)
  }

  async function handleProductImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingProductImg(true)
    const fd = new FormData()
    fd.append('photo', file)
    const result = await uploadProductPhoto(fd)
    if (result.error) toast.error(result.error)
    else if (result.url) setProductImageUrl(result.url)
    setUploadingProductImg(false)
    if (productFileRef.current) productFileRef.current.value = ''
  }

  async function handleStep4() {
    if (!productName.trim()) { toast.error('Le nom du produit est obligatoire.'); return }
    if (!productPrice || isNaN(parseInt(productPrice, 10))) {
      toast.error('Le prix est obligatoire.')
      return
    }
    setSaving(true)
    const result = await saveOnboardingProduct({
      name:        productName.trim(),
      price:       parseInt(productPrice, 10),
      description: productDesc.trim() || undefined,
      photo_url:   productImageUrl ?? undefined,
    })
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    setStep(5)
  }

  async function handleSkip(s: 3 | 4) {
    setSaving(true)
    await skipOnboardingStep(s)
    setSaving(false)
    setStep(s === 3 ? 4 : 5)
  }

  async function handleFinish() {
    setSaving(true)
    await completeOnboarding()
    router.push('/dashboard')
  }

  async function handleActivate() {
    setSaving(true)
    await completeOnboarding()
    router.push('/dashboard/upgrade')
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const fd = new FormData()
    fd.append('logo', file)
    const result = await uploadShopLogo(fd)
    if (result.error) toast.error(result.error)
    else if (result.url) setLogoUrl(result.url)
    setUploadingLogo(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleCopyLink() {
    if (!shopUrl) return
    await navigator.clipboard.writeText(shopUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function applySuggestion(name: string) {
    setProductName(name)
  }

  // ── UI ───────────────────────────────────────────────────────────────────────

  const TOTAL_STEPS = 4
  const progressPct = step === 5 ? 100 : ((step - 1) / TOTAL_STEPS) * 100

  const inputCls = 'w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-[var(--color-primary)] transition-colors bg-white'

  return (
    <div className="w-full">

      {/* Barre de progression */}
      {step < 5 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => step > 1 && setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4 | 5)}
              className={`flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors ${step === 1 ? 'invisible' : ''}`}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
            <span className="text-xs text-gray-400 font-medium">
              Étape {step} sur {TOTAL_STEPS}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-[var(--color-primary)] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Étape 1 — Nom ────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Donne un nom à ton site</h2>
            <p className="mt-1 text-sm text-gray-500">Ce sera le nom affiché à tes clients.</p>
          </div>
          <input
            value={shopName}
            onChange={e => setShopName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStep1()}
            placeholder="Ex : Chez Awa, La Maison du Wax, Fatou Délices..."
            className={inputCls}
            autoFocus
          />
          <button
            onClick={handleStep1}
            disabled={saving || shopName.trim().length < 2}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-4 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving ? 'Création...' : 'Continuer'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Étape 2 — Type de commerce ───────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ton type d'activité</h2>
            <p className="mt-1 text-sm text-gray-500">Choisis ce qui correspond le mieux à ton commerce.</p>
          </div>

          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'individual', label: 'Vendeur individuel', icon: '🙋' },
              { value: 'business',   label: 'Boutique établie',   icon: '🏪' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setBusinessType(opt.value as BusinessType)}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-sm font-medium transition-colors ${
                  businessType === opt.value
                    ? 'border-[var(--color-primary)] bg-sky-50 text-[var(--color-primary)]'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Spécialité */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Catégorie principale</p>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALTIES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSpecialty(s.value)}
                  className={`flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    specialty === s.value
                      ? 'border-[var(--color-primary)] bg-sky-50 text-[var(--color-primary)]'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStep2}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-4 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving ? 'Enregistrement...' : 'Continuer'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Étape 3 — Infos boutique ─────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Infos de ton site</h2>
            <p className="mt-1 text-sm text-gray-500">Visible par tes clients sur ton mini site. (Optionnel — tu pourras compléter plus tard.)</p>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-2xl font-bold text-[var(--color-primary)]">
                  {shopName[0]?.toUpperCase()}
                </div>
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Camera className="h-4 w-4 text-gray-400" />
              {uploadingLogo ? 'Upload...' : 'Ajouter un logo'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ville</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Dakar, Abidjan, Douala..." className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Numéro WhatsApp</label>
            <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+221 77 000 00 00" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder={DESC_PLACEHOLDERS[specialty]}
              className={`${inputCls} resize-none`}
            />
          </div>

          <button
            onClick={handleStep3}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-4 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving ? 'Enregistrement...' : 'Continuer'}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleSkip(3)}
            disabled={saving}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-1"
          >
            Passer cette étape
          </button>
        </div>
      )}

      {/* ── Étape 4 — Premier produit ────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ajoute ton premier produit</h2>
            <p className="mt-1 text-sm text-gray-500">Tes clients pourront immédiatement passer commande.</p>
          </div>

          {/* Photo du produit */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Photo du produit</label>
            <div className="flex items-center gap-3">
              <div className="relative shrink-0 h-20 w-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                {productImageUrl ? (
                  <img src={productImageUrl} alt="Produit" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-7 w-7 text-gray-300" />
                )}
                {uploadingProductImg && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => productFileRef.current?.click()}
                  disabled={uploadingProductImg}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Camera className="h-4 w-4 text-gray-400" />
                  {uploadingProductImg ? 'Upload...' : productImageUrl ? 'Changer la photo' : 'Ajouter une photo'}
                </button>
                <p className="text-[11px] text-gray-400 mt-1">JPG, PNG — max 5 Mo</p>
              </div>
            </div>
            <input ref={productFileRef} type="file" accept="image/*" className="hidden" onChange={handleProductImageChange} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom du produit *</label>
            <input
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder="Ex : Thiéboudienne, Robe wax..."
              className={inputCls}
            />
            {/* Suggestions rapides */}
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {PRODUCT_SUGGESTIONS[specialty].slice(0, 3).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => applySuggestion(s)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prix (FCFA) *</label>
            <input
              type="number"
              min="0"
              value={productPrice}
              onChange={e => setProductPrice(e.target.value)}
              placeholder="5000"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description (optionnel)</label>
            <textarea
              value={productDesc}
              onChange={e => setProductDesc(e.target.value)}
              rows={2}
              placeholder="Décrivez brièvement votre produit..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <button
            onClick={handleStep4}
            disabled={saving || !productName.trim() || !productPrice}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-4 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving ? 'Création...' : 'Ajouter ce produit'}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleSkip(4)}
            disabled={saving}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-1"
          >
            Passer cette étape
          </button>
        </div>
      )}

      {/* ── Étape 5 — Terminé ───────────────────────────────────────────── */}
      {step === 5 && (
        <div className="space-y-6 text-center">
          <div>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <Check className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Ton site est créé !</h2>
            <p className="mt-2 text-sm text-gray-500">
              Une dernière étape : choisis ton plan pour mettre ton site en ligne et commencer à recevoir des commandes.
            </p>
          </div>

          {shopUrl && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ton futur lien</p>
              <p className="text-sm font-mono text-gray-500 break-all">{shopUrl}</p>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {copied ? <><CheckCheck className="h-3.5 w-3.5 text-green-500" /> Copié !</> : <><Copy className="h-3.5 w-3.5" /> Copier le lien</>}
              </button>
            </div>
          )}

          <button
            onClick={handleActivate}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-4 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving ? 'Chargement...' : 'Activer mon site'}
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={handleFinish}
            disabled={saving}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Passer pour l&apos;instant → Accéder au tableau de bord
          </button>
        </div>
      )}
    </div>
  )
}
