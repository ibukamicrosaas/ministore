'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Check, Copy, CheckCheck, Camera, ImagePlus,
  User, Store, MoreHorizontal, ChevronDown, Eye,
  UtensilsCrossed, Shirt, Sparkles, Baby, Palette,
  Smartphone, Home, HeartPulse, Activity, Briefcase,
} from 'lucide-react'
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
import { trackMetaEvent } from '@/components/pwa/MetaPixelProvider'
import {
  AFRICA_PHONE_COUNTRIES,
  EU_CA_PHONE_COUNTRIES,
  getCurrencyForCountry,
} from '@/lib/utils/country-groups'

// ── Types ─────────────────────────────────────────────────────────────────────

type Specialty = 'food' | 'fashion' | 'jewelry' | 'beauty' | 'children' | 'crafts' | 'electronics' | 'home' | 'health' | 'sports' | 'services' | 'other'
type BusinessType = 'individual' | 'business'

// ── Catégories principales (10 cartes) ───────────────────────────────────────

const MAIN_SPECIALTIES: { value: Specialty; Icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { value: 'food',        Icon: UtensilsCrossed, label: 'Alimentation'     },
  { value: 'fashion',     Icon: Shirt,           label: 'Mode & Vêtements' },
  { value: 'beauty',      Icon: Sparkles,        label: 'Beauté & Soins'   },
  { value: 'children',    Icon: Baby,            label: 'Enfants & Bébés'  },
  { value: 'crafts',      Icon: Palette,         label: 'Artisanat'        },
  { value: 'electronics', Icon: Smartphone,      label: 'Électronique'     },
  { value: 'home',        Icon: Home,            label: 'Maison & Déco'    },
  { value: 'health',      Icon: HeartPulse,      label: 'Santé & Bien-être'},
  { value: 'sports',      Icon: Activity,        label: 'Sport & Fitness'  },
  { value: 'services',    Icon: Briefcase,       label: 'Services'         },
]

const MAIN_SPECIALTY_VALUES = MAIN_SPECIALTIES.map(s => s.value)

const SPECIALTY_LABELS: Partial<Record<Specialty, string>> = {
  jewelry: 'Bijoux & Montres',
  other:   'Autre',
}

// ── Suggestions produits ──────────────────────────────────────────────────────

const PRODUCT_SUGGESTIONS_AFRICA: Record<Specialty, string[]> = {
  food:        ['Thiéboudienne', 'Attiéké poulet', 'Jus de bissap', 'Pain de mil', 'Gâteau maison'],
  fashion:     ['Robe wax', 'Boubou brodé', 'Ensemble ankara', 'Foulard en soie', 'Sac à main'],
  jewelry:     ['Bague plaqué or', 'Bracelet traditionnel', 'Collier perles', 'Montre homme', 'Boucles d\'oreilles'],
  beauty:      ['Savon karité', 'Huile de coco', 'Crème éclaircissante', 'Shampoing naturel', 'Parfum local'],
  children:    ['Habit bébé', 'Jouet éducatif', 'Sac à dos enfant', 'Couverture bébé', 'Chaussures enfant'],
  crafts:      ['Tableau africain', 'Sculpture bois', 'Bijou fait main', 'Panier tressé', 'Poterie'],
  electronics: ['Écouteurs Bluetooth', 'Chargeur solaire', 'Batterie externe', 'Câble USB-C', 'Coque téléphone'],
  home:        ['Coussin wax', 'Bougie parfumée', 'Nappe brodée', 'Miroir décoratif', 'Vase artisanal'],
  health:      ['Savon naturel', 'Huile essentielle', 'Tisane locale', 'Complément naturel', 'Soin visage'],
  sports:      ['Tapis de sport', 'Bouteille sport', 'Corde à sauter', 'Short fitness', 'Chaussures sport'],
  services:    ['Cours particuliers', 'Consultation', 'Coaching', 'Réparation', 'Livraison à domicile'],
  other:       ['Mon produit phare', 'Service sur mesure', 'Pack découverte'],
}

