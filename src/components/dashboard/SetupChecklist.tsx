'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, ChevronUp, Copy, CheckCheck, ArrowRight, Zap, X } from 'lucide-react'
import { APP_URL } from '@/constants'

interface SetupChecklistProps {
  shopSlug: string
  shopName: string
  hasProduct: boolean
  hasPayoutNumbers: boolean
  isActivePlan: boolean
}

interface Step {
  id: string
  label: string
  description: string
  done: boolean
  action: React.ReactNode
}

export function SetupChecklist({ shopSlug, shopName, hasProduct, hasPayoutNumbers, isActivePlan }: SetupChecklistProps) {
  const [hasShared, setHasShared]   = useState(false)
  const [collapsed, setCollapsed]   = useState(false)
  const [dismissed, setDismissed]   = useState(false)
  const [copied, setCopied]         = useState(false)

  const sharedKey    = `ts_shared_${shopSlug}`
  const collapseKey  = `ts_checklist_collapsed_${shopSlug}`
  const dismissedKey = `ts_checklist_dismissed_${shopSlug}`

  useEffect(() => {
    setHasShared(localStorage.getItem(sharedKey) === '1')
    setCollapsed(localStorage.getItem(collapseKey) === '1')
    setDismissed(localStorage.getItem(dismissedKey) === '1')
  }, [sharedKey, collapseKey, dismissedKey])

  const shopUrl = `${APP_URL}/${shopSlug}`

  function handleShare() {
    navigator.clipboard.writeText(shopUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      localStorage.setItem(sharedKey, '1')
      setHasShared(true)
    })
  }

  function handleDismiss() {
    localStorage.setItem(dismissedKey, '1')
    setDismissed(true)
  }

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(collapseKey, next ? '1' : '0')
  }

  const steps: Step[] = [
    {
      id:          'products',
      label:       'Ajoute tes produits',
      description: 'Nom, photo, description et prix — tes clients voient tout ça sur ton mini site.',
      done:        hasProduct,
      action: (
        <Link
          href="/dashboard/products/new"
          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Ajouter <ArrowRight className="h-3 w-3" />
        </Link>
      ),
    },
    {
      id:          'payout',
      label:       'Ajoute tes numéros de reversement',
      description: 'Wave ou Orange Money — pour recevoir tes paiements directement sur ton téléphone.',
      done:        hasPayoutNumbers,
      action: (
        <Link
          href="/dashboard/settings"
          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Ajouter <ArrowRight className="h-3 w-3" />
        </Link>
      ),
    },
    {
      id:          'activate',
      label:       'Active ton site',
      description: 'Choisis un plan pour rendre ton site visible et recevoir tes premières commandes.',
      done:        isActivePlan,
      action: (
        <Link
          href="/dashboard/upgrade"
          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <Zap className="h-3 w-3" /> Activer
        </Link>
      ),
    },
    {
      id:          'share',
      label:       'Partage le lien de ton site',
      description: `Envoie ${shopUrl} sur WhatsApp, Facebook ou Instagram pour recevoir tes premières commandes.`,
      done:        hasShared || (hasProduct && hasPayoutNumbers && isActivePlan),
      action: (
        <button
          onClick={handleShare}
          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
        >
          {copied ? <><CheckCheck className="h-3 w-3" /> Copié !</> : <><Copy className="h-3 w-3" /> Copier</>}
        </button>
      ),
    },
  ]

  const doneCount = steps.filter(s => s.done).length
  const allDone   = doneCount === steps.length

  // Ferme définitivement la checklist dès que tout est fait
  useEffect(() => {
    if (allDone && !dismissed) {
      localStorage.setItem(dismissedKey, '1')
      setDismissed(true)
    }
  }, [allDone, dismissed, dismissedKey])

  // Ne jamais afficher si l'utilisateur a fermé ou si tout est complété
  if (dismissed || allDone) return null

  if (collapsed) {
    return (
      <button
        onClick={toggleCollapsed}
        className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-left shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-sky-400 bg-sky-50 text-[10px] font-bold text-sky-500">
            {doneCount}
          </span>
          <span className="text-sm font-medium text-gray-700">Guide de démarrage</span>
          <span className="text-xs text-gray-400">{doneCount}/{steps.length}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">🚀 Lance ton site en 4 étapes</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {`${steps.length - doneCount} étape${steps.length - doneCount > 1 ? 's' : ''} restante${steps.length - doneCount > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleCollapsed} className="text-gray-400 hover:text-gray-600 p-0.5 rounded" aria-label="Réduire">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 p-0.5 rounded" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 h-1.5 rounded-full bg-sky-200">
        <div
          className="h-1.5 rounded-full bg-[var(--color-primary)] transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${
              step.done ? 'bg-white/60' : 'bg-white shadow-sm'
            }`}
          >
            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              step.done ? 'bg-green-500 text-white' : 'bg-[var(--color-primary)] text-white'
            }`}>
              {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${step.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
              )}
            </div>
            {!step.done && <div className="mt-0.5">{step.action}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
