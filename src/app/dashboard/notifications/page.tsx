import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { CheckCircle2, XCircle, Clock, MessageCircle, Bell, Info, Gift, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Profile, NotificationLog } from '@/types'
import type { ShopNotification } from '@/lib/actions/notifications'

export const metadata = { title: 'Notifications — TekkiShop' }

const TYPE_LABELS: Record<string, string> = {
  order_confirmation: 'Confirmation',
  order_reminder:    'Rappel J-1',
  cancellation:      'Annulation',
  new_order_shop:    'Nouvelle résa',
}

const STATUS_STYLES: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  sent:    { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  failed:  { icon: XCircle,      color: 'text-red-500',   bg: 'bg-red-50'   },
  pending: { icon: Clock,        color: 'text-orange-500', bg: 'bg-orange-50' },
}

const NOTIF_TYPE_STYLES: Record<string, { icon: React.ElementType; className: string }> = {
  info:    { icon: Info,          className: 'bg-sky-50 border-sky-200 text-sky-800' },
  promo:   { icon: Gift,          className: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  success: { icon: CheckCircle2,  className: 'bg-green-50 border-green-200 text-green-800' },
  warning: { icon: AlertTriangle, className: 'bg-amber-50 border-amber-200 text-amber-800' },
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
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'shop_id' | 'role'> | null
  if (!profile?.shop_id || profile.role !== 'owner') redirect('/dashboard')

  const adminClient = createAdminClient()

  // Fetch in-app notifications and mark unread ones as read
  const { data: inAppData } = await adminClient
    .from('shop_notifications' as never)
    .select('id, shop_id, title, body, type, read_at, created_at')
    .eq('shop_id', profile.shop_id)
    .order('created_at', { ascending: false })
    .limit(50) as unknown as { data: ShopNotification[] | null }

  const inAppNotifs = inAppData ?? []
  const unreadIds = inAppNotifs.filter(n => !n.read_at).map(n => n.id)

  if (unreadIds.length > 0) {
    await adminClient
      .from('shop_notifications' as never)
      .update({ read_at: new Date().toISOString() } as never)
      .in('id', unreadIds)
  }

  // Fetch WhatsApp logs
  let query = supabase
    .from('notification_logs')
    .select('*')
    .eq('shop_id', profile.shop_id)
    .order('sent_at', { ascending: false })
    .limit(100)

  if (type) query = query.eq('notification_type', type as never)

  const { data: logsData } = await query
  const logs = (logsData ?? []) as NotificationLog[]

  const sentCount   = logs.filter(l => l.status === 'sent').length
  const failedCount = logs.filter(l => l.status === 'failed').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vos messages et alertes</p>
      </div>

      {/* ── Messages admin ─────────────────────────────────────── */}
      {inAppNotifs.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Messages de TekkiShop</h2>
          </div>
          <div className="space-y-2">
            {inAppNotifs.map((notif) => {
              const cfg = NOTIF_TYPE_STYLES[notif.type] ?? NOTIF_TYPE_STYLES.info
              const Icon = cfg.icon
              const isUnread = !notif.read_at && unreadIds.includes(notif.id)
              return (
                <div
                  key={notif.id}
                  className={`rounded-xl border p-4 space-y-1 ${cfg.className} ${isUnread ? 'ring-2 ring-sky-200' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 shrink-0 mt-0.5 opacity-70" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm">{notif.title}</p>
                        <span className="text-[11px] opacity-60 shrink-0">
                          {format(new Date(notif.created_at), "d MMM", { locale: fr })}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 opacity-90 whitespace-pre-wrap">{notif.body}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {inAppNotifs.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border border-dashed border-gray-200 bg-white">
          <Bell className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Aucun message de TekkiShop pour l'instant.</p>
        </div>
      )}

      {/* ── Logs WhatsApp ───────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Logs WhatsApp</h2>
        </div>

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

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[undefined, 'order_confirmation', 'order_reminder', 'cancellation', 'new_order_shop'].map((t) => (
            <a
              key={t ?? 'all'}
              href={t ? `?type=${t}` : '/dashboard/notifications'}
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
              <p className="text-sm text-gray-500">Aucune notification WhatsApp envoyée.</p>
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
      </section>
    </div>
  )
}
