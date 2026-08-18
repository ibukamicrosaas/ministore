'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/utils/country-groups'
import type { ShopCurrency } from '@/lib/utils/country-groups'

/**
 * Relevé "Ce que tu paies" — composant partagé entre le tunnel de commande,
 * la page de confirmation et la page de suivi (§6 de SPEC-refonte-tunnel-commande.md).
 * L'e-mail de confirmation ne peut pas consommer ce composant React (HTML statique
 * envoyé par Resend) : sa propre fonction, dans lib/notifications/email.ts, reproduit
 * la même structure et le même ordre de lignes en HTML inline.
 *
 * Interactif (code promo saisissable/retirable) uniquement quand onApplyPromo/
 * onRemovePromo sont fournis — le tunnel seul. Confirmation et suivi passent des
 * données déjà persistées, sans callback : affichage pur.
 *
 * qtyDiscountAmount n'est fourni que par le tunnel, qui a le prix avant/après remise
 * en mémoire côté client. order_items ne persiste que le prix déjà remisé et le
 * pourcentage, jamais le montant économisé — confirmation/suivi/e-mail n'affichent
 * donc pas cette ligne (décision explicite, voir REPRISE.md, chantier séparé prévu
 * pour la persister à la création via une migration).
 */

export interface OrderSummaryProps {
  currency: ShopCurrency
  itemCount: number
  itemsSubtotal: number
  qtyDiscountAmount?: number | null

  promoCode?: string | null
  promoDiscountPct?: number | null
  promoAmount?: number | null
  promoInputValue?: string
  onPromoInputChange?: (v: string) => void
  promoStatus?: 'idle' | 'checking' | 'valid' | 'invalid'
  promoError?: string
  onApplyPromo?: () => void
  onRemovePromo?: () => void

  deliveryAmount?: number | null
  deliveryZoneName?: string | null

  total: number
  /** Ce qui est dû en ligne, tout de suite (acompte ou total complet). 0 si rien n'est payé en ligne. */
  amountNow: number
  /** Ce qui reste dû à la réception, en espèces. 0 si tout est déjà réglé en ligne. */
  amountLater: number
  /** Contexte de ce qui reste dû — pour le libellé "à la livraison" / "en boutique". */
  laterContext?: 'home_delivery' | 'store_pickup' | null
}

export function OrderSummary({
  currency,
  itemCount,
  itemsSubtotal,
  qtyDiscountAmount,
  promoCode,
  promoDiscountPct,
  promoAmount,
  promoInputValue,
  onPromoInputChange,
  promoStatus = 'idle',
  promoError,
  onApplyPromo,
  onRemovePromo,
  deliveryAmount,
  deliveryZoneName,
  total,
  amountNow,
  amountLater,
  laterContext,
}: OrderSummaryProps) {
  const interactive = !!(onApplyPromo || onRemovePromo)
  const [promoOpen, setPromoOpen] = useState(false)
  const hasPromoApplied = !!promoCode && !!promoAmount && promoAmount > 0
  const laterLabel = laterContext === 'store_pickup' ? 'en boutique' : 'à la livraison'

  return (
    <div className="space-y-2">
      {itemsSubtotal > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Sous-total ({itemCount} article{itemCount > 1 ? 's' : ''})</span>
          <span className="font-medium text-gray-900">{formatPrice(itemsSubtotal, currency)}</span>
        </div>
      )}

      {!!qtyDiscountAmount && qtyDiscountAmount > 0 && (
        <div className="flex items-center justify-between text-sm text-emerald-600">
          <span>Remise sur quantité</span>
          <span className="font-medium">-{formatPrice(qtyDiscountAmount, currency)}</span>
        </div>
      )}

      {hasPromoApplied ? (
        <div className="flex items-center justify-between text-sm text-emerald-600">
          <span>Réduction ({promoCode}, -{promoDiscountPct}%)</span>
          <span className="flex items-center gap-2 font-medium">
            -{formatPrice(promoAmount!, currency)}
            {onRemovePromo && (
              <button
                type="button"
                onClick={onRemovePromo}
                className="text-xs font-semibold text-gray-400 underline underline-offset-2 hover:text-gray-600"
              >
                Retirer
              </button>
            )}
          </span>
        </div>
      ) : interactive ? (
        <div>
          {!promoOpen ? (
            <button
              type="button"
              onClick={() => setPromoOpen(true)}
              className="text-sm font-semibold text-gray-500 underline underline-offset-2 hover:text-gray-700"
            >
              J&apos;ai un code promo
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                value={promoInputValue ?? ''}
                onChange={e => onPromoInputChange?.(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && onApplyPromo?.()}
                placeholder="Ex : SOLDES15"
                maxLength={30}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-mono uppercase outline-none ${
                  promoStatus === 'invalid' ? 'border-red-400' : 'border-gray-200 focus:border-gray-300'
                }`}
                autoCapitalize="characters"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={onApplyPromo}
                disabled={!promoInputValue?.trim() || promoStatus === 'checking'}
                className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                {promoStatus === 'checking' ? '...' : 'Appliquer'}
              </button>
            </div>
          )}
          {promoStatus === 'invalid' && promoError && (
            <p className="mt-1 text-xs text-red-500">{promoError}</p>
          )}
        </div>
      ) : null}

      {!!deliveryAmount && deliveryAmount > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Livraison{deliveryZoneName ? ` (${deliveryZoneName})` : ''}</span>
          <span className="font-medium text-gray-900">+{formatPrice(deliveryAmount, currency)}</span>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-sm font-bold text-gray-900">
        <span>Total</span>
        <span>{formatPrice(total, currency)}</span>
      </div>

      <div className="rounded-xl bg-gray-50 px-3 py-2.5 space-y-1">
        {amountNow > 0 ? (
          <>
            <div className="flex items-center justify-between text-sm font-bold text-gray-900">
              <span>Tu paies maintenant</span>
              <span>{formatPrice(amountNow, currency)}</span>
            </div>
            {amountLater > 0 && (
              <p className="text-xs text-gray-500">
                Puis {formatPrice(amountLater, currency)} {laterLabel}
              </p>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between text-sm font-bold text-gray-900">
            <span>En espèces {laterLabel}</span>
            <span>{formatPrice(amountLater || total, currency)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
