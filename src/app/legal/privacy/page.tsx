import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Politique de Confidentialité — TEKKIShop' }

/**
 * ⚠️ AVANT PUBLICATION — points à valider :
 *  - L'entité (Dukka) : dénomination, immatriculation, siège.
 *  - Le fournisseur du modèle d'IA utilisé par l'Assistant : à nommer
 *    explicitement à l'article 6, ainsi que le pays d'hébergement.
 *  - Le statut de TEKKIShop vis-à-vis des données des clients finaux
 *    (sous-traitant du marchand) doit être cohérent avec les CGU et,
 *    pour les marchands établis dans l'UE, formalisé par un accord de
 *    sous-traitance au sens de l'article 28 du RGPD.
 *  - Les durées de conservation ci-dessous doivent correspondre à ce que
 *    fait réellement le code (purge des brouillons, logs, sauvegardes).
 */

export default function PrivacyPage() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Politique de Confidentialité</h1>
      <p className="text-sm text-gray-400 mb-8">Dernière mise à jour : août 2026</p>

      <Section title="1. Responsable du traitement">
        <p><strong>Dukka</strong>{/* TODO : forme juridique, immatriculation, siège */}, éditeur de TEKKIShop, est responsable du traitement des données décrites ci-après.</p>
        <p>Contact : <a href="mailto:privacy@tekki.shop" className="text-[var(--color-primary)]">privacy@tekki.shop</a></p>
      </Section>

      <Section title="2. Qui est responsable de quoi">
        <p>Deux situations doivent être distinguées.</p>
        <p><strong>Vos données de vendeur</strong> — compte, boutique, revenus, échanges avec le support : TEKKIShop en est responsable de traitement.</p>
        <p><strong>Les données des clients d&apos;une boutique</strong> — nom, téléphone, adresse, commandes : le vendeur en est responsable. TEKKIShop les héberge et les traite <strong>pour son compte</strong>, en qualité de sous-traitant, selon ses instructions et dans les limites du service.</p>
        <p>Si vous êtes client d&apos;une boutique et souhaitez exercer vos droits, adressez-vous en premier lieu au vendeur concerné. Nous pouvons vous aider à l&apos;identifier.</p>
      </Section>

      <Section title="3. Données collectées">
        <p><strong>Vendeurs :</strong></p>
        <ul>
          <li>numéro de téléphone WhatsApp, servant d&apos;identifiant de compte</li>
          <li>code PIN, conservé sous forme chiffrée et jamais lisible en clair</li>
          <li>informations de la boutique : nom, activité, ville, pays, logo, couverture</li>
          <li>réponses fournies lors de la création de la boutique : type de produits vendus, canal de vente actuel, principal frein rencontré</li>
          <li>numéro mobile money utilisé pour les reversements</li>
          <li>données de commandes, de revenus et de retraits</li>
          <li>échanges avec l&apos;Assistant IA et avec le support</li>
        </ul>
        <p><strong>Clients des boutiques :</strong></p>
        <ul>
          <li>nom et prénom</li>
          <li>numéro de téléphone et WhatsApp</li>
          <li>adresse de livraison et ville</li>
          <li>adresse e-mail, si fournie</li>
          <li>historique de commandes et produits commandés</li>
        </ul>
        <p><strong>Visiteurs d&apos;une boutique :</strong></p>
        <ul>
          <li>un compteur d&apos;ouvertures de page, agrégé par boutique et par jour. Ce comptage <strong>n&apos;utilise ni cookie, ni identifiant, ni adresse IP conservée</strong> et ne permet pas d&apos;identifier une personne.</li>
        </ul>
        <p><strong>Liste d&apos;attente :</strong></p>
        <ul>
          <li>si vous demandez à être prévenu de l&apos;ouverture de TEKKIShop dans votre pays : pays indiqué et numéro WhatsApp.</li>
        </ul>
        <p><strong>Données techniques :</strong></p>
        <ul>
          <li>journaux d&apos;erreurs applicatives</li>
          <li>statistiques d&apos;utilisation agrégées</li>
        </ul>
      </Section>

      <Section title="4. Finalités">
        <ul>
          <li>création, sécurisation et gestion de votre compte et de votre boutique</li>
          <li>fourniture du service : catalogue, commandes, paiements, livraison</li>
          <li>encaissement des paiements en ligne et reversement de vos revenus</li>
          <li>notifications WhatsApp, SMS et e-mail liées à votre activité</li>
          <li>personnalisation de votre espace de gestion à partir des réponses fournies à la création</li>
          <li>fonctionnement de l&apos;Assistant IA</li>
          <li>mesure de fréquentation de votre boutique, à votre seule destination</li>
          <li>amélioration du service, prévention de la fraude et détection d&apos;incidents</li>
          <li>information sur les évolutions du service</li>
        </ul>
      </Section>

      <Section title="5. Bases légales">
        <ul>
          <li><strong>Exécution du contrat</strong> : tout ce qui est nécessaire à la fourniture du service</li>
          <li><strong>Obligation légale</strong> : conservation comptable, lutte contre la fraude</li>
          <li><strong>Intérêt légitime</strong> : sécurité, amélioration du service, mesure d&apos;audience agrégée</li>
          <li><strong>Consentement</strong> : liste d&apos;attente et communications non liées au service, révocable à tout moment</li>
        </ul>
      </Section>

      <Section title="6. Destinataires et prestataires">
        <p>Vos données peuvent être communiquées aux prestataires suivants, uniquement pour ce qui est nécessaire au service :</p>
        <ul>
          <li><strong>Supabase</strong> — hébergement de la base de données (Union européenne)</li>
          <li><strong>Vercel</strong> — hébergement de l&apos;application (Union européenne)</li>
          <li><strong>Bictorys</strong> — traitement des paiements mobile money (Sénégal)</li>
          <li><strong>Stripe</strong> — traitement des paiements par carte bancaire</li>
          <li><strong>Lafricamobile</strong> — envoi de SMS et de messages WhatsApp (Sénégal)</li>
          <li><strong>Resend</strong> — envoi d&apos;e-mails transactionnels (États-Unis)</li>
          <li><strong>Sentry</strong> — supervision des erreurs applicatives (États-Unis)</li>
          <li><strong>{/* TODO : nommer le fournisseur du modèle */}</strong> — fonctionnement de l&apos;Assistant IA. Le contenu de vos échanges avec l&apos;Assistant est transmis à ce prestataire pour générer une réponse.</li>
        </ul>
        <p>Ces prestataires sont soumis à des engagements contractuels de protection des données. <strong>Aucune donnée n&apos;est vendue à un tiers.</strong></p>
        <p>Certains prestataires étant établis hors de l&apos;Union européenne et hors du Sénégal, les transferts correspondants sont encadrés par les garanties appropriées prévues par la réglementation applicable.</p>
      </Section>

      <Section title="7. Durées de conservation">
        <ul>
          <li>boutiques créées mais jamais finalisées : supprimées après 7 jours</li>
          <li>données de compte et de boutique : durée d&apos;utilisation du service, puis 3 ans</li>
          <li>données de commandes et de paiements : 5 ans, au titre des obligations comptables</li>
          <li>échanges avec l&apos;Assistant IA et le support : 12 mois</li>
          <li>compteur de visites : 24 mois, sous forme agrégée</li>
          <li>liste d&apos;attente : jusqu&apos;à l&apos;ouverture du pays concerné ou 24 mois</li>
          <li>journaux techniques : 30 jours</li>
        </ul>
      </Section>

      <Section title="8. Vos droits">
        <p>Vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition et de portabilité de vos données, ainsi que du droit de définir des directives relatives à leur sort après votre décès.</p>
        <p>Pour les exercer, écrivez à <a href="mailto:privacy@tekki.shop" className="text-[var(--color-primary)]">privacy@tekki.shop</a>. Nous répondons sous 30 jours.</p>
        <p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir l&apos;autorité de contrôle compétente : la <strong>Commission de Protection des Données Personnelles</strong> au Sénégal, ou l&apos;autorité de votre pays de résidence si vous êtes établi dans l&apos;Union européenne.</p>
      </Section>

      <Section title="9. Sécurité">
        <p>Nous mettons en œuvre des mesures techniques et organisationnelles adaptées : chiffrement des communications, authentification par code PIN chiffré, cloisonnement des accès en production, supervision des erreurs et des accès.</p>
        <p>Certaines informations sont volontairement inaccessibles selon l&apos;état de la boutique : les coordonnées d&apos;un client dont la commande est retenue ne sont pas communiquées au vendeur tant que sa boutique n&apos;est pas activée.</p>
      </Section>

      <Section title="10. Cookies et mesure d'audience">
        <p>TEKKIShop utilise uniquement des cookies strictement nécessaires au fonctionnement du service, notamment pour maintenir votre session. Aucun cookie publicitaire n&apos;est déposé par TEKKIShop.</p>
        <p>La mesure de fréquentation des boutiques est réalisée sans cookie et sans identifiant, sous forme d&apos;un simple comptage agrégé.</p>
        <p>Un marchand peut activer son propre <strong>Meta Pixel</strong> sur sa boutique. Dans ce cas, votre navigation sur cette boutique peut être transmise à Meta selon les choix de ce marchand, qui en est seul responsable. TEKKIShop n&apos;a pas accès à ces données.</p>
      </Section>

      <Section title="11. Modifications">
        <p>Cette politique peut être mise à jour. En cas de modification substantielle, vous en êtes informé par WhatsApp ou lors de votre connexion suivante.</p>
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
