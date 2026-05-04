import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

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
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Rafraîchir la session (obligatoire pour SSR avec Supabase SSR)
  const { data: { user } } = await supabase.auth.getUser()

  // Routes cron : vérifier le secret dans l'Authorization header
  if (pathname.startsWith('/api/cron')) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return response
  }

  // Routes API admin : authentification + rôle owner requis
  if (pathname.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profile = profileData as { role: string } | null
    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return response
  }

  // Routes dashboard : authentification requise
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
    '/dashboard/:path*',
    '/api/admin/:path*',
    '/api/cron/:path*',
    '/login',
    '/onboarding',
  ],
}
