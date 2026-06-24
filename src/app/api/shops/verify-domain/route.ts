import { NextRequest, NextResponse } from 'next/server'
import { promises as dns } from 'dns'
import { createServerClient } from '@/lib/supabase/server'

// Force Node.js runtime pour accéder au module dns natif
export const runtime = 'nodejs'

const VERCEL_APEX_IP = '76.76.21.21'

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

  const parts = domain.split('.')
  const isApex = parts.length === 2

  if (isApex) {
    // Domaine racine → vérifier l'enregistrement A
    try {
      const addresses = await dns.resolve4(domain)
      const verified = addresses.includes(VERCEL_APEX_IP)
      return NextResponse.json({ verified, record: addresses[0] ?? null })
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code
      if (code === 'ENODATA' || code === 'ENOTFOUND') {
        return NextResponse.json({ verified: false, record: null, error: 'Aucun enregistrement A trouvé' })
      }
      console.error('[verify-domain A]', err)
      return NextResponse.json({ verified: false, record: null, error: 'Erreur DNS' })
    }
  }

  // Sous-domaine (www.xxx.com ou sub.xxx.com) → vérifier le CNAME
  try {
    const cnames = await dns.resolveCname(domain)
    const verified = cnames.some(c => c.includes('cname.vercel-dns.com'))
    return NextResponse.json({ verified, record: cnames[0] ?? null })
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENODATA' || code === 'ENOTFOUND') {
      return NextResponse.json({ verified: false, record: null, error: 'Aucun enregistrement CNAME trouvé' })
    }
    console.error('[verify-domain CNAME]', err)
    return NextResponse.json({ verified: false, record: null, error: 'Erreur DNS' })
  }
}
