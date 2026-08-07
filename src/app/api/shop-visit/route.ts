import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Compteur minimal d'ouvertures du lien boutique (voir 079_shop_visits.sql).
 * Appelé côté client (VisitBeacon) plutôt que depuis le composant de page
 * /[shop-slug], qui est en ISR (revalidate=60) — un insert placé dans son
 * rendu ne s'exécuterait qu'une fois par fenêtre de revalidation, pas à
 * chaque visite réelle.
 */
export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, { key: 'shop-visit', maxRequests: 60, windowMs: 60_000 })
  if (limited) return limited

  const { shop_id } = await req.json() as { shop_id?: string }
  if (!shop_id || !UUID_RE.test(shop_id)) {
    return NextResponse.json({ error: 'shop_id invalide' }, { status: 400 })
  }

  // Ne pas compter le marchand qui consulte sa propre boutique connecté.
  const userSupabase = await createServerClient()
  const { data: { user } } = await userSupabase.auth.getUser()
  if (user) {
    const { data: profile } = await userSupabase
      .from('profiles')
      .select('shop_id')
      .eq('id', user.id)
      .single()
    if (profile?.shop_id === shop_id) {
      return NextResponse.json({ ok: true, counted: false })
    }
  }

  const admin = createAdminClient()
  const { error } = await admin.rpc('increment_shop_visit', { p_shop_id: shop_id })
  if (error) {
    console.error('[shop-visit]', error.message)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, counted: true })
}
