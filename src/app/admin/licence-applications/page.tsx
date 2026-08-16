import { createAdminClient } from '@/lib/supabase/admin'
import { FileText, Mail, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const metadata = { title: 'Candidatures de licence — TEKKIShop Admin' }

type RawApplication = {
  id: string
  country: string
  full_name: string
  whatsapp_phone: string
  email: string
  experience: string
  acquisition_plan: string
  status: string
  created_at: string
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending:  { label: 'En attente', className: 'bg-amber-50 text-amber-700' },
  reviewed: { label: 'Étudiée',    className: 'bg-sky-50 text-sky-700' },
  accepted: { label: 'Acceptée',   className: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Refusée',    className: 'bg-gray-100 text-gray-500' },
}

export default async function LicenceApplicationsPage() {
  const admin = createAdminClient()

  const { data: rawApplications } = await admin
    .from('licence_applications' as never)
    .select('id, country, full_name, whatsapp_phone, email, experience, acquisition_plan, status, created_at')
    .order('created_at', { ascending: false }) as { data: RawApplication[] | null }

  const applications = rawApplications ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Candidatures de licence</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Reçues via le formulaire public /licence — {applications.length} au total.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {applications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Aucune candidature pour l&apos;instant.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {applications.map((a) => {
              const status = STATUS_LABEL[a.status] ?? STATUS_LABEL.pending
              return (
                <div key={a.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{a.full_name}</p>
                      <p className="text-xs font-semibold text-sky-600 mt-0.5">{a.country}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${status.className}`}>
                        {status.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(a.created_at), 'd MMM yyyy, HH:mm', { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {a.whatsapp_phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> {a.email}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Parcours</p>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{a.experience}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">100 premiers marchands</p>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{a.acquisition_plan}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
