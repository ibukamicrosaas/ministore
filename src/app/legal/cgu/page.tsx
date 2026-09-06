import type { Metadata } from 'next'

export const metadata: Metadata = { title: "Conditions Générales d'Utilisation — TEKKIShop" }

/**
 * ⚠️ AVANT PUBLICATION — points à valider par un juriste :
 *  - L'entité éditrice (Dukka) : dénomination sociale exacte, forme juridique,
 *    numéro d'immatriculation. Adresse du siège fournie par l'utilisateur le
 *    2026-09-06 (12, Ouest-Foire, Dakar - Sénégal), déjà reportée ci-dessous —
 *    forme juridique et immatriculation restent à compléter.
 *  - L'article 17 (droit applicable) : le service est fourni dans 11 pays, dont
 *    5 soumis au droit de la consommation européen. Une clause de compétence
 *    exclusive au Sénégal peut être inopposable à un utilisateur consommateur
 *    de l'UE. À arbitrer.
 *  - L'article 11 (données des clients finaux) : le partage de responsabilité
 *    entre le marchand et TEKKIShop doit être cohérent avec la politique de
 *    confidentialité et, le cas échéant, avec un accord de sous-traitance.
 */

export default function CGUPage() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{"Conditions Générales d'Utilisation"}</h1>
      <p className="text-sm text-gray-400 mb-8">Dernière mise à jour : août 2026</p>

      <Section title="1. Présentation de TEKKIShop">
        <p>TEKKIShop est une plateforme en ligne qui permet aux commerçants et entrepreneurs de créer une boutique en ligne depuis leur téléphone, de présenter leurs produits, de recevoir des commandes et d&apos;encaisser des paiements par mobile money.</p>
        <p>TEKKIShop est édité et exploité par <strong>Dukka</strong>{/* TODO : forme juridique, immatriculation */}, dont le siège est établi au 12, Ouest-Foire, Dakar - Sénégal.</p>
        <p>Contact : <a href="mailto:contact@tekki.shop" className="text-[var(--color-primary)]">contact@tekki.shop</a></p>
      </Section>

      <Section title="2. Acceptation des conditions">
        <p>En créant un compte sur TEKKIShop, vous acceptez pleinement et sans réserve les présentes Conditions Générales d&apos;Utilisation. Si vous ne les acceptez pas, vous ne pouvez pas utiliser le service.</p>
        <p>Ces conditions s&apos;appliquent au <strong>vendeur</strong> qui crée et exploite une boutique. Les relations entre un vendeur et ses propres clients relèvent de la responsabilité du vendeur.</p>
      </Section>

      <Section title="3. Accès au service et création de compte">
        <p>TEKKIShop est accessible depuis le site <strong>tekki.shop</strong>. La création d&apos;une boutique ne nécessite ni ordinateur, ni compétence technique, ni carte bancaire.</p>
        <p>L&apos;accès à votre espace de gestion nécessite un compte, créé avec un <strong>numéro de téléphone WhatsApp</strong> et un <strong>code PIN à 6 chiffres</strong>. Ce code protège l&apos;accès à vos ventes et à vos revenus : vous êtes seul responsable de sa confidentialité.</p>
        <p>Le service est disponible dans les pays listés sur le site. La liste peut évoluer.</p>
      </Section>

      <Section title="4. Mise en ligne de votre boutique">
        <p>Votre boutique devient <strong>publique dès la publication de votre premier produit</strong>. Aucun paiement n&apos;est requis pour qu&apos;elle soit visible et qu&apos;elle puisse recevoir des commandes.</p>
        <p>Tant que vous n&apos;avez pas souscrit à un plan, votre boutique fonctionne dans les limites suivantes :</p>
        <ul>
          <li><strong>3 commandes offertes</strong>, décomptées à la réception de chaque commande, quel que soit son moyen de paiement et qu&apos;elle soit ensuite honorée, annulée ou non aboutie ;</li>
          <li><strong>14 jours</strong> à compter de la mise en ligne de votre boutique.</li>
        </ul>
        <p>La première de ces deux limites atteinte met fin à la période sans engagement. Une prolongation de 7 jours peut être accordée une fois, dans les conditions indiquées dans votre espace de gestion.</p>
      </Section>

      <Section title="5. Commandes reçues au-delà de la période sans engagement">
        <p>Lorsque la période sans engagement prend fin, votre boutique <strong>reste visible</strong> et vos clients peuvent continuer à passer commande. Les commandes reçues sont alors <strong>enregistrées mais retenues</strong> jusqu&apos;à l&apos;activation d&apos;un plan.</p>
        <p>Pendant cette période :</p>
        <ul>
          <li>vous voyez le montant, le nombre d&apos;articles et la date de chaque commande retenue ;</li>
          <li><strong>les coordonnées du client ne vous sont pas communiquées</strong> et les actions de traitement sont indisponibles ;</li>
          <li>si la commande porte exclusivement sur des produits téléchargeables, le paiement est encaissé et le fichier est délivré automatiquement au client ; <strong>les sommes correspondantes vous sont acquises mais restent bloquées</strong> jusqu&apos;à l&apos;activation ;</li>
          <li>si la commande comporte au moins un produit physique, <strong>aucun paiement en ligne n&apos;est encaissé</strong> ;</li>
          <li>au-delà d&apos;un certain nombre de commandes retenues non traitées, votre boutique cesse d&apos;accepter de nouvelles commandes afin de ne pas laisser vos clients sans réponse.</li>
        </ul>
        <p>Toutes les commandes retenues, ainsi que les sommes bloquées, vous sont restituées dès l&apos;activation d&apos;un plan. Aucune commande n&apos;est supprimée et aucune somme n&apos;est perdue. Les sommes bloquées vous restent dues sans limitation de durée.</p>
      </Section>

      <Section title="6. Plans et abonnements">
        <p>TEKKIShop propose trois plans mensuels : <strong>Découverte</strong>, <strong>Business</strong> et <strong>Pro</strong>. Le contenu et les tarifs de chaque plan sont indiqués sur la page Tarifs et peuvent évoluer.</p>
        <p>Les abonnements sont payables d&apos;avance, par mobile money ou par carte bancaire. Ils sont sans engagement de durée : vous pouvez y mettre fin à tout moment, sans préavis. Les sommes déjà versées ne sont pas remboursables au prorata, sauf disposition contraire.</p>
        <p>En cas de modification tarifaire, les abonnés en cours conservent leur tarif tant que leur abonnement reste actif et ininterrompu.</p>
        <p>Si votre abonnement prend fin, votre boutique cesse d&apos;accepter de nouvelles commandes. Vos produits, vos commandes et vos données sont conservés et redeviennent accessibles dès la réactivation.</p>
      </Section>

      <Section title="7. Paiements en ligne, commission et reversements">
        <p>Les paiements effectués en ligne par vos clients transitent par notre prestataire de paiement et sont collectés sur un compte TEKKIShop avant de vous être reversés.</p>
        <p>Une <strong>commission de 3 %</strong> est prélevée sur chaque paiement collecté en ligne. Cette commission couvre les frais du prestataire de paiement et les frais de transfert lors du reversement. Aucune commission n&apos;est prélevée sur les paiements effectués directement entre vous et votre client, notamment à la livraison.</p>
        <p>Le solde disponible s&apos;entend net de commission. Vous en demandez le reversement depuis votre espace de gestion, vers le compte mobile money que vous indiquez. Vous êtes responsable de l&apos;exactitude de ce numéro.</p>
        <p>TEKKIShop n&apos;est pas partie au contrat de vente conclu entre vous et votre client, et n&apos;intervient qu&apos;en qualité d&apos;intermédiaire technique d&apos;encaissement.</p>
      </Section>

      <Section title="8. Obligations du vendeur">
        <p>En utilisant TEKKIShop, vous vous engagez à :</p>
        <ul>
          <li>fournir des informations exactes et à jour sur votre boutique et vos produits, notamment le prix, la disponibilité et les frais de livraison ;</li>
          <li>honorer les commandes passées sur votre boutique, ou informer le client dans les meilleurs délais si vous ne le pouvez pas ;</li>
          <li>respecter la réglementation applicable dans votre pays, notamment en matière de commerce, de fiscalité et de protection des consommateurs ;</li>
          <li>respecter les droits de vos clients, en particulier en matière de données personnelles ;</li>
          <li>maintenir la confidentialité de votre code PIN et nous signaler tout accès non autorisé ;</li>
          <li>ne pas tenter de contourner les limites du service ni ses mesures de sécurité.</li>
        </ul>
      </Section>

      <Section title="9. Produits et contenus interdits">
        <p>Il vous est interdit de proposer sur votre boutique des produits ou contenus illicites, notamment : produits contrefaits, stupéfiants, armes, médicaments soumis à prescription, espèces protégées, contenus à caractère pornographique, contenus incitant à la haine ou à la violence, ainsi que tout produit dont la vente est réglementée sans que vous disposiez des autorisations requises.</p>
        <p>TEKKIShop peut retirer un produit ou suspendre une boutique en cas de manquement, sans préavis.</p>
      </Section>

      <Section title="10. Suspension et modération">
        <p>TEKKIShop peut suspendre l&apos;accès à une boutique, la rendre invisible ou résilier un compte en cas de violation des présentes conditions, d&apos;activité frauduleuse, ou de signalement sérieux d&apos;un tiers.</p>
        <p>Sauf urgence ou obligation légale, vous en êtes informé et disposez de la possibilité de faire valoir vos observations.</p>
      </Section>

      <Section title="11. Données de vos clients">
        <p>Les données personnelles de vos clients (nom, téléphone, adresse, historique de commandes) sont collectées via votre boutique pour votre compte. Vous en êtes responsable et vous engagez à ne les utiliser qu&apos;aux fins pour lesquelles elles ont été collectées.</p>
        <p>TEKKIShop héberge ces données et les traite pour votre compte, dans les conditions décrites dans la <a href="/legal/confidentialite" className="text-[var(--color-primary)]">politique de confidentialité</a>.</p>
        <p>Vous vous engagez à ne pas utiliser ces données à des fins de démarchage sans base légale valable, ni à les céder à un tiers.</p>
      </Section>

      <Section title="12. Assistant IA">
        <p>TEKKIShop met à votre disposition un assistant automatisé destiné à vous guider et vous conseiller. Ses réponses sont générées automatiquement et fournies à titre indicatif : elles ne constituent ni un conseil professionnel, ni une garantie de résultat. Vous restez seul décisionnaire de vos choix commerciaux.</p>
      </Section>

      <Section title="13. Disponibilité du service">
        <p>TEKKIShop s&apos;efforce de maintenir le service disponible en permanence. Des interruptions peuvent survenir pour maintenance ou pour des raisons techniques. TEKKIShop ne peut être tenu responsable des interruptions indépendantes de sa volonté, notamment celles imputables aux opérateurs de télécommunications ou aux prestataires de paiement.</p>
      </Section>

      <Section title="14. Propriété intellectuelle">
        <p>Les éléments composant TEKKIShop — logiciel, code, marque, logo, design, textes — demeurent la propriété exclusive de Dukka. Aucune disposition des présentes ne vous confère de droit de propriété sur ces éléments.</p>
        <p>Les contenus que vous publiez sur votre boutique — photos, descriptions, logo — restent votre propriété. Vous concédez à TEKKIShop le droit de les afficher aux fins de fonctionnement du service.</p>
      </Section>

      <Section title="15. Limitation de responsabilité">
        <p>TEKKIShop est fourni en l&apos;état. Dukka ne garantit aucun niveau de chiffre d&apos;affaires, de fréquentation ni de résultat commercial : le succès de votre boutique dépend de vos propres efforts.</p>
        <p>Dukka ne peut être tenu responsable des dommages indirects, pertes de revenus ou pertes de données résultant de l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser le service, ni des litiges survenant entre un vendeur et ses clients.</p>
      </Section>

      <Section title="16. Résiliation et récupération de vos données">
        <p>Vous pouvez cesser d&apos;utiliser TEKKIShop à tout moment depuis votre espace de gestion.</p>
        <p>En cas de résiliation, vos données sont conservées pendant la durée indiquée dans la politique de confidentialité, et vous pouvez en demander l&apos;export. Passé ce délai, elles sont supprimées ou anonymisées, sous réserve des obligations légales de conservation.</p>
      </Section>

      <Section title="17. Modification des conditions">
        <p>Les présentes conditions peuvent être modifiées. Vous êtes informé des modifications substantielles par WhatsApp ou lors de votre connexion suivante. La poursuite de l&apos;utilisation du service après notification vaut acceptation.</p>
      </Section>

      <Section title="18. Droit applicable et différends">
        <p>Les présentes conditions sont soumises au droit sénégalais.</p>
        <p>En cas de différend, les parties s&apos;engagent à rechercher une solution amiable avant toute action contentieuse. À défaut, les tribunaux de Dakar seront compétents, sans préjudice des dispositions impératives protégeant les consommateurs dans leur pays de résidence.</p>
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
