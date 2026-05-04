import { ProductForm } from '@/components/dashboard/ProductForm'

export const metadata = { title: 'Nouveau produit — TekkiShop' }

export default function NewProductPage() {
  return (
    <div className="max-w-xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Nouveau produit</h1>
        <p className="text-sm text-gray-500 mt-0.5">Remplissez les informations ci-dessous.</p>
      </div>
      <ProductForm />
    </div>
  )
}
