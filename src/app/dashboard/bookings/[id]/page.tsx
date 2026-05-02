import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Calendar, Clock, User, Phone, CreditCard, FileText } from 'lucide-react'
import { BookingStatusBadge } from '@/components/ui/Badge'
import { BookingActions } from './BookingActions'
import { StaffAssignSelector } from './StaffAssignSelector'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { BookingWithRelations, Profile, Service, Staff, Client } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BookingDetailDashboardPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'salon_id' | 'role'> | null
  if (!profile?.salon_id) redirect('/onboarding')

  const { data: bookingData } = await supabase
    .from('bookings')
    .select('*, services(id, name, price, duration_minutes), staff(id, first_name, last_name), clients(id, first_name, last_name, phone, whatsapp, email)')
    .eq('id', id)
    .eq('salon_id', profile.salon_id)
    .single()

  if (!bookingData) notFound()

  const { data: staffList } = await supabase
    .from('staff')
    .select('id, first_name, last_name')
    .eq('salon_id', profile.salon_id)
    .eq('is_active', true)
    .order('first_name')

  const b = bookingData as unknown as BookingWithRelations & {
    internal_notes: string | null
    notes: string | null
    deposit_paid: boolean
    clients: Pick<Client, 'id' | 'first_name' | 'last_name' | 'phone' | 'whatsapp' | 'email'> | null
    services: Pick<Service, 'id' | 'name' | 'price' | 'duration_minutes'>
    staff: Pick<Staff, 'id' | 'first_name' | 'last_name'> | null
  }

  const dateFormatted = format(new Date(b.booking_date + 'T12:00:00'), 'EEEE d MMMM yyyy', { locale: fr })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/bookings" className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900">
            {b.clients?.first_name ?? 'Cliente'} {b.clients?.last_name ?? ''}
          </h1>
          <p className="text-xs text-gray-500">{dateFormatted}</p>
        </div>
        <BookingStatusBadge status={b.status} />
      </div>

      {/* Service */}
      <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
        <div className="flex items-center gap-3 p-4">
          <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="text-sm font-medium text-gray-900 capitalize">{dateFormatted} à {b.booking_time.slice(0, 5)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4">
          <Clock className="h-4 w-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Service</p>
            <p className="text-sm font-medium text-gray-900">{b.services?.name}</p>
            <p className="text-xs text-gray-400">{b.services?.duration_minutes} min · {b.services?.price.toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>
        {profile.role === 'owner' && staffList && staffList.length > 0 && (
          <StaffAssignSelector
            bookingId={b.id}
            currentStaffId={b.staff_id ?? null}
            staffList={staffList as { id: string; first_name: string; last_name: string | null }[]}
          />
        )}
        {profile.role !== 'owner' && b.staff && (
          <div className="flex items-center gap-3 p-4">
            <User className="h-4 w-4 text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Employée</p>
              <p className="text-sm font-medium text-gray-900">{b.staff.first_name} {b.staff.last_name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Client */}
      {b.clients && (
        <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
          <div className="flex items-center gap-3 p-4">
            <User className="h-4 w-4 text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Cliente</p>
              <p className="text-sm font-medium text-gray-900">{b.clients.first_name} {b.clients.last_name ?? ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Phone className="h-4 w-4 text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Contact</p>
              <p className="text-sm font-medium text-gray-900">{b.clients.phone}</p>
              {b.clients.email && <p className="text-xs text-gray-400">{b.clients.email}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Paiement */}
      <div className="rounded-xl border border-gray-100 p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-4 w-4 text-gray-400" />
          <p className="text-xs font-medium text-gray-500">Paiement</p>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total</span>
          <span className="font-semibold text-gray-900">{b.total_price.toLocaleString('fr-FR')} FCFA</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Acompte {b.deposit_paid ? '✓' : '(non payé)'}</span>
          <span className={b.deposit_paid ? 'text-green-600 font-medium' : 'text-gray-400'}>
            {b.deposit_amount.toLocaleString('fr-FR')} FCFA
          </span>
        </div>
        <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
          <span className="text-gray-600">Solde sur place</span>
          <span className="font-semibold text-gray-900">{(b.total_price - b.deposit_amount).toLocaleString('fr-FR')} FCFA</span>
        </div>
      </div>

      {/* Notes */}
      {(b.notes || b.internal_notes) && (
        <div className="rounded-xl border border-gray-100 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-medium text-gray-500">Notes</p>
          </div>
          {b.notes && (
            <p className="text-sm text-gray-700"><span className="text-xs text-gray-400">Cliente : </span>{b.notes}</p>
          )}
          {b.internal_notes && (
            <p className="text-sm text-gray-700"><span className="text-xs text-gray-400">Interne : </span>{b.internal_notes}</p>
          )}
        </div>
      )}

      {/* Actions */}
      {profile.role === 'owner' && (
        <BookingActions
          bookingId={b.id}
          currentStatus={b.status}
        />
      )}
    </div>
  )
}