const PRODUCT_SUGGESTIONS_EUCA: Record<Specialty, string[]> = {
  food:        ['Fromage artisanal', 'Pain maison', 'Confiture bio', 'Box apéro', 'Plateau dégustation'],
  fashion:     ['Robe créateur', 'Accessoires fait main', 'Sac en cuir', 'Vêtement enfant', 'Chemise lin'],
  jewelry:     ['Bague argent', 'Bracelet cuir', 'Collier perles', 'Montre vintage', 'Boucles créateur'],
  beauty:      ['Savon naturel', 'Crème bio', 'Huile essentielle', 'Parfum naturel', 'Soin visage'],
  children:    ['Jouet en bois', 'Livre illustré', 'Vêtement bébé', 'Doudou fait main', 'Mobile déco'],
  crafts:      ['Illustration', 'Poterie créateur', 'Décoration murale', 'Bougie parfumée', 'Macramé'],
  electronics: ['Accessoire iPhone', 'Câble USB-C', 'Chargeur sans fil', 'Coque personnalisée', 'Support téléphone'],
  home:        ['Bougie déco', 'Coussin brodé', 'Tableau aquarelle', 'Vase céramique', 'Plante succulente'],
  health:      ['Complément naturel', 'Huile de massage', 'Tisane artisanale', 'Savon surgras', 'Aromathérapie'],
  sports:      ['Tapis de yoga', 'Bouteille sport', 'Résistance fitness', 'Équipement gym', 'Nutrition sportive'],
  services:    ['Coaching en ligne', 'Cours particuliers', 'Consultation', 'Formation', 'Design graphique'],
  other:       ['Mon produit phare', 'Service sur mesure', 'Pack découverte'],
}

const DESC_PLACEHOLDERS_AFRICA: Record<Specialty, string> = {
  food:        'Ex : Cuisine africaine maison. Livraison disponible. Commandez à l\'avance...',
  fashion:     'Ex : Créations en tissu wax et bazin. Tenues sur mesure et prêt-à-porter...',
  jewelry:     'Ex : Bijoux et accessoires artisanaux. Pièces uniques, livraison soignée...',
  beauty:      'Ex : Produits cosmétiques 100% naturels, fabriqués localement sans produits chimiques...',
  children:    'Ex : Vêtements et jouets pour enfants et bébés. Livraison disponible...',
  crafts:      'Ex : Artisan créateur. Pièces uniques faites main, sur commande ou en stock...',
  electronics: 'Ex : Accessoires et matériel électronique. Garantie incluse, livraison rapide...',
  home:        'Ex : Décoration intérieure africaine. Pièces uniques pour sublimer votre intérieur...',
  health:      'Ex : Produits naturels et bien-être. Ingrédients locaux, sans chimie...',
  sports:      'Ex : Équipements sportifs et fitness. Livraison rapide...',
  services:    'Ex : Décrivez vos prestations et votre zone d\'intervention...',
  other:       'Décrivez votre boutique en quelques mots...',
}

const DESC_PLACEHOLDERS_EUCA: Record<Specialty, string> = {
  food:        'Ex : Produits artisanaux locaux. Disponible en livraison ou retrait. Commandes sur mesure...',
  fashion:     'Ex : Créations uniques, mode éthique et artisanale. Livraison en France...',
  jewelry:     'Ex : Bijoux créateur et montres vintage. Livraison sécurisée, satisfait ou remboursé 14 jours...',
  beauty:      'Ex : Cosmétiques naturels et bio, sans perturbateurs endocriniens. Fabriqués en France...',
  children:    'Ex : Jouets en bois et vêtements bio pour bébés et enfants. Livraison rapide...',
  crafts:      'Ex : Artiste créateur. Pièces uniques et éditions limitées, sur commande...',
  electronics: 'Ex : Accessoires tech de qualité. Expédition sous 24h...',
  home:        'Ex : Décoration intérieure artisanale. Pièces uniques pour un intérieur authentique...',
  health:      'Ex : Compléments et soins naturels. Certifiés bio, sans additifs...',
  sports:      'Ex : Matériel fitness et bien-être. Livraison offerte dès 50€...',
  services:    'Ex : Coaching, formation ou consulting en ligne. Réservation via ce site...',
  other:       'Décrivez votre boutique en quelques mots...',
}

// ── Pays ──────────────────────────────────────────────────────────────────────

