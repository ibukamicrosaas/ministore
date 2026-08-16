import Image from 'next/image'
import Link from 'next/link'

const tiktok = (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}>
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06V9.66a5.67 5.67 0 0 0-.77-.05A5.69 5.69 0 1 0 15.54 15.3V8.9a7.35 7.35 0 0 0 4.3 1.38V7.19a4.29 4.29 0 0 1-3.24-1.37Z" />
  </svg>
)

export function LandingFooter() {
  return (
    <footer>
      <div className="container">
        <div className="foot-grid">
          <div className="foot-brand">
            <a href="#top" aria-label="TEKKIShop — Accueil">
              <Image src="/logo_white.svg" alt="TEKKIShop" width={140} height={40} style={{ height: 40, width: 'auto' }} />
            </a>
            <p>La manière simple de créer une boutique en ligne, encaisser par mobile money et gérer ses ventes depuis son téléphone.</p>
            <a className="foot-tt" href="https://www.tiktok.com/@tekki.shop" target="_blank" rel="noopener noreferrer">
              {tiktok}
              Suis-nous sur TikTok
            </a>
          </div>
          <div className="foot-col">
            <h4>Produit</h4>
            <Link href="/#probleme">Pourquoi TEKKIShop</Link>
            <Link href="/#etapes">Comment ça marche</Link>
            <Link href="/#tarifs">Tarifs</Link>
            <Link href="/#faq">FAQ</Link>
          </div>
          <div className="foot-col">
            <h4>Ressources</h4>
            <Link href="/pourquoi-pas-shopify">Pourquoi pas Shopify&nbsp;?</Link>
            <Link href="/produits-digitaux">Vendre des produits digitaux</Link>
            <Link href="/europe-canada">Vendre depuis la Diaspora</Link>
            <Link href="/licence">Devenir licencié TEKKIShop</Link>
          </div>
          <div className="foot-col">
            <h4>Aide</h4>
            <Link href="/aide">Centre d&rsquo;aide</Link>
            <a href="https://www.tiktok.com/@tekki.shop" target="_blank" rel="noopener noreferrer">Nos tutoriels vidéo</a>
            <a href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, '')}`}>Support WhatsApp</a>
            <Link href="/contact">Nous contacter</Link>
          </div>
          <div className="foot-col">
            <h4>Légal</h4>
            <Link href="/legal/cgu">Conditions d&rsquo;utilisation</Link>
            <Link href="/legal/privacy">Confidentialité</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} TEKKIShop. Tous droits réservés.</span>
          <span>Une solution de <a href="https://getdukka.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>Dukka</a>, pensée pour l&rsquo;e-commerce en Afrique.</span>
        </div>
      </div>
    </footer>
  )
}
