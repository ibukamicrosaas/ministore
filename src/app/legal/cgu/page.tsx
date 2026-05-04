import type { Metadata } from 'next'

export const metadata: Metadata = { title: "Conditions Générales d'Utilisation — TekkiShop" }

export default function CGUPage() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{"Conditions Générales d'Utilisation"}</h1>
      <p className="text-sm text-gray-400 mb-8">Dernière mise à jour : mai 2026</p>

      <Section title="1. Présentation de TekkiShop">
        <p>TekkiShop est une plateforme SaaS permettant aux commerçants et petits vendeurs de créer un mini site marchand en ligne, gérer leurs produits, recevoir des commandes et encaisser des paiements via Mobile Money. TekkiShop est édité et exploité par Tekki Studio, basé à Dakar, Sénégal.</p>
        <p>Contact : <a href="mailto:contact@tekki.shop" className="text-[var(--color-primary)]">contact@tekki.shop</a></p>
      </Section>

      <Section title="2. Acceptation des CGU">
        <p>En créant un compte sur TekkiShop, vous acceptez pleinement et sans réserve les présentes Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, vous ne pouvez pas utiliser le service.</p>
      </Section>

      <Section title="3. Accès au service">
        <p>TekkiShop est accessible via le site <strong>tekki.shop</strong>. L'accès nécessite la création d'un compte avec un numéro de téléphone WhatsApp et un code PIN à 6 chiffres.</p>
        <p>TekkiShop propose :</p>
        <ul>
          <li>Un essai gratuit de 14 jours sans carte bancaire</li>
          <li>Des plans payants (Starter, Pro, Multi-boutique) activés via Mobile Money</li>
        </ul>
      </Section>

      <Section title="4. Obligations de l'utilisateur">
        <p>En utilisant TekkiShop, vous vous engagez à :</p>
        <ul>
          <li>Fournir des informations exactes et à jour sur vos produits et votre boutique</li>
          <li>Ne pas utiliser le service à des fins illégales ou frauduleuses</li>
          <li>Ne pas tenter de contourner les mesures de sécurité</li>
          <li>Respecter les droits de vos clients (consentement, protection des données)</li>
          <li>Maintenir la confidentialité de votre code PIN</li>
          <li>Honorer les commandes passées sur votre mini site</li>
        </ul>
      </Section>

      <Section title="5. Données des clients">
        <p>En tant que vendeur utilisant TekkiShop, vous êtes responsable des données personnelles de vos clients collectées via la plateforme (nom, numéro de téléphone, historique de commandes). Vous vous engagez à traiter ces données conformément à la législation applicable et à ne les utiliser qu'aux fins pour lesquelles elles ont été collectées.</p>
      </Section>

      <Section title="6. Paiements et commissions">
        <p>Les paiements en ligne effectués par vos clients via TekkiShop transitent par la plateforme Bictorys. Une commission de 3% est prélevée par TekkiShop sur chaque paiement en ligne collecté. Les reversements aux vendeurs sont effectués via Wave ou Orange Money dans les délais convenus.</p>
        <p>Les abonnements mensuels sont payables d'avance et non remboursables sauf disposition contraire.</p>
      </Section>

      <Section title="7. Disponibilité du service">
        <p>TekkiShop s'efforce de maintenir le service disponible 24h/24 et 7j/7. Cependant, des interruptions pour maintenance ou pour des raisons techniques peuvent survenir. TekkiShop ne peut être tenu responsable des interruptions de service indépendantes de sa volonté.</p>
      </Section>

      <Section title="8. Propriété intellectuelle">
        <p>Tous les éléments du site TekkiShop (logo, design, code, textes) sont la propriété exclusive de Tekki Studio. Toute reproduction sans autorisation est interdite.</p>
      </Section>

      <Section title="9. Limitation de responsabilité">
        <p>TekkiShop est fourni "tel quel". Tekki Studio ne peut être tenu responsable des dommages indirects, pertes de revenus ou pertes de données résultant de l'utilisation ou de l'impossibilité d'utiliser le service.</p>
      </Section>

      <Section title="10. Résiliation">
        <p>Vous pouvez cesser d'utiliser TekkiShop à tout moment. Tekki Studio se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes CGU, sans préavis ni remboursement.</p>
      </Section>

      <Section title="11. Modifications des CGU">
        <p>TekkiShop se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications importantes. L'utilisation continue du service après notification vaut acceptation des nouvelles conditions.</p>
      </Section>

      <Section title="12. Droit applicable">
        <p>Les présentes CGU sont soumises au droit sénégalais. En cas de litige, les tribunaux compétents de Dakar seront seuls compétents.</p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </section>
  )
}
