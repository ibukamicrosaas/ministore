'use client'

import { useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { subscribeStockAlert } from '@/lib/actions/stockAlerts'

interface Props {
  productId: string
  primaryColor: string
}

export function StockAlertForm({ productId, primaryColor }: Props) {
  const [open, setOpen]       = useState(false)
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await subscribeStockAlert(productId, name, phone)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-green-50 border border-green-200 px-5 py-4 text-center">
        <BellRing className="h-6 w-6 text-green-600" />
        <p className="text-sm font-semibold text-green-700">Tu seras prévenu(e) par SMS !</p>
        <p className="text-xs text-green-600 leading-relaxed">
          On t&apos;envoie un message dès que ce produit est de nouveau disponible.
        </p>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.99] transition-all"
      >
        <Bell className="h-4 w-4" />
        Me prévenir quand disponible
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
        <p className="text-sm font-semibold text-gray-900">Alerte disponibilité</p>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        Entre ton prénom et ton numéro. On t&apos;envoie un SMS dès que ce produit revient en stock.
      </p>

      <input
        type="text"
        placeholder="Ton prénom"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        maxLength={60}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 placeholder:text-gray-400"
      />
      <input
        type="tel"
        placeholder="Ton numéro (ex : +221 77 000 00 00)"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        required
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 placeholder:text-gray-400"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || !name.trim() || !phone.trim()}
        className="w-full rounded-2xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        {loading ? 'Inscription...' : 'Me prévenir'}
      </button>

      <button
        type="button"
        onClick={() => setOpen(false)}
        className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        Annuler
      </button>
    </form>
  )
}
