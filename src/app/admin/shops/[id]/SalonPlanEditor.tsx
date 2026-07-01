'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { updateShopPlan } from '@/lib/actions/admin'
import { resetUserPin } from '@/lib/actions/admin-shops'
import { ChevronLeft, ExternalLink, TrendingUp, KeyRound, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const PLANS = [
  { value: 'trial',      label: 'Essai gratuit' },
  { value: 'decouverte', label: 'Découverte — 2 900 FCFA/mois' },
  { value: 'business',   label: 'Business — 4 900 FCFA/mois' },
  { value: 'pro',        label: 'Pro — 9 900 FCFA/mois' },
]

const PLAN_DURATIONS: Record<string, number> = {
  decouverte: 31,
  business:   31,
  pro:        31,
}

function defaultEndsAt(days = 31) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export interface SalonAdminData {
  id: string
  name: string
  slug: string
  plan: string
  trial_ends_at: string | null
  subscription_ends_at: string | null
  is_active: boolean
  phone_whatsapp: string | null
  city: string | null
  created_at: string
}

function formatFCFA(n: number): string {
  return n.toLocaleString('fr-FR') + ' FCFA'
}

export function SalonPlanEditor({ salon, onlineRevenue }: { salon: SalonAdminData; onlineRevenue: number }) {
  const router = useRouter()
  const [plan, setPlan] = useState(salon.plan)
  const [isActive, setIsActive] = useState(salon.is_active)
  const [trialEndsAt, setTrialEndsAt] = useState(
    salon.trial_ends_at ? salon.trial_ends_at.slice(0, 10) : ''
  )
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState(
    salon.subscription_ends_at
      ? salon.subscription_ends_at.slice(0, 10)
      : defaultEndsAt(PLAN_DURATIONS[salon.plan] ?? 31)
  )
  const [loading, setLoading] = useState(false)
  const [newPin, setNewPin]   = useState('')
  const [showPin, setShowPin] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)

  // When plan changes, reset the expiry to a reasonable default if not already set
  function handlePlanChange(newPlan: string) {
    setPlan(newPlan)
    if (newPlan !== 'trial' && !salon.subscription_ends_at) {
      setSubscriptionEndsAt(defaultEndsAt(PLAN_DURATIONS[newPlan] ?? 31))
    }
  }

  const isExpired = plan !== 'trial' && subscriptionEndsAt
    ? new Date(subscriptionEndsAt) < new Date()
    : false

  async function handlePinReset() {
    if (!/^\d{6}$/.test(newPin)) {
      toast.error('Le PIN doit contenir exactement 6 chiffres.')
      return
    }
    setPinLoading(true)
    const result = await resetUserPin(salon.id, newPin)
    setPinLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`PIN réinitialisé ✓ — compte : ${result.userPhone ?? '?'}`)
      setNewPin('')
    }
  }

  async function handleSave() {
    setLoading(true)
    const result = await updateShopPlan(salon.id, {
      plan,
      is_active: isActive,
      trial_ends_at: plan === 'trial' ? (trialEndsAt ? new Date(trialEndsAt).toISOString() : null) : undefined,
      subscription_ends_at: plan !== 'trial'
        ? (subscriptionEndsAt ? new Date(subscriptionEndsAt + 'T23:59:59').toISOString() : undefined)
        : undefined,
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
        <Link href="/admin/shops" className="p-1.5 rounded-lg hover:bg-gray-100">
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

      {/* Infos boutique */}
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

      {/* CA en ligne Bictorys */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-emerald-700">CA généré via TEKKIShop (Bictorys)</p>
          <p className="text-xl font-bold text-emerald-800 mt-0.5">{formatFCFA(onlineRevenue)}</p>
        </div>
      </div>

      {/* Réinitialisation PIN */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Réinitialiser le PIN</h2>
        </div>
        <p className="text-xs text-gray-500">
          Définis un PIN temporaire à 6 chiffres, puis communique-le à l'utilisateur.
          Il pourra le changer depuis Paramètres → Changer le PIN.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showPin ? 'text' : 'password'}
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6 chiffres"
              maxLength={6}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-10 text-sm font-mono tracking-widest outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
            />
            <button
              type="button"
              onClick={() => setShowPin(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={handlePinReset}
            disabled={pinLoading || newPin.length !== 6}
            className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {pinLoading ? 'En cours…' : 'Réinitialiser'}
          </button>
        </div>
      </div>

      {/* Éditeur de plan */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900">Plan & accès</h2>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Plan</label>
          <select
            value={plan}
            onChange={e => handlePlanChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
          >
            {PLANS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {plan === 'trial' ? (
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
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Date d'expiration de l'abonnement
              {isExpired && (
                <span className="ml-2 text-red-500 font-semibold">⚠ Abonnement expiré</span>
              )}
            </label>
            <input
              type="date"
              value={subscriptionEndsAt}
              onChange={e => setSubscriptionEndsAt(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-1 ${
                isExpired
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
                  : 'border-gray-200 focus:border-sky-400 focus:ring-sky-400'
              }`}
            />
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {[
                { label: '+1 mois', days: 31 },
                { label: '+3 mois', days: 92 },
                { label: '+1 an', days: 365 },
              ].map(({ label, days }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    const base = subscriptionEndsAt && new Date(subscriptionEndsAt) > new Date()
                      ? new Date(subscriptionEndsAt).getTime()
                      : Date.now()
                    setSubscriptionEndsAt(
                      new Date(base + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
                    )
                  }}
                  className="text-xs text-sky-600 hover:text-sky-800 font-medium bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-lg transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
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
