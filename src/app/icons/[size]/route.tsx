import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params
  const dim = size === '512' ? 512 : 192

  return new ImageResponse(
    (
      <div
        style={{
          width: dim,
          height: dim,
          background: '#0EA5E9',
          borderRadius: dim * 0.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: dim * 0.42,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            fontFamily: 'sans-serif',
          }}
        >
          M
        </div>
      </div>
    ),
    { width: dim, height: dim }
  )
}
