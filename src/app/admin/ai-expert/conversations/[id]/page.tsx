import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bot, User } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

export default async function ConversationDetailPage({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: conv } = await admin
    .from('ai_conversations' as never)
    .select('id, shop_id, messages, message_count, last_message_at, created_at')
    .eq('id', id)
    .single() as { data: {
      id: string
      shop_id: string
      messages: Array<{ role: string; content: string; at?: string }>
      message_count: number
      last_message_at: string
      created_at: string
    } | null }

  if (!conv) notFound()

  const { data: shop } = await admin
    .from('shops')
    .select('name, plan, country')
    .eq('id', conv.shop_id)
    .single()

  const startDate = new Date(conv.created_at).toLocaleString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/ai-expert"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </div>

      {/* Infos boutique */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-bold text-gray-900">{shop?.name ?? '—'}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Plan {shop?.plan ?? '—'} · {shop?.country ?? '—'} · {conv.message_count} messages · {startDate}
        </p>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {conv.messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs ${
              msg.role === 'user' ? 'bg-gray-600' : 'bg-sky-500'
            }`}>
              {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === 'user'
                ? 'bg-gray-100 text-gray-900'
                : 'bg-sky-50 border border-sky-100 text-gray-800'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              {msg.at && (
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(msg.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
