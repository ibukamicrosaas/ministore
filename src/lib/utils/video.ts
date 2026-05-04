export type VideoPlatform = 'tiktok' | 'instagram' | 'facebook' | null

export function detectVideoPlatform(url: string): VideoPlatform {
  try {
    const { hostname } = new URL(url)
    if (hostname.includes('tiktok.com')) return 'tiktok'
    if (hostname.includes('instagram.com')) return 'instagram'
    if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) return 'facebook'
    return null
  } catch {
    return null
  }
}

export function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)

    if (u.hostname.includes('tiktok.com')) {
      const match = u.pathname.match(/\/video\/(\d+)/)
      if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`
    }

    if (u.hostname.includes('instagram.com')) {
      const match = u.pathname.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/)
      if (match) return `https://www.instagram.com/p/${match[2]}/embed/`
    }

    if (u.hostname.includes('facebook.com') || u.hostname.includes('fb.watch')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=320&mute=0`
    }

    return null
  } catch {
    return null
  }
}
