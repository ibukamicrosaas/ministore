import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types'

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: profileData } = await supabase
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'salon_id' | 'role'> | null
  if (!profile?.salon_id || profile.role !== 'owner') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!from || !to) return new NextResponse('Missing from/to params', { status: 400 })

  const { data, error } = await supabase
    .from('bookings')
    .select('booking_date, booking_time, status, total_price, deposit_amount, clients(first_name, last_name, phone), services(name), staff(first_name, last_name)')
    .eq('salon_id', profile.salon_id)
    .gte('booking_date', from)
    .lte('booking_date', to)
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true })

  if (error) return new NextResponse('Query error', { status: 500 })

  type Row = {
    booking_date: string
    booking_time: string
    status: string
    total_price: number
    deposit_amount: number
    clients: { first_name: string; last_name: string | null; phone: string } | null
    services: { name: string } | null
    staff: { first_name: string; last_name: string } | null
  }

  const rows = (data ?? []) as unknown as Row[]

  const STATUS_FR: Record<string, string> = {
    pending: 'En attente', confirmed: 'Confirmée', present: 'Présente',
    completed: 'Terminée', cancelled: 'Annulée', no_show: 'Absent',
  }

  const header = 'Date,Heure,Cliente,Téléphone,Service,Employée,Statut,Prix (FCFA),Acompte (FCFA)'
  const lines = rows.map(r => {
    const name = [r.clients?.first_name, r.clients?.last_name].filter(Boolean).join(' ')
    const staff = r.staff ? `${r.staff.first_name} ${r.staff.last_name}` : ''
    return [
      r.booking_date,
      r.booking_time.slice(0, 5),
      `"${name}"`,
      r.clients?.phone ?? '',
      `"${r.services?.name ?? ''}"`,
      `"${staff}"`,
      STATUS_FR[r.status] ?? r.status,
      r.total_price,
      r.deposit_amount,
    ].join(',')
  })

  const csv = [header, ...lines].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="reservations-${from.slice(0, 7)}.csv"`,
    },
  })
}
