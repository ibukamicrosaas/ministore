import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Conditions Générales d\'Utilisation — Sheka' }

export default function CGUPage() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Conditions Générales d'Utilisation</h1>
      <p className="text-sm text-gray-400 mb-8">Dernière mise à jour : avril 2026</p>

      <Section title="1. Présentation de Sheka">
        <p>Sheka est une plateforme SaaS de gestion de salons de beauté permettant aux professionnels de créer une page de réservation en ligne, gérer leurs prestations, leur personnel et leurs revenus. Sheka est édité et exploité par Tekki Studio, basé à Dakar, Sénégal.</p>
        <p>Contact : <a href="mailto:contact@sheka.store" className="text-[#E85D04]">contact@sheka.store</a></p>
      </Section>

      <Section title="2. Acceptation des CGU">
        <p>En créant un compte sur Sheka, vous acceptez pleinement et sans réserve les présentes Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, vous ne pouvez pas utiliser le service.</p>
      </Section>

      <Section title="3. Accès au service">
        <p>Sheka est accessible via le site <strong>sheka.store</strong>. L'accès nécessite la création d'un compte avec un numéro de téléphone WhatsApp et un code PIN à 6 chiffres.</p>
        <p>Sheka propose :</p>
        <ul>
          <li>Un essai gratuit de 14 jours sans carte bancaire</li>
          <li>Des plans payants (Starter, Pro, Multi-salon) activés via Mobile Money</li>
        </ul>
      </Section>

      <Section title="4. Obligations de l'utilisateur">
        <p>En utilisant Sheka, vous vous engagez à :</p>
        <ul>
          <li>Fournir des informations exactes et à jour</li>
          <li>Ne pas utiliser le service à des fins illégales ou frauduleuses</li>
          <li>Ne pas tenter de contourner les mesures de sécurité</li>
          <li>Respecter les droits de vos clients (consentement, protection des données)</li>
          <li>Maintenir la confidentialité de votre code PIN</li>
        </ul>
      </Section>

      <Section title="5. Données des clientes">
        <p>En tant que propriétaire de salon utilisant Sheka, vous êtes responsable des données personnelles de vos clientes collectées via la plateforme (nom, numéro de téléphone, historique de réservations). Vous vous engagez à traiter ces données conformément à la législation applicable et à ne les utiliser qu'aux fins pour lesquelles elles ont été collectées.</p>
      </Section>

      <Section title="6. Paiements et commissions">
        <p>Les paiements en ligne effectués par vos clientes via Sheka transitent par la plateforme Bictorys. Une commission de 3% est prélevée par Sheka sur chaque paiement en ligne collecté. Les reversements aux salons sont effectués via Wave ou Orange Money dans les délais convenus.</p>
        <p>Les abonnements mensuels sont payables d'avance et non remboursables sauf disposition contraire.</p>
      </Section>

      <Section title="7. Disponibilité du service">
        <p>Sheka s'efforce de maintenir le service disponible 24h/24 et 7j/7. Cependant, des interruptions pour maintenance ou pour des raisons techniques peuvent survenir. Sheka ne peut être tenu responsable des interruptions de service indépendantes de sa volonté.</p>
      </Section>

      <Section title="8. Propriété intellectuelle">
        <p>Tous les éléments du site Sheka (logo, design, code, textes) sont la propriété exclusive de Tekki Studio. Toute reproduction sans autorisation est interdite.</p>
      </Section>

      <Section title="9. Limitation de responsabilité">
        <p>Sheka est fourni "tel quel". Tekki Studio ne peut être tenu responsable des dommages indirects, pertes de revenus ou pertes de données résultant de l'utilisation ou de l'impossibilité d'utiliser le service.</p>
      </Section>

      <Section title="10. Résiliation">
        <p>Vous pouvez cesser d'utiliser Sheka à tout moment. Tekki Studio se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes CGU, sans préavis ni remboursement.</p>
      </Section>

      <Section title="11. Modifications des CGU">
        <p>Sheka se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications importantes. L'utilisation continue du service après notification vaut acceptation des nouvelles conditions.</p>
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
