'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Copy, Scissors } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  startOnboarding,
  saveOnboardingType,
  saveOnboardingInfo,
  saveOnboardingService,
  skipOnboardingStep,
  completeOnboarding,
} from '@/lib/actions/onboarding'
import { APP_URL } from '@/constants'

// ── Données métier ────────────────────────────────────────────────────────────

type Specialty = 'hair' | 'nails' | 'makeup' | 'beauty' | 'fashion' | 'other'
type BusinessType = 'independent' | 'salon'

const SPECIALTIES: { value: Specialty; icon: string; label: string }[] = [
  { value: 'hair',    icon: '✂️', label: 'Coiffure' },
  { value: 'nails',   icon: '💅', label: 'Onglerie' },
  { value: 'makeup',  icon: '💄', label: 'Maquillage' },
  { value: 'beauty',  icon: '🧖', label: 'Soins & Beauté' },
  { value: 'fashion', icon: '👁', label: 'Cils & Sourcils' },
  { value: 'other',   icon: '✨', label: 'Autre' },
]

const SUGGESTIONS: Record<Specialty, string[]> = {
  hair:    ['Tresses simples', 'Tresses avec mèches', 'Tissage', 'Coiffure naturelle', 'Soins capillaires'],
  nails:   ['Pose résine', 'Pose gel', 'Nail art', 'Dépose + repose', 'Manucure simple'],
  makeup:  ['Maquillage mariée', 'Maquillage événement', 'Maquillage naturel', 'Cours maquillage'],
  beauty:  ['Soin visage', 'Épilation', 'Massage', 'Gommage', 'Soin corps'],
  fashion: ['Pose cils volume russe', 'Pose cils classic', 'Rehaussement cils', 'Design sourcils', 'Épilation sourcils'],
  other:   ['Prestation sur mesure', 'Consultation', 'Forfait découverte'],
}

const DESC_PLACEHOLDERS: Record<Specialty, string> = {
  hair:    'Ex : Salon de coiffure pour femmes et enfants. Tresses, tissages, soins...',
  nails:   "Ex : Pose d'ongles gel, résine, nail art. Sur rendez-vous.",
  makeup:  'Ex : Maquillage professionnel pour mariages, événements et shooting.',
  beauty:  'Ex : Soins du visage, épilation, massage. Prenez soin de vous.',
  fashion: 'Ex : Pose de cils, rehaussement, design sourcils. Sur rendez-vous.',
  other:   'Ex : Décrivez votre activité en quelques mots...',
}

const DURATIONS = [
  { value: 30,  label: '30 min' },
  { value: 45,  label: '45 min' },
  { value: 60,  label: '1h' },
  { value: 90,  label: '1h30' },
  { value: 120, label: '2h' },
  { value: 150, label: '2h30' },
  { value: 180, label: '3h' },
  { value: 240, label: 'Plus de 3h' },
]

// ── Props ────────────────────────────────────────────────────────────────────

interface WizardProps {
  initialStep: 1 | 2 | 3 | 4 | 5
  userPhone: string | null
  salon: { name: string; slug: string; business_type: string | null; specialty: string | null } | null
}

// ── Composant principal ───────────────────────────────────────────────────────

