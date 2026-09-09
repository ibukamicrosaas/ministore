import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_REASONS = new Set(['sexual_no_consent', 'impersonation', 'scam', 'other'])

// Implémentation locale, pas lib/rate-limit.ts — checkRateLimit() a un défaut
// réel (son insert de suivi est un `void ...insert(...)` jamais awaité ni
// .then()é ; un query builder Supabase est un thenable paresseux, la requête
// HTTP ne part donc jamais du tout — le compteur reste à 0 pour toujours,
// aucune route qui l'utilise n'a jamais réellement limité quoi que ce soit).
// Trouvé en construisant ce correctif-ci. Correction du helper partagé et de
// tous les autres cas du même défaut : chantier séparé, en cours de décision.
async function checkReportRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const ip = (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  ).slice(0, 64)

  const identifier = `report:${ip}`
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const admin = createAdminClient()
  const { count } = await admin
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('attempt_type', 'report')
    .gte('attempted_at', windowStart)

  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: 'Trop de signalements. Réessayez dans quelques minutes.' },
      { status: 429 }
    )
  }

  // Awaité, contrairement au défaut de checkRateLimit() — c'est précisément
  // ce qui distingue ce correctif local du bug partagé.
  await admin.from('login_attempts').insert({
    identifier,
    attempt_type: 'report',
    success:      true,
  })

  return null
}

export async function POST(req: NextRequest) {
  // Signalement anonyme accessible sans authentification — action rare, pas
  // répétée comme une commande, seuil bien plus bas que /api/orders (20/h).
  const limited = await checkReportRateLimit(req)
  if (limited) return limited

  const body = await req.json() as {
    shop_id?:          string
    product_id?:       string | null
    reason?:            string
    detail?:            string | null
    reporter_contact?: string | null
  }

  const { shop_id, product_id, reason, detail, reporter_contact } = body

  if (!shop_id || typeof shop_id !== 'string') {
    return NextResponse.json({ error: 'Boutique invalide.' }, { status: 400 })
  }
  if (!reason || !VALID_REASONS.has(reason)) {
    return NextResponse.json({ error: 'Motif invalide.' }, { status: 400 })
  }
  if (detail && (typeof detail !== 'string' || detail.length > 1000)) {
    return NextResponse.json({ error: 'Détail trop long (max 1000 caractères).' }, { status: 400 })
  }
  if (reporter_contact && (typeof reporter_contact !== 'string' || reporter_contact.length > 100)) {
    return NextResponse.json({ error: 'Contact invalide.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // shop_id inconnu échouerait de toute façon sur la FK — vérifié en amont
  // pour renvoyer une erreur claire plutôt qu'un 500 générique.
  const { data: shop } = await admin.from('shops').select('id').eq('id', shop_id).single()
  if (!shop) {
    return NextResponse.json({ error: 'Boutique introuvable.' }, { status: 404 })
  }

  if (product_id) {
    const { count } = await admin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('id', product_id)
      .eq('shop_id', shop_id)
    if (!count) {
      return NextResponse.json({ error: 'Produit introuvable pour cette boutique.' }, { status: 404 })
    }
  }

  const { error } = await admin
    .from('content_reports' as never)
    .insert({
      shop_id,
      product_id:       product_id || null,
      reason,
      detail:            detail?.trim() || null,
      reporter_contact: reporter_contact?.trim() || null,
    } as never)

  if (error) {
    console.error('[reports] insert error:', error)
    return NextResponse.json({ error: "Impossible d'enregistrer le signalement." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
