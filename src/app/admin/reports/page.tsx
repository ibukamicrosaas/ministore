import { createAdminClient } from '@/lib/supabase/admin'
import { Flag, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const metadata = { title: 'Signalements — TEKKIShop Admin' }

type RawReport = {
  id: string
  shop_id: string
  product_id: string | null
  reason: string
  detail: string | null
  reporter_contact: string | null
  status: string
  created_at: string
  shops: { name: string; slug: string } | null
  products: { name: string } | null
}

const REASON_LABEL: Record<string, string> = {
  sexual_no_consent: 'Contenu à caractère sexuel/intime sans consentement',
  impersonation:     "Usurpation d'identité (marque, organisme, personne)",
  scam:              'Arnaque / produit non reçu',
  other:             'Autre',
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  new:       { label: 'Nouveau',  className: 'bg-amber-50 text-amber-700' },
  reviewed:  { label: 'Étudié',   className: 'bg-sky-50 text-sky-700' },
  dismissed: { label: 'Classé',   className: 'bg-gray-100 text-gray-500' },
}

export default async function AdminReportsPage() {
  const admin = createAdminClient()

  const { data: rawReports } = await admin
    .from('content_reports' as never)
    .select('id, shop_id, product_id, reason, detail, reporter_contact, status, created_at, shops(name, slug), products(name)')
    .order('created_at', { ascending: false }) as unknown as { data: RawReport[] | null }

  const reports = rawReports ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Signalements</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Envoyés par des acheteurs depuis une fiche produit ou une boutique — {reports.length} au total.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {reports.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Flag className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Aucun signalement pour l&apos;instant.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reports.map((r) => {
              const status = STATUS_LABEL[r.status] ?? STATUS_LABEL.new
              return (
                <div key={r.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">{r.shops?.name ?? 'Boutique supprimée'}</p>
                        {r.shops?.slug && (
                          <Link
                            href={`/${r.shops.slug}`}
                            target="_blank"
                            className="text-gray-400 hover:text-sky-600"
                            title="Voir la boutique"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r.products?.name ? `Produit : ${r.products.name}` : 'Boutique entière'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${status.className}`}>
                        {status.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(r.created_at), 'd MMM yyyy, HH:mm', { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-red-600 mb-1.5">{REASON_LABEL[r.reason] ?? r.reason}</p>
                  {r.detail && (
                    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 mb-2">
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{r.detail}</p>
                    </div>
                  )}
                  {r.reporter_contact && (
                    <p className="text-xs text-gray-500">Contact laissé : {r.reporter_contact}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
