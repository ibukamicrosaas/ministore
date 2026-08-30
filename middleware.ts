import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { APP_URL } from '@/constants'

// ── Rate limiting ─────────────────────────────────────────────────────────────
// In-memory, per-instance (Vercel Edge). Sufficient for early-stage traffic.
// For distributed rate limiting at scale, replace with Upstash Redis.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  if (entry.count >= limit) return true
  entry.count++
  return false
}

// Nettoyage périodique pour éviter les fuites mémoire
let lastCleanup = Date.now()
function maybeCleanup() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key)
  }
}

// ── Custom domain routing ─────────────────────────────────────────────────────
// Dérivé d'APP_URL (source unique, src/constants/index.ts) plutôt que recalculé
// ici depuis process.env avec un défaut différent (tekki.shop vs www.tekki.shop
// pour APP_URL) — les deux calculs indépendants pouvaient diverger silencieusement
// selon lequel des deux défauts finissait utilisé. Voir REPRISE.md §42 : nettoyage
// de dette, pas un correctif d'incident confirmé — la cause exacte de l'incident
// (pas de confirmation après paiement Wave) n'a jamais été établie avec certitude.
const APP_HOSTNAME      = APP_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')
// Forme sans www, pour reconnaître les deux formes réelles du domaine principal
// sans supposer laquelle des deux APP_URL utilise.
const APP_HOSTNAME_BARE = APP_HOSTNAME.replace(/^www\./, '')

// Même allowlist que src/app/admin/layout.tsx et src/app/dashboard/layout.tsx —
// profiles.role vaut 'owner' pour 100 % des marchands en prod (vérifié), donc
// role==='owner' ne protège rien de plus qu'« être connecté ». L'allowlist est
// la vraie garde.
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

async function handleCustomDomain(request: NextRequest): Promise<NextResponse | null> {
  const hostname = request.headers.get('host') ?? ''
  const pathname = request.nextUrl.pathname

  // Ignorer le domaine principal, localhost et Vercel previews
  if (
    hostname === APP_HOSTNAME_BARE ||
    hostname === `www.${APP_HOSTNAME_BARE}` ||
    hostname.includes('localhost') ||
    hostname.includes('.vercel.app')
  ) return null

  // Ne pas toucher les assets statiques ni les API internes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/manifest') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|gif|css|js|woff2?|txt|xml)$/)
  ) return null

  // Lookup du slug via l'API REST Supabase (pas de cookies requis)
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  let slug: string | null = null
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/shops?custom_domain=eq.${encodeURIComponent(hostname)}&is_active=eq.true&select=slug&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    if (res.ok) {
      const shops = await res.json() as { slug: string }[]
      slug = shops[0]?.slug ?? null
    }
  } catch {
    // En cas d'erreur DB, on laisse passer (dégradé gracieux)
    return null
  }

  if (!slug) {
    // Domaine inconnu → redirection vers le site principal
    return NextResponse.redirect(new URL('/', APP_URL))
  }

  // Si le chemin commence déjà par /{slug} (liens internes de la boutique), ne pas re-préfixer
  // — comparaison sur la frontière du segment, pas un simple startsWith : sinon un
  // slug 'viens' matcherait le chemin d'une autre boutique '/viens-autre-boutique/...'
  if (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)) {
    return NextResponse.next({ request })
  }

  // Réécriture interne : custom-domain.com/{path} → /{slug}/{path}
  const url = request.nextUrl.clone()
  url.pathname = `/${slug}${pathname === '/' ? '' : pathname}`
  return NextResponse.rewrite(url)
}

