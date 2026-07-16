import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crée ta boutique en 60 secondes — TEKKIShop',
  description: 'Réponds à 5 questions et ta boutique en ligne est prête. Gratuit, depuis ton téléphone.',
}

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center" style={{ background: '#F7FAFF' }}>
      {children}
    </div>
  )
}
