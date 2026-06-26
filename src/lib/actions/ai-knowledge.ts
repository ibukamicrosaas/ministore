'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

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
  const admin = createAdminClient()
  const { error } = await admin
    .from('ai_knowledge_entries' as never)
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/ai-expert/knowledge')
  return {}
}
