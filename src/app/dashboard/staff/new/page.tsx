import { StaffForm } from '@/components/dashboard/StaffForm'

export const metadata = { title: 'Nouvelle employée — Sheka' }

export default function NewStaffPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Nouvelle employée</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Renseigne les informations de l&apos;employée.
        </p>
      </div>
      <StaffForm />
    </div>
  )
}
