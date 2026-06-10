import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
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
      .select('slug, plan')
      .eq('id', profile.shop_id)
      .single(),
  ])

  if (productRes.error || !productRes.data) notFound()

  const product   = productRes.data as Product
  const shopData  = shopRes.data as { slug?: string; plan?: string } | null
  const shopSlug  = shopData?.slug
  const shopPlan  = shopData?.plan

  // Build the public URL — use slug if available, otherwise UUID
  const productIdentifier = (product as Product & { slug?: string | null }).slug ?? product.id
  const publicUrl = shopSlug
    ? `${APP_URL}/${shopSlug}/produit/${productIdentifier}`
    : null

  return (
    <div className="max-w-xl">
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

      <ProductForm product={product} shopSlug={shopSlug} shopPlan={shopPlan} />
    </div>
  )
}
