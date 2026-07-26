import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Politique de Confidentialité — TekkiShop' }

export default function PrivacyPage() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Politique de Confidentialité</h1>
      <p className="text-sm text-gray-400 mb-8">Dernière mise à jour : juillet 2026</p>

      <Section title="1. Responsable du traitement">
        <p><strong>Tekki Studio</strong>, éditeur de TekkiShop, est le responsable du traitement de vos données personnelles.</p>
        <p>Contact DPO : <a href="mailto:privacy@tekki.shop" className="text-[var(--color-primary)]">privacy@tekki.shop</a></p>
      </Section>

      <Section title="2. Données collectées">
        <p>TekkiShop collecte les données suivantes selon les catégories d'utilisateurs :</p>
        <p><strong>Vendeurs :</strong></p>
        <ul>
          <li>Numéro de téléphone WhatsApp (identifiant du compte)</li>
          <li>Nom, prénom (optionnel)</li>
          <li>Informations de la boutique (nom, adresse, ville, logo)</li>
          <li>Numéros mobile money pour les reversements</li>
          <li>Données de commandes et de revenus</li>
        </ul>
        <p><strong>Clients des boutiques :</strong></p>
        <ul>
          <li>Nom, prénom</li>
          <li>Numéro de téléphone et WhatsApp</li>
          <li>Adresse e-mail (optionnel, si fournie lors de la commande)</li>
          <li>Historique de commandes et produits commandés</li>
        </ul>
        <p><strong>Données de navigation :</strong></p>
        <ul>
          <li>Logs d'erreurs (via Sentry)</li>
          <li>Statistiques d'utilisation anonymisées (via Vercel Analytics)</li>
        </ul>
      </Section>

      <Section title="3. Finalités du traitement">
        <p>Vos données sont traitées pour les finalités suivantes :</p>
        <ul>
          <li>Gestion et sécurisation de votre compte</li>
          <li>Fourniture du service de vente en ligne</li>
          <li>Traitement des paiements et reversements</li>
          <li>Envoi de notifications WhatsApp (confirmations de commande, rappels de livraison)</li>
          <li>Envoi d&apos;e-mails transactionnels (confirmation de commande, si adresse e-mail fournie)</li>
          <li>Amélioration du service et détection d'erreurs</li>
          <li>Communication sur les évolutions du service</li>
        </ul>
      </Section>

      <Section title="4. Base légale du traitement">
        <ul>
          <li><strong>Exécution du contrat</strong> : traitement nécessaire à la fourniture du service</li>
          <li><strong>Intérêt légitime</strong> : amélioration du service, sécurité</li>
          <li><strong>Consentement</strong> : communications marketing (révocable à tout moment)</li>
        </ul>
      </Section>

      <Section title="5. Durée de conservation">
        <ul>
          <li>Données de compte : durée de l'abonnement + 3 ans après résiliation</li>
          <li>Données de commandes : 5 ans (obligations comptables)</li>
          <li>Logs techniques : 30 jours</li>
        </ul>
      </Section>

      <Section title="6. Partage des données">
        <p>Vos données peuvent être partagées avec :</p>
        <ul>
          <li><strong>Supabase</strong> (hébergement base de données, UE)</li>
          <li><strong>Vercel</strong> (hébergement application, UE)</li>
          <li><strong>Bictorys</strong> (traitement des paiements, Sénégal)</li>
          <li><strong>Lafricamobile</strong> (envoi de notifications SMS, Sénégal)</li>
          <li><strong>Resend</strong> (envoi d&apos;e-mails transactionnels, USA)</li>
          <li><strong>Sentry</strong> (monitoring erreurs, USA)</li>
        </ul>
        <p>Ces prestataires sont soumis à des engagements contractuels de protection des données. Aucune donnée n'est vendue à des tiers.</p>
      </Section>

      <Section title="7. Vos droits">
        <p>Conformément à la réglementation applicable, vous disposez des droits suivants :</p>
        <ul>
          <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
          <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
          <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
          <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
          <li><strong>Droit d'opposition</strong> : vous opposer à certains traitements</li>
        </ul>
        <p>Pour exercer ces droits, contactez-nous à <a href="mailto:privacy@tekki.shop" className="text-[var(--color-primary)]">privacy@tekki.shop</a>. Nous répondrons dans un délai de 30 jours.</p>
      </Section>

      <Section title="8. Sécurité">
        <p>TekkiShop met en œuvre des mesures techniques et organisationnelles pour protéger vos données : chiffrement des communications (HTTPS), authentification par code PIN, accès limité aux données en production, monitoring des erreurs et des accès.</p>
      </Section>

      <Section title="9. Cookies et pixels de suivi">
        <p>TekkiShop utilise uniquement des cookies strictement nécessaires au fonctionnement du service (session d&apos;authentification).</p>
        <p>Certains marchands peuvent activer leur propre <strong>Meta Pixel</strong> sur leur boutique TekkiShop. Dans ce cas, votre navigation sur cette boutique peut être transmise à Meta (Facebook) conformément à la politique de confidentialité du marchand. TekkiShop n&apos;a pas accès à ces données et n&apos;en est pas responsable au titre du RGPD ; le marchand est responsable de traitement pour ce suivi.</p>
      </Section>

      <Section title="10. Modifications">
        <p>Cette politique peut être mise à jour. En cas de modification substantielle, vous serez informé par WhatsApp ou lors de votre prochaine connexion.</p>
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
