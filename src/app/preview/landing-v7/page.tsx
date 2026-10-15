import { redirect } from 'next/navigation'

// Bascule du 2026-10-15 : le contenu de cette route est désormais `/`
// (src/app/page.tsx). landing-v7.css reste dans ce dossier (importé par
// la nouvelle page via l'alias @/app/preview/landing-v7/landing-v7.css) —
// ne pas le supprimer. Les composants de src/components/landing-v7/ ne
// sont pas touchés non plus.
export default function LandingV7Redirect() {
  redirect('/')
}
