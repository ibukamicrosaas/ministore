import {
  ACTIVE_PAYOUT_STATUSES, toBalancePayments, toBalancePayouts,
  type BalancePayment, type BalancePayout,
} from '@/lib/billing/balance'

// Chargement des lignes nécessaires à computeBalance pour UNE boutique.
// Lecture seule. Pagination explicite : PostgREST plafonne une requête à
// 1000 lignes par défaut, une boutique au-delà verrait un solde tronqué sans
// aucune erreur.
//
// Le client est typé de façon structurelle pour accepter indifféremment le
// client admin (service role) et le client serveur de l'utilisateur.
type AnyClient = { from: (table: string) => any } // eslint-disable-line @typescript-eslint/no-explicit-any

const PAGE = 1000

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<{ rows: T[]; error: string | null }> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1)
    if (error) return { rows: [], error: error.message }
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) break
  }
  return { rows, error: null }
}

export async function loadBalanceInputs(
  client: AnyClient,
  shopId: string,
): Promise<{ payments: BalancePayment[]; payouts: BalancePayout[]; error: string | null }> {
  const [pay, out] = await Promise.all([
    fetchAll<{ amount: number; orders: { is_held: boolean | null; released_at: string | null } | null }>((from, to) =>
      client
        .from('payments')
        .select('amount, orders(is_held, released_at)')
        .eq('shop_id', shopId)
        .eq('status', 'completed')
        .order('id')
        .range(from, to),
    ),
    fetchAll<{ status: string; gross_amount: number; net_amount: number }>((from, to) =>
      client
        .from('payouts')
        .select('status, gross_amount, net_amount')
        .eq('shop_id', shopId)
        .in('status', [...ACTIVE_PAYOUT_STATUSES])
        .order('id')
        .range(from, to),
    ),
  ])

  const error = pay.error ?? out.error
  return {
    payments: toBalancePayments(pay.rows),
    payouts: toBalancePayouts(out.rows),
    error,
  }
}
