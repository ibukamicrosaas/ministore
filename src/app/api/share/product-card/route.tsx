import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const SIZE = 1080

type ProductRow = {
  id: string
  name: string
  price: number
  photos: unknown
  photo_url: string | null
  shops: { name: string; primary_color: string | null; currency: string | null } | null
}

function formatPrice(price: number, currency: string | null) {
  const n = price.toLocaleString('fr-FR')
  if (currency === 'EUR') return `${n} €`
  if (currency === 'CAD') return `${n} CAD`
  return `${n} FCFA`
}

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return new Response('Missing id', { status: 400 })

  const admin = createAdminClient()
  const { data } = await (admin
    .from('products')
    .select('id, name, price, photos, photo_url, shops(name, primary_color, currency)')
    .eq('id', id)
    .eq('is_active', true)
    .single() as unknown as Promise<{ data: ProductRow | null }>)

  if (!data) return new Response('Not found', { status: 404 })

  const photos = Array.isArray(data.photos) ? (data.photos as { url: string; is_primary?: boolean }[]) : []
  const photoUrl = photos.find(p => p.is_primary)?.url ?? photos[0]?.url ?? data.photo_url ?? null

  const shopName     = data.shops?.name ?? ''
  const primaryColor = data.shops?.primary_color ?? '#0EA5E9'
  const currency     = data.shops?.currency ?? 'XOF'
  const priceStr     = formatPrice(data.price, currency)

  return new ImageResponse(
    (
      <div
        style={{
          width: SIZE,
          height: SIZE,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          background: photoUrl ? '#111' : primaryColor,
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Photo full bleed */}
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Gradient overlay bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
            display: 'flex',
          }}
        />

        {/* Badge "Disponible en ligne" */}
        <div
          style={{
            position: 'absolute',
            top: 52,
            left: 52,
            background: primaryColor,
            color: 'white',
            borderRadius: 48,
            paddingTop: 14,
            paddingBottom: 14,
            paddingLeft: 28,
            paddingRight: 28,
            fontSize: 30,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ✓ Disponible en ligne
        </div>

        {/* Content bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingLeft: 60,
            paddingRight: 60,
            paddingBottom: 60,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Product name */}
          <div
            style={{
              color: 'white',
              fontSize: data.name.length > 30 ? 60 : 76,
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 18,
            }}
          >
            {data.name}
          </div>

          {/* Price */}
          <div
            style={{
              color: primaryColor,
              fontSize: 58,
              fontWeight: 800,
              marginBottom: 28,
            }}
          >
            {priceStr}
          </div>

          {/* Shop name */}
          {shopName && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: 6,
                  height: 36,
                  background: primaryColor,
                  borderRadius: 3,
                  marginRight: 16,
                }}
              />
              <div
                style={{
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: 34,
                  fontWeight: 600,
                }}
              >
                {shopName}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    { width: SIZE, height: SIZE },
  )
}
