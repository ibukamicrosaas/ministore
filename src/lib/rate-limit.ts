import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createAdminClient } from './supabase/admin'

interface RateLimitOptions {
  key: string        // préfixe d'identification (ex: 'payment')
  maxRequests: number
  windowMs: number   // fenêtre en millisecondes
}

// Cœur partagé par checkRateLimit (route.ts, reçoit un NextRequest) et
// checkRateLimitAction (Server Action, pas de NextRequest disponible — IP
// lue via headers() de next/headers à la place). Même table login_attempts,
// même logique de comptage/enregistrement.
async function checkAndRecord(ip: string, opts: RateLimitOptions): Promise<boolean> {
  const identifier = `${opts.key}:${ip.slice(0, 64)}`
  const windowStart = new Date(Date.now() - opts.windowMs).toISOString()

  const supabase = createAdminClient()
  const { count } = await supabase
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('attempt_type', opts.key)
    .gte('attempted_at', windowStart)

  if ((count ?? 0) >= opts.maxRequests) return true

  // Enregistrer la requête. Awaité — un query builder Supabase est un
  // thenable paresseux, `void` seul sur l'expression n'appelle jamais
  // .then() et la requête ne part donc jamais (REPRISE.md §94) : c'était le
  // défaut réel, pas juste une écriture "fire-and-forget" qui traînait.
  await supabase.from('login_attempts').insert({
    identifier,
    attempt_type: opts.key,
    success:      true,
  })

  return false
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
  )

  const blocked = await checkAndRecord(ip, opts)
  if (blocked) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
      { status: 429 }
    )
  }
  return null
}

/**
 * Équivalent de checkRateLimit pour une Server Action ('use server'), qui ne
 * reçoit pas de NextRequest — IP lue via headers() de next/headers. Retourne
 * un message d'erreur si la limite est dépassée, null sinon.
 */
export async function checkRateLimitAction(
  opts: RateLimitOptions,
): Promise<{ error: string } | null> {
  const h = await headers()
  const ip = (
    h.get('x-real-ip') ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )

  const blocked = await checkAndRecord(ip, opts)
  if (blocked) {
    return { error: 'Trop de requêtes. Réessayez dans quelques minutes.' }
  }
  return null
}
