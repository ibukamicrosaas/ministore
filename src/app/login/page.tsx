import Link from 'next/link'
import { LoginForm } from './LoginForm'
import { APP_NAME } from '@/constants'
import { Scissors } from 'lucide-react'

export const metadata = {
  title: `Connexion — ${APP_NAME}`,
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E85D04] mb-4">
            <Scissors className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-gray-500">Gestion de salon simplifiée</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-gray-400">
          En vous connectant, vous acceptez nos{' '}
          <Link href="/legal/cgu" className="underline hover:text-gray-600">CGU</Link>
          {' '}et notre{' '}
          <Link href="/legal/privacy" className="underline hover:text-gray-600">politique de confidentialité</Link>.
        </p>
      </div>
    </div>
  )
}
