'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

// Une Server Action importée par un composant client est un endpoint POST
// public, indépendant du garde de /admin/layout.tsx — même mécanisme que
// admin.ts (audit sécurité §109, finding élevé #6).
async function assertAdmin(): Promise<string | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_USER_IDS.includes(user.id)) return 'Accès non autorisé.'
  return null
}

interface KnowledgeEntry {
  id:         string
  title:      string
  content:    string
  is_active:  boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export async function createKnowledgeEntry(data: { title: string; content: string }): Promise<{ error?: string }> {
  const authError = await assertAdmin()
  if (authError) return { error: authError }

  const admin = createAdminClient()
  const { error } = await admin
    .from('ai_knowledge_entries' as never)
    .insert({ title: data.title.trim(), content: data.content.trim() } as never)
  if (error) return { error: error.message }
  revalidatePath('/admin/ai-expert/knowledge')
  return {}
}

export async function updateKnowledgeEntry(
  id: string,
  data: Partial<Pick<KnowledgeEntry, 'title' | 'content' | 'is_active' | 'sort_order'>>,
): Promise<{ error?: string }> {
  const authError = await assertAdmin()
  if (authError) return { error: authError }

  const admin = createAdminClient()
  const { error } = await admin
    .from('ai_knowledge_entries' as never)
    .update({ ...data, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/ai-expert/knowledge')
  return {}
}

export async function deleteKnowledgeEntry(id: string): Promise<{ error?: string }> {
  const authError = await assertAdmin()
  if (authError) return { error: authError }

  const admin = createAdminClient()
  const { error } = await admin
    .from('ai_knowledge_entries' as never)
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/ai-expert/knowledge')
  return {}
}
