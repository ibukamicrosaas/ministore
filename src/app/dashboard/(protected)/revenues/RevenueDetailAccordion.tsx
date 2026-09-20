'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronDown, ArrowDownToLine, Clock, Lock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'
import type { Payout } from '@/types'

interface RevenueDetailAccordionProps {
  currency: ShopCurrency
  blockedNet: number
  totalPending: number
  commissionRate: number
  commissionTotal: number
  totalCollected: number
  blockedGross: number
  totalNet: number
  // Le libellé de méthode est résolu côté serveur (page.tsx) — une fonction
  // ne peut pas être passée en prop à un Client Component.
  payouts: (Payout & { methodLabel: string })[]
}

// Section 8 de la spec : le détail (commission, répartition, fonds bloqués,
// historique) reste entièrement accessible en un clic, juste replié par
// défaut derrière cet accordéon — rien de supprimé, uniquement hiérarchisé.
// Aucune donnée recalculée ici, tout arrive déjà calculé depuis page.tsx.
export function RevenueDetailAccordion({
  currency, blockedNet, totalPending, commissionRate, commissionTotal,
  totalCollected, blockedGross, totalNet, payouts,
}: RevenueDetailAccordionProps) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700"
      >
        Voir le détail
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-5">
          {/* Fonds bloqués — commandes digitales retenues et payées, en attendant
              l'activation. Pas <Card> ici non plus, même raison qu'en tête de
              page.tsx : bg-amber-50/border-amber-200 perdrait potentiellement
              face à bg-white/border-gray-200 selon l'ordre de sortie Tailwind
              — un <div> nu élimine le doute plutôt que de le laisser courir. */}
          {blockedNet > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 shadow-sm p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-800">Bloqué jusqu&apos;à activation</p>
                </div>
                <p className="text-xl font-bold text-amber-800">{formatPrice(blockedNet, currency)}</p>
              </div>
              <p className="mt-3 text-xs text-amber-700">
                Ces {formatPrice(blockedNet, currency)} sont à toi. Choisis un plan pour les débloquer et les retirer.
              </p>
            </div>
          )}

          {/* Métriques restantes */}
          <div className="grid grid-cols-2 gap-3">
            <Card padding="md">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-xs text-gray-500">En attente</p>
              </div>
              <p className="text-lg font-bold text-amber-600">{formatPrice(totalPending, currency)}</p>
            </Card>

            <Card padding="md">
              <div className="flex items-center gap-2 mb-1">
                {/* Distinct de la ligne "Commission TekkiShop" de Répartition
                    ci-dessous : celle-ci ne porte que sur le disponible
                    (totalCollected), l'autre sur tout le collecté y compris
                    le bloqué — même libellé auparavant, deux montants
                    différents pour le même marchand (signalé en test réel,
                    Lot 6). Libellés distingués, aucun montant recalculé. */}
                <p className="text-xs text-gray-500">Commission (disponible)</p>
              </div>
              <p className="text-lg font-bold text-gray-900">{commissionRate}%</p>
              <p className="text-xs text-gray-400">{formatPrice(commissionTotal, currency)} déduits</p>
            </Card>
          </div>

          {/* Répartition */}
          {(totalCollected > 0 || blockedGross > 0) && (
            <Card padding="md">
              <p className="text-sm font-semibold text-gray-900 mb-3">Répartition</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Collecté en ligne</span>
                  <span className="font-medium text-gray-900">{formatPrice(totalCollected + blockedGross, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Commission TekkiShop ({commissionRate}% du total collecté)</span>
                  <span className="font-medium text-red-500">− {formatPrice(commissionTotal + (blockedGross - blockedNet), currency)}</span>
                </div>
                {blockedNet > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Bloqué jusqu&apos;à activation</span>
                    <span className="font-medium text-amber-600">− {formatPrice(blockedNet, currency)}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
                  <span className="font-semibold text-gray-900">Net disponible</span>
                  <span className="font-bold text-gray-900">{formatPrice(totalNet, currency)}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Historique des retraits */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Historique des retraits</p>
            {payouts.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 py-10 text-center">
                <p className="text-sm text-gray-400">Aucun retrait effectué pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payouts.map(payout => (
                  <div
                    key={payout.id}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${
                      payout.status === 'completed' ? 'bg-green-100' :
                      payout.status === 'failed' ? 'bg-red-100' : 'bg-amber-100'
                    }`}>
                      <ArrowDownToLine className={`h-4 w-4 ${
                        payout.status === 'completed' ? 'text-green-600' :
                        payout.status === 'failed' ? 'text-red-500' : 'text-amber-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPrice(payout.net_amount, currency)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payout.methodLabel} · {payout.payout_number}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(payout.requested_at), 'd MMMM yyyy', { locale: fr })}
                      </p>
                      {/* Statut clair : badge + explication courte (section 8
                          de la spec) — pas de vraie raison technique
                          disponible par retrait (payouts.notes n'est jamais
                          rempli à l'échec), explication générique + action. */}
                      {payout.status !== 'completed' && (
                        <p className="mt-1 text-[11px] text-gray-500">
                          {payout.status === 'failed' ? (
                            <>
                              Le retrait a échoué.{' '}
                              <a
                                href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold underline"
                              >
                                Contacter le support
                              </a>
                            </>
                          ) : (
                            'En cours de traitement, généralement sous quelques minutes.'
                          )}
                        </p>
                      )}
                    </div>
                    <Badge variant={payout.status} className="shrink-0">
                      {payout.status === 'completed' ? 'Terminé' :
                       payout.status === 'failed' ? 'Échoué' :
                       payout.status === 'processing' ? 'En cours' : 'En attente'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
