import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')?.trim().toLowerCase()

  if (!slug || slug.length < 2) {
    return NextResponse.json({ available: false, error: 'Trop court' })
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ available: false, error: 'Caractères invalides' })
  }

  // Authentifier l'appelant
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Récupérer le shop_id de l'utilisateur pour exclure son propre slug
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  const { count } = await admin
    .from('shops')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug)
    .neq('id', profile?.shop_id ?? '00000000-0000-0000-0000-000000000000')

  return NextResponse.json({ available: (count ?? 0) === 0 })
}
