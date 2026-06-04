import { NextRequest, NextResponse } from 'next/server'
import { promises as dns } from 'dns'
import { createServerClient } from '@/lib/supabase/server'

// Force Node.js runtime pour accéder au module dns natif
export const runtime = 'nodejs'

const APP_DOMAIN = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://tekki.shop')
  .replace(/https?:\/\//, '')
  .replace(/\/$/, '')

export async function GET(req: NextRequest) {
  // Authentification requise
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Vérifier que l'utilisateur est Pro
  const { data: profile } = await supabase
    .from('profiles').select('shop_id').eq('id', user.id).single()
  if (!profile?.shop_id) return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })

  const { data: shop } = await supabase
    .from('shops').select('plan, custom_domain').eq('id', profile.shop_id).single()
  if (shop?.plan !== 'pro') {
    return NextResponse.json({ error: 'Plan Pro requis' }, { status: 403 })
  }

  const domain = req.nextUrl.searchParams.get('domain')?.trim().toLowerCase()
  if (!domain) return NextResponse.json({ error: 'Paramètre domain manquant' }, { status: 400 })

  // Vérifier que le domaine correspond bien à celui enregistré (évite les lookups arbitraires)
  if (shop.custom_domain && domain !== shop.custom_domain) {
    return NextResponse.json({ error: 'Domaine non correspondant' }, { status: 400 })
  }

  try {
    const cnames = await dns.resolveCname(domain)
    const verified = cnames.some(c =>
      c.includes('cname.vercel-dns.com') ||
      c === APP_DOMAIN ||
      c === `www.${APP_DOMAIN}`
    )
    return NextResponse.json({ verified, cname: cnames[0] ?? null })
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENODATA' || code === 'ENOTFOUND') {
      return NextResponse.json({ verified: false, cname: null, error: 'Aucun enregistrement CNAME trouvé' })
    }
    console.error('[verify-domain]', err)
    return NextResponse.json({ verified: false, cname: null, error: 'Erreur DNS' })
  }
}
