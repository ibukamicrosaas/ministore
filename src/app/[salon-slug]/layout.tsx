import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Salon } from '@/types'
import { MessageCircle } from 'lucide-react'

interface Props {
  children: React.ReactNode
  params: Promise<{ 'salon-slug': string }>
}

export async function generateMetadata({ params }: { params: Promise<{ 'salon-slug': string }> }): Promise<Metadata> {
  const { 'salon-slug': slug } = await params
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('salons')
    .select('name, description, logo_url')
    .eq('slug', slug)
    .single()

  const salon = data as Pick<Salon, 'name' | 'description' | 'logo_url'> | null
  if (!salon) return { title: 'Salon introuvable' }

  return {
    title: salon.name,
    description: salon.description ?? `Réservez vos services beauté chez ${salon.name}`,
    openGraph: {
      title: salon.name,
      images: salon.logo_url ? [salon.logo_url] : [],
    },
  }
}

export default async function SalonLayout({ children, params }: Props) {
  const { 'salon-slug': slug } = await params
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('salons')
    .select('name, primary_color, is_active, phone_whatsapp')
    .eq('slug', slug)
    .single()

  const salon = data as Pick<Salon, 'name' | 'primary_color' | 'is_active' | 'phone_whatsapp'> | null

  // Salon inexistant → 404
  if (!salon) notFound()

  // Salon suspendu → page dédiée (pas un 404 muet)
  if (!salon.is_active) {
    const waLink = salon.phone_whatsapp
      ? `https://wa.me/${salon.phone_whatsapp.replace(/\D/g, '')}`
      : null

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-sm space-y-4">
          <div className="text-4xl">🔒</div>
          <h1 className="text-lg font-bold text-gray-900">{salon.name}</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Ce salon a temporairement suspendu ses réservations en ligne.
          </p>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white"
            >
              <MessageCircle className="h-4 w-4" />
              Contacter le salon
            </a>
          )}
          <p className="text-xs text-gray-400">
            Si vous êtes le propriétaire,{' '}
            <a href="/dashboard/upgrade" className="underline hover:text-gray-600">
              réactivez votre abonnement
            </a>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ '--color-primary': salon.primary_color ?? '#E85D04' } as React.CSSProperties}
      className="min-h-screen bg-gray-50"
    >
      {children}
    </div>
  )
}
