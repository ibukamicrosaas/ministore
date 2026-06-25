import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const orderId      = req.nextUrl.searchParams.get('order_id')
  const clientToken  = req.nextUrl.searchParams.get('client_token')

  if (!orderId || !clientToken) return NextResponse.json({ tokens: [] })

  const supabase = createAdminClient()

  // Authentification : client_token doit correspondre à la commande
  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('client_token', clientToken)
    .single()

  if (!order) return NextResponse.json({ tokens: [] })

  // Ne jamais exposer digital_file_path — uniquement les données nécessaires à l'UI
  const { data: tokens } = await (supabase as any)
    .from('download_tokens')
    .select('token, expires_at, download_count, max_downloads, products(name, digital_file_name, digital_file_size)')
    .eq('order_id', orderId)

  return NextResponse.json({ tokens: tokens ?? [] })
}
