import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ProductForm } from '@/components/dashboard/ProductForm'
import type { Product, Profile } from '@/types'

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

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('shop_id', profile.shop_id)
    .single()

  if (error || !data) notFound()

  return (
    <div className="max-w-xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Modifier le produit</h1>
        <p className="text-sm text-gray-500 mt-0.5">{(data as Product).name}</p>
      </div>
      <ProductForm product={data as Product} />
    </div>
  )
}
