import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { arePayoutsEnabled } from '@/lib/billing/payouts-guard'

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

// Vérification de l'environnement avant fusion de la garde de retraits : aucune lecture de table,
// aucun appel Bictorys. Hors administrateur : 404, pour ne rien révéler de l'existence de la route.
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(
    { vercelEnv: process.env.VERCEL_ENV ?? null, payoutsEnabled: arePayoutsEnabled() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
