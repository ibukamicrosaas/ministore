interface Props {
  used:     number
  quota:    number
  daysLeft: number | null
}

function daysLeftLabel(daysLeft: number | null): string | null {
  if (daysLeft === null) return null
  if (daysLeft <= 0) return 'Dernier jour'
  if (daysLeft === 1) return '1 jour restant'
  return `${daysLeft} jours restants`
}

/** SPEC-dashboard-fins-essai §2 — aucun bouton d'activation à ce stade. */
export function QuotaCounter({ used, quota, daysLeft }: Props) {
  const label = daysLeftLabel(daysLeft)

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-amber-900">Commandes offertes</p>
        <p className="text-sm font-bold text-amber-900">{used} / {quota}</p>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1.5">
          {Array.from({ length: quota }, (_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${i < used ? 'bg-amber-500' : 'bg-amber-200'}`}
            />
          ))}
        </div>
        {label && <p className="text-xs font-medium text-amber-700">{label}</p>}
      </div>
    </div>
  )
}
