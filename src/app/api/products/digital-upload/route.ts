import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/zip',
  'application/epub+zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.shop_id || profile.role !== 'owner')
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  if (file.size > 50 * 1024 * 1024)
    return NextResponse.json({ error: 'Fichier trop lourd (max 50 MB)' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: 'Type de fichier non accepté' }, { status: 400 })

  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const filePath = `${profile.shop_id}/${safeName}`

  const admin = createAdminClient()
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await admin.storage
    .from('digital-products')
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError)
    return NextResponse.json({ error: 'Erreur upload: ' + uploadError.message }, { status: 500 })

  return NextResponse.json({
    path: filePath,
    name: file.name,
    size: file.size,
  })
}
