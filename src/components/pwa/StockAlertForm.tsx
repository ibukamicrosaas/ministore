'use client'

import { useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { subscribeStockAlert } from '@/lib/actions/stockAlerts'
import { ALL_PHONE_COUNTRIES } from '@/lib/utils/country-groups'

interface Props {
  productId: string
  primaryColor: string
  /** Pays de la boutique (ex : 'SN') — sert à présélectionner l'indicatif. */
  shopCountry?: string | null
}

const RECEPTION_NOTE = 'On t’enverra un SMS dès que ce produit est de nouveau disponible (la réception n’est pas garantie).'

export function StockAlertForm({ productId, primaryColor, shopCountry }: Props) {
  const defaultDial = ALL_PHONE_COUNTRIES.find(c => c.code === shopCountry)?.dial ?? '+221'

  const [open, setOpen]       = useState(false)
  const [name, setName]       = useState('')
  const [dial, setDial]       = useState<string>(defaultDial)
  const [phone, setPhone]     = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await subscribeStockAlert(productId, name, dial, phone)
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
        <p className="text-sm font-semibold text-green-700">C&apos;est noté !</p>
        <p className="text-xs text-green-600 leading-relaxed">{RECEPTION_NOTE}</p>
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
        Entre ton prénom et ton numéro. {RECEPTION_NOTE}
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
      <div className="flex gap-2">
        <select
          value={dial}
          onChange={e => setDial(e.target.value)}
          aria-label="Indicatif pays"
          className="w-[7.5rem] shrink-0 rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-sm outline-none focus:border-gray-400"
        >
          {ALL_PHONE_COUNTRIES.map(c => (
            <option key={c.code} value={c.dial}>{c.flag} {c.dial}</option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="tel"
          placeholder="Ton numéro"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
          className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 placeholder:text-gray-400"
        />
      </div>

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
