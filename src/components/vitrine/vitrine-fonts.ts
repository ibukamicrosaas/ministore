import { Geist } from 'next/font/google'

// Police chargée UNIQUEMENT par les composants Vitrine (décision #10,
// PLAN-THEME-VITRINE.md §15) — jamais dans le layout racine, jamais pour
// Classique. Geist n'est utilisée nulle part ailleurs dans ce dépôt
// (vérifié par recherche exhaustive avant ce lot).
export const vitrineFont = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-vitrine',
  display: 'swap',
})
