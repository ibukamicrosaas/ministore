import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { logShopEvent } from '@/lib/billing/events'

const ALLOWED_EVENTS = new Set([
  'quota_counter_shown',
  'held_orders_banner_shown',
  'trial_end_screen_shown',
  'acquisition_plan_opened',
  'pricing_viewed_from_trial_end',
])

/**
 * Journalisation d'événements déclenchés côté client (clics/affichages du
 * tableau de bord free_orders — SPEC-dashboard-fins-essai §9). Liste fermée
 * d'événements : ce n'est pas un point d'entrée générique.
 */
export async function POST(req: NextRequest) {
  const { event_name, metadata } = await req.json() as { event_name?: string; metadata?: Record<string, unknown> }

  if (!event_name || !ALLOWED_EVENTS.has(event_name)) {
    return NextResponse.json({ error: 'Événement invalide' }, { status: 400 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id) return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })

  logShopEvent(profile.shop_id, event_name, metadata ?? {})

  return NextResponse.json({ ok: true })
}
