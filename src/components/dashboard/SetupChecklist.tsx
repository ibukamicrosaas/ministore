'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, ChevronUp, Copy, CheckCheck, ArrowRight } from 'lucide-react'
import { APP_URL } from '@/constants'

interface SetupChecklistProps {
  salonSlug: string
  salonName: string
  hasService: boolean
  hasPayoutNumbers: boolean
}

interface Step {
  id: string
  label: string
  description: string
  done: boolean
  action: React.ReactNode
}

export function SetupChecklist({ salonSlug, salonName, hasService, hasPayoutNumbers }: SetupChecklistProps) {
  const [hasConfiguredHours, setHasConfiguredHours] = useState(false)
  const [hasShared, setHasShared] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  const hoursKey   = `sheka_hours_${salonSlug}`
  const sharedKey  = `sheka_shared_${salonSlug}`
  const collapseKey = `sheka_checklist_collapsed_${salonSlug}`

  useEffect(() => {
    setHasConfiguredHours(localStorage.getItem(hoursKey) === '1')
    setHasShared(localStorage.getItem(sharedKey) === '1')
    setCollapsed(localStorage.getItem(collapseKey) === '1')
  }, [hoursKey, sharedKey, collapseKey])

  const salonUrl = `${APP_URL}/${salonSlug}`

  function handleShare() {
    navigator.clipboard.writeText(salonUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      localStorage.setItem(sharedKey, '1')
      setHasShared(true)
    })
  }

  function handleConfigureHours() {
    localStorage.setItem(hoursKey, '1')
    setHasConfiguredHours(true)
  }

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(collapseKey, next ? '1' : '0')
  }

  const steps: Step[] = [
    {
      id: 'services',
      label: 'Ajouter vos prestations',
      description: 'Nom, photo, description, durée et prix — vos clientes voient tout ça.',
      done: hasService,
      action: (
        <Link
          href="/dashboard/services/new"
          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#E85D04] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Ajouter <ArrowRight className="h-3 w-3" />
        </Link>
      ),
    },
    {
      id: 'hours',
      label: "Définir vos horaires d'ouverture",
      description: "Indiquez quand vous êtes disponible pour que vos clientes réservent les bons créneaux.",
      done: hasConfiguredHours,
      action: (
        <Link
          href="/dashboard/settings"
          onClick={handleConfigureHours}
          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#E85D04] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Configurer <ArrowRight className="h-3 w-3" />
        </Link>
      ),
    },
    {
      id: 'payout',
      label: 'Ajouter vos numéros de reversement',
      description: 'Wave ou Orange Money — pour recevoir vos paiements directement.',
      done: hasPayoutNumbers,
      action: (
        <Link
          href="/dashboard/revenues"
          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#E85D04] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Ajouter <ArrowRight className="h-3 w-3" />
        </Link>
      ),
    },
    {
      id: 'share',
      label: 'Partager votre lien de réservation',
      description: `Partagez ${salonUrl} sur WhatsApp, Instagram ou Facebook pour recevoir vos premiers rendez-vous.`,
      done: hasShared,
      action: (
        <button
          onClick={handleShare}
          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#E85D04] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
        >
          {copied ? <><CheckCheck className="h-3 w-3" /> Copié !</> : <><Copy className="h-3 w-3" /> Copier</>}
        </button>
      ),
    },
  ]

  const doneCount = steps.filter(s => s.done).length
  const allDone = doneCount === steps.length

  // Masquer une fois tout complété et réduit
  if (allDone && collapsed) return null

  if (collapsed) {
    return (
      <button
        onClick={toggleCollapsed}
        className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-left shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-orange-400 bg-orange-50 text-[10px] font-bold text-orange-500">
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
    <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">🚀 Lancez votre mini site en 4 étapes</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {allDone
              ? 'Tout est prêt — vous pouvez recevoir des réservations !'
              : `${steps.length - doneCount} étape${steps.length - doneCount > 1 ? 's' : ''} restante${steps.length - doneCount > 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={toggleCollapsed} className="text-gray-400 hover:text-gray-600 p-0.5">
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      {/* Barre de progression */}
      <div className="mb-4 h-1.5 rounded-full bg-orange-200">
        <div
          className="h-1.5 rounded-full bg-[#E85D04] transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Étapes */}
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${
              step.done ? 'bg-white/60' : 'bg-white shadow-sm'
            }`}
          >
            {/* Numéro / check */}
            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              step.done
                ? 'bg-green-500 text-white'
                : 'bg-[#E85D04] text-white'
            }`}>
              {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>

            {/* Texte */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${step.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
              )}
            </div>

            {/* Action */}
            {!step.done && <div className="mt-0.5">{step.action}</div>}
          </div>
        ))}
      </div>

      {allDone && (
        <button
          onClick={toggleCollapsed}
          className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600"
        >
          Réduire ↑
        </button>
      )}
    </div>
  )
}
