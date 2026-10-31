import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { APP_URL } from '@/constants'
import { isOrderBlocked } from '@/lib/orders/redact'
import { planDownloadTokens, type ExistingToken } from '@/lib/orders/digital-order'

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
    .select('id, shop_id, status, is_held, released_at')
    .eq('id', orderId)
    .eq('shop_id', profileData.shop_id)
    .single()

  if (!orderData) {
    return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
  }

  const o = orderData as unknown as { id: string; shop_id: string; status: string; is_held: boolean; released_at: string | null }

  if (isOrderBlocked(o)) {
    return NextResponse.json({ error: 'Commande retenue — active ta boutique pour l\'envoyer au client.' }, { status: 403 })
  }

  // Le statut 'completed' n'est jamais posé que par les webhooks Bictorys/Stripe,
  // après paiement en ligne réellement confirmé (jamais par une action marchand).
  // Sans cette vérification, ce bouton distribuait le fichier sur une commande
  // payment_type='on_site'/'on_delivery' jamais payée en ligne — 2 commandes
  // réelles concernées, trouvées le 2026-08-17 (K.B.Y multi services, LolaShop).
  if (o.status !== 'completed') {
    return NextResponse.json(
      { error: 'Aucun paiement en ligne confirmé pour cette commande — impossible d\'envoyer le fichier depuis ce bouton.' },
      { status: 403 },
    )
  }

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

  // Réutilise un lien encore valide au lieu d'en créer un à chaque appel : un
  // second clic (ou un double envoi) ne multiplie plus les liens actifs.
  const { data: existingData, error: existingError } = await supabase
    .from('download_tokens')
    .select('product_id, token, expires_at, download_count, max_downloads')
    .eq('order_id', orderId)
    .eq('shop_id', profileData.shop_id)

  if (existingError) {
    console.error('[resend-digital] lecture download_tokens', existingError.message)
    return NextResponse.json({ error: 'Impossible de vérifier les liens existants. Réessaie.' }, { status: 500 })
  }

  const productNameById = new Map(digitalItems.map(i => [i.product_id, i.products?.digital_file_name ?? 'ton fichier']))
  const plan = planDownloadTokens(
    digitalItems.map(i => i.product_id),
    (existingData ?? []) as ExistingToken[],
    Date.now(),
  )

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  const newTokens: { token: string; downloadUrl: string; productName: string; expiresAt: string; reused: boolean }[] =
    plan.reuse.map(r => ({
      token:       r.token,
      downloadUrl: `${APP_URL}/telechargement/${r.token}`,
      productName: productNameById.get(r.product_id) ?? 'ton fichier',
      expiresAt:   r.expires_at,
      reused:      true,
    }))

  let createFailures = 0
  for (const productId of plan.create) {
    const { data: tokenData, error: insertError } = await supabase
      .from('download_tokens')
      .insert({
        order_id:      orderId,
        product_id:    productId,
        shop_id:       profileData.shop_id,
        expires_at:    expiresAt,
        max_downloads: 5,
      })
      .select('token')
      .single()

    if (insertError) console.error('[resend-digital] création du lien', productId, insertError.message)

    if (!tokenData?.token) {
      createFailures++
    } else {
      newTokens.push({
        token:       tokenData.token,
        downloadUrl: `${APP_URL}/telechargement/${tokenData.token}`,
        productName: productNameById.get(productId) ?? 'ton fichier',
        expiresAt,
        reused:      false,
      })
    }
  }

  // Un lien manque : ne pas laisser croire à la vendeuse que tout est prêt. Les
  // liens déjà créés restent valides et seront réutilisés au prochain essai.
  if (createFailures > 0 || newTokens.length === 0) {
    return NextResponse.json({ error: 'Impossible de générer le lien. Réessaie dans un instant.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, tokens: newTokens })
}
