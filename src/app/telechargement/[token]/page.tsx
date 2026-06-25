import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Download, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: dt } = await admin
    .from('download_tokens')
    .select(`
      expires_at, download_count, max_downloads, downloaded_at,
      products(name, digital_file_name, digital_file_size),
      orders(total_price),
      shops:shop_id(name, slug)
    `)
    .eq('token', token)
    .single()

  const isExpired   = !dt || new Date(dt.expires_at) < new Date()
  const isExhausted = !!dt && dt.download_count >= dt.max_downloads
  const isInvalid   = !dt

  if (isInvalid || isExpired || isExhausted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide ou expiré</h1>
          <p className="text-sm text-gray-500 mb-6">
            {isExhausted
              ? 'Le nombre maximum de téléchargements a été atteint.'
              : "Ce lien de téléchargement n'est plus valide ou a expiré (48h après l'achat)."}
          </p>
          <p className="text-xs text-gray-400">
            Contacte la boutique via WhatsApp pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    )
  }

  const product   = dt.products as { name: string; digital_file_name: string; digital_file_size: number | null } | null
  const shop      = dt.shops as { name: string; slug: string } | null
  const remaining = dt.max_downloads - dt.download_count
  const expiresAt = new Date(dt.expires_at)

  const fileSizeStr = product?.digital_file_size
    ? product.digital_file_size > 1024 * 1024
      ? `${(product.digital_file_size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(product.digital_file_size / 1024)} KB`
    : null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-4">
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          {shop && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {shop.name}
            </p>
          )}
          <h1 className="text-xl font-bold text-gray-900 mb-1">Merci pour ton achat !</h1>
          {product && (
            <p className="text-sm text-gray-500 mb-6">{product.name}</p>
          )}

          <a
            href={`/api/download/${token}`}
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[var(--color-primary,#0EA5E9)] py-4 text-sm font-bold text-white hover:opacity-90 transition-opacity"
          >
            <Download className="h-5 w-5" />
            Télécharger{product?.digital_file_name ? ` — ${product.digital_file_name}` : ''}
            {fileSizeStr && <span className="opacity-70 font-normal ml-1">({fileSizeStr})</span>}
          </a>

          <div className="mt-5 space-y-1.5 text-xs text-gray-400">
            <p className="flex items-center justify-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Lien valide jusqu&apos;au {expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </p>
            <p>{remaining} téléchargement{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Problème ?{' '}
          {shop && (
            <Link href={`/${shop.slug}`} className="underline hover:text-gray-600">
              Contacter {shop.name}
            </Link>
          )}
        </p>
      </div>
    </div>
  )
}
