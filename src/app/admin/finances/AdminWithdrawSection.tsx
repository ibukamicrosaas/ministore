'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

const METHODS = [
  { key: 'wave',         label: 'Wave' },
  { key: 'orange_money', label: 'Orange Money' },
  { key: 'mtn',          label: 'MTN Mobile Money' },
  { key: 'moov',         label: 'Moov Money' },
  { key: 'tmoney',       label: 'T-Money' },
  { key: 'flooz',        label: 'Flooz' },
  { key: 'mobicash',     label: 'Mobicash' },
  { key: 'maxit',        label: 'Maxit' },
  { key: 'airtel',       label: 'Airtel Money' },
  { key: 'mvola',        label: 'MVola' },
]

export function AdminWithdrawSection({ availableBalance }: { availableBalance: number }) {
  const [amount, setAmount]   = useState(String(Math.max(0, availableBalance)))
  const [method, setMethod]   = useState('wave')
  const [phone, setPhone]     = useState('')
  const [notes, setNotes]     = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseInt(amount, 10)
    if (!amt || !phone.trim()) return
    if (amt > availableBalance) {
      toast.error(`Montant supérieur au solde disponible (${availableBalance.toLocaleString('fr-FR')} F)`)
      return
    }
    if (!confirm(
      `Confirmer le retrait de ${amt.toLocaleString('fr-FR')} FCFA via ${method} (${phone}) ?\n\nCeci va déclencher un virement depuis Bictorys vers votre numéro.`
    )) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/finances/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, method, phoneNumber: phone, notes }),
      })
      const data = await res.json() as { success?: boolean; auto?: boolean; error?: string }
      if (!res.ok || !data.success) {
        toast.error(data.error ?? 'Erreur')
        return
      }
      if (data.auto) {
        toast.success('Virement Bictorys déclenché — retrait enregistré ✓')
      } else {
        toast.success('Retrait enregistré — effectuez le virement manuellement sur Bictorys')
      }
      setAmount('0')
      setPhone('')
      setNotes('')
      router.refresh()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 overflow-hidden">
      <div className="px-5 py-4 border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-800">Retirer mes revenus abonnements</p>
        </div>
        <p className="text-xs text-emerald-600 mt-0.5">
          Solde disponible :{' '}
          <span className="font-bold">{availableBalance.toLocaleString('fr-FR')} FCFA</span>
        </p>
      </div>

      {availableBalance <= 0 ? (
        <p className="px-5 py-4 text-sm text-gray-400">Aucun solde disponible pour le moment.</p>
      ) : (
        <form onSubmit={handleSubmit} className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Montant (FCFA)</label>
            <input
              type="number"
              min={1}
              max={availableBalance}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Méthode mobile money</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 outline-none"
            >
              {METHODS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Votre numéro mobile money</label>
            <input
              type="tel"
              placeholder="+221 77 000 00 00"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optionnel)</label>
            <input
              type="text"
              placeholder="Ex : Retrait mensuel juillet 2026"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Traitement…' : 'Retirer'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
