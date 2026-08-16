import type { Metadata } from 'next'
import { COUNTRY_CONFIGS } from '@/data/country-configs'
import { CountryLandingV6 } from '@/components/landing/CountryLandingV6'

export const revalidate = 3600

const cfg = COUNTRY_CONFIGS.ML

export const metadata: Metadata = {
  title: cfg.meta.title,
  description: cfg.meta.description,
  openGraph: {
    title: cfg.meta.title,
    description: cfg.meta.description,
    locale: cfg.meta.locale,
  },
}

export default function MaliPage() {
  return <CountryLandingV6 config={cfg} />
}
