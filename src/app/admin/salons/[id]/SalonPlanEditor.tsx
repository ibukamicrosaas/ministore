'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { updateShopPlan } from '@/lib/actions/admin'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const PLANS = [
  { value: 'trial',      label: 'Essai gratuit' },
  { value: 'decouverte', label: 'Découverte — 2 900 FCFA/mois' },
  { value: 'business',   label: 'Business — 4 900 FCFA/mois' },
  { value: 'pro',        label: 'Pro — 9 900 FCFA/mois' },
]

export interface SalonAdminData {
  id: string
  name: string
  slug: string
  plan: string
  trial_ends_at: string | null
  is_active: boolean
  phone_whatsapp: string | null
  city: string | null
  created_at: string
}

export function SalonPlanEditor({ salon }: { salon: SalonAdminData }) {
  const router = useRouter()
  const [plan, setPlan] = useState(salon.plan)
  const [isActive, setIsActive] = useState(salon.is_active)
  const [trialEndsAt, setTrialEndsAt] = useState(
    salon.trial_ends_at ? salon.trial_ends_at.slice(0, 10) : ''
  )
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    const result = await updateShopPlan(salon.id, {
      plan,
      is_active: isActive,
      trial_ends_at: plan === 'trial' ? (trialEndsAt ? new Date(trialEndsAt).toISOString() : null) : undefined,
    })
    if ('error' in result) {
      toast.error(result.error ?? 'Erreur')
    } else {
      toast.success('Boutique mise à jour ✓')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/salons" className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{salon.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-gray-500">
              {salon.city ?? '—'} · Inscrit le {format(new Date(salon.created_at), 'd MMM yyyy', { locale: fr })}
            </p>
            <Link href={`/${salon.slug}`} target="_blank" className="text-blue-500 hover:text-blue-700">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Infos salon */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Slug</span>
          <span className="font-mono text-gray-900">{salon.slug}</span>
        </div>
        {salon.phone_whatsapp && (
          <div className="flex justify-between">
            <span className="text-gray-500">WhatsApp</span>
            <span className="text-gray-900">{salon.phone_whatsapp}</span>
          </div>
        )}
      </div>

      {/* Éditeur de plan */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900">Plan & accès</h2>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Plan</label>
          <select
            value={plan}
            onChange={e => setPlan(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
          >
            {PLANS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {plan === 'trial' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Date de fin d'essai</label>
            <input
              type="date"
              value={trialEndsAt}
              onChange={e => setTrialEndsAt(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
            />
            <p className="text-xs text-gray-400 mt-1">Laisser vide pour pas de date limite (déconseillé)</p>
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Mini site actif</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isActive ? 'La boutique accepte des commandes' : 'Le mini site est suspendu'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative h-6 w-11 rounded-full transition-colors ${isActive ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  )
}
