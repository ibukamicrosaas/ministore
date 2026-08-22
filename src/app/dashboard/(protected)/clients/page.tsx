import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { UserCircle, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import type { Profile, Client } from '@/types'
import { isOrderBlocked, REDACTED_LABEL } from '@/lib/orders/redact'

export const metadata = { title: 'Clients — TekkiShop' }

const PAGE_SIZE = 50

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>
}

type LoyaltyTier = { label: string; emoji: string; color: string; bg: string; minOrders: number }

const LOYALTY_TIERS: LoyaltyTier[] = [
  { label: 'Or',     emoji: '🥇', color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  minOrders: 10 },
  { label: 'Argent', emoji: '🥈', color: 'text-slate-600',  bg: 'bg-slate-50 border-slate-200',  minOrders: 3  },
  { label: 'Bronze', emoji: '🥉', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', minOrders: 1  },
]

function getLoyaltyTier(totalOrders: number): LoyaltyTier | null {
  if (totalOrders < 1) return null
  return LOYALTY_TIERS.find(t => totalOrders >= t.minOrders) ?? null
}

export default async function ClientsPage({ searchParams }: Props) {
  const { q, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

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

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('shop_id', profile.shop_id)
    .order('total_orders', { ascending: false, nullsFirst: false })
    .order('last_order_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`)
  }

  const { data: clientsData, count } = await query.range(from, to)
  const clients    = (clientsData ?? []) as Client[]
  const total      = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Dépenses totales par client (pour les clients affichés)
  const clientIds = clients.map(c => c.id)
  let totalSpentMap: Record<string, number> = {}
  if (clientIds.length > 0) {
    const { data: spendData } = await supabase
      .from('orders')
      .select('client_id, total_price')
      .eq('shop_id', profile.shop_id)
      .in('client_id', clientIds)
      .not('status', 'eq', 'cancelled')
    if (spendData) {
      totalSpentMap = spendData.reduce((acc, o) => {
        if (o.client_id) {
          acc[o.client_id] = (acc[o.client_id] ?? 0) + (o.total_price ?? 0)
        }
        return acc
      }, {} as Record<string, number>)
    }
  }

  // `clients` est upserté dès la création d'une commande (upsert_client_from_order),
  // indépendamment de is_held — cette liste contourne donc le modèle de masquage
  // par commande. Un client dont TOUTES les commandes sont encore retenues ne doit
  // pas apparaître ici en clair. Voir src/lib/orders/redact.ts.
  const unmaskedClientIds = new Set<string>()
  if (clientIds.length > 0) {
    const { data: heldCheckData } = await supabase
      .from('orders')
      .select('client_id, is_held, released_at')
      .eq('shop_id', profile.shop_id)
      .in('client_id', clientIds)
    for (const o of heldCheckData ?? []) {
      if (o.client_id && !isOrderBlocked(o)) unmaskedClientIds.add(o.client_id)
    }
  }

  // Statistiques globales
  const goldCount   = clients.filter(c => (c.total_orders ?? 0) >= 10).length
  const silverCount = clients.filter(c => (c.total_orders ?? 0) >= 3 && (c.total_orders ?? 0) < 10).length

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/dashboard/clients${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Clients</h1>
        <span className="text-sm text-gray-500">
          {total} client{total > 1 ? 's' : ''}
        </span>
      </div>

      {/* Résumé fidélité */}
      {!q && total > 0 && (goldCount > 0 || silverCount > 0) && (
        <div className="flex gap-2">
          {goldCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <span className="text-sm">🥇</span>
              <div>
                <p className="text-xs font-bold text-amber-800">{goldCount} client{goldCount > 1 ? 's' : ''} Or</p>
                <p className="text-[10px] text-amber-600">10+ commandes</p>
              </div>
            </div>
          )}
          {silverCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-sm">🥈</span>
              <div>
                <p className="text-xs font-bold text-slate-700">{silverCount} client{silverCount > 1 ? 's' : ''} Argent</p>
                <p className="text-[10px] text-slate-500">3-9 commandes</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recherche */}
      <form method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher par nom ou téléphone..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
        />
      </form>

      <Card>
        {clients.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={UserCircle}
              title={q ? 'Aucun résultat' : 'Aucun client'}
              description={q ? `Aucun client ne correspond à « ${q} ».` : 'Les clients apparaîtront ici après leurs premières commandes.'}
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clients.map((client) => {
              const orders     = client.total_orders ?? 0
              const tier       = getLoyaltyTier(orders)
              const totalSpent = totalSpentMap[client.id] ?? 0
              const masked     = !unmaskedClientIds.has(client.id)
              const displayName = masked ? REDACTED_LABEL : `${client.first_name} ${client.last_name ?? ''}`

              return (
                <div key={client.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Avatar + tier */}
                  <div className="relative shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100">
                      <span className="text-sm font-semibold text-[var(--color-primary)]">
                        {masked ? '🔒' : client.first_name[0]?.toUpperCase()}
                      </span>
                    </div>
                    {tier && (
                      <span className="absolute -bottom-0.5 -right-0.5 text-[11px] leading-none">
                        {tier.emoji}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">
                        {displayName}
                      </p>
                      {tier && (
                        <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${tier.color} ${tier.bg}`}>
                          {tier.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{masked ? '' : client.phone}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-gray-700">
                      {orders} commande{orders > 1 ? 's' : ''}
                    </p>
                    {totalSpent > 0 ? (
                      <p className="text-xs text-gray-400">
                        {totalSpent.toLocaleString('fr-FR')} F
                      </p>
                    ) : client.last_order_at ? (
                      <p className="text-xs text-gray-400">
                        {format(new Date(client.last_order_at), 'd MMM', { locale: fr })}
                      </p>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Légende fidélité */}
      {total > 0 && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Programme de fidélité
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>🥉 Bronze = 1-2 commandes</span>
            <span>🥈 Argent = 3-9 commandes</span>
            <span>🥇 Or = 10+ commandes</span>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-1">
          <Link
            href={pageUrl(page - 1)}
            aria-disabled={page <= 1}
            className={`flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Link>
          <span className="text-xs text-gray-500">
            Page {page} / {totalPages}
          </span>
          <Link
            href={pageUrl(page + 1)}
            aria-disabled={page >= totalPages}
            className={`flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ${page >= totalPages ? 'pointer-events-none opacity-40' : ''}`}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
