import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const APP_DOMAIN = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://tekki.shop')
  .replace(/https?:\/\//, '')
  .replace(/\/$/, '')

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  const { hostname, pathname } = request.nextUrl

  // Routing custom domain : custom_domain.com → tekkishop.com/[shop-slug]
  // Middleware.ts s'execute pour TOUS les requêtes sur Vercel, donc on check le hostname
  if (hostname && hostname !== APP_DOMAIN && !hostname.startsWith('localhost') && !hostname.startsWith('127.0.0.1')) {
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

    try {
      const { data: shop } = await supabase
        .from('shops')
        .select('slug, plan, is_active')
        .eq('custom_domain', hostname)
        .eq('is_active', true)
        .single()

      if (shop?.slug && shop.plan === 'pro') {
        const newUrl = new URL(`https://${APP_DOMAIN}/${shop.slug}${pathname === '/' ? '' : pathname}`, request.url)
        newUrl.search = request.nextUrl.search
        return NextResponse.redirect(newUrl, { status: 307 })
      }
    } catch {
      // Shop not found or not Pro, continue with default routing
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Rafraîchit la session si elle existe (important pour SSR)
  const { data: { user } } = await supabase.auth.getUser()

  // Routes dashboard et admin : authentification obligatoire
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Routes API admin : authentification obligatoire
  if (pathname.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/payouts/:path*',
  ],
}
