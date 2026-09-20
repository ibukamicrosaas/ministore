import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Wallet, TrendingUp, ArrowDownToLine, Link as LinkIcon } from 'lucide-react'
import { RequestPayoutButton } from './RequestPayoutButton'
import { RevenueDetailAccordion } from './RevenueDetailAccordion'
import { PAYOUT_MIN_AMOUNT } from '@/constants'
import type { Profile, Payout } from '@/types'
import { isEuCaCountry, getPayoutMethods, formatPrice, PAYOUT_METHODS_BY_COUNTRY } from '@/lib/utils/country-groups'
import type { PayoutMethodKey } from '@/lib/utils/country-groups'
import { getCommissionRate } from '@/lib/billing/commission'
import { getPayoutFeeRate } from '@/lib/billing/payout-fees'

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
    .select('name, country, currency')
    .eq('id', shopId)
    .single()

  const shop = shopData as {
    name: string
    country: string | null
    currency: string | null
  } | null
  if (!shop) redirect('/dashboard')

  // Numéros réels isolés dans shop_payment_secrets (audit sécurité §109, migration 103)
  const { data: shopSecrets } = await supabase
    .from('shop_payment_secrets')
    .select('payout_wave_number, payout_om_number')
    .eq('shop_id', shopId)
    .single()
  const payoutNumbers = shopSecrets as { payout_wave_number: string | null; payout_om_number: string | null } | null

  const shopCurrency = (shop.currency ?? 'XOF') as import('@/lib/utils/country-groups').ShopCurrency
  const euCa = isEuCaCountry(shop.country)
  const commissionRate = getCommissionRate(shop.country)

  // Méthodes de payout disponibles selon le pays, avec numéros résolus depuis
  // les slots DB, et frais de retrait réels (opérateur + Bictorys) par
  // méthode — affichés au marchand avant qu'il ne confirme un retrait.
  const rawMethods = getPayoutMethods(shop.country)
  const payoutMethodsWithNumbers = rawMethods
    .map(m => ({
      label:  m.label,
      key:    m.key,
      number: m.col === 'payout_wave_number' ? payoutNumbers?.payout_wave_number : payoutNumbers?.payout_om_number,
      feeRate: getPayoutFeeRate(shop.country, m.key),
    }))
    .filter((m): m is { label: string; key: PayoutMethodKey; number: string; feeRate: number | null } => !!m.number)

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

  const commissionTotal = Math.floor(totalCollected * (commissionRate / 100))
  const totalNet = totalCollected - commissionTotal
  const blockedNet = blockedGross - Math.floor(blockedGross * (commissionRate / 100))

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

  // Label lisible pour une méthode de payout (recherche dans toutes les
  // définitions) — résolu ici, côté serveur : une fonction ne peut pas
  // traverser la frontière Server → Client Component (RevenueDetailAccordion),
  // seule une donnée sérialisable le peut.
  const allMethods = Object.values(PAYOUT_METHODS_BY_COUNTRY).flat()
  const getMethodLabel = (key: string) => allMethods.find(m => m.key === key)?.label ?? key
  const payoutsWithLabel = payouts.map(p => ({ ...p, methodLabel: getMethodLabel(p.payout_method) }))

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Revenus</h1>
        <p className="text-sm text-gray-500 mt-0.5">Paiements en ligne collectés via TekkiShop</p>
      </div>

      {/* Carte portefeuille — section 8 de la spec : solde en grand, un seul
          bouton principal blanc sur fond de couleur, deux indicateurs
          secondaires seulement. Le reste (commission, répartition, fonds
          bloqués, historique) est replié dans RevenueDetailAccordion.
          Pas <Card> : ses classes de base (bg-white, border-gray-200) sont
          en tête de la chaîne clsx() et gagnent la cascade Tailwind quelle
          que soit la classe passée en className — un <div> nu évite ce
          conflit plutôt que de forcer via !important. */}
      <div className="rounded-xl p-6 shadow-sm bg-[var(--db-money,#128A4C)] text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-white/70" />
              <p className="text-xs text-white/80">Solde disponible</p>
            </div>
            <p className="text-3xl font-bold text-white">
              {formatPrice(Math.max(0, availableBalance), shopCurrency)}
            </p>
          </div>
          {euCa ? (
            <span className="text-xs text-white/80 max-w-[160px] text-right leading-relaxed">
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
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-white/10 px-3 py-2.5">
            <LinkIcon className="h-4 w-4 text-white shrink-0 mt-0.5" />
            <p className="text-xs text-white">
              Ajoute un numéro mobile money dans tes{' '}
              <Link href="/dashboard/settings" className="font-semibold underline">Paramètres</Link>{' '}
              pour pouvoir retirer tes fonds.
            </p>
          </div>
        )}

        {!euCa && hasPayoutMethod && availableBalance < PAYOUT_MIN_AMOUNT && availableBalance > 0 && (
          <p className="mt-3 text-xs text-white/70">
            Minimum {formatPrice(PAYOUT_MIN_AMOUNT, shopCurrency)} requis pour effectuer un retrait.
          </p>
        )}

        {/* Deux indicateurs secondaires seulement, dans la carte */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/20 pt-4">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <TrendingUp className="h-3.5 w-3.5 text-white/70" />
              <p className="text-[11px] text-white/80">Total gagné</p>
            </div>
            <p className="text-sm font-bold text-white">{formatPrice(totalNet, shopCurrency)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <ArrowDownToLine className="h-3.5 w-3.5 text-white/70" />
              <p className="text-[11px] text-white/80">Total retiré</p>
            </div>
            <p className="text-sm font-bold text-white">{formatPrice(totalPaidOut, shopCurrency)}</p>
          </div>
        </div>
      </div>

      <RevenueDetailAccordion
        currency={shopCurrency}
        blockedNet={blockedNet}
        totalPending={totalPending}
        commissionRate={commissionRate}
        commissionTotal={commissionTotal}
        totalCollected={totalCollected}
        blockedGross={blockedGross}
        totalNet={totalNet}
        payouts={payoutsWithLabel}
      />
    </div>
  )
}
