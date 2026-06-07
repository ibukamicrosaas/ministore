'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export function FixShopCountriesButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleFixCountries() {
    if (result) {
      setResult(null)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/fix-countries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      const data = await response.json()
      setResult(data)

      if (data.fixed > 0) {
        toast.success(`✅ ${data.fixed} boutiques corrigées!`)
      } else {
        toast.success('✓ Toutes les boutiques sont déjà correctes')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      toast.error('❌ ' + message)
      console.error('[FixShopCountries]', error)
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="group rounded-lg bg-white border-2 border-emerald-200 p-4 hover:shadow-md transition-all">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">{result.message}</p>
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              <p>✓ Total : {result.total} boutiques</p>
              <p>✓ Corrigées : {result.fixed}</p>
              <p>✓ Déjà correct : {result.skipped}</p>
            </div>
            {result.corrections && result.corrections.length > 0 && (
              <div className="mt-3 bg-emerald-50 rounded p-2 max-h-48 overflow-y-auto">
                <p className="font-medium text-emerald-900 text-xs mb-2">Exemples de corrections :</p>
                {result.corrections.slice(0, 5).map((c: any, i: number) => (
                  <p key={i} className="text-emerald-700 text-xs">
                    • {c.shop}: {c.from} → {c.to}
                  </p>
                ))}
                {result.corrections.length > 5 && (
                  <p className="text-emerald-600 text-xs italic mt-2">
                    ... et {result.corrections.length - 5} autres
                  </p>
                )}
              </div>
            )}
            {result.errors && result.errors.length > 0 && (
              <div className="mt-3 bg-orange-50 rounded p-2 max-h-48 overflow-y-auto">
                <p className="font-medium text-orange-900 text-xs mb-2">Erreurs ({result.errors.length}) :</p>
                {result.errors.slice(0, 5).map((e: any, i: number) => (
                  <p key={i} className="text-orange-700 text-xs">
                    • {e.shop}: {e.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setResult(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleFixCountries}
      disabled={loading}
      className="group w-full rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 hover:border-emerald-300 hover:shadow-md transition-all disabled:opacity-50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {loading ? (
            <Loader className="h-5 w-5 text-emerald-600 animate-spin" />
          ) : (
            <AlertCircle className="h-5 w-5 text-emerald-600" />
          )}
          <div className="text-left">
            <p className="font-semibold text-gray-900 text-sm">
              {loading ? 'Correction en cours...' : 'Corriger les pays des boutiques'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {loading ? 'Détection automatique par ville et téléphone...' : 'Détecte et corrige automatiquement le pays de chaque boutique'}
            </p>
          </div>
        </div>
      </div>
    </button>
  )
}
