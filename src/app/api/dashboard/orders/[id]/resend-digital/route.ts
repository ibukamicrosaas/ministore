import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { APP_URL } from '@/constants'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await checkRateLimit(req, { key: 'resend-digital', maxRequests: 5, windowMs: 15 * 60 * 1000 })
  if (limited) return limited

  const { id: orderId } = await params

  // Auth : vérifier que l'utilisateur est connecté et propriétaire de la boutique
  const userSupabase = await createServerClient()
  const { data: { user } } = await userSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profileData } = await userSupabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  if (!profileData?.shop_id) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  const supabase = createAdminClient()

  // Vérifier que la commande appartient à cette boutique
  const { data: orderData } = await supabase
    .from('orders')
    .select('id, shop_id, status')
    .eq('id', orderId)
    .eq('shop_id', profileData.shop_id)
    .single()

  if (!orderData) {
    return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
  }

  const o = orderData as unknown as { id: string; shop_id: string; status: string }

  // Récupérer les produits digitaux de la commande
  const { data: orderItems } = await (supabase as any)
    .from('order_items')
    .select('product_id, products(product_type, digital_file_name)')
    .eq('order_id', orderId)

  const digitalItems = ((orderItems ?? []) as Array<{
    product_id: string
    products: { product_type: string | null; digital_file_name: string | null } | null
  }>).filter(item => item.products?.product_type === 'digital')

  if (digitalItems.length === 0) {
    return NextResponse.json({ error: 'Aucun produit digital dans cette commande' }, { status: 400 })
  }

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  const newTokens: { token: string; downloadUrl: string; productName: string }[] = []

  for (const item of digitalItems) {
    const { data: tokenData } = await supabase
      .from('download_tokens')
      .insert({
        order_id:      orderId,
        product_id:    item.product_id,
        shop_id:       profileData.shop_id,
        expires_at:    expiresAt,
        max_downloads: 5,
      })
      .select('token')
      .single()

    if (tokenData?.token) {
      const downloadUrl   = `${APP_URL}/telechargement/${tokenData.token}`
      const productName   = item.products?.digital_file_name ?? 'ton fichier'
      newTokens.push({ token: tokenData.token, downloadUrl, productName })
    }
  }

  // Marquer la commande comme complétée si elle était encore en pending/confirmed
  if (o.status === 'pending' || o.status === 'confirmed') {
    await supabase
      .from('orders')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', orderId)
  }

  return NextResponse.json({ ok: true, tokens: newTokens })
}
