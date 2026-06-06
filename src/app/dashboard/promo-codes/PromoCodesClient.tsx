'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { createPromoCode, togglePromoCode, deletePromoCode } from '@/lib/actions/promo-codes'

type PromoCode = {
  id: string; code: string; discount_pct: number
  max_uses: number | null; used_count: number
  expires_at: string | null; is_active: boolean; created_at: string
}

export function PromoCodesClient({ codes: initial }: { codes: PromoCode[] }) {
  const [codes, setCodes]       = useState<PromoCode[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)

  const [code, setCode]           = useState('')
  const [pct, setPct]             = useState('')
  const [maxUses, setMaxUses]     = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || !pct) return
    setSaving(true)
    const result = await createPromoCode({
      code,
      discount_pct: parseInt(pct, 10),
      max_uses:     maxUses ? parseInt(maxUses, 10) : null,
      expires_at:   expiresAt || null,
    })
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Code créé ✓')
    setCode(''); setPct(''); setMaxUses(''); setExpiresAt('')
    setShowForm(false)
    window.location.reload()
  }

  async function handleToggle(id: string, current: boolean) {
    const result = await togglePromoCode(id, !current)
    if (result.error) { toast.error(result.error); return }
    setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
  }

  async function handleDelete(id: string) {
    const result = await deletePromoCode(id)
    if (result.error) { toast.error(result.error); return }
    setCodes(prev => prev.filter(c => c.id !== id))
    toast.success('Code supprimé.')
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] transition-colors'

  return (
    <>
      {/* Bouton créer */}
      <button
        onClick={() => setShowForm(v => !v)}
        className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        <Plus className="h-4 w-4" />
        Créer un code promo
      </button>

      {/* Formulaire de création */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">Nouveau code promo</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder="EX: SOLDES15"
                maxLength={30}
                className={inputCls}
                required
              />
              <p className="text-[10px] text-gray-400 mt-0.5">Lettres, chiffres, - et _ uniquement</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Réduction *</label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={pct}
                  onChange={e => setPct(e.target.value)}
                  placeholder="15"
                  className={`${inputCls} pr-8`}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Utilisations max <span className="text-gray-400">(vide = illimité)</span>
              </label>
              <input
                type="number"
                min={1}
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                placeholder="Ex : 50"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Expire le <span className="text-gray-400">(vide = jamais)</span>
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value ? `${e.target.value}T23:59:59Z` : '')}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Création...' : 'Créer le code'}
            </button>
          </div>
        </form>
      )}

      {/* Liste des codes */}
      {codes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-gray-200 text-center">
          <Tag className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm font-medium text-gray-500">Aucun code promo</p>
          <p className="text-xs text-gray-400 mt-0.5">Créez votre premier code pour attirer plus de clients.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {codes.map(c => {
            const isExpired = c.expires_at ? new Date(c.expires_at) < new Date() : false
            const isExhausted = c.max_uses !== null && c.used_count >= c.max_uses
            const statusBg = !c.is_active || isExpired || isExhausted
              ? 'bg-gray-100 text-gray-500'
              : 'bg-green-100 text-green-700'

            return (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold font-mono text-gray-900">{c.code}</span>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${statusBg}`}>
                      {isExpired ? 'Expiré' : isExhausted ? 'Épuisé' : c.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    -{c.discount_pct}%
                    {c.max_uses !== null && ` · ${c.used_count}/${c.max_uses} utilisations`}
                    {!c.max_uses && c.used_count > 0 && ` · ${c.used_count} utilisation${c.used_count > 1 ? 's' : ''}`}
                    {c.expires_at && ` · expire le ${format(new Date(c.expires_at), 'd MMM yyyy', { locale: fr })}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(c.id, c.is_active)}
                    title={c.is_active ? 'Désactiver' : 'Activer'}
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {c.is_active
                      ? <ToggleRight className="h-5 w-5 text-[var(--color-primary)]" />
                      : <ToggleLeft className="h-5 w-5" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