// ── Middleware principal ──────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  maybeCleanup()

  // ── Routing domaines personnalisés (Plan Pro) ─────────────────────────────
  const customDomainResponse = await handleCustomDomain(request)
  if (customDomainResponse) return customDomainResponse

  // ── Rate limiting sur les endpoints publics ───────────────────────────────
  if (pathname.startsWith('/api/orders') || pathname.startsWith('/api/payments')) {
    const ip = getClientIp(request)
    const key = `${ip}:${pathname.split('/').slice(0, 4).join('/')}`

    // 20 requêtes / minute par IP sur /api/orders
    // 10 requêtes / minute par IP sur /api/payments
    const limit     = pathname.startsWith('/api/payments') ? 10 : 20
    const windowMs  = 60_000

    if (isRateLimited(key, limit, windowMs)) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessaie dans une minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
    return response
  }

  // ── Routes CRON : secret obligatoire, fail closed ─────────────────────────
  if (pathname.startsWith('/api/cron')) {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('Authorization')

    if (!cronSecret) {
      console.error('[cron] CRON_SECRET non configuré — accès refusé')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return response
  }

  // ── Session Supabase : uniquement pour les routes qui en ont besoin ───────
  // Avant : supabase.auth.getUser() s'exécutait sur CHAQUE requête (page
  // d'accueil, pages boutiques publiques...), pas seulement les routes
  // authentifiées — un aller-retour Supabase Auth inutile sur chaque vue
  // publique du site.
  //
  // /preview, /country-admin et /essai-expire sont inclus alors qu'ils ne lisent
  // jamais `user` dans CE fichier : ce sont des Server Components qui vérifient
  // leur propre auth via createServerClient() (src/lib/supabase/server.ts), dont
  // le rafraîchissement de cookie échoue TOUJOURS silencieusement dans ce contexte
  // (Next.js interdit l'écriture de cookies pendant le rendu d'un Server
  // Component — le setAll de ce wrapper avale l'erreur, voir son commentaire).
  // Seul CE middleware peut réellement rafraîchir leur cookie de session.
  const needsSession =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/payouts') ||
    pathname.startsWith('/preview') ||
    pathname.startsWith('/country-admin') ||
    pathname === '/essai-expire' ||
    pathname === '/login' ||
    pathname === '/onboarding'

  if (!needsSession) {
    return response
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, { ...options, maxAge: 30 * 24 * 60 * 60 })
          )
        },
      },
    }
  )

  // Rafraîchir la session (obligatoire pour SSR avec Supabase SSR)
  const { data: { user } } = await supabase.auth.getUser()

  // ── Routes API admin : authentification + allowlist requises ─────────────
  // role==='owner' ne protège rien (100 % des profils en prod ont ce rôle,
  // vérifié) — l'allowlist est la vraie garde, même mécanisme que
  // src/app/admin/layout.tsx et les 5 routes qui la vérifiaient déjà elles-mêmes.
  if (pathname.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!ADMIN_USER_IDS.includes(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return response
  }

  // ── Routes API payouts : authentification requise ─────────────────────────
  // CVE-14 (pentest de mai) : jamais protégé par la racine — la seule route
  // réelle (payouts/request) a sa propre vérif complète, mais rien n'empêchait
  // une future route copiée sans sa propre garde d'être ouverte.
  if (pathname.startsWith('/api/payouts')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return response
  }

  // ── Routes dashboard : authentification requise ───────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: profileData2 } = await supabase
      .from('profiles')
      .select('shop_id, role, onboarding_completed')
      .eq('id', user.id)
      .single()

    const profile2 = profileData2 as { shop_id: string | null; role: string; onboarding_completed: boolean } | null
    if (profile2 && profile2.role === 'owner' && (!profile2.shop_id || !profile2.onboarding_completed)) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    return response
  }

  // Rediriger les utilisateurs connectés depuis /login vers /dashboard
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Rediriger depuis /onboarding si déjà complété
  if (pathname === '/onboarding' && user) {
    const { data: profileData3 } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()
    if (profileData3?.onboarding_completed) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Exclure les assets statiques Next.js et les fichiers publics courants.
     * Le middleware tourne sur toutes les autres routes pour :
     * - intercepter les requêtes de domaines personnalisés (Plan Pro)
     * - protéger /dashboard, /api/admin, /api/cron, /api/orders, /api/payments
     * - gérer les redirections /login et /onboarding
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|og-ministore\\.png|sw\\.js).*)',
  ],
}
