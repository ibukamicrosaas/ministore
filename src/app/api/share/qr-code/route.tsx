import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { APP_URL } from '@/constants'
import QRCode from 'qrcode'

export const runtime = 'nodejs'

const SIZE = 1080

type ShopRow = { name: string; primary_color: string | null; slug: string }

export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get('slug')
  if (!slug) return new Response('Missing slug', { status: 400 })

  const admin = createAdminClient()
  const { data } = await (admin
    .from('shops')
    .select('name, primary_color, slug')
    .eq('slug', slug)
    .eq('is_active', true)
    .single() as unknown as Promise<{ data: ShopRow | null }>)

  if (!data) return new Response('Not found', { status: 404 })

  const primaryColor = data.primary_color ?? '#0EA5E9'
  const shopUrl      = `${APP_URL.replace(/^http:\/\//, 'https://')}/${data.slug}`

  // Génération du QR code en PNG base64
  const qrBuffer   = await QRCode.toBuffer(shopUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 620,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  })
  const qrDataUrl = `data:image/png;base64,${qrBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: SIZE,
          height: SIZE,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Bande couleur boutique en haut */}
        <div
          style={{
            width: '100%',
            background: primaryColor,
            paddingTop: 52,
            paddingBottom: 52,
            paddingLeft: 60,
            paddingRight: 60,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: data.name.length > 22 ? 56 : 68,
              fontWeight: 800,
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            {data.name}
          </div>
        </div>

        {/* Instruction */}
        <div
          style={{
            color: '#374151',
            fontSize: 34,
            fontWeight: 600,
            marginTop: 48,
            marginBottom: 32,
          }}
        >
          Scannez pour commander en ligne
        </div>

        {/* QR code avec bordure */}
        <div
          style={{
            display: 'flex',
            padding: 20,
            borderRadius: 24,
            border: `6px solid ${primaryColor}`,
            background: '#ffffff',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR code" style={{ width: 560, height: 560 }} />
        </div>

        {/* URL */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 40,
          }}
        >
          <div
            style={{
              color: primaryColor,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            {shopUrl}
          </div>
        </div>

        {/* Bande bas */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 16,
            background: primaryColor,
            display: 'flex',
          }}
        />
      </div>
    ),
    { width: SIZE, height: SIZE },
  )
}
