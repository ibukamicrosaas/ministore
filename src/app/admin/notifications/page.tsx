'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendNotificationToShops, getShopIdsByPlan, type NotificationType } from '@/lib/actions/notifications'
import { Bell, Send, Users, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const PLAN_OPTIONS = [
  { value: 'trial',      label: 'Essai',      icon: '📋', color: 'bg-gray-100 text-gray-700' },
  { value: 'decouverte', label: 'Découverte',  icon: '🚀', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'business',   label: 'Business',   icon: '💼', color: 'bg-blue-100 text-blue-700' },
  { value: 'pro',        label: 'Pro',         icon: '👑', color: 'bg-purple-100 text-purple-700' },
]

const TYPE_OPTIONS: { value: NotificationType; label: string; icon: string; color: string }[] = [
  { value: 'info',    label: 'Info',      icon: 'ℹ️',  color: 'bg-sky-50 border-sky-200 text-sky-800' },
  { value: 'promo',   label: 'Promo',     icon: '🎁',  color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  { value: 'success', label: 'Succès',    icon: '✅',  color: 'bg-green-50 border-green-200 text-green-800' },
  { value: 'warning', label: 'Attention', icon: '⚠️',  color: 'bg-amber-50 border-amber-200 text-amber-800' },
]

export default function AdminNotificationsPage() {
  const supabase = createClient()
  const [planCounts, setPlanCounts] = useState<Record<string, number>>({})
  const [selectedPlans, setSelectedPlans] = useState<string[]>(['trial'])
  const [title,   setTitle]   = useState('')
  const [body,    setBody]    = useState('')
  const [type,    setType]    = useState<NotificationType>('info')
  const [sending, setSending] = useState(false)
  const [preview, setPreview] = useState(false)

  const estimatedCount = selectedPlans.reduce((acc, p) => acc + (planCounts[p] ?? 0), 0)

  useEffect(() => {
    async function loadCounts() {
      const { data } = await supabase
        .from('shops')
        .select('plan')
      if (!data) return
      const counts: Record<string, number> = {}
      for (const row of data) counts[row.plan] = (counts[row.plan] ?? 0) + 1
      setPlanCounts(counts)
    }
    loadCounts()
  }, [supabase])

  function togglePlan(plan: string) {
    setSelectedPlans(prev =>
      prev.includes(plan) ? prev.filter(p => p !== plan) : [...prev, plan]
    )
  }

  async function handleSend() {
    if (!selectedPlans.length) { toast.error('Sélectionne au moins un plan.'); return }
    if (!title.trim())         { toast.error('Le titre est requis.');           return }
    if (!body.trim())          { toast.error('Le message est requis.');          return }

    setSending(true)
    try {
      const shopIds = await getShopIdsByPlan(selectedPlans)
      if (!shopIds.length) { toast.error('Aucune boutique trouvée pour ces plans.'); return }

      const result = await sendNotificationToShops({ shopIds, title, body, type })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`✅ Notification envoyée à ${result.sent} boutique${result.sent !== 1 ? 's' : ''} !`)
        setTitle('')
        setBody('')
        setPreview(false)
      }
    } finally {
      setSending(false)
    }
  }

  const selectedTypeCfg = TYPE_OPTIONS.find(t => t.value === type) ?? TYPE_OPTIONS[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-sky-100">
            <Bell className="h-6 w-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">Envoie un message dans les dashboards des marchands</p>
          </div>
        </div>

        {/* 1. Ciblage */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 text-sm">1. Ciblage par plan</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PLAN_OPTIONS.map(plan => {
              const isOn = selectedPlans.includes(plan.value)
              const count = planCounts[plan.value] ?? 0
              return (
                <button
                  key={plan.value}
                  type="button"
                  onClick={() => togglePlan(plan.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                    isOn
                      ? 'border-sky-500 bg-sky-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl leading-none">{plan.icon}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plan.color}`}>
                    {plan.label}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{count} boutique{count !== 1 ? 's' : ''}</span>
                  {isOn && <CheckCircle className="h-3.5 w-3.5 text-sky-500" />}
                </button>
              )
            })}
          </div>
          {estimatedCount > 0 && (
            <p className="mt-3 text-sm text-sky-700 font-medium">
              → {estimatedCount} boutique{estimatedCount !== 1 ? 's' : ''} ciblée{estimatedCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* 2. Type */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">2. Type de notification</h2>
          <div className="flex gap-2 flex-wrap">
            {TYPE_OPTIONS.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  type === t.value
                    ? `${t.color} border-current ring-2 ring-offset-1 ring-sky-300`
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Contenu */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">3. Contenu</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Titre</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex : Activez votre boutique maintenant 🚀"
              maxLength={80}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{title.length}/80</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Ex : Votre boutique est prête ! Activez-la dès aujourd'hui pour commencer à vendre. Plan Découverte à 2 900 FCFA/mois."
              rows={4}
              maxLength={500}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 resize-none transition-all"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{body.length}/500</p>
          </div>
        </div>

        {/* 4. Prévisualisation */}
        {title.trim() && body.trim() && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 text-sm">4. Aperçu</h2>
              <button
                type="button"
                onClick={() => setPreview(v => !v)}
                className="text-xs text-sky-600 hover:underline"
              >
                {preview ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            {preview && (
              <div className={`rounded-xl border p-4 space-y-1 ${selectedTypeCfg.color}`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg leading-none mt-0.5">{selectedTypeCfg.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs mt-1 opacity-90 whitespace-pre-wrap">{body}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bouton envoi */}
        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim() || !selectedPlans.length || estimatedCount === 0}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-base bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-sky-200"
        >
          {sending
            ? <><span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Envoi en cours...</>
            : <><Send className="h-4 w-4" />Envoyer à {estimatedCount} boutique{estimatedCount !== 1 ? 's' : ''}</>
          }
        </button>

        {estimatedCount === 0 && selectedPlans.length > 0 && (
          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Aucune boutique trouvée pour les plans sélectionnés.
          </div>
        )}
      </div>
    </div>
  )
}
