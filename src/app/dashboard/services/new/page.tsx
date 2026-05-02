import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ServiceForm } from '@/components/dashboard/ServiceForm'

export const metadata = { title: 'Nouvelle prestation — Sheka' }

export default function NewServicePage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/dashboard/services"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Prestations
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Nouvelle prestation</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Renseigne les informations de la prestation.
        </p>
      </div>
      <ServiceForm />
    </div>
  )
}
