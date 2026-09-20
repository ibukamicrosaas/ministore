import { CheckCircle2, XCircle } from 'lucide-react'

interface StepperProps {
  /** Statuts dans l'ordre d'avancement (ex: ['pending','confirmed','preparing','ready','delivered']). */
  steps: string[]
  /** Libellé affiché sous chaque étape. */
  labels: Record<string, string>
  /** Statut actuel de la commande/du retrait — détermine quelles étapes sont "faites". */
  currentStatus: string
  className?: string
}

/**
 * Extrait de src/app/dashboard/(protected)/orders/[id]/page.tsx (SPEC-refonte
 * -dashboard-marchand.md, Lot 1). Section 6, correctif Lot 4 : un
 * `currentStatus` absent de `steps` (ex. commande annulée) n'affiche plus un
 * stepper vierge qui donnerait l'impression qu'aucune étape n'a eu lieu —
 * remplacé par un état terminal distinct, rouge, sans numéros de progression.
 */
export function Stepper({ steps, labels, currentStatus, className }: StepperProps) {
  const idx = steps.indexOf(currentStatus)

  if (idx === -1) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 rounded-xl bg-[var(--db-danger-soft,#FBEAE7)] px-3 py-2.5 text-sm font-semibold text-[var(--db-danger,#C4321F)]">
          <XCircle className="h-4 w-4 shrink-0" />
          Commande annulée
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-1">
        {steps.map((s, i) => {
          const done = i <= idx
          const last = i === steps.length - 1
          return (
            <div key={s} className="flex flex-1 items-center gap-1">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                done ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {done && i < idx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {!last && (
                <div className={`flex-1 h-0.5 ${i < idx ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-1">
        {steps.map(s => (
          <p key={s} className="text-[9px] text-gray-400 text-center flex-1">
            {labels[s] ?? s}
          </p>
        ))}
      </div>
    </div>
  )
}
