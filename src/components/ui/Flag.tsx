import 'flag-icons/css/flag-icons.min.css'

// Remplace les emojis de drapeaux (rendu inconsistant sur certains
// téléphones) par de vraies icônes SVG — paquet flag-icons (MIT), installé
// le 2026-10-24 avec l'accord explicite de l'utilisateur. Le CSS importé
// ci-dessus définit une règle par pays (ex. .fi-sn{background-image:
// url(.../sn.svg)}) pour ~270 pays, mais le SVG de chaque pays n'est
// chargé par le navigateur QUE pour les classes réellement affichées dans
// le DOM — ce composant ne charge donc que les drapeaux des pays
// effectivement utilisés (mesuré : 11 SVG, ~370 octets chacun en moyenne).
//
// Codes internes du projet (country-groups.ts, LoginForm.tsx) → code ISO
// 3166-1 alpha-2 utilisé par flag-icons, vérifié un par un. Un seul écart :
// 'BK' (Burkina Faso, code interne du projet depuis la migration 093) →
// 'bf' (code ISO réel du Burkina Faso ; "bk" n'est le code ISO d'aucun
// pays).
const CODE_TO_ISO: Record<string, string> = {
  SN: 'sn', // Sénégal
  CI: 'ci', // Côte d'Ivoire
  TG: 'tg', // Togo
  BJ: 'bj', // Bénin
  BK: 'bf', // Burkina Faso — seul code interne qui diffère de l'ISO
  ML: 'ml', // Mali
  FR: 'fr', // France
  BE: 'be', // Belgique
  LU: 'lu', // Luxembourg
  CH: 'ch', // Suisse
  CA: 'ca', // Canada
}

interface FlagProps {
  /** Code interne du projet (ex. 'BK'), pas forcément le code ISO. */
  code: string
  /** Nom du pays, pour l'alt/aria — jamais déduit du code seul. */
  countryName: string
  size?: number
}

// aria-hidden + alt vide : le nom du pays est toujours affiché en texte à
// côté du drapeau (StartFlow.tsx, LoginForm.tsx) — le drapeau seul serait
// une redite pour un lecteur d'écran, jamais la seule source d'information.
export function Flag({ code, countryName, size = 20 }: FlagProps) {
  const iso = CODE_TO_ISO[code.toUpperCase()]
  if (!iso) return null
  return (
    <span
      className={`fi fi-${iso}`}
      role="img"
      aria-label={countryName}
      style={{
        width: size,
        height: size * 0.75,
        display: 'inline-block',
        backgroundSize: 'cover',
        backgroundPosition: '50% 50%',
        borderRadius: 2,
        flex: 'none',
      }}
    />
  )
}
