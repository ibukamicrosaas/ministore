'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

const ALL_METHODS = [
  { key: 'wave',         label: 'Wave' },
  { key: 'orange_money', label: 'Orange Money' },
  { key: 'mtn',          label: 'MTN Mobile Money' },
  { key: 'moov',         label: 'Moov Money' },
  { key: 'tmoney',       label: 'T-Money (Togocel)' },
  { key: 'flooz',        label: 'Flooz (Moov Togo)' },
  { key: 'mobicash',     label: 'Mobicash' },
  { key: 'maxit',        label: 'Maxit' },
  { key: 'airtel',       label: 'Airtel Money' },
  { key: 'mvola',        label: 'MVola' },
]

export function AdminManualPayoutSection() {
  const [open, setOpen] = useState(false)
  const [slug, setSlug]         = useState('')
  const [amount, setAmount]     = useState('')
  const [method, setMethod]     = useState('wave')
  const [phone, setPhone]       = useState('')
  const [notes, setNotes]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseInt(amount, 10)
    if (!slug.trim() || !amt || !phone.trim()) return

    if (!confirm(`Confirmer le reversement de ${amt.toLocaleString('fr-FR')} FCFA à la boutique "${slug}" via ${method} (${phone}) ?\n\nCette opération va créer un enregistrement "Payé" dans TEKKIShop.`)) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/payouts/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopSlug: slug, amount: amt, method, phoneNumber: phone, notes }),
      })
      const data = await res.json() as { success?: boolean; error?: string; shopName?: string; netBalance?: number }
      if (!res.ok || !data.success) { toast.error(data.error ?? 'Erreur'); return }
      toast.success(`Reversement créé pour ${data.shopName} ✓`)
      setSlug(''); setAmount(''); setPhone(''); setNotes('')
      router.refresh()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4 text-gray-400" />
          Créer un reversement manuel pour un marchand
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Slug de la boutique</label>
            <input
              type="text"
              placeholder="ma-boutique-slug"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
              required
            />
            <p className="mt-0.5 text-[10px] text-gray-400">Visible dans la colonne Boutique de la page admin</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Montant net versé (FCFA)</label>
            <input
              type="number"
              min={1}
              placeholder="9700"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Méthode mobile money</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 outline-none"
            >
              {ALL_METHODS.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Numéro mobile money</label>
            <input
              type="tel"
              placeholder="+228 90 00 00 00"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optionnel)</label>
            <input
              type="text"
              placeholder="Ex : Ref Bictorys TXN-12345"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Création…' : 'Créer et marquer comme payé'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