export function OnboardingWizard({ initialStep, userPhone, salon }: WizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(initialStep)
  const [saving, setSaving] = useState(false)

  // État de progression
  const [salonSlug, setSalonSlug] = useState(salon?.slug ?? null)

  // Étape 1
  const [salonName, setSalonName] = useState(salon?.name ?? '')

  // Étape 2
  const [businessType, setBusinessType] = useState<BusinessType | null>(
    (salon?.business_type as BusinessType) ?? null
  )
  const [specialty, setSpecialty] = useState<Specialty | null>(
    (salon?.specialty as Specialty) ?? null
  )
  const [specialtyCustom, setSpecialtyCustom] = useState('')

  // Étape 3
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [whatsapp, setWhatsapp] = useState(userPhone ?? '')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Étape 4
  const [serviceName, setServiceName] = useState('')
  const [serviceDuration, setServiceDuration] = useState(60)
  const [servicePrice, setServicePrice] = useState('')

  // Victory
  const [linkCopied, setLinkCopied] = useState(false)

  const salonUrl = salonSlug ? `${APP_URL}/${salonSlug}` : null

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleStep1() {
    if (salonName.trim().length < 2) {
      toast.error('Le nom doit faire au moins 2 caractères.')
      return
    }
    setSaving(true)
    const result = await startOnboarding(salonName.trim())
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    setSalonSlug(result.slug ?? null)
    setStep(2)
  }

  async function handleStep2() {
    if (!businessType || !specialty) {
      toast.error('Veuillez sélectionner votre type d\'activité et votre spécialité.')
      return
    }
    if (specialty === 'other' && !specialtyCustom.trim()) {
      toast.error('Précisez votre activité.')
      return
    }
    setSaving(true)
    const result = await saveOnboardingType({
      businessType,
      specialty,
      specialtyCustom: specialtyCustom || undefined,
    })
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    setStep(3)
  }

  async function handleStep3() {
    setSaving(true)
    const fd = new FormData()
    if (city) fd.append('city', city)
    if (description) fd.append('description', description)
    if (whatsapp) fd.append('whatsapp', whatsapp)
    if (logoFile) fd.append('logo', logoFile)
    const result = await saveOnboardingInfo(fd)
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    setStep(4)
  }

  async function handleStep4() {
    if (!serviceName.trim() || !servicePrice) {
      toast.error('Nom et prix sont obligatoires.')
      return
    }
    setSaving(true)
    const result = await saveOnboardingService({
      name: serviceName.trim(),
      duration_minutes: serviceDuration,
      price: parseInt(servicePrice, 10),
    })
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    setStep(5)
  }

  async function handleSkip(s: 3 | 4) {
    setSaving(true)
    await skipOnboardingStep(s)
    setSaving(false)
    if (s === 4) {
      setStep(5)
    } else {
      setStep((s + 1) as 4)
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Le fichier doit faire moins de 2 Mo.'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function applySuggestion(name: string) {
    setServiceName(name)
  }

  async function handleCopyLink() {
    if (!salonUrl) return
    await navigator.clipboard.writeText(salonUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  function handleWhatsAppShare() {
    if (!salonUrl) return
    const msg = encodeURIComponent(
      `Bonjour ! 👋 Réserve maintenant ta prochaine séance chez ${salonName} 👉 ${salonUrl}`
    )
    const a = document.createElement('a')
    a.href = `https://wa.me/?text=${msg}`
    a.rel = 'noopener noreferrer'
    a.click()
  }

  // ── Layout ───────────────────────────────────────────────────────────────

  const TOTAL_STEPS = 4
  const progressPct = step === 5 ? 100 : ((step - 1) / TOTAL_STEPS) * 100

  return (
    <div className="min-h-screen bg-white flex flex-col md:bg-[#FAF7F2]">
      <div className="flex-1 flex flex-col md:items-center md:justify-center md:py-12 md:px-4">
        <div className="w-full md:max-w-[480px] flex-1 flex flex-col bg-white md:rounded-2xl md:shadow-lg md:overflow-hidden">

          {/* Barre de progression */}
          <div className="h-1 bg-gray-100 shrink-0">
            <div
              className="h-full bg-[#E85D04] transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Header */}
          {step < 5 && (
            <div className="px-5 pt-5 pb-1 flex items-center justify-between shrink-0">
              {step > 1 ? (
                <button
                  onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4 | 5)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 text-gray-500" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E85D04]">
                    <Scissors className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-[#1A0A00]">Sheka</span>
                </div>
              )}
              <span className="text-xs font-medium text-gray-400">
                Étape {step} sur {TOTAL_STEPS}
              </span>
            </div>
          )}

          {/* Contenu principal */}
          <div className="flex-1 flex flex-col overflow-y-auto">

            {/* ── ÉTAPE 1 — Nom du salon ──────────────────────────────── */}
            {step === 1 && (
              <div className="flex-1 flex flex-col px-5 pt-8 pb-6">
                <div className="flex-1">
                  <h1 className="text-2xl font-black text-[#1A0A00] leading-tight">
                    Bienvenue 👋
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Commençons par les bases. Ça prend moins de 5 minutes.
                  </p>

                  <div className="mt-8">
                    <label className="block text-sm font-semibold text-[#1A0A00] mb-2">
                      Nom de votre salon ou activité
                    </label>
                    <input
                      type="text"
                      value={salonName}
                      onChange={e => setSalonName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleStep1()}
                      placeholder="Ex : Chez Aïssatou, Glamour Studio, Fatou Beauty..."
                      autoFocus
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 text-base text-[#1A0A00] placeholder-gray-300 outline-none focus:border-[#E85D04] transition-colors"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleStep1}
                    disabled={saving || salonName.trim().length < 2}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E85D04] py-4 text-base font-bold text-white shadow-lg shadow-[#E85D04]/20 disabled:opacity-40 disabled:shadow-none transition-all active:scale-[0.98]"
                  >
                    {saving ? 'Création...' : 'Continuer'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 2 — Type + spécialité ─────────────────────────── */}
            {step === 2 && (
              <div className="flex-1 flex flex-col px-5 pt-8 pb-6">
                <div className="flex-1">
                  <h1 className="text-2xl font-black text-[#1A0A00] leading-tight">Vous êtes…</h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Cela nous permet de personnaliser votre espace.
                  </p>

                  {/* Structure */}
                  <div className="mt-7">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                      Votre situation
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { value: 'independent' as BusinessType, icon: '🏠', label: 'Indépendante', sub: 'Seule, à domicile ou en déplacement' },
                        { value: 'salon' as BusinessType,       icon: '💼', label: 'Salon', sub: 'Local physique avec employées' },
                      ] as const).map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setBusinessType(opt.value)}
                          className={`flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition-all ${
                            businessType === opt.value
                              ? 'border-[#E85D04] bg-orange-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <span className="text-2xl">{opt.icon}</span>
                          <span className="text-sm font-bold text-[#1A0A00]">{opt.label}</span>
                          <span className="text-xs text-gray-400 leading-tight">{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spécialité */}
                  <div className="mt-7">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                      Votre spécialité principale
                    </p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {SPECIALTIES.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSpecialty(opt.value)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3.5 px-2 text-center transition-all ${
                            specialty === opt.value
                              ? 'border-[#E85D04] bg-orange-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <span className="text-xl">{opt.icon}</span>
                          <span className="text-xs font-semibold text-[#1A0A00] leading-tight">{opt.label}</span>
                        </button>
                      ))}
                    </div>

                    {specialty === 'other' && (
                      <input
                        type="text"
                        value={specialtyCustom}
                        onChange={e => setSpecialtyCustom(e.target.value)}
                        placeholder="Précisez votre activité"
                        className="mt-3 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-[#1A0A00] outline-none focus:border-[#E85D04]"
                        autoFocus
                      />
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleStep2}
                    disabled={saving || !businessType || !specialty}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E85D04] py-4 text-base font-bold text-white shadow-lg shadow-[#E85D04]/20 disabled:opacity-40 disabled:shadow-none transition-all active:scale-[0.98]"
                  >
                    {saving ? 'Enregistrement...' : 'Continuer'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 3 — Informations du salon ─────────────────────── */}
            {step === 3 && (
              <div className="flex-1 flex flex-col px-5 pt-8 pb-6">
                <div className="flex-1">
                  <h1 className="text-2xl font-black text-[#1A0A00] leading-tight">
                    Votre page salon
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Ces informations seront visibles par vos clientes.
                  </p>

                  <div className="mt-7 space-y-4">
                    {/* Ville */}
                    <div>
                      <label className="block text-sm font-semibold text-[#1A0A00] mb-2">Ville</label>
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="Ex : Dakar, Abidjan, Douala..."
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-[#1A0A00] outline-none focus:border-[#E85D04]"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-[#1A0A00] mb-2">
                        Description courte
                      </label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        maxLength={150}
                        rows={3}
                        placeholder={specialty ? DESC_PLACEHOLDERS[specialty] : 'Ex : Décrivez votre activité en quelques mots...'}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-[#1A0A00] outline-none focus:border-[#E85D04] resize-none"
                      />
                      <p className="mt-1 text-right text-xs text-gray-400">{description.length}/150</p>
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="block text-sm font-semibold text-[#1A0A00] mb-2">
                        Numéro WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={e => setWhatsapp(e.target.value)}
                        placeholder="+221 77 000 00 00"
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-[#1A0A00] outline-none focus:border-[#E85D04]"
                      />
                    </div>

                    {/* Logo */}
                    <div>
                      <label className="block text-sm font-semibold text-[#1A0A00] mb-1">
                        Logo ou photo du salon{' '}
                        <span className="text-xs font-normal text-gray-400">(optionnel)</span>
                      </label>
                      <p className="text-xs text-gray-400 mb-3">Ça rend votre page plus professionnelle</p>
                      <div className="flex items-center gap-3">
                        {logoPreview ? (
                          <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 border-[#E85D04]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-16 w-16 shrink-0 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                            <span className="text-2xl">📷</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:border-[#E85D04] hover:text-[#E85D04] transition-colors"
                        >
                          {logoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleStep3}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E85D04] py-4 text-base font-bold text-white shadow-lg shadow-[#E85D04]/20 disabled:opacity-40 disabled:shadow-none transition-all active:scale-[0.98]"
                  >
                    {saving ? 'Enregistrement...' : 'Continuer'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSkip(3)}
                    disabled={saving}
                    className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Passer cette étape
                  </button>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 4 — Première prestation ───────────────────────── */}
            {step === 4 && (
              <div className="flex-1 flex flex-col px-5 pt-8 pb-6">
                <div className="flex-1">
                  <h1 className="text-2xl font-black text-[#1A0A00] leading-tight">
                    Ajoutez votre première prestation
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Vous pourrez en ajouter d&apos;autres ensuite.
                  </p>

                  {/* Suggestions */}
                  {specialty && SUGGESTIONS[specialty] && (
                    <div className="mt-6">
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                        Suggestions rapides
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTIONS[specialty].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => applySuggestion(s)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                              serviceName === s
                                ? 'border-[#E85D04] bg-orange-50 text-[#E85D04]'
                                : 'border-gray-200 text-gray-600 hover:border-[#E85D04] hover:text-[#E85D04]'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 space-y-4">
                    {/* Nom */}
                    <div>
                      <label className="block text-sm font-semibold text-[#1A0A00] mb-2">
                        Nom de la prestation
                      </label>
                      <input
                        type="text"
                        value={serviceName}
                        onChange={e => setServiceName(e.target.value)}
                        placeholder="Ex : Tresse box braid, Soin visage..."
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-[#1A0A00] outline-none focus:border-[#E85D04]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Durée */}
                      <div>
                        <label className="block text-sm font-semibold text-[#1A0A00] mb-2">Durée</label>
                        <select
                          value={serviceDuration}
                          onChange={e => setServiceDuration(Number(e.target.value))}
                          className="w-full rounded-xl border-2 border-gray-200 px-3 py-3 text-sm text-[#1A0A00] outline-none focus:border-[#E85D04] bg-white"
                        >
                          {DURATIONS.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Prix */}
                      <div>
                        <label className="block text-sm font-semibold text-[#1A0A00] mb-2">Prix (FCFA)</label>
                        <input
                          type="number"
                          value={servicePrice}
                          onChange={e => setServicePrice(e.target.value)}
                          placeholder="5000"
                          min="0"
                          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-[#1A0A00] outline-none focus:border-[#E85D04]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleStep4}
                    disabled={saving || !serviceName.trim() || !servicePrice}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E85D04] py-4 text-base font-bold text-white shadow-lg shadow-[#E85D04]/20 disabled:opacity-40 disabled:shadow-none transition-all active:scale-[0.98]"
                  >
                    {saving ? 'Enregistrement...' : 'Terminer'}
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSkip(4)}
                    disabled={saving}
                    className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Passer cette étape
                  </button>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 5 — Victory screen ─────────────────────────────── */}
            {step === 5 && (
              <VictoryScreen
                salonName={salonName}
                salonUrl={salonUrl}
                linkCopied={linkCopied}
                onCopy={handleCopyLink}
                onWhatsApp={handleWhatsAppShare}
                onDashboard={async () => {
                  await completeOnboarding()
                  router.push('/dashboard')
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Victory screen ────────────────────────────────────────────────────────────

function VictoryScreen({
  salonName,
  salonUrl,
  linkCopied,
  onCopy,
  onWhatsApp,
  onDashboard,
}: {
  salonName: string
  salonUrl: string | null
  linkCopied: boolean
  onCopy: () => void
  onWhatsApp: () => void
  onDashboard: () => void
}) {

  return (
    <div className="flex-1 flex flex-col px-5 pt-10 pb-8">
      {/* Icône animée */}
      <div className="flex justify-center mb-6">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <span className="text-4xl">🎉</span>
          </div>
        </div>
      </div>

      <h1 className="text-center text-2xl font-black text-[#1A0A00] leading-tight">
        Votre page est prête&nbsp;!
      </h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        Partagez ce lien à vos clientes pour qu&apos;elles puissent réserver.
      </p>

      {/* Aperçu du lien */}
      {salonUrl && (
        <div className="mt-6 rounded-2xl border-2 border-gray-100 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Votre lien de réservation
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A0A00] truncate">{salonUrl}</p>
            </div>
            <a
              href={salonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#E85D04] hover:text-[#E85D04] transition-colors"
            >
              Voir →
            </a>
          </div>

          {/* Miniature salon */}
          <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-white">
            <div className="h-2 bg-[#E85D04]" />
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-[#E85D04]/15 flex items-center justify-center text-sm font-bold text-[#E85D04]">
                  {salonName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1A0A00]">{salonName}</p>
                  <p className="text-[10px] text-gray-400">Page de réservation</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {['Choisir un service', 'Choisir une date', 'Réserver'].map((s, i) => (
                  <div key={i} className={`flex-1 h-6 rounded text-[9px] font-medium flex items-center justify-center ${i === 0 ? 'bg-[#E85D04] text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 space-y-3">
        <button
          onClick={onWhatsApp}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 text-base font-bold text-white shadow-lg shadow-green-500/20 transition-all active:scale-[0.98]"
        >
          <span>📲</span>
          Envoyer sur WhatsApp
        </button>

        <button
          onClick={onCopy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 py-4 text-base font-bold text-[#1A0A00] hover:border-[#E85D04] hover:text-[#E85D04] transition-all"
        >
          {linkCopied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-green-600">Lien copié !</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copier le lien
            </>
          )}
        </button>
      </div>

      {/* Vers le dashboard */}
      <button
        onClick={onDashboard}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E85D04] py-4 text-sm font-bold text-white shadow-lg shadow-[#E85D04]/25 active:opacity-80 transition-opacity"
      >
        Accéder à mon tableau de bord
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}
