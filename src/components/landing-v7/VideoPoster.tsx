import { IC } from '@/components/landing-v6/icons'

// Écart n°7 : habillage visuel "poster" avec chrono, fidèle au mockup —
// AUCUN fichier vidéo réel, aucune lecture possible. La vidéo elle-même
// reste hors périmètre (lot C, inchangé) ; ceci est une approximation
// statique de la mise en page finale, pas un lecteur fonctionnel.
export function VideoPoster() {
  return (
    <div className="video-poster">
      <div className="video-poster-phone" />
      <div className="video-poster-play">{IC.arrowRight}</div>
      <div className="chrono">
        <small>CHRONO</small>
        00:00 → 04:52
      </div>
      <span className="video-poster-note">Vidéo à venir — lot C</span>
    </div>
  )
}
