import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProductForm } from '@/components/dashboard/ProductForm'

export const metadata = { title: 'Nouveau produit — TekkiShop' }

export default async function NewProductPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  const shopData = profile?.shop_id
    ? ((await supabase.from('shops').select('slug, plan').eq('id', profile.shop_id).single()).data as { slug?: string; plan?: string } | null)
    : null

  return (
    <div className="max-w-xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Nouveau produit</h1>
        <p className="text-sm text-gray-500 mt-0.5">Remplissez les informations ci-dessous.</p>
      </div>
      <ProductForm shopSlug={shopData?.slug} shopPlan={shopData?.plan} />
    </div>
  )
}
