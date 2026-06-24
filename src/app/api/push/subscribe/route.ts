import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()
  if (!profile?.shop_id) return NextResponse.json({ error: 'Boutique introuvable.' }, { status: 404 })

  const body = await req.json()
  const { endpoint, keys } = body as { endpoint: string; keys: { p256dh: string; auth: string } }

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Données d\'abonnement invalides.' }, { status: 400 })
  }

  const admin = createAdminClient()
  await admin
    .from('push_subscriptions' as never)
    .upsert({
      shop_id:    profile.shop_id,
      endpoint,
      p256dh:     keys.p256dh,
      auth:       keys.auth,
      user_agent: req.headers.get('user-agent')?.slice(0, 200) ?? null,
    } as never, { onConflict: 'shop_id,endpoint' })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()
  if (!profile?.shop_id) return NextResponse.json({ error: 'Boutique introuvable.' }, { status: 404 })

  const { endpoint } = await req.json() as { endpoint: string }
  if (!endpoint) return NextResponse.json({ error: 'Endpoint requis.' }, { status: 400 })

  const admin = createAdminClient()
  await admin
    .from('push_subscriptions' as never)
    .delete()
    .eq('endpoint', endpoint)
    .eq('shop_id', profile.shop_id)

  return NextResponse.json({ ok: true })
}
