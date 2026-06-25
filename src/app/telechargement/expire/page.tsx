import { AlertCircle } from 'lucide-react'

export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Lien expiré</h1>
        <p className="text-sm text-gray-500">
          Ce lien de téléchargement n&apos;est plus valide. Contacte la boutique via WhatsApp pour obtenir un nouveau lien.
        </p>
      </div>
    </div>
  )
}
