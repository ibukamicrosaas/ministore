import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Bot, MessageSquare, BookOpen, TrendingUp, Clock } from 'lucide-react'

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
  return first.content.length > 80 ? first.content.slice(0, 80) + '…' : first.content
}

export const metadata = { title: 'Assistant IA — Admin' }

export default async function AdminAIExpertPage() {
  const admin = createAdminClient()

  // Stats globales
  const today = new Date().toISOString().slice(0, 10)
  const [convsResult, todayUsageResult, shopsResult] = await Promise.all([
    admin.from('ai_conversations' as never).select('id', { count: 'exact', head: true }),
    admin.from('ai_chat_usage' as never).select('message_count').eq('date', today),
    admin.from('ai_chat_usage' as never).select('shop_id').eq('date', today),
  ])

  const totalConversations = (convsResult as { count: number | null }).count ?? 0
  const todayMessages = ((todayUsageResult as { data: Array<{ message_count: number }> | null }).data ?? [])
    .reduce((s, r) => s + r.message_count, 0)
  const activeShopsToday = new Set(
    ((shopsResult as { data: Array<{ shop_id: string }> | null }).data ?? []).map(r => r.shop_id)
  ).size

  // Conversations récentes
  const { data: rawConvs } = await admin
    .from('ai_conversations' as never)
    .select('id, shop_id, messages, message_count, last_message_at, created_at')
    .order('last_message_at', { ascending: false })
    .limit(50) as { data: Array<{
      id: string
      shop_id: string
      messages: Array<{ role: string; content: string }>
      message_count: number
      last_message_at: string
      created_at: string
    }> | null }

  const convs = rawConvs ?? []

  // Récupérer les noms de boutiques
  const shopIds = [...new Set(convs.map(c => c.shop_id))]
  const { data: shops } = shopIds.length > 0
    ? await admin.from('shops').select('id, name, plan').in('id', shopIds)
    : { data: [] }
  const shopMap = new Map((shops ?? []).map(s => [s.id, s]))

  return (
    <div className="space-y-6">
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs font-medium">Conversations totales</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{totalConversations.toLocaleString('fr-FR')}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Messages aujourd'hui</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{todayMessages.toLocaleString('fr-FR')}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Bot className="h-4 w-4" />
            <span className="text-xs font-medium">Boutiques actives (auj.)</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{activeShopsToday}</p>
        </div>
      </div>

      {/* Conversations récentes */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-900">Conversations récentes</h2>
        </div>
        {convs.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Bot className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucune conversation enregistrée pour l'instant.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {convs.map(conv => {
              const shop = shopMap.get(conv.shop_id)
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
                        <span className="ml-2 text-xs font-normal text-gray-400">{shop?.plan ?? '—'}</span>
                      </p>
                      <div className="flex items-center gap-2 shrink-0 text-xs text-gray-400">
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
