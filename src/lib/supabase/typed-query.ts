// Helper pour forcer le type des résultats de queries Supabase
// Workaround pour l'inférence TypeScript avec @supabase/ssr + Turbopack
import type { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js'

export function typedData<T>(result: PostgrestSingleResponse<unknown>): T | null {
  if (result.error) return null
  return result.data as T
}

export function typedList<T>(result: PostgrestResponse<unknown>): T[] {
  if (result.error || !result.data) return []
  return result.data as T[]
}
