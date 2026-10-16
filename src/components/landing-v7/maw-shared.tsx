import type { ReactNode } from 'react'

// Primitives visuelles partagées entre MaisonAwaHome.tsx (accueil) et
// ClientJourney.tsx (parcours "Côté client") — un seul système d'échelle
// et un seul jeu d'icônes, jamais deux copies qui pourraient diverger.

// Canevas virtuel : toutes les valeurs passées à U() sont des px "de
// design" dans ce système à 390 de large, jamais des px réels à l'écran.
// U(n) convertit n en unité de container query (cqw) — voir .maw-stage
// dans landing-v7.css : le canevas fait toujours 100% de la largeur
// réelle de son cadre, à n'importe quelle largeur d'écran, sans JS.
export const CANVAS_WIDTH = 390
export function U(px: number): string {
  return `${+((px / CANVAS_WIDTH) * 100).toFixed(4)}cqw`
}

// Icônes copiées telles quelles (mêmes tracés) de Main.dc.html /
// produit-mobile.dc.html — pas de nouvelle dépendance, pas de dessin
// inventé : fidélité au fichier de référence. size = px de design (390),
// converti en cqw comme le reste du canevas.
export function Ic({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <span aria-hidden="true" className="maw-ic" style={{ width: U(size), height: U(size), display: 'inline-flex', flex: 'none' }}>
      {children}
    </span>
  )
}

const svgProps = { viewBox: '0 0 24 24', fill: 'none' as const, stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const IC_SEARCH = <svg {...svgProps}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
export const IC_SHARE = <svg {...svgProps}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>
export const IC_PIN = <svg {...svgProps} strokeWidth={2}><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>
export const IC_ARROW = <svg {...svgProps} strokeWidth={2}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
export const IC_CHEVRON_LEFT = <svg {...svgProps} strokeWidth={2}><path d="m15 18-6-6 6-6" /></svg>
export const IC_CHAT = <svg {...svgProps}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" /></svg>
export const IC_TRUCK = <svg {...svgProps}><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5" /><path d="M16 13h2" /></svg>
export const IC_WALLET = <svg {...svgProps}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.7a1 1 0 0 0-.2-.6l-3.4-4.3a1 1 0 0 0-.8-.4H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
export const IC_GRID = <svg {...svgProps} strokeWidth={1.9}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
export const IC_LIST = <svg {...svgProps} strokeWidth={1.9}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
export const IC_PHONE = <svg {...svgProps}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>
export const IC_IG = <svg {...svgProps}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></svg>
export const IC_TT = <svg {...svgProps}><path d="M16 3v10.5a4.5 4.5 0 1 1-4.5-4.5M16 3a5 5 0 0 0 5 5" /></svg>
export const IC_FB = <svg {...svgProps}><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5A.5.5 0 0 1 14 8z" /></svg>
export const IC_FLAG = <svg {...svgProps}><path d="M4 22V4M4 4h13l-2 4 2 4H4" /></svg>
export const IC_CHECK_CIRCLE = <svg {...svgProps} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="m8 12.5 2.6 2.6L16 9.7" /></svg>
export const IC_MINUS = <svg {...svgProps} strokeWidth={2}><path d="M5 12h14" /></svg>
export const IC_PLUS = <svg {...svgProps} strokeWidth={2}><path d="M5 12h14M12 5v14" /></svg>
export const IC_PACKAGE = <svg {...svgProps}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
export const IC_MAP = <svg {...svgProps}><path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5" /></svg>
export const IC_USER = <svg {...svgProps}><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="8" r="5" /></svg>
export const IC_MAIL = <svg {...svgProps}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></svg>
