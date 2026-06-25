import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const expireUrl = new URL('/telechargement/expire', process.env.NEXT_PUBLIC_APP_URL!)

  if (!token) return NextResponse.redirect(expireUrl)

  const admin = createAdminClient()

  const { data: dt, error } = await admin
    .from('download_tokens')
    .select('*, products(digital_file_path, digital_file_name)')
    .eq('token', token)
    .single()

  if (error || !dt) return NextResponse.redirect(expireUrl)

  if (new Date(dt.expires_at) < new Date())
    return NextResponse.redirect(expireUrl)

  if (dt.download_count >= dt.max_downloads)
    return NextResponse.redirect(expireUrl)

  const product = dt.products as unknown as { digital_file_path: string; digital_file_name: string } | null
  if (!product?.digital_file_path)
    return NextResponse.redirect(expireUrl)

  const { data: signedData, error: signedError } = await admin.storage
    .from('digital-products')
    .createSignedUrl(product.digital_file_path, 60)

  if (signedError || !signedData?.signedUrl)
    return NextResponse.json({ error: 'Erreur génération lien' }, { status: 500 })

  // Incrémenter avant de streamer (évite double-comptage si le fetch échoue après)
  await admin
    .from('download_tokens')
    .update({
      download_count: dt.download_count + 1,
      downloaded_at: dt.downloaded_at ?? new Date().toISOString(),
    })
    .eq('id', dt.id)

  // Proxier le fichier avec Content-Disposition: attachment pour forcer le téléchargement
  // sur tous les appareils (iOS Safari ouvre les PDF en ligne sans ce header)
  const fileRes = await fetch(signedData.signedUrl)
  if (!fileRes.ok || !fileRes.body)
    return NextResponse.json({ error: 'Fichier inaccessible' }, { status: 502 })

  const contentType   = fileRes.headers.get('content-type') ?? 'application/octet-stream'
  const contentLength = fileRes.headers.get('content-length')

  // Encode le nom de fichier pour les caractères non-ASCII (accents, espaces…)
  const filename = product.digital_file_name ?? 'telechargement'
  const encodedName = encodeURIComponent(filename)

  const headers: Record<string, string> = {
    'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedName}`,
    'Content-Type':        contentType,
    'Cache-Control':       'no-store, no-cache',
  }
  if (contentLength) headers['Content-Length'] = contentLength

  return new NextResponse(fileRes.body, { headers })
}