const MAIN_COUNTRIES = [
  { code: 'CI', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: 'SN', flag: '🇸🇳', name: 'Sénégal'       },
  { code: 'BJ', flag: '🇧🇯', name: 'Bénin'         },
  { code: 'TG', flag: '🇹🇬', name: 'Togo'          },
  { code: 'BF', flag: '🇧🇫', name: 'Burkina Faso'  },
  { code: 'FR', flag: '🇫🇷', name: 'France'        },
]

function detectCountryFromPhone(phone: string | null): string {
  if (!phone) return ''
  const p = phone.replace(/\s/g, '')
  if (p.startsWith('+352')) return 'LU'
  if (p.startsWith('+33'))  return 'FR'
  if (p.startsWith('+32'))  return 'BE'
  if (p.startsWith('+41'))  return 'CH'
  if (p.startsWith('+1'))   return 'CA'
  if (p.startsWith('+221')) return 'SN'
  if (p.startsWith('+225')) return 'CI'
  if (p.startsWith('+228')) return 'TG'
  if (p.startsWith('+229')) return 'BJ'
  if (p.startsWith('+226')) return 'BF'
  if (p.startsWith('+223')) return 'ML'
  if (p.startsWith('+237')) return 'CM'
  if (p.startsWith('+224')) return 'GN'
  if (p.startsWith('+243')) return 'CD'
  if (p.startsWith('+241')) return 'GA'
  if (p.startsWith('+261')) return 'MG'
  if (p.startsWith('+212')) return 'MA'
  return 'SN'
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface WizardProps {
  initialStep: 1 | 2 | 3 | 4 | 5
  userPhone: string | null
  salon: {
    name: string
    slug: string
    business_type: string | null
    specialty: string | null
    country?: string | null
    currency?: string | null
  } | null
  initialName?: string
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function OnboardingWizard({ initialStep, userPhone, salon, initialName }: WizardProps) {
  const router = useRouter()

  const [step, setStep]     = useState<1 | 2 | 3 | 4 | 5>(initialStep)
  const [saving, setSaving] = useState(false)

  // Step 1
  const [shopName, setShopName]             = useState(salon?.name ?? initialName ?? '')
  const [country, setCountry]               = useState<string>(
    salon?.country ?? detectCountryFromPhone(userPhone)
  )
  const [showMoreCountries, setShowMoreCountries] = useState(false)

  // Step 2
  const [businessType, setBusinessType] = useState<BusinessType>(
    (salon?.business_type as BusinessType | null) ?? 'individual'
  )
  const [specialty, setSpecialty] = useState<Specialty>(
    (salon?.specialty as Specialty | null) ?? 'other'
  )
  const [showSpecialtySelect, setShowSpecialtySelect] = useState(
    !MAIN_SPECIALTY_VALUES.includes((salon?.specialty as Specialty | null) ?? 'other')
  )

  // Step 3
  const [shopSlug, setShopSlug]         = useState(salon?.slug ?? '')
  const [city, setCity]                 = useState('')
  const [whatsapp, setWhatsapp]         = useState(userPhone ?? '')
  const [description, setDescription]   = useState('')
  const [logoUrl, setLogoUrl]           = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef                    = useRef<HTMLInputElement>(null)

  // Step 4
  const [productName, setProductName]         = useState('')
  const [productPrice, setProductPrice]       = useState('')
  const [productDesc, setProductDesc]         = useState('')
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null)
  const [uploadingProductImg, setUploadingProductImg] = useState(false)
  const productFileRef = useRef<HTMLInputElement>(null)

  // Step 5
  const [copied, setCopied] = useState(false)

  // ── Valeurs dérivées ───────────────────────────────────────────────────────

  const isEuCa = country ? ['FR', 'BE', 'LU', 'CH', 'CA'].includes(country) : false

  const shopCurrencySymbol = (() => {
    const c = getCurrencyForCountry(country || null)
    if (c === 'EUR') return '€'
    if (c === 'CAD') return 'CAD'
    return 'FCFA'
  })()

  const productSuggestions = (isEuCa ? PRODUCT_SUGGESTIONS_EUCA : PRODUCT_SUGGESTIONS_AFRICA)[specialty]
  const descPlaceholder    = (isEuCa ? DESC_PLACEHOLDERS_EUCA  : DESC_PLACEHOLDERS_AFRICA)[specialty]
  const cityPlaceholder    = isEuCa ? 'Paris, Lyon, Bruxelles...' : 'Abidjan, Dakar, Douala...'

  const shopUrl    = shopSlug ? `${APP_URL}/${shopSlug}` : null
  const previewUrl = shopSlug ? `/preview/${shopSlug}` : null

  const countryIsInMain = MAIN_COUNTRIES.some(m => m.code === country)

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleStep1() {
    if (!shopName.trim() || shopName.trim().length < 2) {
      toast.error('Le nom doit faire au moins 2 caractères.')
      return
    }
    setSaving(true)
    const result = await startOnboarding(shopName.trim(), country || undefined)
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    if (result.slug) setShopSlug(result.slug)
    trackMetaEvent('Lead', undefined, result.metaEventId)
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
    const result = await completeOnboarding()
    trackMetaEvent('CompleteRegistration', undefined, result.metaEventId)
    router.push('/dashboard')
  }

  async function handleActivate() {
    setSaving(true)
    const result = await completeOnboarding()
    trackMetaEvent('CompleteRegistration', undefined, result.metaEventId)
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

  // ── UI ───────────────────────────────────────────────────────────────────────

  const TOTAL_STEPS = 4
  const progressPct = step === 5 ? 100 : ((step - 1) / TOTAL_STEPS) * 100
  const inputCls    = 'w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-[var(--color-primary)] transition-colors bg-white'

  return (
    <div className="w-full">

      {/* Barre de progression */}
      {step < 5 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => step > 1 && setStep(s => Math.max(1, s - 1) as 1 | 2 | 3 | 4 | 5)}
              className={`flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer ${step === 1 ? 'invisible' : ''}`}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
            <span className="text-xs text-gray-400 font-medium">Étape {step} sur {TOTAL_STEPS}</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-[var(--color-primary)] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Étape 1 — Nom + Pays ────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Crée ton site en 5 minutes</h2>
            <p className="mt-1 text-sm text-gray-500">Commence par donner un nom à ton site.</p>
          </div>

          {/* Nom du site */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nom de ton site</label>
            <input
              value={shopName}
              onChange={e => setShopName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStep1()}
              placeholder="Ex : Chez Awa, La Maison du Wax, Fatou Délices..."
              className={inputCls}
              autoFocus
            />
          </div>

          {/* Sélecteur de pays */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Ton pays</label>

            <div className="grid grid-cols-3 gap-2">
              {MAIN_COUNTRIES.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { setCountry(c.code); setShowMoreCountries(false) }}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 cursor-pointer transition-colors min-h-[60px] ${
                    country === c.code
                      ? 'border-[var(--color-primary)] bg-sky-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl leading-none">{c.flag}</span>
                  <span className={`text-[10px] font-medium leading-tight text-center px-0.5 ${
                    country === c.code ? 'text-[var(--color-primary)]' : 'text-gray-600'
                  }`}>
                    {c.name}
                  </span>
                </button>
              ))}

              {/* Bouton "Autre" */}
              <button
                type="button"
                onClick={() => setShowMoreCountries(v => !v)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 cursor-pointer transition-colors min-h-[60px] ${
                  showMoreCountries || (!countryIsInMain && country)
                    ? 'border-[var(--color-primary)] bg-sky-50'
                    : 'border-dashed border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
                <span className="text-[10px] font-medium text-gray-500">Autre</span>
              </button>
            </div>

            {/* Dropdown tous les pays */}
            {(showMoreCountries || (!countryIsInMain && country)) && (
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className={`mt-2 ${inputCls}`}
              >
                <option value="">-- Sélectionne ton pays --</option>
                <optgroup label="Afrique">
                  {[...AFRICA_PHONE_COUNTRIES].map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Europe & Canada">
                  {[...EU_CA_PHONE_COUNTRIES].map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </optgroup>
              </select>
            )}
          </div>

          <button
            onClick={handleStep1}
            disabled={saving || shopName.trim().length < 2}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-4 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity cursor-pointer"
          >
            {saving ? 'Création...' : 'Continuer'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Étape 2 — Type + Catégorie ───────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ton activité</h2>
            <p className="mt-1 text-sm text-gray-500">Quelques questions pour personnaliser ton site.</p>
          </div>

          {/* Type de vendeur */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2.5">Type de vendeur</p>
            <div className="grid grid-cols-2 gap-3">

              {/* Vendeur individuel */}
              <button
                type="button"
                onClick={() => setBusinessType('individual')}
                className={`relative flex flex-col items-start gap-2.5 rounded-2xl border-2 p-4 text-left cursor-pointer transition-colors ${
                  businessType === 'individual'
                    ? 'border-[var(--color-primary)] bg-sky-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                  businessType === 'individual' ? 'bg-[var(--color-primary)]' : 'bg-gray-100'
                }`}>
                  <User className={`h-5 w-5 ${businessType === 'individual' ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold leading-tight ${businessType === 'individual' ? 'text-[var(--color-primary)]' : 'text-gray-800'}`}>
                    Vendeur individuel
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                    Je vends depuis chez moi, livraison uniquement
                  </p>
                </div>
                {businessType === 'individual' && (
                  <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)]">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
              </button>

              {/* Boutique établie */}
              <button
                type="button"
                onClick={() => setBusinessType('business')}
                className={`relative flex flex-col items-start gap-2.5 rounded-2xl border-2 p-4 text-left cursor-pointer transition-colors ${
                  businessType === 'business'
                    ? 'border-[var(--color-primary)] bg-sky-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                  businessType === 'business' ? 'bg-[var(--color-primary)]' : 'bg-gray-100'
                }`}>
                  <Store className={`h-5 w-5 ${businessType === 'business' ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold leading-tight ${businessType === 'business' ? 'text-[var(--color-primary)]' : 'text-gray-800'}`}>
                    Boutique établie
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                    J&apos;ai un espace physique, retrait possible
                  </p>
                </div>
                {businessType === 'business' && (
                  <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)]">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Catégorie principale */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2.5">Catégorie principale</p>

            <div className="grid grid-cols-2 gap-2">
              {MAIN_SPECIALTIES.map(s => {
                const Icon   = s.Icon
                const active = specialty === s.value && !showSpecialtySelect
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => { setSpecialty(s.value); setShowSpecialtySelect(false) }}
                    className={`flex items-center gap-2.5 rounded-xl border-2 px-3 py-3 text-sm font-medium cursor-pointer transition-colors ${
                      active
                        ? 'border-[var(--color-primary)] bg-sky-50 text-[var(--color-primary)]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[var(--color-primary)]' : 'text-gray-400'}`} />
                    <span className="text-left leading-tight">{s.label}</span>
                  </button>
                )
              })}

              {/* Bouton "Autre" — révèle le select étendu */}
              <button
                type="button"
                onClick={() => setShowSpecialtySelect(v => !v)}
                className={`flex items-center gap-2.5 rounded-xl border-2 px-3 py-3 text-sm font-medium cursor-pointer transition-colors ${
                  showSpecialtySelect
                    ? 'border-[var(--color-primary)] bg-sky-50 text-[var(--color-primary)]'
                    : 'border-dashed border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <MoreHorizontal className={`h-4 w-4 shrink-0 ${showSpecialtySelect ? 'text-[var(--color-primary)]' : 'text-gray-400'}`} />
                <span className="text-left leading-tight">
                  {showSpecialtySelect && !MAIN_SPECIALTY_VALUES.includes(specialty)
                    ? SPECIALTY_LABELS[specialty] ?? 'Autre'
                    : 'Autre'
                  }
                </span>
              </button>
            </div>

            {/* Select étendu — toutes les catégories */}
            {showSpecialtySelect && (
              <div className="relative mt-2">
                <select
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value as Specialty)}
                  className={`${inputCls} appearance-none pr-10 cursor-pointer`}
                >
                  <optgroup label="Mode, Beauté &amp; Lifestyle">
                    <option value="fashion">Mode &amp; Accessoires</option>
                    <option value="jewelry">Bijoux &amp; Montres</option>
                    <option value="beauty">Beauté &amp; Cosmétiques</option>
                    <option value="health">Santé &amp; Bien-être</option>
                  </optgroup>
                  <optgroup label="Alimentation &amp; Maison">
                    <option value="food">Alimentation &amp; Restauration</option>
                    <option value="home">Maison &amp; Déco</option>
                    <option value="children">Bébé &amp; Enfant</option>
                  </optgroup>
                  <optgroup label="Tech, Loisirs &amp; Services">
                    <option value="electronics">Électronique &amp; High-Tech</option>
                    <option value="sports">Sport &amp; Loisirs</option>
                    <option value="crafts">Artisanat</option>
                    <option value="services">Services</option>
                    <option value="other">Autre (non listé)</option>
                  </optgroup>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>

          <button
            onClick={handleStep2}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-4 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity cursor-pointer"
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
            <p className="mt-1 text-sm text-gray-500">Visible par tes clients. Tu pourras tout modifier plus tard.</p>
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
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            >
              <Camera className="h-4 w-4 text-gray-400" />
              {uploadingLogo ? 'Chargement...' : 'Ajouter un logo'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Ville</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder={cityPlaceholder} className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              {isEuCa ? 'Numéro WhatsApp / contact' : 'Numéro WhatsApp'}
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder={isEuCa ? '+33 6 00 00 00 00' : '+221 77 000 00 00'}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder={descPlaceholder}
              className={`${inputCls} resize-none`}
            />
          </div>

          <button
            onClick={handleStep3}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-4 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity cursor-pointer"
          >
            {saving ? 'Enregistrement...' : 'Continuer'}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleSkip(3)}
            disabled={saving}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 cursor-pointer"
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

          {/* Photo */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Photo du produit</label>
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
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  <Camera className="h-4 w-4 text-gray-400" />
                  {uploadingProductImg ? 'Chargement...' : productImageUrl ? 'Changer la photo' : 'Ajouter une photo'}
                </button>
                <p className="text-[11px] text-gray-400 mt-1">JPG, PNG — max 5 Mo</p>
              </div>
            </div>
            <input ref={productFileRef} type="file" accept="image/*" className="hidden" onChange={handleProductImageChange} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nom du produit *</label>
            <input
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder={productSuggestions[0] ? `Ex : ${productSuggestions[0]}...` : 'Nom du produit'}
              className={inputCls}
            />
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {productSuggestions.slice(0, 3).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setProductName(s)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Prix ({shopCurrencySymbol}) *</label>
            <input
              type="number"
              min="0"
              value={productPrice}
              onChange={e => setProductPrice(e.target.value)}
              placeholder={shopCurrencySymbol === 'FCFA' ? '5000' : '15'}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description (optionnel)</label>
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-4 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity cursor-pointer"
          >
            {saving ? 'Création...' : 'Ajouter ce produit'}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleSkip(4)}
            disabled={saving}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 cursor-pointer"
          >
            Passer cette étape
          </button>
        </div>
      )}

      {/* ── Étape 5 — Terminé ───────────────────────────────────────────── */}
      {step === 5 && (
        <div className="space-y-5 text-center">
          <div>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <Check className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Ton site est créé !</h2>
            <p className="mt-2 text-sm text-gray-500">
              Dernière étape : choisis ton plan pour mettre ton site en ligne et recevoir des commandes.
            </p>
          </div>

          {/* Aperçu privé */}
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-[var(--color-primary)] py-3.5 text-sm font-semibold text-[var(--color-primary)] hover:bg-sky-50 transition-colors"
            >
              <Eye className="h-4 w-4" />
              Voir l&apos;aperçu de ton site
            </a>
          )}

          {/* Lien futur */}
          {shopUrl && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-2 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ton futur lien</p>
              <p className="text-sm font-mono text-gray-500 break-all">{shopUrl}</p>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                {copied
                  ? <><CheckCheck className="h-3.5 w-3.5 text-green-500" /> Copié !</>
                  : <><Copy className="h-3.5 w-3.5" /> Copier le lien</>
                }
              </button>
            </div>
          )}

          <button
            onClick={handleActivate}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-4 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity cursor-pointer"
          >
            {saving ? 'Chargement...' : 'Activer mon site'}
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={handleFinish}
            disabled={saving}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            Passer pour l&apos;instant → Accéder au tableau de bord
          </button>
        </div>
      )}
    </div>
  )
}
