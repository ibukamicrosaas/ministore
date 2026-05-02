import { ResetPinForm } from './ResetPinForm'

export const metadata = { title: 'Réinitialisation PIN — Sheka' }

export default function ResetPinPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Réinitialiser le PIN</h1>
          <p className="text-sm text-gray-500 mt-1">Un code vous sera envoyé par WhatsApp</p>
        </div>
        <ResetPinForm />
      </div>
    </div>
  )
}
