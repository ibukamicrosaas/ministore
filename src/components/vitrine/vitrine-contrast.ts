// Fonctions de contraste pour le thème Vitrine (PLAN-THEME-VITRINE.md §5).
// Reprend la formule WCAG exacte déjà présente dans Main.dc.html/produit-mobile.dc.html
// (luminance relative sRGB, linéarisation gamma), mais corrige le défaut de ce mockup :
// celui-ci ne sécurisait que le texte de bouton (seuil de luminance fixe), jamais le
// texte coloré sur fond clair ni les icônes/bordures.

function toRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function linear(v: number): number {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = toRgb(hex)
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA)
  const l2 = relativeLuminance(hexB)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Fonction 1 — texte de bouton sur `brand` : choisit blanc ou sombre selon le
 * MEILLEUR contraste calculé, jamais un seuil de luminance fixe.
 */
export function buttonTextColor(brand: string): string {
  const white = '#FFFFFF'
  const dark = '#1F1B18'
  return contrastRatio(brand, white) >= contrastRatio(brand, dark) ? white : dark
}

/**
 * Fonction 2 — texte coloré sur fond clair : assombrit `brand` vers le noir
 * par dichotomie jusqu'à atteindre `target` (4,5:1 par défaut, seuil WCAG AA
 * texte normal) contre `bg`. Retourne `brand` inchangé si déjà conforme.
 */
export function textColorOnLight(brand: string, bg = '#FFFFFF', target = 4.5): string {
  if (contrastRatio(brand, bg) >= target) return brand
  const [r, g, b] = toRgb(brand)
  let lo = 0
  let hi = 1
  for (let i = 0; i < 40; i++) {
    const k = (lo + hi) / 2
    const candidate = toHex(r * (1 - k), g * (1 - k), b * (1 - k))
    if (contrastRatio(candidate, bg) >= target) hi = k
    else lo = k
  }
  const [r2, g2, b2] = toRgb(brand)
  return toHex(r2 * (1 - hi), g2 * (1 - hi), b2 * (1 - hi))
}

/**
 * Fonction 3 — liens/icônes/bordures : même principe que la Fonction 2, mais
 * seuil 3:1 (WCAG 1.4.11, objets graphiques/non-textuels, plus permissif).
 */
export function graphicColorOnLight(brand: string, bg = '#FFFFFF', target = 3.0): string {
  return textColorOnLight(brand, bg, target)
}

// Dérivés de teinte (même logique mix() que le mockup : tint/soft/line/darkest).
function mix(hex: string, target: number, k: number): string {
  const [r, g, b] = toRgb(hex)
  const m = (v: number) => v * (1 - k) + target * k
  return toHex(m(r), m(g), m(b))
}

export interface VitrineTokens {
  brand: string
  tint: string
  soft: string
  line: string
  darkest: string
  onBrand: string
  textOnLight: string
  graphicOnLight: string
}

export function deriveVitrineTokens(brandHex: string): VitrineTokens {
  const brand = brandHex && /^#[0-9a-fA-F]{6}$/.test(brandHex) ? brandHex : '#0EA5E9'
  return {
    brand,
    tint: mix(brand, 255, 0.86),
    soft: mix(brand, 255, 0.93),
    line: mix(brand, 255, 0.72),
    darkest: mix(brand, 0, 0.8),
    onBrand: buttonTextColor(brand),
    textOnLight: textColorOnLight(brand),
    graphicOnLight: graphicColorOnLight(brand),
  }
}
