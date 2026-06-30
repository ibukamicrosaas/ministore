import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { APP_URL } from '@/constants'

export const runtime = 'nodejs'

const SIZE = 1080

type ShopRow = {
  name: string
  logo_url: string | null
  primary_color: string | null
  slug: string
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null
}

function darkenColor(hex: string, amount = 60): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#0369a1'
  const r = Math.max(0, rgb.r - amount)
  const g = Math.max(0, rgb.g - amount)
  const b = Math.max(0, rgb.b - amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get('slug')
  if (!slug) return new Response('Missing slug', { status: 400 })

  const admin = createAdminClient()
  const { data } = await (admin
    .from('shops')
    .select('name, logo_url, primary_color, slug')
    .eq('slug', slug)
    .eq('is_active', true)
    .single() as unknown as Promise<{ data: ShopRow | null }>)

  if (!data) return new Response('Not found', { status: 404 })

  const primaryColor = data.primary_color ?? '#0EA5E9'
  const darkColor    = darkenColor(primaryColor, 70)
  const initial      = data.name.charAt(0).toUpperCase()
  const shopUrl      = `${APP_URL.replace(/^http:\/\//, 'https://')}/${data.slug}`

  return new ImageResponse(
    (
      <div
        style={{
          width: SIZE,
          height: SIZE,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(145deg, ${primaryColor} 0%, ${darkColor} 100%)`,
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 500,
            height: 500,
            borderRadius: 250,
            background: 'rgba(255,255,255,0.07)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 360,
            height: 360,
            borderRadius: 180,
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
          }}
        />

        {/* Logo or initials */}
        {data.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.logo_url}
            alt=""
            style={{
              width: 200,
              height: 200,
              borderRadius: 32,
              objectFit: 'contain',
              background: 'white',
              padding: 16,
              marginBottom: 48,
            }}
          />
        ) : (
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: 100,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 48,
            }}
          >
            <div
              style={{
                color: 'white',
                fontSize: 100,
                fontWeight: 800,
              }}
            >
              {initial}
            </div>
          </div>
        )}

        {/* Shop name */}
        <div
          style={{
            color: 'white',
            fontSize: data.name.length > 20 ? 72 : 88,
            fontWeight: 800,
            textAlign: 'center',
            paddingLeft: 60,
            paddingRight: 60,
            lineHeight: 1.1,
            marginBottom: 24,
          }}
        >
          {data.name}
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 38,
            fontWeight: 500,
            marginBottom: 64,
          }}
        >
          Boutique en ligne
        </div>

        {/* CTA pill */}
        <div
          style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 60,
            paddingTop: 20,
            paddingBottom: 20,
            paddingLeft: 48,
            paddingRight: 48,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            🛍️  Commandez maintenant !
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 44,
            color: 'rgba(255,255,255,0.55)',
            fontSize: 26,
            fontWeight: 500,
          }}
        >
          {shopUrl}
        </div>
      </div>
    ),
    { width: SIZE, height: SIZE },
  )
}
