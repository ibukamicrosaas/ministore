'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { createService, updateService, deleteService, hardDeleteService, uploadServicePhoto } from '@/lib/actions/services'
import { SERVICE_CATEGORIES as SERVICE_CATEGORIES_CONST } from '@/constants'
import { Camera, X, Plus, Trash2 } from 'lucide-react'

const SERVICE_CATEGORIES: { value: string; label: string }[] = [...SERVICE_CATEGORIES_CONST]
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import type { Service, CreateServiceInput, ServiceVariant } from '@/types'

interface ServiceFormProps {
  service?: Service
}

const DURATION_OPTIONS = [
  { value: '15',  label: '15 minutes' },
  { value: '30',  label: '30 minutes' },
  { value: '45',  label: '45 minutes' },
  { value: '60',  label: '1 heure' },
  { value: '90',  label: '1h30' },
  { value: '120', label: '2 heures' },
  { value: '150', label: '2h30' },
  { value: '180', label: '3 heures' },
  { value: '240', label: '4 heures' },
  { value: '300', label: '5 heures' },
  { value: '360', label: '6 heures' },
  { value: '480', label: '8 heures' },
]

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [hardDeleting, setHardDeleting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(service?.photo_url ?? null)
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null)
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null)
  const [useCustomDeposit, setUseCustomDeposit] = useState(service?.deposit_percentage != null)
  const [depositPct, setDepositPct] = useState(service?.deposit_percentage ?? 30)
  const [useVariants, setUseVariants] = useState(
    Array.isArray((service as Service & { variants?: ServiceVariant[] | null })?.variants) &&
    ((service as Service & { variants?: ServiceVariant[] | null })?.variants?.length ?? 0) > 0
  )
  const [variants, setVariants] = useState<ServiceVariant[]>(
    (service as Service & { variants?: ServiceVariant[] | null })?.variants ?? []
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const existingService = !!service

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (existingService) {
      // Existing service: upload immediately
      setUploadingPhoto(true)
      const fd = new FormData()
      fd.append('photo', file)
      const result = await uploadServicePhoto(service!.id, fd)
      if ('error' in result) {
        toast.error(result.error ?? 'Erreur')
      } else {
        setPhotoUrl(result.url ?? null)
        toast.success('Photo mise à jour ✓')
      }
      setUploadingPhoto(false)
    } else {
      // New service: store file for upload after creation
      const preview = URL.createObjectURL(file)
      setPendingPhotoFile(file)
      setPendingPhotoPreview(preview)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removePhoto() {
    if (existingService) {
      setPhotoUrl(null)
    } else {
      if (pendingPhotoPreview) URL.revokeObjectURL(pendingPhotoPreview)
      setPendingPhotoFile(null)
      setPendingPhotoPreview(null)
    }
  }

  const currentPhotoDisplay = existingService ? photoUrl : pendingPhotoPreview

  function addVariant() {
    setVariants(v => [...v, { label: '', price: 0 }])
  }

  function removeVariant(index: number) {
    setVariants(v => v.filter((_, i) => i !== index))
  }

  function updateVariant(index: number, field: keyof ServiceVariant, value: string) {
    setVariants(v =>
      v.map((item, i) =>
        i === index
          ? { ...item, [field]: field === 'price' ? parseInt(value.replace(/\s/g, '')) || 0 : value }
          : item
      )
    )
  }

  const validVariants = variants.filter(v => v.label.trim() && v.price > 0)
  const minVariantPrice = validVariants.length > 0 ? Math.min(...validVariants.map(v => v.price)) : null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    let rawPrice = parseInt((formData.get('price') as string).replace(/\s/g, ''))

    // When variants are enabled, price = min variant price
    if (useVariants && minVariantPrice !== null) {
      rawPrice = minVariantPrice
    }

    if (useVariants && validVariants.length === 0) {
      toast.error('Ajoutez au moins une variante avec un nom et un prix.')
      setLoading(false)
      return
    }

    const input: CreateServiceInput = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      duration_minutes: parseInt(formData.get('duration_minutes') as string),
      price: rawPrice,
      category: (formData.get('category') as string) || undefined,
      deposit_percentage: useCustomDeposit ? depositPct : 0,
      variants: useVariants ? validVariants : null,
    }

    if (existingService) {
      const result = await updateService(service!.id, input)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Prestation mise à jour.')
      }
      setLoading(false)
    } else {
      const result = await createService(input)
      if (!result || 'error' in result) {
        toast.error(('error' in result ? result.error : null) ?? 'Impossible de créer le service.')
        setLoading(false)
        return
      }

      const newId = result.id
      if (pendingPhotoFile) {
        const fd = new FormData()
        fd.append('photo', pendingPhotoFile)
        await uploadServicePhoto(newId, fd)
      }

      router.push(`/dashboard/services/${newId}?created=1`)
    }
  }

  async function handleDelete() {
    if (!service) return
    if (!confirm(`Désactiver "${service.name}" ? Elle ne sera plus visible pour les réservations, mais les réservations existantes restent.`)) return

    setDeleting(true)
    const result = await deleteService(service.id)
    if (result?.error) {
      toast.error(result.error)
      setDeleting(false)
    } else {
      toast.success('Prestation désactivée.')
      router.push('/dashboard/services')
    }
  }

  async function handleHardDelete() {
    if (!service) return
    if (!confirm(`Supprimer définitivement "${service.name}" ? Cette action est irréversible.`)) return

    setHardDeleting(true)
    const result = await hardDeleteService(service.id)
    if (result?.error) {
      toast.error(result.error)
      setHardDeleting(false)
    } else {
      toast.success('Prestation supprimée définitivement.')
      router.push('/dashboard/services')
    }
  }

  return (
    <Card padding="lg">
      {/* Photo de la prestation */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Photo de la prestation</p>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            {currentPhotoDisplay ? (
              <>
                <img src={currentPhotoDisplay} alt="Photo" className="h-20 w-20 rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white shadow"
                  title="Supprimer la photo"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <div className="h-20 w-20 rounded-xl bg-orange-50 flex items-center justify-center">
                <Camera className="h-7 w-7 text-gray-300" />
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {uploadingPhoto ? 'Envoi...' : currentPhotoDisplay ? 'Changer la photo' : 'Ajouter une photo'}
            </button>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · Max 5 Mo</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="name"
          label="Nom de la prestation"
          placeholder="Tresses box braids"
          required
          defaultValue={service?.name}
        />

        <Textarea
          name="description"
          label="Description"
          placeholder="Décris le service (optionnel)"
          defaultValue={service?.description ?? ''}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            name="duration_minutes"
            label="Durée"
            options={DURATION_OPTIONS}
            defaultValue={String(service?.duration_minutes ?? '60')}
            required
          />
          <Select
            name="category"
            label="Catégorie"
            options={SERVICE_CATEGORIES}
            placeholder="Choisir..."
            defaultValue={service?.category ?? ''}
          />
        </div>

        {/* Prix — masqué quand les variantes gèrent les prix */}
        {!useVariants && (
          <Input
            name="price"
            type="number"
            label="Prix (FCFA)"
            placeholder="15000"
            required
            min={0}
            step={500}
            defaultValue={service?.price}
            hint="En FCFA — le montant que la cliente verra"
          />
        )}
        {useVariants && (
          <input type="hidden" name="price" value={minVariantPrice ?? service?.price ?? 0} />
        )}

        {/* Variantes de prix */}
        <div className="rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Variantes de prix</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {useVariants
                  ? 'La cliente choisira la variante qui lui correspond'
                  : 'Ex. : selon la longueur ou le type de cheveux'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !useVariants
                setUseVariants(next)
                if (next && variants.length === 0) addVariant()
              }}
              className={`relative h-6 w-11 rounded-full transition-colors ${useVariants ? 'bg-[#E85D04]' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${useVariants ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {useVariants && (
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={v.label}
                    onChange={e => updateVariant(i, 'label', e.target.value)}
                    placeholder="Ex : Court, Mi-long, Long…"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#E85D04] focus:ring-1 focus:ring-[#E85D04]"
                  />
                  <input
                    type="number"
                    value={v.price || ''}
                    onChange={e => updateVariant(i, 'price', e.target.value)}
                    placeholder="Prix"
                    min={0}
                    step={500}
                    className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#E85D04] focus:ring-1 focus:ring-[#E85D04]"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1.5 text-xs font-medium text-[#E85D04] hover:opacity-80 transition-opacity mt-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter une variante
              </button>
              {minVariantPrice !== null && (
                <p className="text-xs text-gray-400">
                  Prix affiché dans la liste : <strong>{minVariantPrice.toLocaleString('fr-FR')} FCFA</strong> (prix minimum)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Acompte */}
        <div className="rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Demander un acompte</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {useCustomDeposit ? `La cliente paiera ${depositPct}% du prix à la réservation` : 'Aucun acompte demandé pour cette prestation'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUseCustomDeposit(!useCustomDeposit)}
              className={`relative h-6 w-11 rounded-full transition-colors ${useCustomDeposit ? 'bg-[#E85D04]' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${useCustomDeposit ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          {useCustomDeposit && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={depositPct}
                  onChange={e => setDepositPct(Number(e.target.value))}
                  className="flex-1 accent-[#E85D04]"
                />
                <span className="w-12 text-right text-sm font-bold text-gray-900">{depositPct}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading} fullWidth>
            {service ? 'Enregistrer' : 'Créer la prestation'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/dashboard/services')}
          >
            Annuler
          </Button>
        </div>

        {service && (
          <div className="space-y-2 mt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              loading={deleting}
              onClick={handleDelete}
            >
              Désactiver (masquer des réservations)
            </Button>
            <Button
              type="button"
              variant="danger"
              fullWidth
              loading={hardDeleting}
              onClick={handleHardDelete}
            >
              Supprimer définitivement
            </Button>
          </div>
        )}
      </form>
    </Card>
  )
}
