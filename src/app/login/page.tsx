import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
import { LoginForm } from './LoginForm'
import { APP_NAME } from '@/constants'
import { getPublicOrdersCount } from '@/lib/public-stats'

// Rendu dynamique (pas de revalidate) — inchangé après le passage de
// shopsCount (createAdminClient direct) à getPublicOrdersCount() (2026-10-24) :
// ce helper utilise lui aussi createAdminClient() en interne (pas de cookies,
// pas d'API dynamique Next), donc par lui-même il ne force rien — c'est
// uniquement ce `dynamic = 'force-dynamic'` explicite qui fait que /login se
// recalcule à chaque requête. Aucun changement de comportement de cache :
// toujours aucune revalidation ISR, toujours recalculé à chaque visite,
// comme avant ce changement.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: `Connexion — ${APP_NAME}`,
}

// Luxembourg ajouté le 2026-10-24 : présent dans LoginForm.tsx (sélecteur de
// pays du formulaire, déjà fonctionnel) et dans country-groups.ts (référence
// centrale utilisée par /start) depuis le début — seule CETTE liste
// d'affichage l'omettait, faisant dire à tort "10 pays" alors que 11 pays
// sont réellement couverts (6 Afrique + 5 Europe/Canada, LU inclus).
const COUNTRIES = [
  { flag: '🇸🇳', name: 'Sénégal' },
  { flag: '🇨🇮', name: "Côte d'Ivoire" },
  { flag: '🇧🇯', name: 'Bénin' },
  { flag: '🇹🇬', name: 'Togo' },
  { flag: '🇲🇱', name: 'Mali' },
  { flag: '🇧🇫', name: 'Burkina Faso' },
  { flag: '🇫🇷', name: 'France' },
  { flag: '🇧🇪', name: 'Belgique' },
  { flag: '🇱🇺', name: 'Luxembourg' },
  { flag: '🇨🇭', name: 'Suisse' },
  { flag: '🇨🇦', name: 'Canada' },
]

