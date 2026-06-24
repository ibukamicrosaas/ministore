import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
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
    ? ((await supabase.from('shops').select('slug, plan, currency').eq('id', profile.shop_id).single()).data as { slug?: string; plan?: string; currency?: string | null } | null)
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
        <h1 className="text-xl font-bold text-gray-900">Nouveau produit</h1>
        <p className="text-sm text-gray-500 mt-0.5">Remplissez les informations ci-dessous.</p>
      </div>
      <ProductForm shopSlug={shopData?.slug} shopPlan={shopData?.plan} shopCurrency={shopData?.currency ?? 'XOF'} />
    </div>
  )
}
