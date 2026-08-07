'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { UpgradePlans, type Plan } from '@/app/dashboard/upgrade/UpgradePlans'
import { useChatAssistant } from './ChatAssistantContext'
import { extendTrialByShare } from '@/lib/actions/trial'
import { APP_URL } from '@/constants'

function logEvent(eventName: string, metadata: Record<string, unknown> = {}) {
  fetch('/api/dashboard/events', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ event_name: eventName, metadata }),
    keepalive: true,
  }).catch(() => {})
}

interface CaseAProps {
  caseType:        'A'
  collectedTotal:  number | null
  heldCount:       number
  currency:        string
  plans:           Plan[]
  currentPlan:     string
  isEuCa:          boolean
  subscriptionEndsAt: string | null
}

interface CaseBProps {
  caseType:      'B'
  visitCount:    number
  category:      string
  country:       string | null
  shopSlug:      string
  shopName:      string
  /** Si déjà renseigné (prolongation déjà utilisée), le bloc reste masqué en permanence. */
  trialExtendedAt: string | null
}

type Props = (CaseAProps | CaseBProps) & { shopId: string }

function formatAmount(amount: number, currency: string): string {
  if (currency === 'EUR') return `${(amount / 100).toLocaleString('fr-FR')} €`
  if (currency === 'CAD') return `${(amount / 100).toLocaleString('fr-FR')} CAD`
  return `${amount.toLocaleString('fr-FR')} F`
}

export function TrialEndScreen(props: Props) {
  const [dismissed, setDismissed] = useState(true) // true par défaut : évite un flash avant lecture du localStorage
  const dismissKey = `trial_end_screen_dismissed_${props.shopId}`

  useEffect(() => {
    setDismissed(localStorage.getItem(dismissKey) === '1')
  }, [dismissKey])

  useEffect(() => {
    if (dismissed) return
    logEvent('trial_end_screen_shown', { case: props.caseType })
    if (props.caseType === 'A') logEvent('pricing_viewed_from_trial_end', { case: 'A' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed])

  function handleDismiss() {
    localStorage.setItem(dismissKey, '1')
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="mx-auto max-w-lg px-5 py-8">
        <button
          onClick={handleDismiss}
          aria-label="Fermer"
          className="ml-auto mb-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {props.caseType === 'A' ? <CaseAContent {...props} /> : <CaseBContent {...props} />}
      </div>
    </div>
  )
}

function CaseAContent({ collectedTotal, heldCount, currency, plans, currentPlan, isEuCa, subscriptionEndsAt }: CaseAProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 leading-snug">
          {collectedTotal !== null
            ? `Tes 3 commandes offertes t'ont rapporté ${formatAmount(collectedTotal, currency)}.`
            : 'Tes 3 commandes offertes ont été passées.'}
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Ta boutique fonctionne. Pour continuer à recevoir des commandes, choisis ton plan.
        </p>
        {heldCount > 0 && (
          <p className="text-sm font-semibold text-amber-700 mt-2">
            {heldCount} commande{heldCount > 1 ? 's' : ''} t&apos;attend{heldCount > 1 ? 'ent' : ''} déjà.
          </p>
        )}
      </div>

      <UpgradePlans
        plans={plans}
        currentPlan={currentPlan}
        isEuCa={isEuCa}
        showCardOption={!isEuCa}
        subscriptionEndsAt={subscriptionEndsAt}
      />

      <p className="text-xs text-gray-400 text-center">
        Tes commandes restent enregistrées. Tu les retrouveras dès l&apos;activation.
      </p>
    </div>
  )
}

function CaseBContent({ visitCount, category, country, shopSlug, shopName, trialExtendedAt }: CaseBProps) {
  const { openChatWithPrompt } = useChatAssistant()
  const [pending, startTransition] = useTransition()
  // Déjà prolongée dans une session précédente : le bloc reste masqué en
  // permanence (§6, « ne pas afficher un bouton mort »). `justExtended` ne
  // couvre que le retour visuel immédiat après l'action, dans cette session.
  const alreadyExtended = trialExtendedAt !== null
  const [justExtended, setJustExtended] = useState(false)
  const [extendError, setExtendError] = useState<string | null>(null)

  const neverOpened = visitCount === 0

  function handleAskAssistant() {
    logEvent('acquisition_plan_opened', {})
    const where = country ? ` à ${country}` : ''
    openChatWithPrompt(
      `Je vends ${category}${where}. Ma boutique est en ligne depuis 14 jours et je n'ai pas encore de client. Aide-moi à trouver mes premiers acheteurs.`
    )
  }

  function handleShareAndExtend() {
    const url = `${APP_URL}/${shopSlug}`
    const waMessage = `Bonjour 👋\n\nDécouvrez *${shopName}* et commandez directement en ligne !\n\n👉 ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(waMessage)}`, '_blank', 'noopener,noreferrer')
    startTransition(async () => {
      const result = await extendTrialByShare()
      if (result.error) setExtendError(result.error)
      else setJustExtended(true)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 leading-snug">
          {neverOpened
            ? "Ta boutique est prête, mais personne ne l'a encore vue."
            : 'Ta boutique est prête. Il lui manque des visiteurs.'}
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          {neverOpened
            ? "En 14 jours, ton lien n'a jamais été ouvert. Ce n'est pas ta boutique le problème : c'est que personne ne sait encore qu'elle existe."
            : `En 14 jours, ton lien a été ouvert ${visitCount} fois. C'est un début, mais il en faut davantage pour déclencher une première commande.`}
        </p>
      </div>

      {/* 1. Assistant IA */}
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
        <p className="text-sm font-bold text-sky-900">Ton Assistant IA peut t&apos;aider à trouver tes premiers clients.</p>
        <p className="text-xs text-sky-700 mt-1 mb-3">
          Il connaît ce que tu vends et où tu es. Pose-lui la question, il te répond tout de suite.
        </p>
        <button
          onClick={handleAskAssistant}
          className="w-full rounded-xl bg-sky-600 py-2.5 text-sm font-bold text-white hover:bg-sky-700 transition-colors"
        >
          Demander à mon Assistant
        </button>
      </div>

      {/* 2. Prolongation — une seule fois. Si déjà utilisée dans une session
          précédente (trialExtendedAt renseigné), le bloc reste masqué en
          permanence, y compris la confirmation. */}
      {!alreadyExtended && !justExtended && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-900">Partage ton lien et continue 7 jours de plus.</p>
          <p className="text-xs text-emerald-700 mt-1 mb-3">
            Ta boutique n&apos;a jamais été partagée. Envoie-la à tes contacts et on te rend 7 jours, avec tes 3 commandes offertes.
          </p>
          {extendError && <p className="text-xs text-red-600 mb-2">{extendError}</p>}
          <button
            onClick={handleShareAndExtend}
            disabled={pending}
            className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {pending ? 'Un instant…' : 'Partager ma boutique'}
          </button>
        </div>
      )}
      {!alreadyExtended && justExtended && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-900">Essai prolongé de 7 jours ✓</p>
        </div>
      )}

      {/* 3. Tarifs — discret */}
      <Link
        href="/dashboard/upgrade"
        onClick={() => logEvent('pricing_viewed_from_trial_end', { case: 'B' })}
        className="block text-center text-xs text-gray-500 hover:text-gray-700 underline"
      >
        Tu peux aussi activer ta boutique dès maintenant.
      </Link>
    </div>
  )
}
