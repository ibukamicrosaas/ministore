'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─── Annulation abonnement à la fin de période ──────────────────────────────

export async function cancelSubscription(): Promise<{ error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()
  if (!profile?.shop_id) return { error: 'Boutique introuvable.' }

  const { error } = await supabase
    .from('shops')
    .update({ plan_cancel_at_period_end: true } as never)
    .eq('id', profile.shop_id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/billing')
  return {}
}

export async function revertCancellation(): Promise<{ error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()
  if (!profile?.shop_id) return { error: 'Boutique introuvable.' }

  const { error } = await supabase
    .from('shops')
    .update({ plan_cancel_at_period_end: false } as never)
    .eq('id', profile.shop_id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/billing')
  return {}
}

// ─── Suppression définitive du compte ───────────────────────────────────────

export async function deleteMyAccount(): Promise<{ error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  const admin = createAdminClient()

  // Supprimer la boutique (CASCADE sur produits, commandes, etc.)
  // Les subscription_transactions sont préservées via ON DELETE SET NULL
  if (profile?.shop_id) {
    const { error: shopError } = await admin
      .from('shops')
      .delete()
      .eq('id', profile.shop_id)
    if (shopError) return { error: shopError.message }
  }

  // Supprimer l'utilisateur auth (CASCADE sur profiles)
  const { error: authError } = await admin.auth.admin.deleteUser(user.id)
  if (authError) return { error: authError.message }

  redirect('/')
}
