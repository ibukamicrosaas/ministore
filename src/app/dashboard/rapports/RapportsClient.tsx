'use client'

import { Card } from '@/components/ui/Card'
import { TrendingUp, ShoppingBag, Users, BarChart2, ArrowUp, ArrowDown, Minus, Star } from 'lucide-react'

interface OrderStats { total: number; pending: number; confirmed: number; delivered: number; cancelled: number }
interface TopProduct  { name: string; qty: number; revenue: number }
interface ChartDay    { date: string; count: number }
interface DayOfWeek   { label: string; count: number }

interface Props {
  monthLabel: string
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  prevRevenue: number
  revenueGrowth: number
  orderStats: OrderStats
  ordersGrowth: number
  completionRate: number
  cancellationRate: number
  topProducts: TopProduct[]
  clientCount: number
  productCount: number
  chartData: ChartDay[]
  dayOfWeek: DayOfWeek[]
  bestDay: string | null
}

function Growth({ value }: { value: number }) {
  if (value === 0) return <span className="flex items-center gap-0.5 text-xs text-gray-400"><Minus className="h-3 w-3" /> —</span>
  if (value > 0)  return <span className="flex items-center gap-0.5 text-xs text-green-600 font-medium"><ArrowUp className="h-3 w-3" /> +{value}%</span>
  return              <span className="flex items-center gap-0.5 text-xs text-red-500 font-medium"><ArrowDown className="h-3 w-3" /> {value}%</span>
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
  monthLabel, todayRevenue, weekRevenue, monthRevenue, prevRevenue, revenueGrowth,
  orderStats, ordersGrowth, completionRate, cancellationRate,
  topProducts, clientCount, productCount,
  chartData, dayOfWeek, bestDay,
}: Props) {
  const maxCount   = Math.max(...chartData.map(d => d.count), 1)
  const maxDayCount = Math.max(...dayOfWeek.map(d => d.count), 1)

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Rapports</h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">{monthLabel}</p>
      </div>

      {/* Chiffre d'affaires */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Chiffre d'affaires</p>
          </div>
          <Growth value={revenueGrowth} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Aujourd'hui", value: todayRevenue, active: todayRevenue > 0 },
            { label: 'Cette semaine', value: weekRevenue, active: weekRevenue > 0 },
            { label: 'Ce mois',      value: monthRevenue, active: monthRevenue > 0 },
          ].map(({ label, value, active }) => (
            <div key={label} className={`rounded-xl px-3 py-3 text-center ${active ? 'bg-sky-50 border border-sky-100' : 'bg-gray-50'}`}>
              <p className="text-[10px] text-gray-500 mb-1">{label}</p>
              <p className={`text-lg font-bold leading-tight ${active ? 'text-sky-600' : 'text-gray-400'}`}>
                {value.toLocaleString('fr-FR')}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">FCFA</p>
            </div>
          ))}
        </div>
        {prevRevenue > 0 && (
          <p className="text-xs text-gray-400 text-right">
            Mois dernier : {prevRevenue.toLocaleString('fr-FR')} FCFA
          </p>
        )}
      </Card>

      {/* Commandes ce mois */}
      <Card className="space-y-1">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Commandes ce mois</p>
          </div>
          <Growth value={ordersGrowth} />
        </div>
        <StatRow label="Total" value={orderStats.total} />
        <StatRow label="En cours" value={orderStats.confirmed} color={orderStats.confirmed > 0 ? 'text-blue-600' : 'text-gray-400'} />
        <StatRow label="Livrées"  value={orderStats.delivered} color={orderStats.delivered > 0 ? 'text-green-600' : 'text-gray-400'} />
        <StatRow label="Annulées" value={orderStats.cancelled} color={orderStats.cancelled > 0 ? 'text-red-500' : 'text-gray-400'} />
        <StatRow label="En attente" value={orderStats.pending} color={orderStats.pending > 0 ? 'text-amber-600' : 'text-gray-400'} />
        <div className="pt-2 mt-1 border-t border-gray-100 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-green-50 px-3 py-2.5 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Taux de livraison</p>
            <p className={`text-lg font-bold ${completionRate > 0 ? 'text-green-600' : 'text-gray-400'}`}>{completionRate}%</p>
          </div>
          <div className="rounded-xl bg-red-50 px-3 py-2.5 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Taux d'annulation</p>
            <p className={`text-lg font-bold ${cancellationRate > 0 ? 'text-red-500' : 'text-gray-400'}`}>{cancellationRate}%</p>
          </div>
        </div>
      </Card>

      {/* Graphique 30 jours */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="h-4 w-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-900">Commandes — 30 derniers jours</p>
        </div>
        <div className="flex items-end gap-[2px] h-20">
          {chartData.map(({ date, count }) => (
            <div
              key={date}
              title={`${date.slice(5).replace('-', '/')}: ${count} commande${count > 1 ? 's' : ''}`}
              className="flex-1 rounded-t-sm transition-all cursor-default"
              style={{
                height: `${Math.max((count / maxCount) * 100, count > 0 ? 10 : 3)}%`,
                backgroundColor: count > 0 ? 'var(--color-primary)' : '#E5E7EB',
                opacity: count > 0 ? 1 : 0.5,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-gray-400">{chartData[0]?.date.slice(5).replace('-', '/')}</span>
          <span className="text-[10px] text-gray-400">Aujourd'hui</span>
        </div>
      </Card>

      {/* Meilleur jour de la semaine */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-amber-400" />
          <p className="text-sm font-semibold text-gray-900">Activité par jour</p>
          {bestDay && (
            <span className="ml-auto text-xs bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
              Meilleur : {bestDay}
            </span>
          )}
        </div>
        <div className="flex items-end gap-2 h-14">
          {dayOfWeek.map(({ label, count }) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: `${Math.max((count / maxDayCount) * 48, count > 0 ? 6 : 3)}px`,
                  backgroundColor: count === Math.max(...dayOfWeek.map(d => d.count)) && count > 0
                    ? '#F59E0B'
                    : count > 0
                    ? 'var(--color-primary)'
                    : '#E5E7EB',
                  opacity: count > 0 ? 1 : 0.4,
                }}
              />
              <span className="text-[9px] text-gray-400 font-medium">{label}</span>
            </div>
          ))}
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
        ) : topProducts.map((p, i) => (
          <div key={p.name} className="flex items-center gap-3 py-1.5">
            <span className={`text-xs font-bold w-4 text-right ${i === 0 ? 'text-amber-500' : 'text-gray-400'}`}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
              </div>
              <div className="mt-0.5 h-1 rounded-full bg-gray-100">
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: `${(p.qty / (topProducts[0]?.qty ?? 1)) * 100}%`,
                    backgroundColor: i === 0 ? '#F59E0B' : 'var(--color-primary)',
                  }}
                />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-xs font-semibold text-gray-700">{p.qty}×</span>
              <p className="text-[10px] text-gray-400">{p.revenue.toLocaleString('fr-FR')} F</p>
            </div>
          </div>
        ))}
      </Card>

      {/* Base clients & catalogue */}
      <Card className="space-y-1">
        <div className="flex items-center gap-2 pb-2">
          <Users className="h-4 w-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-900">Base clients & catalogue</p>
        </div>
        <StatRow label="Clients enregistrés" value={clientCount} />
        <StatRow label="Produits actifs"      value={productCount} />
      </Card>
    </div>
  )
}
