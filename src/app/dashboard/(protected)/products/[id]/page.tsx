import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ProductForm } from '@/components/dashboard/ProductForm'
import { CopyProductLinkButton } from '@/components/dashboard/CopyProductLinkButton'
import type { Product, Profile } from '@/types'
import { APP_URL } from '@/constants'

export const metadata = { title: 'Modifier le produit — TekkiShop' }

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'shop_id'> | null
  if (!profile?.shop_id) redirect('/onboarding')

  const [productRes, shopRes] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('shop_id', profile.shop_id)
      .single(),
    supabase
      .from('shops')
      .select('slug, plan, currency')
      .eq('id', profile.shop_id)
      .single(),
  ])

  if (productRes.error || !productRes.data) notFound()

  // Lot 4 de la bascule variantes (REPRISE.md §76-81) : product_variants
  // (système B) fusionné dans product.variants avant de passer au
  // formulaire — ProductForm.tsx n'a pas besoin de savoir d'où viennent les
  // données, il lit product.variants comme avant. Toutes les lignes (pas
  // seulement actives) ne sont pas nécessaires ici : une variante désactivée
  // depuis le dashboard ne doit plus apparaître dans le formulaire.
  const { data: variantRows } = await supabase
    .from('product_variants')
    .select('id, name, price, stock, image_url')
    .eq('product_id', id)
    .eq('is_active', true)
    .order('position', { ascending: true })

  const product = {
    ...(productRes.data as Product),
    variants: (variantRows && variantRows.length > 0)
      ? variantRows.map(v => ({
          id: v.id,
          label: v.name,
          price: v.price ?? (productRes.data as Product).price,
          stock_count: v.stock,
          image_url: v.image_url,
        }))
      : (productRes.data as Product).variants,
  } as Product
  const shopData      = shopRes.data as { slug?: string; plan?: string; currency?: string | null } | null
  const shopSlug      = shopData?.slug
  const shopPlan      = shopData?.plan
  const shopCurrency  = shopData?.currency ?? 'XOF'

  // Build the public URL — use slug if available, otherwise UUID
  const productIdentifier = (product as Product & { slug?: string | null }).slug ?? product.id
  const publicUrl = shopSlug
    ? `${APP_URL}/${shopSlug}/produit/${productIdentifier}`
    : null

  return (
    <div className="max-w-xl">
      <Link
        href="/dashboard/products"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Produits
      </Link>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Modifier le produit</h1>
        <p className="text-sm text-gray-500 mt-0.5">{product.name}</p>
      </div>

      {publicUrl && (
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-500 mb-1.5">Lien public du produit</p>
          <CopyProductLinkButton url={publicUrl} />
        </div>
      )}

      <ProductForm product={product} shopSlug={shopSlug} shopPlan={shopPlan} shopCurrency={shopCurrency} />
    </div>
  )
}
