import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Bot, MessageSquare, BookOpen, TrendingUp, AlertTriangle, Clock } from 'lucide-react'

const PLAN_LABELS: Record<string, string> = {
  trial: 'Essai', decouverte: 'Découverte', business: 'Business', pro: 'Pro',
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'à l\'instant'
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  return `il y a ${d}j`
}

function getFirstUserMessage(messages: Array<{ role: string; content: string }>): string {
  const first = messages.find(m => m.role === 'user')
  if (!first) return '—'
  return first.content.length > 90 ? first.content.slice(0, 90) + '…' : first.content
}

export const metadata = { title: 'Assistant IA — Admin' }

export default async function AdminAIExpertPage() {
  const admin = createAdminClient()

  const today   = new Date().toISOString().slice(0, 10)
  const day7ago = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // ── Stats depuis ai_chat_usage (table existante) ──────────────────────────
  const [todayRows, weekRows, convsResult] = await Promise.all([
    (admin.from('ai_chat_usage' as never)
      .select('shop_id, message_count')
      .eq('date', today)) as unknown as Promise<{ data: Array<{ shop_id: string; message_count: number }> | null }>,
    (admin.from('ai_chat_usage' as never)
      .select('shop_id, message_count, date')
      .gte('date', day7ago)) as unknown as Promise<{ data: Array<{ shop_id: string; message_count: number; date: string }> | null }>,
    // ── Tentative sur ai_conversations (peut ne pas exister encore) ──────────
    (admin.from('ai_conversations' as never)
      .select('id, shop_id, messages, message_count, last_message_at, created_at')
      .order('last_message_at', { ascending: false })
      .limit(50)) as unknown as Promise<{
        data: Array<{
          id: string; shop_id: string
          messages: Array<{ role: string; content: string }>
          message_count: number; last_message_at: string; created_at: string
        }> | null
        error: { message: string } | null
      }>,
  ])

  const todayData    = todayRows.data ?? []
  const weekData     = weekRows.data ?? []
  const convs        = convsResult.data ?? []
  const convTableOk  = !convsResult.error  // false si migration pas encore appliquée

  const todayMessages   = todayData.reduce((s, r) => s + r.message_count, 0)
  const weekMessages    = weekData.reduce((s, r) => s + r.message_count, 0)
  const activeToday     = new Set(todayData.map(r => r.shop_id)).size

  // Activité par boutique aujourd'hui — join avec shops
  const allShopIds = [...new Set([
    ...todayData.map(r => r.shop_id),
    ...convs.map(c => c.shop_id),
  ])]
  const { data: shopsData } = allShopIds.length > 0
    ? await admin.from('shops').select('id, name, plan').in('id', allShopIds)
    : { data: [] }
  const shopMap = new Map((shopsData ?? []).map(s => [s.id, s]))

  // Trier par messages décroissants pour l'affichage
  const sortedToday = [...todayData].sort((a, b) => b.message_count - a.message_count)

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Assistant IA</h1>
          <p className="text-sm text-gray-500 mt-0.5">Conversations, analytics et base de connaissance</p>
        </div>
        <Link
          href="/admin/ai-expert/knowledge"
          className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
        >
          <BookOpen className="h-4 w-4" />
          Base de connaissance
        </Link>
      </div>

      {/* Bandeau migration manquante */}
      {!convTableOk && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Migration à appliquer en production</p>
            <p className="text-xs text-amber-700 mt-0.5">
              La table <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">ai_conversations</code> n'existe
              pas encore. Le logging des conversations est inactif. Exécutez&nbsp;
              <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">supabase db push</code> pour appliquer
              la migration 052. Les conversations enregistrées après cela apparaîtront ici.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Messages aujourd'hui</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{todayMessages}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Bot className="h-4 w-4" />
            <span className="text-xs font-medium">Boutiques actives (auj.)</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{activeToday}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Messages (7 derniers jours)</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{weekMessages}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs font-medium">Conversations enregistrées</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{convs.length}</p>
          {!convTableOk && <p className="text-[10px] text-amber-500 mt-0.5">Migration requise</p>}
        </div>
      </div>

      {/* Activité par boutique aujourd'hui */}
      {sortedToday.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-bold text-gray-900">Activité aujourd'hui — par boutique</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {sortedToday.map(row => {
              const shop = shopMap.get(row.shop_id)
              return (
                <div key={row.shop_id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 text-sm font-bold">
                    {(shop?.name ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {shop?.name ?? <span className="text-gray-400 font-normal text-xs">{row.shop_id.slice(0, 8)}</span>}
                    </p>
                    <p className="text-xs text-gray-400">
                      {shop ? PLAN_LABELS[shop.plan] ?? shop.plan : '—'}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 rounded-full bg-sky-50 border border-sky-100 px-3 py-1">
                    <MessageSquare className="h-3 w-3 text-sky-500" />
                    <span className="text-xs font-semibold text-sky-700">{row.message_count} msg</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Conversations enregistrées (disponible après migration) */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Conversations enregistrées</h2>
          {!convTableOk && (
            <span className="text-xs text-amber-600 font-medium">En attente de la migration</span>
          )}
        </div>
        {convs.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bot className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {convTableOk
                ? 'Aucune conversation enregistrée pour l\'instant.'
                : 'Le logging des conversations démarrera après l\'application de la migration 052.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {convs.map(conv => {
              const shop    = shopMap.get(conv.shop_id)
              const preview = getFirstUserMessage(conv.messages)
              return (
                <Link
                  key={conv.id}
                  href={`/admin/ai-expert/conversations/${conv.id}`}
                  className="flex items-start gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {shop?.name ?? conv.shop_id.slice(0, 8)}
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          {shop ? PLAN_LABELS[shop.plan] ?? shop.plan : '—'}
                        </span>
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {timeAgo(conv.last_message_at)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{preview}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {conv.message_count} msg
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
