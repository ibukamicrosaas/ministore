import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { SUBSCRIPTION_DAYS } from '@/constants'

/**
 * Active ou renouvelle un plan payant pour une boutique.
 * - Met à jour plan, is_active et subscription_ends_at
 * - Revalide tous les chemins concernés
 * Utilisé par le webhook Bictorys, verifySubscriptionPayment et l'admin.
 */
export async function activatePlan(
  shopId: string,
  planKey: string,
): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  const subscriptionEndsAt = new Date(
    Date.now() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  const { error, data } = await supabase
    .from('shops')
    .update({
      plan:                 planKey,
      is_active:            true,
      subscription_ends_at: subscriptionEndsAt,
      updated_at:           new Date().toISOString(),
    })
    .eq('id', shopId)
    .select('slug')
    .single()

  if (error) {
    console.error('[activatePlan]', error.message)
    return { error: 'Erreur lors de l\'activation du plan.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/upgrade')
  revalidatePath('/dashboard/settings')
  if (data?.slug) revalidatePath(`/${data.slug}`)

  return {}
}
