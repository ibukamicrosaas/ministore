'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, ChevronUp, ArrowRight, Zap, X } from 'lucide-react'
import { APP_URL } from '@/constants'

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

interface SetupChecklistProps {
  shopSlug: string
  shopName: string
  hasProduct: boolean
  hasPayoutNumbers: boolean
  isActivePlan: boolean
  isFreeOrders: boolean
}

interface Step {
  id: string
  label: string
  description: string
  done: boolean
  action: React.ReactNode
}

export function SetupChecklist({ shopSlug, shopName, hasProduct, hasPayoutNumbers, isActivePlan, isFreeOrders }: SetupChecklistProps) {
  const [hasShared, setHasShared]   = useState(false)
  const [collapsed, setCollapsed]   = useState(false)
  const [dismissed, setDismissed]   = useState(false)

  const sharedKey    = `ts_shared_${shopSlug}`
  const collapseKey  = `ts_checklist_collapsed_${shopSlug}`
  const dismissedKey = `ts_checklist_dismissed_${shopSlug}`

  useEffect(() => {
    setHasShared(localStorage.getItem(sharedKey) === '1')
    setCollapsed(localStorage.getItem(collapseKey) === '1')
    setDismissed(localStorage.getItem(dismissedKey) === '1')
  }, [sharedKey, collapseKey, dismissedKey])

  const shopUrl = `${APP_URL}/${shopSlug}`
  const waMessage = `Bonjour 👋\n\nDécouvrez *${shopName}* et commandez directement en ligne !\n\n👉 ${shopUrl}`

  function handleWaShare() {
    localStorage.setItem(sharedKey, '1')
    setHasShared(true)
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
      label:       isFreeOrders ? 'Passe à un plan payant' : 'Active ton site',
      description: isFreeOrders
        ? 'Pour continuer à recevoir des commandes sans limite, au-delà des 3 offertes.'
        : 'Choisis un plan pour rendre ton site visible et recevoir tes premières commandes.',
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
      label:       'Partage sur WhatsApp maintenant',
      description: 'Envoie ton lien à tes contacts et dans tes groupes — c\'est le moyen le plus rapide d\'avoir tes premières commandes.',
      done:        hasShared || (hasProduct && hasPayoutNumbers && isActivePlan),
      action: (
        <a
          href={`https://wa.me/?text=${encodeURIComponent(waMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWaShare}
          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <WhatsAppIcon /> Partager
        </a>
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
