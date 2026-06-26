import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { KnowledgeManager } from './KnowledgeManager'

export const metadata = { title: 'Base de connaissance IA — Admin' }

export default async function KnowledgePage() {
  const admin = createAdminClient()
  const { data: entries } = await admin
    .from('ai_knowledge_entries' as never)
    .select('id, title, content, is_active, sort_order, created_at, updated_at')
    .order('sort_order')
    .order('created_at') as { data: Array<{
      id: string
      title: string
      content: string
      is_active: boolean
      sort_order: number
      created_at: string
      updated_at: string
    }> | null }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/ai-expert"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Base de connaissance</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ces informations sont injectées dans le prompt de l'assistant IA et lui permettent de répondre
          à des questions spécifiques à TEKKIShop que vous souhaitez enrichir ou corriger.
        </p>
      </div>

      <KnowledgeManager initialEntries={entries ?? []} />
    </div>
  )
}
