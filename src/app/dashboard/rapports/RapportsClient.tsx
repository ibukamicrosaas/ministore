'use client'

import { Card } from '@/components/ui/Card'
import { TrendingUp, ShoppingBag, Users, Package, CheckCircle2, XCircle, Clock, BarChart2 } from 'lucide-react'

interface OrderStats {
  total: number
  pending: number
  confirmed: number
  delivered: number
  cancelled: number
}

interface TopProduct {
  name: string
  qty: number
  revenue: number
}

interface Props {
  monthLabel: string
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  orderStats: OrderStats
  completionRate: number
  cancellationRate: number
  topProducts: TopProduct[]
  clientCount: number
  productCount: number
}

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${color ?? 'text-gray-900'}`}>{value}</span>
    </div>
  )
}

export function RapportsClient({
  monthLabel,
  todayRevenue,
  weekRevenue,
  monthRevenue,
  orderStats,
  completionRate,
  cancellationRate,
  topProducts,
  clientCount,
  productCount,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rapports</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{monthLabel}</p>
        </div>
      </div>

      {/* Chiffre d'affaires */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-900">Chiffre d'affaires</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Aujourd'hui", value: todayRevenue, highlighted: false },
            { label: 'Cette semaine', value: weekRevenue, highlighted: weekRevenue > 0 },
            { label: 'Ce mois',      value: monthRevenue, highlighted: monthRevenue > 0 },
          ].map(({ label, value, highlighted }) => (
            <div
              key={label}
              className={`rounded-xl px-3 py-3 text-center ${highlighted ? 'bg-sky-50 border border-sky-100' : 'bg-gray-50'}`}
            >
              <p className="text-[10px] text-gray-500 mb-1">{label}</p>
              <p className={`text-lg font-bold leading-tight ${highlighted ? 'text-sky-600' : 'text-gray-400'}`}>
                {value.toLocaleString('fr-FR')}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">FCFA</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Commandes ce mois */}
      <Card className="space-y-1">
        <div className="flex items-center gap-2 pb-2">
          <ShoppingBag className="h-4 w-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-900">Commandes ce mois</p>
        </div>
        <StatRow label="Total" value={orderStats.total} />
        <StatRow
          label="En cours (confirmées + préparation)"
          value={orderStats.confirmed}
          color={orderStats.confirmed > 0 ? 'text-blue-600' : 'text-gray-400'}
        />
        <StatRow
          label="Livrées"
          value={orderStats.delivered}
          color={orderStats.delivered > 0 ? 'text-green-600' : 'text-gray-400'}
        />
        <StatRow
          label="Annulées"
          value={orderStats.cancelled}
          color={orderStats.cancelled > 0 ? 'text-red-500' : 'text-gray-400'}
        />
        <StatRow
          label="En attente"
          value={orderStats.pending}
          color={orderStats.pending > 0 ? 'text-amber-600' : 'text-gray-400'}
        />
        <div className="pt-2 mt-1 border-t border-gray-100 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-green-50 px-3 py-2.5 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Taux de livraison</p>
            <p className={`text-lg font-bold ${completionRate > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {completionRate}%
            </p>
          </div>
          <div className="rounded-xl bg-red-50 px-3 py-2.5 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Taux d'annulation</p>
            <p className={`text-lg font-bold ${cancellationRate > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {cancellationRate}%
            </p>
          </div>
        </div>
      </Card>

      {/* Top produits */}
      <Card className="space-y-2">
        <div className="flex items-center gap-2 pb-1">
          <BarChart2 className="h-4 w-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-900">Top produits ce mois</p>
        </div>
        {topProducts.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Aucune vente ce mois.</p>
        ) : (
          topProducts.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3 py-1.5">
              <span className="text-xs font-bold text-gray-400 w-4 text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.revenue.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                {p.qty}×
              </span>
            </div>
          ))
        )}
      </Card>

      {/* Base clients & catalogue */}
      <Card className="space-y-1">
        <div className="flex items-center gap-2 pb-2">
          <Users className="h-4 w-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-900">Base clients & catalogue</p>
        </div>
        <StatRow label="Clients enregistrés" value={clientCount} />
        <StatRow label="Produits actifs" value={productCount} />
      </Card>
    </div>
  )
}
