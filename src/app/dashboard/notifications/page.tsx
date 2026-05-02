import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader } from '@/components/ui/Card'
import { CheckCircle2, XCircle, Clock, MessageCircle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Profile, NotificationLog } from '@/types'

export const metadata = { title: 'Notifications — Sheka' }

const TYPE_LABELS: Record<string, string> = {
  booking_confirmation: 'Confirmation',
  booking_reminder:    'Rappel J-1',
  cancellation:        'Annulation',
  new_booking_alert:   'Nouvelle résa',
}

const STATUS_STYLES: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  sent:    { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  failed:  { icon: XCircle,      color: 'text-red-500',   bg: 'bg-red-50'   },
  pending: { icon: Clock,        color: 'text-orange-500', bg: 'bg-orange-50' },
}

interface Props {
  searchParams: Promise<{ type?: string }>
}

export default async function NotificationsPage({ searchParams }: Props) {
  const { type } = await searchParams
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'salon_id' | 'role'> | null
  if (!profile?.salon_id || profile.role !== 'owner') redirect('/dashboard')

  let query = supabase
    .from('notification_logs')
    .select('*')
    .eq('salon_id', profile.salon_id)
    .order('sent_at', { ascending: false })
    .limit(100)

  if (type) query = query.eq('notification_type', type)

  const { data: logsData } = await query
  const logs = (logsData ?? []) as NotificationLog[]

  const sentCount = logs.filter(l => l.status === 'sent').length
  const failedCount = logs.filter(l => l.status === 'failed').length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Logs de notifications</h1>
        <p className="text-sm text-gray-500 mt-0.5">Historique des messages WhatsApp envoyés</p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{logs.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-center">
          <p className="text-lg font-bold text-green-700">{sentCount}</p>
          <p className="text-xs text-green-600">Envoyés</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center">
          <p className="text-lg font-bold text-red-600">{failedCount}</p>
          <p className="text-xs text-red-500">Échoués</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[undefined, 'booking_confirmation', 'booking_reminder', 'cancellation', 'new_booking_alert'].map((t) => (
          <a
            key={t ?? 'all'}
            href={t ? `?type=${t}` : '?'}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              type === t || (!type && !t)
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t ? (TYPE_LABELS[t] ?? t) : 'Tous'}
          </a>
        ))}
      </div>

      <Card padding="none">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <MessageCircle className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Aucune notification envoyée pour l'instant.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => {
              const style = STATUS_STYLES[log.status] ?? STATUS_STYLES.pending
              const Icon = style.icon
              return (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5 ${style.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${style.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-800">
                        {TYPE_LABELS[log.notification_type] ?? log.notification_type}
                      </span>
                      <span className="text-xs text-gray-400">{log.recipient_phone}</span>
                    </div>
                    {log.error_message && (
                      <p className="text-xs text-red-500 mt-0.5 truncate">{log.error_message}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(log.sent_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
