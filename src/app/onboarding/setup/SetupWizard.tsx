'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { saveOnboardingProduct, completeOnboarding } from '@/lib/actions/onboarding'
import toast from 'react-hot-toast'
import { CheckCircle2, Package, ArrowRight } from 'lucide-react'

export function SetupWizard() {
  const router = useRouter()
  const [saving, setSaving]         = useState(false)
  const [done, setDone]             = useState(false)
  const [productName, setProductName]   = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productDesc, setProductDesc]   = useState('')

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!productName || !productPrice) return
    setSaving(true)

    const result = await saveOnboardingProduct({
      name:        productName.trim(),
      price:       parseInt(productPrice, 10),
      description: productDesc.trim() || undefined,
    })

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success('Produit ajouté ✓')
      await completeOnboarding()
      setDone(true)
    }
    setSaving(false)
  }

  async function handleSkip() {
    await completeOnboarding()
    router.push('/dashboard')
  }

  if (done) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900">Votre boutique est prête !</h2>
            <p className="text-sm text-gray-500 mt-1">
              Vous pouvez maintenant recevoir des commandes.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white"
          >
            Accéder au tableau de bord
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
          <Package className="h-4 w-4 text-[var(--color-primary)]" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">Ajoutez votre premier produit</h2>
      </div>

      <form onSubmit={handleCreateProduct} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Nom du produit <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={productName}
            onChange={e => setProductName(e.target.value)}
            placeholder="Ex : Thiéboudienne, Robe wax, Savon karité..."
            required
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Prix (FCFA) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={productPrice}
            onChange={e => setProductPrice(e.target.value)}
            placeholder="5000"
            min="0"
            required
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description (optionnel)</label>
          <textarea
            value={productDesc}
            onChange={e => setProductDesc(e.target.value)}
            placeholder="Décrivez brièvement votre produit..."
            rows={2}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[var(--color-primary)] resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !productName || !productPrice}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Ajout...' : 'Ajouter ce produit'}
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleSkip}
          className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
        >
          Passer cette étape
        </button>
      </form>
    </Card>
  )
}
