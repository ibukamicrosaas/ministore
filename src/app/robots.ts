import type { MetadataRoute } from 'next'
import { APP_URL } from '@/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/legal/'],
        disallow: ['/dashboard/', '/admin/', '/api/', '/onboarding/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
