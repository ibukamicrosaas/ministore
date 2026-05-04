import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { UserCircle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Profile, Client } from '@/types'

export const metadata = { title: 'Clients — TekkiShop' }

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function ClientsPage({ searchParams }: Props) {
  const { q } = await searchParams
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
    .select('*')
    .eq('shop_id', profile.shop_id)
    .order('last_order_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`)
  }

  const { data: clientsData } = await query.limit(100)
  const clients = (clientsData ?? []) as Client[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Clients</h1>
        <span className="text-sm text-gray-500">{clients.length} cliente{clients.length > 1 ? 's' : ''}</span>
      </div>

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
              title={q ? 'Aucun résultat' : 'Aucune cliente'}
              description={q ? `Aucune cliente ne correspond à « ${q} ».` : 'Les clientes apparaîtront ici après leurs premières réservations.'}
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 shrink-0">
                  <span className="text-sm font-semibold text-[var(--color-primary)]">
                    {client.first_name[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {client.first_name} {client.last_name ?? ''}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{client.phone}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-gray-700">{client.total_orders ?? 0} commande{(client.total_orders ?? 0) > 1 ? 's' : ''}</p>
                  {client.last_order_at && (
                    <p className="text-xs text-gray-400">
                      {format(new Date(client.last_order_at), 'd MMM', { locale: fr })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
