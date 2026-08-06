import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/auth/verify-cron'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsApp } from '@/lib/notifications/whatsapp'
import { APP_URL } from '@/constants'

// Séquence d'activation pour les nouveaux inscrits trial
// Objectif : convertir les utilisateurs qui se sont inscrits mais n'ont pas configuré leur boutique
// J+1, J+3, J+7 depuis la création du compte

const WINDOWS = [
  { day: 1, type: 'onboarding_j1' },
  { day: 3, type: 'onboarding_j3' },
  { day: 7, type: 'onboarding_j7' },
] as const

function buildOnboardingMessage(params: {
  shopName: string
  day: 1 | 3 | 7
  hasProducts: boolean
  dashboardUrl: string
}): string {
  const { shopName, day, hasProducts, dashboardUrl } = params

  if (day === 1) {
    return `Bienvenue sur TekkiShop, ${shopName}! Votre boutique est prete. Ajoutez vos premiers produits et partagez votre lien pour recevoir vos premieres commandes: ${dashboardUrl}`
  }
  if (day === 3) {
    if (!hasProducts) {
      return `TekkiShop - ${shopName}: votre boutique attend ses premiers produits! Ajoutez-les en 2 minutes et commencez a vendre: ${dashboardUrl}`
    }
    return `TekkiShop - ${shopName}: vos produits sont en ligne! Partagez votre boutique a vos clients pour recevoir vos premieres commandes: ${dashboardUrl}`
  }
  // day === 7
  if (!hasProducts) {
    return `TekkiShop - ${shopName}: vous n'avez toujours pas ajoute de produits. Votre boutique vous attend! Configurez-la maintenant: ${dashboardUrl}`
  }
  return `TekkiShop - ${shopName}: votre boutique est configuree! Activez un plan payant pour etre visible par vos clients et commencer a vendre: ${APP_URL}/dashboard/upgrade`
}

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = Date.now()
  let totalSent = 0

  for (const window of WINDOWS) {
    // Fenêtre de 24h centrée sur J+day (absorbe les décalages cron)
    const windowStart = new Date(now - (window.day + 0.5) * 86400000).toISOString()
    const windowEnd   = new Date(now - (window.day - 0.5) * 86400000).toISOString()

    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, phone_whatsapp, slug, onboarding_completed')
      .eq('plan', 'trial')
      .eq('is_active', true)
      .eq('trial_model', 'legacy') // free_orders : /start a son propre funnel de relance, pas ces textes-ci
      .gte('created_at', windowStart)
      .lte('created_at', windowEnd)

    if (error) {
      console.error(`[cron/trial-onboarding] ${window.type}:`, error.message)
      continue
    }

    for (const shop of shops ?? []) {
      if (!shop.phone_whatsapp) continue

      // Déduplication : pas deux fois le même message
      const dedupKey = `${window.type}:${shop.id}`
      const oneDayAgo = new Date(now - 86400000).toISOString()
      const { count } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('identifier', dedupKey)
        .eq('attempt_type', 'onboarding_reminder')
        .gte('attempted_at', oneDayAgo)

      if ((count ?? 0) > 0) continue

      // Vérifier si la boutique a des produits
      const { count: productCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('shop_id', shop.id)

      const hasProducts = (productCount ?? 0) > 0
      const dashboardUrl = `${APP_URL}/dashboard/products`

      const msg = buildOnboardingMessage({
        shopName: shop.name,
        day: window.day,
        hasProducts,
        dashboardUrl,
      })

      const { success } = await sendWhatsApp(shop.phone_whatsapp, msg)

      await supabase.from('login_attempts').insert({
        identifier:   dedupKey,
        attempt_type: 'onboarding_reminder',
        success,
      })

      if (success) totalSent++
    }
  }

  return NextResponse.json({ sent: totalSent })
}
