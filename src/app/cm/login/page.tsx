import type { Metadata } from 'next'
import { CmLoginForm } from './CmLoginForm'

export const metadata: Metadata = {
  title: 'Connexion Country Manager — TEKKIShop',
  robots: { index: false, follow: false },
}

export default function CmLoginPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-[10px] font-black tracking-[0.2em] text-sky-400 uppercase mb-1">
            TEKKIShop
          </p>
          <h1 className="text-lg font-bold text-white">Espace Country Manager</h1>
          <p className="text-xs text-gray-500 mt-1">Réservé aux licenciés TEKKIShop par pays.</p>
        </div>
        <CmLoginForm />
      </div>
    </div>
  )
}
