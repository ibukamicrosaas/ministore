import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const APP_DOMAIN = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://tekki.shop')
  .replace(/https?:\/\//, '')
  .replace(/\/$/, '')

export async function middleware(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl

  // Routing custom domain : custom_domain.com → tekki.shop/[shop-slug]
  // S'exécute pour toutes les requêtes non-statiques provenant d'un hostname tiers
  if (
    hostname &&
    hostname !== APP_DOMAIN &&
    !hostname.startsWith('localhost') &&
    !hostname.startsWith('127.0.0.1')
  ) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )

    try {
      const { data: shop } = await supabase
        .from('shops')
        .select('slug, plan, is_active')
        .eq('custom_domain', hostname)
        .eq('is_active', true)
        .single()

      if (shop?.slug && shop.plan === 'pro') {
        const newUrl = new URL(
          `https://${APP_DOMAIN}/${shop.slug}${pathname === '/' ? '' : pathname}`,
          request.url
        )
        newUrl.search = request.nextUrl.search
        return NextResponse.rewrite(newUrl)
      }
    } catch {
      // Shop not found or not Pro, continue with default routing
    }
  }

  const THIRTY_DAYS = 30 * 24 * 60 * 60

  // Auth checks — uniquement pour les routes protégées
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/payouts')
  ) {
    const response = NextResponse.next({ request })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/payouts')) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Rafraîchir les cookies de session
    const supabaseWithCookies = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const opts = { ...options, maxAge: THIRTY_DAYS }
              request.cookies.set(name, value)
              response.cookies.set(name, value, opts)
            })
          },
        },
      }
    )
    await supabaseWithCookies.auth.getUser()

    return response
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    // Routes protégées (dashboard, admin, API admin)
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/payouts/:path*',
    // Toutes les routes non-statiques (pour le routing custom domain)
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)).*)',
  ],
}
