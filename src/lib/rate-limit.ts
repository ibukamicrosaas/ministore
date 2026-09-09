import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from './supabase/admin'

interface RateLimitOptions {
  key: string        // préfixe d'identification (ex: 'payment')
  maxRequests: number
  windowMs: number   // fenêtre en millisecondes
}

/**
 * Vérifie le rate limit pour une IP via la table login_attempts.
 * Retourne une Response 429 si la limite est dépassée, null sinon.
 */
export async function checkRateLimit(
  req: NextRequest,
  opts: RateLimitOptions,
): Promise<NextResponse | null> {
  const ip = (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  ).slice(0, 64)

  const identifier = `${opts.key}:${ip}`
  const windowStart = new Date(Date.now() - opts.windowMs).toISOString()

  const supabase = createAdminClient()
  const { count } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('attempt_type', opts.key)
    .gte('attempted_at', windowStart)

  if ((count ?? 0) >= opts.maxRequests) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
      { status: 429 }
    )
  }

  // Enregistrer la requête. Awaité — un query builder Supabase est un
  // thenable paresseux, `void` seul sur l'expression n'appelle jamais
  // .then() et la requête ne part donc jamais (REPRISE.md §94) : c'était le
  // défaut réel, pas juste une écriture "fire-and-forget" qui traînait.
  await supabase.from('login_attempts').insert({
    identifier,
    attempt_type: opts.key,
    success:      true,
  })

  return null
}
