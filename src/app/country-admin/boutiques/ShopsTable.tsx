'use client'

import { useState, useMemo } from 'react'
import { MessageCircle, ExternalLink, Search } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type Shop = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: string | null
  is_active: boolean | null
  phone_whatsapp: string | null
  city: string | null
  created_at: string
  primary_color: string | null
  product_count: number
}

const PLAN_CONFIG: Record<string, { label: string; badge: string }> = {
  trial:      { label: 'Essai',      badge: 'bg-gray-100 text-gray-600' },
  decouverte: { label: 'Découverte', badge: 'bg-emerald-100 text-emerald-700' },
  business:   { label: 'Business',   badge: 'bg-blue-100 text-blue-700' },
  pro:        { label: 'Pro',        badge: 'bg-purple-100 text-purple-700' },
}

function getSegment(count: number) {
  if (count >= 3) return { label: 'Prête',    color: 'text-emerald-600', dot: 'bg-emerald-400' }
  if (count >= 1) return { label: 'Démarrée', color: 'text-sky-600',     dot: 'bg-sky-400' }
  return              { label: 'Fantôme',   color: 'text-gray-400',    dot: 'bg-gray-300' }
}

export function ShopsTable({ shops }: { shops: Shop[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return shops
    return shops.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.city ?? '').toLowerCase().includes(q) ||
      (s.phone_whatsapp ?? '').includes(q)
    )
  }, [shops, query])

  return (
    <div>
      {/* Barre de recherche */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, ville, téléphone…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            Aucune boutique trouvée.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(shop => {
              const plan = PLAN_CONFIG[shop.plan ?? 'trial'] ?? PLAN_CONFIG.trial
              const segment = getSegment(shop.product_count)

              return (
                <div key={shop.id} className="flex items-center gap-3 px-5 py-4">
                  {/* Avatar */}
                  {shop.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shop.logo_url}
                      alt={shop.name}
                      className="h-10 w-10 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: shop.primary_color ?? '#0EA5E9' }}
                    >
                      {shop.name[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* Infos principales */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{shop.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${plan.badge}`}>
                        {plan.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <p className="text-xs text-gray-400">{shop.city ?? 'Ville inconnue'}</p>
                      <span className="flex items-center gap-1 text-xs">
                        <span className={`h-1.5 w-1.5 rounded-full ${segment.dot}`} />
                        <span className={segment.color}>{segment.label}</span>
                        <span className="text-gray-400">· {shop.product_count} produit{shop.product_count > 1 ? 's' : ''}</span>
                      </span>
                      <p className="text-[10px] text-gray-400 hidden sm:block">
                        {format(new Date(shop.created_at), 'd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/tekki.shop/${shop.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center h-8 w-8 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                      title="Voir la boutique"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    {shop.phone_whatsapp && (
                      <a
                        href={`https://wa.me/${shop.phone_whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center h-8 w-8 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                        title="Contacter sur WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="mt-3 text-xs text-gray-400 text-right">
          {filtered.length} boutique{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