// "100% mobile" / "depuis ton téléphone" retirés le 2026-10-24 : le
// dashboard a une vraie navigation desktop dédiée (Sidebar.tsx:81,
// `hidden lg:flex`, distincte de BottomNav mobile) — l'exclusivité mobile
// implicite de ces libellés est fausse, le reste (prix, mobile money,
// pas de développeur) n'est pas remis en cause.
const BENEFITS = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    text: 'Boutique prête en quelques minutes',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    text: 'Paiement par mobile money et à la livraison',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
    text: 'Gestion complète, sur mobile ou ordinateur',
  },
]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  // Remplace le compteur de boutiques par celui des commandes passées
  // (2026-10-24, même source que /login d'origine visait déjà à aligner
  // avec la page d'accueil — getPublicOrdersCount est le helper partagé
  // utilisé là-bas, src/lib/public-stats.ts). null si la requête échoue :
  // la ligne correspondante est masquée plus bas, jamais de repli chiffré.
  const ordersCount = await getPublicOrdersCount()

  const { success } = await searchParams
  const paymentReceived = success === '1'

  return (
    <>
      <style>{`
        *{box-sizing:border-box}
        .lp{min-height:100vh;display:grid;grid-template-columns:minmax(460px,1.05fr) minmax(500px,.95fr);font-family:"Inter",ui-sans-serif,system-ui,sans-serif}
        .lp-left{background:radial-gradient(circle at 82% 8%,rgba(24,107,255,.13) 0%,transparent 26%),linear-gradient(155deg,#071a35 0%,#0d2448 65%,#0a1e3d 100%);color:#fff;padding:40px 52px 36px;display:flex;flex-direction:column;position:relative;overflow:hidden}
        .lp-left::after{content:"";position:absolute;right:-150px;bottom:-180px;width:450px;height:450px;border-radius:50%;border:1px solid rgba(255,255,255,.04);box-shadow:0 0 0 60px rgba(255,255,255,.015),0 0 0 120px rgba(255,255,255,.01);pointer-events:none}
        .lp-hero{margin:auto 0;max-width:640px;padding:46px 0 24px;position:relative;z-index:2}
        .lp-eyebrow{display:inline-flex;align-items:center;gap:9px;color:#6fa5ff;font-size:12.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:22px}
        .lp-eyebrow::before{content:"";width:8px;height:8px;border-radius:50%;background:#6fa5ff;box-shadow:0 0 0 5px rgba(111,165,255,.12);flex-shrink:0}
        .lp-h1{font-family:var(--lv6-display,"Bricolage Grotesque","Inter",system-ui,sans-serif);font-size:clamp(40px,4.5vw,68px);line-height:1.04;letter-spacing:-.05em;margin:0 0 20px;color:#fff}
        .lp-h1 span{color:#ffb020}
        .lp-sub{color:#8fb0d0;font-size:16.5px;line-height:1.7;max-width:580px;margin:0}
        .lp-benefits{display:grid;grid-template-columns:1fr 1fr;gap:14px 22px;margin-top:28px}
        .lp-benefit{display:flex;gap:11px;align-items:flex-start;color:#b8cfe8;font-size:14px;line-height:1.45}
        .lp-bico{width:34px;height:34px;border-radius:11px;background:rgba(24,107,255,.12);border:1px solid rgba(67,150,255,.18);display:grid;place-items:center;color:#6fa5ff;flex-shrink:0}
        .lp-countries{margin-top:30px}
        .lp-countries b{display:block;color:#4d6a8a;font-size:10.5px;text-transform:uppercase;letter-spacing:.11em;font-weight:600;margin-bottom:11px}
        .lp-chips{display:flex;flex-wrap:wrap;gap:8px}
        .lp-chip{padding:7px 12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);border-radius:999px;color:#c4d4e5;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:6px}
        .lp-testi{position:relative;z-index:2;border-top:1px solid rgba(255,255,255,.08);padding-top:22px;display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start}
        .lp-testi-ava{position:relative;width:52px;height:52px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid rgba(255,255,255,.18)}
        .lp-right{min-height:100vh;display:flex;flex-direction:column;background:radial-gradient(circle at 85% 5%,rgba(24,107,255,.055) 0%,transparent 22%),#fff;padding:28px 38px 28px}
        .lp-right-top{display:flex;justify-content:flex-end;margin-bottom:0}
        .lp-form-area{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 0 28px}
        .lp-wrap{width:min(100%,500px)}
        .lp-heading{text-align:center;margin-bottom:24px}
        .lp-mini{width:56px;height:56px;border-radius:17px;background:linear-gradient(145deg,#eaf4ff,#fff);border:1px solid #cce5f8;display:grid;place-items:center;margin:0 auto 16px;overflow:hidden}
        .lp-h2{font-family:var(--lv6-display,"Bricolage Grotesque","Inter",system-ui,sans-serif);font-size:29px;font-weight:800;color:#0b1830;letter-spacing:-.035em;margin:0 0 8px}
        .lp-sub2{color:#697893;font-size:14.5px;margin:0}
        .lp-proofs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
        .lp-proof{background:#f7f9fc;border:1px solid #edf0f4;border-radius:13px;padding:11px 8px;text-align:center}
        .lp-proof b{display:block;font-size:13.5px;color:#0b1830;font-weight:800}
        .lp-proof span{font-size:11px;color:#98a2b3}
        .lp-trust{display:none}
        .lp-mobile-header{display:none}
        .lp-terms{margin-top:18px;text-align:center;color:#9ba8bc;font-size:11.5px;line-height:1.6}
        .lp-terms a{text-decoration:underline;color:inherit}
        @media(max-width:1080px){
          .lp{grid-template-columns:1fr 1fr}
          .lp-left{padding:32px 36px}
          .lp-benefits{grid-template-columns:1fr}
          .lp-h1{font-size:48px}
        }
        @media(max-width:820px){
          .lp{display:flex;flex-direction:column}
          .lp-left{display:none}
          .lp-right{padding:0;background:#fff}
          .lp-right-top{display:none}
          .lp-mobile-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0f4f9;background:#fff;flex-shrink:0}
          .lp-form-area{padding:28px 20px 32px;justify-content:flex-start}
          .lp-proofs{grid-template-columns:1fr 1fr}
          .lp-proof:last-child{grid-column:1/-1}
          .lp-trust{display:block;margin-top:18px;padding:14px 16px;border-radius:14px;background:#f7fbfe;border:1px solid #e0eff8}
        }
        @media(max-width:430px){
          .lp-form-area{padding:24px 16px 28px}
          .lp-h2{font-size:25px}
          .lp-sub2{font-size:13.5px}
        }
      `}</style>

      <div className="lp">

        {/* ── Panneau gauche ─────────────────────────────────── */}
        <aside className="lp-left">
          <div style={{ position: 'relative', zIndex: 2 }}>
            <Link href="/">
              <Image src="/logo_white.svg" alt={APP_NAME} width={140} height={42} style={{ height: 42, width: 'auto' }} />
            </Link>
          </div>

          <div className="lp-hero">
            {ordersCount !== null && (
              <p className="lp-eyebrow">+{ordersCount.toLocaleString('fr-FR')} commandes passées sur des boutiques TEKKIShop</p>
            )}
            <h2 className="lp-h1">
              La façon la plus simple<br />
              de <span>vendre en ligne</span><br />
              depuis l&apos;Afrique.
            </h2>
            <p className="lp-sub">
              Crée ta boutique, ajoute tes produits, reçois tes paiements et gère tes commandes depuis ton téléphone. Sans développeur, sans complexité.
            </p>
            <div className="lp-benefits">
              {BENEFITS.map((b) => (
                <div key={b.text} className="lp-benefit">
                  <span className="lp-bico">{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
            <div className="lp-countries">
              <b>11 pays couverts</b>
              <div className="lp-chips">
                {COUNTRIES.map((c) => (
                  <span key={c.name} className="lp-chip">
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Témoignage remplacé le 2026-10-24 : "Fatou D." était une
              personne fictive (avatar générique /avatars/2.jpg, citation
              inventée) — jamais présentée comme telle. Remplacée par la
              citation réelle du fondateur, mot pour mot identique à celle
              validée dans landing-v7 (src/app/preview/landing-v7/page.tsx,
              section "Fondateur", récupérée par lecture directe, pas
              réécrite de mémoire). Aucune étoile : il n'y a pas de système
              de note marchande (déjà établi plus tôt dans ce chantier). */}
          <div className="lp-testi">
            <div className="lp-testi-ava">
              <Image src="/avatars/ibuka.jpg" alt="Ibuka Ndjoli" fill className="object-cover" style={{ objectPosition: '50% 20%' }} sizes="52px" />
            </div>
            <div>
              <p style={{ color: '#c4d4e5', fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 8px' }}>
                « Vendre en ligne depuis l&rsquo;Afrique ne devrait pas être une galère. Notre mission&nbsp;: simplifier la vente pour les marchands, et l&rsquo;achat pour les clients. »
              </p>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: 0 }}>
                Ibuka Ndjoli <span style={{ color: '#4d6a8a', fontWeight: 500 }}>· Fondateur de TEKKIShop · 11 ans d&rsquo;expérience en e-commerce</span>
              </p>
            </div>
          </div>
        </aside>

        {/* ── Panneau droit ──────────────────────────────────── */}
        <main className="lp-right">

          {/* Mobile header */}
          <div className="lp-mobile-header">
            <Link href="/">
              <Image src="/logo.svg" alt={APP_NAME} width={130} height={42} style={{ height: 42, width: 'auto' }} />
            </Link>
            <Link href="/start" style={{ fontSize: 12, fontWeight: 600, color: '#176bff' }}>
              Créer mon site →
            </Link>
          </div>

          {/* Desktop top bar */}
          <div className="lp-right-top">
            <Link href="/" style={{ fontSize: 13, color: '#697893', fontWeight: 600, padding: '9px 12px', borderRadius: 10 }}>
              ← Retour à l&apos;accueil
            </Link>
          </div>

          {/* Zone formulaire */}
          <div className="lp-form-area">
            <div className="lp-wrap">

              {/* Heading */}
              <div className="lp-heading">
                <div className="lp-mini">
                  <Image src="/icone-tekkishop-fallback.png" alt={APP_NAME} width={38} height={38} />
                </div>
                <h1 className="lp-h2">Heureux de te revoir</h1>
                <p className="lp-sub2">Connecte-toi avec ton numéro de téléphone et ton code PIN.</p>
              </div>

              {paymentReceived && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3 mb-5">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">Ton paiement a bien été reçu.</p>
                    <p className="text-xs text-green-600 mt-0.5">Connecte-toi pour voir ton compte activé.</p>
                  </div>
                </div>
              )}

              <LoginForm />

              {/* Statistiques — la 1ère case se masque si ordersCount est
                  null (jamais de repli chiffré) ; la grille repasse à 2
                  colonnes dans ce cas pour ne pas laisser de case vide. */}
              <div className="lp-proofs" style={ordersCount === null ? { gridTemplateColumns: 'repeat(2,1fr)' } : undefined}>
                {ordersCount !== null && (
                  <div className="lp-proof">
                    <b>+{ordersCount.toLocaleString('fr-FR')}</b>
                    <span>commandes passées</span>
                  </div>
                )}
                <div className="lp-proof">
                  <b>11 pays</b>
                  <span>déjà disponibles</span>
                </div>
                <div className="lp-proof">
                  <b>Mobile ou ordinateur</b>
                  <span>création et gestion</span>
                </div>
              </div>

              {/* Section confiance mobile */}
              <div className="lp-trust">
                <p style={{ fontWeight: 700, fontSize: 13.5, color: '#0b1830', margin: '0 0 4px' }}>
                  Une expérience pensée pour les entrepreneurs africains
                </p>
                <p style={{ color: '#697893', fontSize: 12.5, margin: 0 }}>
                  Paiements locaux, WhatsApp, gestion mobile et support humain.
                </p>
              </div>

              <p className="lp-terms">
                En continuant, tu acceptes nos{' '}
                <Link href="/legal/cgu">CGU</Link>
                {' '}et notre{' '}
                <Link href="/legal/privacy">politique de confidentialité</Link>.
              </p>
            </div>
          </div>
        </main>

      </div>
    </>
  )
}
