import type { Metadata } from 'next'
import { COUNTRY_CONFIGS } from '@/data/country-configs'
import { CountryLandingPage } from '@/components/landing/CountryLandingPage'

export const revalidate = 3600

const cfg = COUNTRY_CONFIGS.TG

export const metadata: Metadata = {
  title: cfg.meta.title,
  description: cfg.meta.description,
  openGraph: {
    title: cfg.meta.title,
    description: cfg.meta.description,
    locale: cfg.meta.locale,
  },
}

export default function TogoPage() {
  return <CountryLandingPage config={cfg} />
}
