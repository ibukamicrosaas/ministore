'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductPhoto,
} from '@/lib/actions/products'
import { Camera, X, Plus, Trash2, GripVertical, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import type { Product, ProductVariant, ProductPhoto } from '@/types'

interface ProductFormProps {
  product?: Product
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading]     = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const fileInputRef              = useRef<HTMLInputElement>(null)

  // Photos
  const initialPhotos = Array.isArray(product?.photos)
    ? (product.photos as unknown as ProductPhoto[])
    : product?.photo_url
    ? [{ url: product.photo_url, is_primary: true }]
    : []

  const [photos, setPhotos]               = useState<ProductPhoto[]>(initialPhotos)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Variants
  const initialVariants = Array.isArray((product as Product & { variants?: ProductVariant[] | null })?.variants)
    ? ((product as Product & { variants?: ProductVariant[] | null }).variants ?? [])
    : []

  const [useVariants, setUseVariants]   = useState(initialVariants.length > 0)
  const [variants, setVariants]         = useState<ProductVariant[]>(
    initialVariants.length > 0 ? initialVariants : [{ label: '', price: 0 }]
  )

  // Vidéo
  const [videoUrl, setVideoUrl] = useState((product as Product & { video_url?: string | null })?.video_url ?? '')

  // Format d'affichage
  const [imageRatio, setImageRatio] = useState<'square' | 'portrait'>(
    (product as Product & { image_ratio?: string | null })?.image_ratio === 'portrait' ? 'portrait' : 'square'
  )

  // Acompte
  const [useDeposit, setUseDeposit]     = useState(product?.deposit_percentage != null)
  const [depositPct, setDepositPct]     = useState(product?.deposit_percentage ?? 30)

  const [category, setCategory] = useState(product?.category ?? '')

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (photos.length >= 5) { toast.error('Maximum 5 photos par produit.'); return }

    setUploadingPhoto(true)
    const fd = new FormData()
    fd.append('photo', file)
    const result = await uploadProductPhoto(fd)
    if (result.error) {
      toast.error(result.error)
    } else if (result.url) {
      setPhotos(prev => [...prev, { url: result.url!, is_primary: prev.length === 0 }])
    }
    setUploadingPhoto(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removePhoto(index: number) {
    setPhotos(prev => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length > 0 && prev[index].is_primary) {
        next[0] = { ...next[0], is_primary: true }
      }
      return next
    })
  }

  function setPrimaryPhoto(index: number) {
    setPhotos(prev => prev.map((p, i) => ({ ...p, is_primary: i === index })))
  }

  const VARIANT_PRESETS = [
    { icon: '⚖️', label: 'Poids',       values: ['250g', '500g', '1 kg', '2 kg', '5 kg'] },
    { icon: '👕', label: 'Taille',      values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    { icon: '📏', label: 'Longueur',    values: ['30 cm', '50 cm', '1 m', '1,5 m', '2 m'] },
    { icon: '📦', label: 'Format',      values: ['Unité', 'Sachet', 'Boîte de 6', 'Boîte de 12', 'Carton'] },
    { icon: '🍽️', label: 'Portion',    values: ['Petite', 'Normale', 'Grande', 'Familiale'] },
    { icon: '🎨', label: 'Couleur',     values: ['Blanc', 'Noir', 'Rouge', 'Bleu', 'Vert', 'Jaune'] },
    { icon: '💎', label: 'Qualité',     values: ['Standard', 'Premium', 'Deluxe'] },
  ]

  function applyPreset(values: string[]) {
    setVariants(values.map(v => ({ label: v, price: 0 })))
    setUseVariants(true)
  }

  function addVariant() {
    setVariants(prev => [...prev, { label: '', price: 0 }])
  }

  function updateVariant(index: number, field: keyof ProductVariant, value: string | number) {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  function removeVariant(index: number) {
    setVariants(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const fd      = new FormData(e.currentTarget)
    const name    = (fd.get('name') as string).trim()
    const price   = parseInt(fd.get('price') as string, 10)
    const categoryValue = category.trim() || undefined

    if (!name) { toast.error('Le nom est obligatoire.'); setLoading(false); return }
    if (isNaN(price) || price < 0) { toast.error('Prix invalide.'); setLoading(false); return }

    const validVariants = useVariants ? variants.filter(v => v.label.trim()) : []

    const payload = {
      name,
      price,
      description: (fd.get('description') as string).trim() || undefined,
      category: categoryValue,
      photos,
      video_url: videoUrl.trim() || null,
      image_ratio: imageRatio,
      deposit_percentage: useDeposit ? depositPct : null,
      variants: validVariants.length > 0 ? validVariants : null,
      stock_count: fd.get('stock') ? parseInt(fd.get('stock') as string, 10) || null : null,
    }

    let result
    if (product) {
      result = await updateProduct(product.id, payload)
    } else {
      result = await createProduct(payload)
    }

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(product ? 'Produit mis à jour ✓' : 'Produit créé ✓')
      router.push('/dashboard/products')
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!product) return
    if (!confirm('Supprimer ce produit ? Cette action est irréversible.')) return
    setDeleting(true)
    const result = await deleteProduct(product.id)
    if (result.error) {
      toast.error(result.error)
      setDeleting(false)
    } else {
      toast.success('Produit supprimé.')
      router.push('/dashboard/products')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">

      {/* Photos */}
      <Card>
        <p className="text-sm font-semibold text-gray-900 mb-3">Photos</p>
        <div className="flex gap-3 flex-wrap">
          {photos.map((photo, i) => (
            <div key={i} className="relative group">
              <img
                src={photo.url}
                alt=""
                className={`h-20 w-20 rounded-xl object-cover border-2 transition-colors cursor-pointer ${
                  photo.is_primary ? 'border-[var(--color-primary)]' : 'border-gray-200'
                }`}
                onClick={() => setPrimaryPhoto(i)}
                title={photo.is_primary ? 'Photo principale' : 'Définir comme principale'}
              />
              {photo.is_primary && (
                <span className="absolute bottom-1 left-1 rounded-md bg-[var(--color-primary)] px-1 text-[9px] font-bold text-white">
                  principal
                </span>
              )}
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {photos.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-50"
            >
              {uploadingPhoto ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
              ) : (
                <>
                  <Camera className="h-5 w-5" />
                  <span className="mt-1 text-[10px]">Ajouter</span>
                </>
              )}
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-400">Max 5 photos · JPG, PNG · 5 Mo. Cliquez sur une photo pour la définir comme principale.</p>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

        {/* Format d'affichage */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-700 mb-2">Format d&apos;affichage dans la boutique</p>
          <div className="flex gap-2">
            {([
              { value: 'square',  label: 'Carré',    hint: '1:1', preview: 'w-8 h-8' },
              { value: 'portrait', label: 'Portrait', hint: '3:4', preview: 'w-6 h-8' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setImageRatio(opt.value)}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors ${
                  imageRatio === opt.value
                    ? 'border-[var(--color-primary)] bg-sky-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`${opt.preview} rounded bg-gray-200 shrink-0 ${imageRatio === opt.value ? 'bg-[var(--color-primary)]/20' : ''}`} />
                <div className="text-left">
                  <p className={`text-xs font-semibold ${imageRatio === opt.value ? 'text-[var(--color-primary)]' : 'text-gray-700'}`}>{opt.label}</p>
                  <p className="text-[10px] text-gray-400">{opt.hint}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Vidéo */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Video className="h-4 w-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-900">Vidéo du produit</p>
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-600">Optionnel</span>
        </div>
        <input
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          placeholder="Lien TikTok, Instagram Reels ou Facebook Reels..."
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
        />
        <p className="mt-2 text-xs text-gray-400">
          Colle le lien de ta vidéo TikTok, Instagram Reels ou Facebook Reels. Elle sera affichée sur la page de ton produit.
        </p>
      </Card>

      {/* Infos de base */}
      <Card>
        <p className="text-sm font-semibold text-gray-900 mb-3">Informations</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nom du produit <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              defaultValue={product?.name}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              placeholder="Ex : Thiéboudienne, Robe wax..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              defaultValue={product?.description ?? ''}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] resize-none"
              placeholder="Décrivez votre produit..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Ex: Alimentation, Vêtements, Beauté..."
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>
      </Card>

      {/* Prix */}
      <Card>
        <p className="text-sm font-semibold text-gray-900 mb-3">Prix</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Prix de base (FCFA) <span className="text-red-500">*</span>
            </label>
            <input
              name="price"
              type="number"
              min="0"
              defaultValue={product?.price ?? ''}
              required={!useVariants}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              placeholder="5000"
            />
          </div>

          {/* Variantes */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Variantes de prix</p>
              <p className="text-xs text-gray-500">Ex : Format entier / Demi format</p>
            </div>
            <button
              type="button"
              onClick={() => setUseVariants(v => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                useVariants ? 'bg-[var(--color-primary)]' : 'bg-gray-200'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${useVariants ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {useVariants && (
            <div className="space-y-3">
              {/* Presets rapides */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Modèles rapides :</p>
                <div className="flex flex-wrap gap-1.5">
                  {VARIANT_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset.values)}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-sky-50 transition-colors"
                    >
                      <span>{preset.icon}</span>
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variantes personnalisées */}
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
                    <input
                      value={v.label}
                      onChange={e => updateVariant(i, 'label', e.target.value)}
                      placeholder="Ex : 1 kg, Taille L, Rouge…"
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                    <div className="relative w-28 shrink-0">
                      <input
                        type="number"
                        min="0"
                        value={v.price || ''}
                        onChange={e => updateVariant(i, 'price', parseInt(e.target.value, 10) || 0)}
                        placeholder="Prix"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-10 text-sm outline-none focus:border-[var(--color-primary)]"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">F</span>
                    </div>
                    <button type="button" onClick={() => removeVariant(i)} className="p-1 text-gray-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-1.5 text-xs text-[var(--color-primary)] font-medium hover:opacity-75"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter une variante
                </button>
              </div>
            </div>
          )}

          {/* Acompte */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Acompte à la commande</p>
              <p className="text-xs text-gray-500">% du prix payé en ligne</p>
            </div>
            <button
              type="button"
              onClick={() => setUseDeposit(d => !d)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                useDeposit ? 'bg-[var(--color-primary)]' : 'bg-gray-200'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${useDeposit ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {useDeposit && (
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={depositPct}
                onChange={e => setDepositPct(parseInt(e.target.value, 10))}
                className="flex-1 accent-[var(--color-primary)]"
              />
              <span className="text-sm font-semibold text-gray-900 w-12 text-right">{depositPct}%</span>
            </div>
          )}
        </div>
      </Card>

      {/* Stock (optionnel) */}
      <Card>
        <p className="text-sm font-semibold text-gray-900 mb-1">Stock</p>
        <p className="text-xs text-gray-500 mb-3">Laissez vide pour un stock illimité.</p>
        <input
          name="stock"
          type="number"
          min="0"
          defaultValue={product?.stock_count ?? ''}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          placeholder="Ex : 20 (laisser vide = illimité)"
        />
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Enregistrement...' : product ? 'Enregistrer les modifications' : 'Créer le produit'}
        </Button>

        {product && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Suppression...' : 'Supprimer ce produit'}
          </button>
        )}
      </div>
    </form>
  )
}
