import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { BookingWithRelations } from '@/types'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const token = req.nextUrl.searchParams.get('token')

  const supabase = await createServerClient()

  const query = supabase
    .from('bookings')
    .select('*, services(id, name, price, duration_minutes), staff(id, first_name, last_name), clients(id, first_name, last_name, phone)')
    .eq('id', id)
    .single()

  const { data, error } = await query

  if (error || !data) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }

  const booking = data as unknown as BookingWithRelations & { client_token: string }

  // Vérifier le token client si fourni (accès public)
  if (token && booking.client_token !== token) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 403 })
  }

  return NextResponse.json({ booking })
}
