import Image from 'next/image'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { SPECIALTY_TO_LABEL } from '@/app/start/data'

// Variante locale à landing-v7, jamais RealShopsShowcase.tsx (partagé avec
// / et les pages pays, non modifié — accord explicite requis pour y
// toucher). Mêmes boutiques que la liste manuelle de la page (shopIds
// passés depuis page.tsx), mais filtre supplémentaire status='active' en
// plus de is_active=true : is_active seul reste true pour un essai
// free_orders expiré (voir plan-features/shop-status), status='active' ne
// l'est que pour trial_model='legacy' (toujours vrai ici) ou un
// free_orders réellement payant — exclut une boutique vitrine qui aurait
// basculé en essai expiré entre deux visites.
interface Props {
  shopIds: string[]
}

// Masque la description entière (jamais une coupe partielle) si elle
// contient un e-mail, une URL/wa.me, ou une suite de chiffres de type
// téléphone — trouvé en vrai sur ABI&CO ("+225 07 10 23 30 59") en
// vérifiant les 3 boutiques actuelles, pas une précaution théorique.
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/
const URL_RE   = /https?:\/\/|www\.|wa\.me/i
const PHONE_RE = /(\+?\d[\d\s.\-]{5,}\d)/
function isDescriptionSafe(desc: string | null): desc is string {
  if (!desc || !desc.trim()) return false
  return !EMAIL_RE.test(desc) && !URL_RE.test(desc) && !PHONE_RE.test(desc)
}

export async function RealShopsShowcaseV7({ shopIds }: Props) {
  if (shopIds.length === 0) return null

  const admin = createAdminClient()
  // cover_image_url/description absents des types générés (comme déjà
  // rencontré dans [shop-slug]/page.tsx:27) — cast explicite, même
  // convention.
  const { data } = await admin
    .from('shops')
    .select('id, slug, name, specialty, logo_url, cover_image_url, primary_color, description')
    .in('id', shopIds)
    .eq('is_active', true)
    .eq('status', 'active') as unknown as {
      data: {
        id: string; slug: string; name: string; specialty: string | null
        logo_url: string | null; cover_image_url: string | null; primary_color: string | null
        description: string | null
      }[] | null
    }

  const shops = (data ?? []).slice().sort(
    (a, b) => shopIds.indexOf(a.id) - shopIds.indexOf(b.id)
  )
  if (shops.length === 0) return null

  // Image de couverture : cover_image_url réel en priorité ; à défaut,
  // photo du premier produit actif (display_order le plus bas) ; à défaut,
  // dégradé de primary_color avec le logo — jamais de capture de page
  // boutique (numéro WhatsApp visible, pages bientôt remaniées).
  const withCovers = await Promise.all(shops.map(async (s) => {
    let coverUrl = s.cover_image_url as string | null
    if (!coverUrl) {
      const { data: product } = await admin
        .from('products')
        .select('photo_url, photos')
        .eq('shop_id', s.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(1)
        .maybeSingle()
      const photos = product?.photos as { url: string; is_primary?: boolean }[] | null
      coverUrl = product?.photo_url ?? photos?.find(p => p.is_primary)?.url ?? photos?.[0]?.url ?? null
    }
    return { ...s, resolvedCover: coverUrl }
  }))

  // Boucle infinie (CSS pur, liste dupliquée) seulement à partir de 6
  // boutiques — en dessous, un défilement en boucle sur une poignée de
  // cartes répéterait le même contenu trop vite, sans intérêt. Aujourd'hui
  // 3 boutiques réelles : rendu simple, pas de duplication, inchangé.
  const useMarquee = withCovers.length >= 6

  function renderCard(s: typeof withCovers[number], opts: { duplicate?: boolean } = {}) {
    const safeDescription = isDescriptionSafe(s.description) ? s.description : null
    return (
      <Link
        key={opts.duplicate ? `${s.id}-dup` : s.id}
        href={`/${s.slug}`}
        className="shop-card--v7"
        tabIndex={opts.duplicate ? -1 : undefined}
      >
        <div className="shop-card-cover--v7" style={!s.resolvedCover ? { background: `linear-gradient(135deg, ${s.primary_color ?? '#1d5ce6'}, #0b1830)` } : undefined}>
          {s.resolvedCover ? (
            <Image src={s.resolvedCover} alt="" fill sizes="(max-width: 760px) 80vw, 360px" style={{ objectFit: 'cover' }} />
          ) : (
            s.logo_url && <Image src={s.logo_url} alt="" width={56} height={56} className="shop-card-cover-logo--v7" />
          )}
        </div>
        <div className="shop-card-body--v7">
          <div className="shop-card-logo--v7">
            {s.logo_url ? (
              <Image src={s.logo_url} alt={s.name} width={40} height={40} />
            ) : (
              <span>{s.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <b>{s.name}</b>
            <small>{(s.specialty && SPECIALTY_TO_LABEL[s.specialty]) || 'Boutique en ligne'}</small>
          </div>
        </div>
        {safeDescription && (
          <div className="shop-card-desc-wrap--v7">
            <p className="shop-card-desc--v7">{safeDescription}</p>
          </div>
        )}
        <span className="shop-card-visit--v7">Visiter →</span>
      </Link>
    )
  }

  if (!useMarquee) {
    return (
      <div className="shops-grid--v7">
        {withCovers.map((s) => renderCard(s))}
      </div>
    )
  }

  return (
    <div className="shops-marquee-fullbleed-wrap--v7">
      <div className="shops-marquee-track--v7">
        <div className="shops-marquee-set--v7">
          {withCovers.map((s) => renderCard(s))}
        </div>
        {/* Copie dupliquée pour la boucle CSS — aria-hidden + non focusable,
            jamais lue/atteinte deux fois au clavier ou au lecteur d'écran.
            Masquée en CSS sous 900px : la boucle n'existe qu'en défilement
            automatique desktop, jamais sur le carrousel tactile mobile. */}
        <div className="shops-marquee-set--v7 shops-marquee-dup--v7" aria-hidden="true">
          {withCovers.map((s) => renderCard(s, { duplicate: true }))}
        </div>
      </div>
    </div>
  )
}
