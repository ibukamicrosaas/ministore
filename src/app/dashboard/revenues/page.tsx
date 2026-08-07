import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { Wallet, TrendingUp, ArrowDownToLine, Clock, Link as LinkIcon, Lock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { RequestPayoutButton } from './RequestPayoutButton'
import { TEKKISHOP_COMMISSION_RATE, PAYOUT_MIN_AMOUNT } from '@/constants'
import type { Profile, Payout } from '@/types'
import { isEuCaCountry, getPayoutMethods, formatPrice, PAYOUT_METHODS_BY_COUNTRY } from '@/lib/utils/country-groups'
import type { PayoutMethodKey } from '@/lib/utils/country-groups'

export const metadata = { title: 'Revenus — TekkiShop' }

export default async function RevenuesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'shop_id' | 'role'> | null
  if (!profile?.shop_id || profile.role !== 'owner') redirect('/dashboard')

  const shopId = profile.shop_id

  const { data: shopData } = await supabase
    .from('shops')
    .select('name, country, currency, payout_wave_number, payout_om_number')
    .eq('id', shopId)
    .single()

  const shop = shopData as {
    name: string
    country: string | null
    currency: string | null
    payout_wave_number: string | null
    payout_om_number: string | null
  } | null
  if (!shop) redirect('/dashboard')

  const shopCurrency = (shop.currency ?? 'XOF') as import('@/lib/utils/country-groups').ShopCurrency
  const euCa = isEuCaCountry(shop.country)

  // Méthodes de payout disponibles selon le pays, avec numéros résolus depuis les slots DB
  const rawMethods = getPayoutMethods(shop.country)
  const payoutMethodsWithNumbers = rawMethods
    .map(m => ({
      label:  m.label,
      key:    m.key,
      number: m.col === 'payout_wave_number' ? shop.payout_wave_number : shop.payout_om_number,
    }))
    .filter((m): m is { label: string; key: PayoutMethodKey; number: string } => !!m.number)

  // Total collecté via paiements en ligne (status completed). Les paiements
  // liés à une commande encore retenue (is_held=true, released_at IS NULL)
  // sont exclus : cet argent existe mais n'est pas disponible tant que la
  // boutique n'est pas activée — voir ADDITIF-argent-commandes-retenues.md.
  // Pas de colonne dédiée : le blocage se dérive de is_held/released_at,
  // même principe que le reste du modèle free_orders.
  const { data: paymentsData } = await supabase
    .from('payments')
    .select('amount, orders!inner(is_held, released_at)')
    .eq('shop_id', shopId)
    .eq('status', 'completed')

  type PaymentWithOrder = { amount: number; orders: { is_held: boolean; released_at: string | null } | null }
  const allPayments = (paymentsData ?? []) as unknown as PaymentWithOrder[]
  const isBlocked = (o: PaymentWithOrder['orders']) => !!o && o.is_held === true && o.released_at === null

  const totalCollected = allPayments
    .filter(p => !isBlocked(p.orders))
    .reduce((s, p) => s + p.amount, 0)
  const blockedGross = allPayments
    .filter(p => isBlocked(p.orders))
    .reduce((s, p) => s + p.amount, 0)

  const commissionTotal = Math.floor(totalCollected * (TEKKISHOP_COMMISSION_RATE / 100))
  const totalNet = totalCollected - commissionTotal
  const blockedNet = blockedGross - Math.floor(blockedGross * (TEKKISHOP_COMMISSION_RATE / 100))

  // Historique des reversements
  const { data: payoutsData } = await supabase
    .from('payouts')
    .select('*')
    .eq('shop_id', shopId)
    .order('requested_at', { ascending: false })

  const payouts = (payoutsData ?? []) as Payout[]

  const totalPaidOut = payouts
    .filter(p => p.status === 'completed')
    .reduce((s, p) => s + p.net_amount, 0)

  const totalPending = payouts
    .filter(p => p.status === 'pending' || p.status === 'processing')
    .reduce((s, p) => s + p.net_amount, 0)

  const availableBalance = totalNet - totalPaidOut - totalPending

  const hasPayoutMethod = payoutMethodsWithNumbers.length > 0
  const canRequestPayout = !euCa && availableBalance >= PAYOUT_MIN_AMOUNT && hasPayoutMethod

  // Label lisible pour une méthode de payout (recherche dans toutes les définitions)
  const allMethods = Object.values(PAYOUT_METHODS_BY_COUNTRY).flat()
  const getMethodLabel = (key: string) => allMethods.find(m => m.key === key)?.label ?? key

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Revenus</h1>
        <p className="text-sm text-gray-500 mt-0.5">Paiements en ligne collectés via TekkiShop</p>
      </div>

      {/* Solde disponible */}
      <Card padding="lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-gray-400" />
              <p className="text-xs text-gray-500">Solde disponible</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatPrice(Math.max(0, availableBalance), shopCurrency)}
            </p>
          </div>
          {euCa ? (
            <span className="text-xs text-gray-400 max-w-[160px] text-right leading-relaxed">
              Paiements gérés via Stripe Connect — les fonds arrivent directement sur ton compte bancaire.
            </span>
          ) : (
            <RequestPayoutButton
              shopId={shopId}
              availableBalance={Math.max(0, availableBalance)}
              payoutMethods={payoutMethodsWithNumbers}
              currency={shopCurrency}
              canRequest={canRequestPayout}
              minAmount={PAYOUT_MIN_AMOUNT}
            />
          )}
        </div>

        {!euCa && !hasPayoutMethod && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
            <LinkIcon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Ajoute un numéro mobile money dans tes{' '}
              <Link href="/dashboard/settings" className="font-semibold underline">Paramètres</Link>{' '}
              pour pouvoir retirer tes fonds.
            </p>
          </div>
        )}

        {!euCa && hasPayoutMethod && availableBalance < PAYOUT_MIN_AMOUNT && availableBalance > 0 && (
          <p className="mt-3 text-xs text-gray-400">
            Minimum {formatPrice(PAYOUT_MIN_AMOUNT, shopCurrency)} requis pour effectuer un retrait.
          </p>
        )}
      </Card>

      {/* Fonds bloqués — commandes digitales retenues et payées, en attendant l'activation */}
      {blockedNet > 0 && (
        <Card padding="lg" className="border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">Bloqué jusqu&apos;à activation</p>
            </div>
            <p className="text-xl font-bold text-amber-800">{formatPrice(blockedNet, shopCurrency)}</p>
          </div>
          <p className="mt-3 text-xs text-amber-700">
            Ces {formatPrice(blockedNet, shopCurrency)} sont à toi. Choisis un plan pour les débloquer et les retirer.
          </p>
        </Card>
      )}

      {/* Métriques */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="md">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            <p className="text-xs text-gray-500">Total net gagné</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatPrice(totalNet, shopCurrency)}</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownToLine className="h-3.5 w-3.5 text-blue-500" />
            <p className="text-xs text-gray-500">Total retiré</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatPrice(totalPaidOut, shopCurrency)}</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <p className="text-xs text-gray-500">En attente</p>
          </div>
          <p className="text-lg font-bold text-amber-600">{formatPrice(totalPending, shopCurrency)}</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-gray-500">Commission TekkiShop</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{TEKKISHOP_COMMISSION_RATE}%</p>
          <p className="text-xs text-gray-400">{formatPrice(commissionTotal, shopCurrency)} déduits</p>
        </Card>
      </div>

      {/* Répartition */}
      {(totalCollected > 0 || blockedGross > 0) && (
        <Card padding="md">
          <p className="text-sm font-semibold text-gray-900 mb-3">Répartition</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Collecté en ligne</span>
              <span className="font-medium text-gray-900">{formatPrice(totalCollected + blockedGross, shopCurrency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Commission TekkiShop ({TEKKISHOP_COMMISSION_RATE}%)</span>
              <span className="font-medium text-red-500">− {formatPrice(commissionTotal + (blockedGross - blockedNet), shopCurrency)}</span>
            </div>
            {blockedNet > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bloqué jusqu&apos;à activation</span>
                <span className="font-medium text-amber-600">− {formatPrice(blockedNet, shopCurrency)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
              <span className="font-semibold text-gray-900">Net disponible</span>
              <span className="font-bold text-gray-900">{formatPrice(totalNet, shopCurrency)}</span>
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
                    {formatPrice(payout.net_amount, shopCurrency)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getMethodLabel(payout.payout_method)} · {payout.payout_number}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(payout.requested_at), 'd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <span className={`text-xs font-semibold shrink-0 ${
                  payout.status === 'completed' ? 'text-green-600' :
                  payout.status === 'failed' ? 'text-red-500' :
                  payout.status === 'processing' ? 'text-blue-600' : 'text-amber-600'
                }`}>
                  {payout.status === 'completed' ? 'Terminé' :
                   payout.status === 'failed' ? 'Échoué' :
                   payout.status === 'processing' ? 'En cours' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
