import Link from 'next/link'

/** SPEC-dashboard-fins-essai §3 — déclenché à la 2ᵉ commande sur 3. */
export function SecondOrderAlert() {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3.5">
      <p className="text-sm font-bold text-amber-900">Il te reste 1 commande offerte.</p>
      <p className="text-xs text-amber-700 mt-0.5 mb-3">
        Active ta boutique maintenant pour ne pas rater la suivante.
      </p>
      <Link
        href="/dashboard/upgrade"
        className="block w-full rounded-xl bg-amber-500 py-2.5 text-center text-xs font-bold text-white hover:bg-amber-600 transition-colors"
      >
        Activer ma boutique
      </Link>
    </div>
  )
}
