'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Smartphone } from 'lucide-react'
import { getPayoutMethods } from '@/lib/utils/country-groups'

interface Props {
  available: number
  country: string
  onClose: () => void
}

export function PayoutRequestModal({ available, country, onClose }: Props) {
  const methods = getPayoutMethods(country)
  const [amount, setAmount]   = useState(String(available))
  const [provider, setProvider] = useState(methods[0]?.key ?? '')
  const [phone, setPhone]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const amt = parseInt(amount, 10)
    if (!amt || amt <= 0) { setError('Montant invalide.'); return }
    if (amt > available)  { setError('Montant supérieur au solde disponible.'); return }
    if (!phone.trim())    { setError('Numéro mobile money requis.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/country-admin/request-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, provider, mobileMoneyNumber: phone.trim() }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { setError(data.error ?? `Erreur ${res.status}`); return }
      router.refresh()
      onClose()
    } catch {
      setError('Erreur réseau. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Demander un retrait</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Solde dispo */}
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Solde disponible</span>
            <span className="text-base font-black text-emerald-700">
              {available.toLocaleString('fr-FR')} FCFA
            </span>
          </div>

          {/* Montant */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Montant à retirer (FCFA)
            </label>
            <input
              type="number"
              min={5000}
              max={available}
              step={100}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
              required
            />
            <p className="mt-1 text-[10px] text-gray-400">Minimum 5 000 FCFA</p>
          </div>

          {/* Provider */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Méthode de paiement
            </label>
            <div className="grid grid-cols-2 gap-2">
              {methods.map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setProvider(m.key)}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                    provider === m.key
                      ? 'border-sky-400 bg-sky-50 text-sky-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Numéro */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Numéro mobile money
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+228 90 00 00 00"
                className="w-full rounded-xl border border-gray-200 pl-9 pr-3.5 py-2.5 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
                required
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
