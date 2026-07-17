'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteReview(reviewId: string) {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id || profile.role !== 'owner') return { error: 'Accès non autorisé.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('product_reviews')
    .delete()
    .eq('id', reviewId)
    .eq('shop_id', profile.shop_id)

  if (error) {
    console.error('[deleteReview]', error.message)
    return { error: 'Impossible de supprimer cet avis.' }
  }

  revalidatePath('/dashboard/reviews')
  return { success: true }
}
