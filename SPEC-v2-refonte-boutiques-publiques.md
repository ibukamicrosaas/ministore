# SPEC v2 — Refonte des boutiques publiques TEKKIShop

**Périmètre :** page d'accueil boutique, page produit, tunnel de commande.
**Hors périmètre :** tableau de bord marchand (sauf les 4 réglages du §9), tunnel de paiement Bictorys, landing tekki.shop.

**Maquettes de référence :** `tekkishop-boutique-accueil.html` et `tekkishop-boutique-produit.html`. Elles définissent la structure, la hiérarchie et les textes — pas la stack. Elles embarquent un basculement « boutique minimale » : c'est le critère de recette du §1, utilise-le.

**Dépendance :** cette spec touche des fichiers communs avec `SPEC-3-commandes-offertes.md`. Là où les deux se croisent — commandes retenues, statut de boutique — **la spec « 3 commandes offertes » fait autorité et n'est pas modifiée ici.**

> ⚠️ **Correction par rapport à la v1 :** la v1 affirmait que les deux specs devaient partir en production ensemble. **C'est faux.** La refonte boutique doit *respecter* le modèle à 3 commandes, qui est déjà implémenté — l'inverse n'est pas vrai. Les deux sortent séquentiellement : le modèle d'essai d'abord, la refonte ensuite.

---

## 1. Les deux règles qui tranchent tous les arbitrages

**Règle A — Un seul gabarit pour les trois plans.**
Découverte, Business et Pro partagent exactement le même code de rendu. Aucune branche conditionnelle sur le plan dans la structure des pages. Ce qui varie est une liste finie de drapeaux (§8), qui **ajoutent** des éléments et n'en dégradent aucun.

> **Ampleur réelle du chantier.** Les captures de production montrent que Pro et Business n'ont pas deux variantes du même gabarit, mais **deux structures différentes** : ABI&CO (Pro) affiche une bannière de couverture puis une colonne d'identité à gauche et le catalogue à droite ; Glow Eternel (Business) affiche un bandeau coloré pleine largeur sans colonne latérale. Ce n'est pas un nettoyage, c'est une unification.

**Règle B — Tout élément dépendant d'une donnée marchand est conditionnel.**
Donnée absente → l'élément disparaît entièrement. Pas de bloc vide, pas de tiret, pas de « Non renseigné », pas de valeur par défaut inventée. La page doit rester dense et vendeuse avec le marchand médian : 4 produits, une photo chacun, une ligne de description, aucune zone de livraison configurée.

**Critère de recette permanent :** toute page testée dans deux états — données complètes et données minimales. Une page qui « a l'air cassée » en données minimales n'est pas livrable.

---

## 2. Bugs visibles en production — à corriger, à reproduire d'abord

Ces défauts sont observables aujourd'hui sur des boutiques réelles. Reproduis chacun avant de le corriger, pour être sûr de traiter la cause.

| # | Constat | Où |
|---|---|---|
| 2.1 | **Le bouton d'achat est affiché deux fois** sur la fiche produit mobile | ABI&CO et Glow Eternel |
| 2.2 | La barre d'achat collante **recouvre le bloc « Livraison estimée »** | ABI&CO mobile |
| 2.3 | **Le prix ne semble pas affiché** dans la colonne d'achat mobile | Glow Eternel mobile — à vérifier |
| 2.4 | Le libellé de l'action change en cours de route : « Commander » en barre haute, **« Je le prends »** sur la fiche | Les deux boutiques |
| 2.5 | Le badge **« NOUVEAU » figure sur 100 % du catalogue** — il ne signale plus rien | ABI&CO |
| 2.6 | Les puces de catégories sont **tronquées** : `BAGC…`, `Beauté, Lait & Crèm…` | Les deux |
| 2.7 | Noms produits **en capitales et tronqués** : `BANDOULIÈRE VERSSE BLEU …` | ABI&CO |
| 2.8 | **Grille en dents de scie** : hauteurs de cartes très inégales selon le format des photos | Glow Eternel |
| 2.9 | **Vide considérable** sous la colonne d'achat desktop, et sous la colonne d'identité de l'accueil | Les deux |
| 2.10 | La galerie produit contient une **vignette parasite** portant le logo de la boutique | Glow Eternel |

**Sur 2.5** — le badge « Nouveau » doit obéir à deux conditions cumulatives : produit publié depuis moins de 14 jours, **et** moins de 30 % du catalogue concerné. Au-delà, le badge disparaît pour tout le monde : un signal porté par tous ne distingue personne.

**Sur 2.10** — identifie d'où vient cette vignette avant de la retirer. Si elle est générée automatiquement, la génération est le bug.

---

## 3. Modèle de données — variantes produit

Prérequis de toute la refonte. ABI&CO vend aujourd'hui **neuf couleurs du même sac comme neuf produits distincts** : le catalogue est illisible, le stock est faux, et la fiche produit ne peut pas jouer son rôle.

```sql
CREATE TABLE product_variants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,        -- « Rouge », « 500 ml », « Format entier »
  price        INTEGER,              -- NULL = hérite de products.price
  compare_at   INTEGER,              -- prix barré, NULL = hérite
  stock        INTEGER,              -- NULL = illimité, cohérent avec products.stock
  image_url    TEXT,                 -- NULL = image principale du produit
  position     INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON product_variants(product_id, position);

ALTER TABLE products
  ADD COLUMN variant_label TEXT;      -- « Couleur », « Taille », « Format ». NULL = pas de variantes
```

### Règles

- Un produit sans variante se comporte exactement comme aujourd'hui. **Aucune migration de données n'est imposée aux marchands existants.**
- `variant_label` non nul **et** au moins une variante active → le sélecteur s'affiche. Sinon, rien.
- Le stock est porté par la variante quand elle existe, sinon par le produit. Une variante à `stock = 0` reste visible mais non sélectionnable.
- `orders.items` stocke `variant_id` **et** `variant_name` figé au moment de la commande : le marchand peut renommer ou supprimer une variante après coup, la commande ne doit pas changer rétroactivement.
- L'interrupteur « Variantes de prix » du formulaire produit est remplacé par ce système. Migration : les variantes de prix existantes deviennent des lignes `product_variants` avec `variant_label = 'Format'`. **Écris la migration, ne la lance pas.**

### Une aide au regroupement, pas une migration forcée

Un marchand comme ABI&CO ne regroupera pas neuf fiches à la main. Prévois, dans le tableau de bord, une **suggestion** : quand plusieurs produits actifs partagent le même prix et un préfixe de nom commun, proposer « Regrouper ces 9 produits en un seul avec 9 couleurs ? », avec aperçu et confirmation.

Jamais automatique, jamais silencieux. Si c'est trop coûteux pour ce lot, dis-le et on le sort — mais ne livre pas les variantes sans chemin de reprise pour l'existant.

---

## 4. Page d'accueil de la boutique

Ordre des blocs identique sur mobile et desktop.

### 4.1 Barre haute (collante)
Logo, nom, badge de vérification si applicable. À droite : recherche, « Appeler » si numéro renseigné, « Écrire » (WhatsApp). Sur mobile, icônes seules.

### 4.2 Bandeau de couverture — conditionnel, Pro
Hauteur 104 px mobile / 168 px desktop. Absent → la page démarre sur la carte d'identité, sans espace résiduel.

### 4.3 Carte d'identité marchand
Logo, nom, badge, ligne de contexte (`catégorie · ville`), délai de réponse (§7), description, liens sociaux, boutons « Écrire » et « Appeler ».

**Les liens sociaux passent sur tous les plans.** Chez ces acheteurs, l'Instagram du vendeur est une preuve d'existence, pas un ornement.

> **Observation à traiter :** ABI&CO a écrit son numéro de téléphone **dans le texte de sa description**, alors qu'un bouton « Appeler » existe. Le marchand ne fait pas confiance au bouton ou ne l'a pas vu. Rends le bouton « Appeler » visible sans défilement sur mobile, et ne détecte pas automatiquement les numéros dans la description — ce serait traiter le symptôme.

### 4.4 Bande de faits — nouveau
Trois cartes maximum, chacune conditionnelle :

1. **Livraison** — si au moins une zone configurée. `Livraison à {ville}` · `Tarif calculé selon ta zone, affiché avant de payer`
2. **Paiement** — si mobile money ou paiement à la livraison actif. **Liste les moyens réellement activés**, jamais une liste générique.
3. **Retour / échange** — uniquement si le marchand a renseigné une politique (§9).

Zéro fait renseigné → la bande entière disparaît.

### 4.5 Coups de cœur — conditionnel

> ⚠️ **La v1 disait « Pro uniquement ». C'est faux :** Glow Eternel est en Business et affiche « Coups de cœur ». Ne te fie pas à la matrice de la v1. **Établis la matrice réelle depuis le code**, présente-la-moi, et on décide ensuite.

### 4.6 Recherche et filtres
Recherche toujours présente. Puis, dans cet ordre de repli : filtres d'intention si définis (§9) → catégories existantes → rien.

Supprime les puces vides et les libellés tronqués (2.6). Une puce dont le libellé ne tient pas est raccourcie proprement, jamais coupée au milieu d'un mot.

### 4.7 Grille produits
- 2 colonnes mobile, 3 dès 640 px, 4 dès 1000 px.
- **Cadrage carré imposé côté plateforme**, fond neutre, `object-fit: contain`. Le réglage « Carré / Portrait » par produit disparaît du formulaire et remonte en réglage de boutique (§9). C'est la cause de 2.8.
- Nom sur **2 lignes maximum**, jamais tronqué sur une seule. Casse normalisée à l'affichage : nom intégralement en capitales et de plus de 3 caractères → rendu en casse de phrase. **La donnée en base n'est pas modifiée.**
- Prix, puce de stock, pastilles de variantes (5 maximum + « +N couleurs »), bouton « Commander ».

### 4.8 Pied de page
Bloc de réassurance, puis `Boutique propulsée par TEKKIShop`, masquable en Pro. Le lien porte un paramètre traçable par boutique.

---

## 5. Page produit

### 5.1 Disposition
- **Desktop :** deux colonnes. Galerie collante à gauche, colonne d'achat déroulante à droite, puis en pleine largeur « Aussi dans cette boutique » et le bandeau marchand. Le vide de 2.9 disparaît.
- **Mobile :** galerie en carrousel pleine largeur, colonne d'achat, suite de boutique. Barre d'achat collante en bas (§5.5).

### 5.2 Ordre de la colonne d'achat
1. « Vendu par {boutique} » + badge, cliquable vers l'accueil
2. Titre, **prix** (+ prix barré si `compare_at`)
3. Puces d'état : stock, `Livraison à {ville}`, `Prix fixe` — toutes conditionnelles
4. Sélecteur de variantes (§5.3)
5. Quantité + « Commander ce produit »
6. « Poser une question sur ce produit » (WhatsApp), bouton secondaire
7. `Tu choisis la livraison et le paiement à l'étape suivante.`
8. Moyens de paiement réellement activés
9. Bloc « Avant de commander » (§5.4)
10. Description et caractéristiques
11. Vidéo produit si renseignée

**Le prix est en position 2, toujours, sur tous les formats** (voir 2.3). Le bloc « Avant de commander » reste **sous** le bouton d'achat : l'acheteur décidé ne doit pas défiler pour acheter.

**Un seul bouton d'achat en ligne** (voir 2.1). Le duplicata actuel disparaît.

### 5.3 Sélecteur de variantes
Libellé `{variant_label} : {nom sélectionné}` + compteur à droite. Vignettes de 52 px avec l'image de la variante.

Changer de variante met à jour : image principale, prix, puce de stock, barre d'achat mobile, et **l'URL** (paramètre `?v=`) pour qu'un lien partagé sur WhatsApp ouvre la bonne variante.

- Variante en rupture : opacité réduite, barrée, **non sélectionnable**, `aria-disabled`.
- Toutes les variantes en rupture → « Bientôt de retour », bouton de commande désactivé, bouton WhatsApp mis en avant.

### 5.4 Bloc « Avant de commander »
Trois lignes conditionnelles, mêmes sources qu'au §4.4 mais détaillées : zones et tarifs réels, moyens de paiement, politique d'échange. Aucune ligne renseignée → le bloc disparaît.

### 5.5 Barre d'achat mobile
Prix et état de stock à gauche, « Commander » au centre, WhatsApp à droite. Elle apparaît au défilement, **et le bouton en ligne se masque quand elle est visible** — les deux ne coexistent jamais.

Le conteneur réserve un `padding-bottom` égal à la hauteur réelle de la barre plus `env(safe-area-inset-bottom)`, mesurée au montage et au redimensionnement. C'est la correction de 2.2.

### 5.6 Badges produit — à reprendre
Aujourd'hui, quatre champs libres rendus avec une coche verte identique à celle d'un fait vérifié. En production, on lit ainsi :

> ✓ +18ans   ✓ Satisfait ou remboursé   ✓ + Groupe de suivi   ✓ Expédition 48h

La plateforme a l'air de garantir tout cela. Deux traitements visuels **distincts et non interchangeables** :

- **Faits plateforme** (stock, livraison, paiement, échange) : puce colorée avec coche, calculés depuis la configuration.
- **Mentions du marchand** (les quatre champs libres) : puce neutre, sans coche, sans couleur de validation, regroupées sous `Le vendeur précise`.

### 5.6bis Badges de réassurance dynamiques — ajouté 2026-08-30, remonté par l'utilisateur
Livraison gratuite, paiement à la livraison, délai — **dérivés des vrais réglages de la boutique, jamais en dur**. Distinct des §5.6 « faits plateforme » existants (stock, échange) qui viennent déjà de la configuration — celui-ci couvre les trois badges de réassurance qui manquent encore à ce traitement. À faire au Lot 2, aucune investigation ni implémentation commencée.

### 5.6ter Support de GIFs animés — ajouté 2026-08-30, remonté par l'utilisateur
Sur la fiche produit. **À vérifier en premier, avant toute décision** : le pipeline d'images actuel (upload, stockage, redimensionnement) préserve-t-il l'animation d'un GIF, ou l'aplatit-il silencieusement en image statique ? Aucune investigation faite — l'ordre de travail est explicitement : vérifier le pipeline d'abord, décider ensuite. Lot 2.

### 5.7 Compteur social
`N personnes ont déjà commandé` ne s'affiche qu'à partir de **30 commandes** sur le produit. En dessous : rien.

Glow Eternel affiche aujourd'hui **« 3 personnes ont déjà commandé »** — le pire signal possible, il dit à l'acheteur que presque personne n'a acheté.

**Aucune icône emoji** : `AI_RULES.md` l'interdit dans l'interface. Icône Lucide ou rien.

---

## 6. Tunnel de commande

Les trois étapes actuelles sont conservées.

### 6.1 Disposition desktop
Deux colonnes à partir de 900 px — formulaire à gauche, **récapitulatif collant à droite** (articles, sous-total, livraison, total). Sur mobile, récapitulatif en haut, replié.

### 6.2 La barre collante ne recouvre plus le contenu
Même correction qu'au §5.5, appliquée aux trois étapes. Le bouton « Continuer » recouvre aujourd'hui le champ e-mail ; la barre de total recouvre l'option « Payer maintenant ».

**Réapparition constatée le 2026-08-30, captures à l'appui** : sur mobile, la barre récapitulative collante recouvre le bas du formulaire de commande. Hypothèse non vérifiée : un padding fixe qui ne suit pas la hauteur variable du contenu du relevé. Aucune investigation faite — à confirmer avant de corriger, ne pas supposer que c'est exactement le même défaut que ci-dessus sans l'avoir vérifié sur le code actuel (le Lot D du tunnel a déjà été livré depuis, §33/§35 — ce pourrait être une régression distincte).

### 6.3 Rupture de stock bloquante
Un article en rupture doit désactiver « Continuer », proposer « Retirer cet article » et « Choisir une autre {variant_label} », et **revalider le stock au moment de la confirmation**, pas seulement à l'affichage.

### 6.4 Cohérence des montants
La modale de confirmation et la page de paiement annoncent 14 000 FCFA pour une commande de 28 000. **Un montant unique calculé côté serveur** est passé à la modale, à la page de paiement et à Bictorys. Aucun recalcul côté client.

### 6.5 Cohérence des moyens de paiement
La liste affichée est générée depuis les moyens réellement disponibles pour le pays et la boutique, à tous les endroits où elle apparaît.

### 6.6 Textes
- **Tutoiement partout.** Le tunnel mélange aujourd'hui « Vos coordonnées » et « tu t'engages à payer ».
- `ARTICLE 1` / `ARTICLE 2` → nom du produit en intitulé de carte.
- **Un seul libellé d'action de bout en bout** : « Commander » → tunnel « Commande » → « Commande enregistrée ». Le « Je le prends » de la fiche produit disparaît (2.4).
- Placeholder des notes : `Une précision pour le vendeur ?` au lieu de la formulation restauration.

### 6.7 Articulation avec les commandes retenues
Boutique `expired` → le tunnel se termine normalement et affiche le message neutre défini dans `SPEC-3-commandes-offertes.md`. **Aucune mention du statut d'abonnement du marchand côté acheteur, à aucune étape.**

### 6.8 Absence de champs Pays/Ville — ajouté 2026-08-30, remonté par l'utilisateur
Le formulaire de commande n'a pas de champs Pays/Ville explicites — le pays est aujourd'hui déduit du seul indicatif téléphonique de l'acheteur. **À investiguer avant toute décision de solution** : comment cette détection fonctionne réellement aujourd'hui (quel code, quelle logique exacte), et ce qui se passe concrètement si l'acheteur est dans un pays différent de celui de la boutique (livraison transfrontalière, frais, moyens de paiement affichés). Aucune investigation faite.

---

## 7. Couleur du marchand

**Une seule variable CSS** `--brand` alimente accent, boutons, liens et puces sur les trois pages. Aucune couleur codée en dur dans les composants de boutique.

Contrainte d'accessibilité : contraste insuffisant avec du texte blanc (ratio < 4.5:1) → le texte des boutons bascule automatiquement en sombre. Le marchand ne doit pas pouvoir rendre sa boutique illisible.

---

## 8. Vérification des boutiques

Le badge n'est plus lié au plan. Il devient une vérification réelle, disponible sur les trois plans.

```sql
ALTER TABLE shops
  ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'none'
    CHECK (verification_status IN ('none','pending','verified','rejected')),
  ADD COLUMN verified_at TIMESTAMPTZ,
  ADD COLUMN response_time_minutes INTEGER;
```

- `verified` s'obtient sur dossier instruit par le support : pièce d'identité ou registre de commerce, numéro WhatsApp confirmé, au moins une commande livrée. Aucune automatisation : une fonction admin suffit.
- `response_time_minutes` : médiane du délai entre création de commande et premier changement de statut, sur 30 jours glissants, **minimum 5 commandes**. En dessous, la ligne « Répond en général sous X » ne s'affiche pas.

> ⚠️ **Point commercial, pas technique.** La v1 prévoyait de faire passer les boutiques Pro actuellement badgées en `pending`. Ces marchands paient 9 900 FCFA et **perdraient un signe visible sur leur vitrine du jour au lendemain**.
>
> Conserve-leur le badge le temps de l'instruction : `verification_status = 'verified'` avec `verified_at = NULL` et une mention interne « à instruire ». Prépare la requête, ne la lance pas. Une communication leur sera adressée avant tout changement visible.

---

## 9. Matrice des drapeaux par plan

Un seul point de vérité, `lib/plan-features.ts`. **Aucun `if (plan === 'pro')` en dehors de ce fichier.**

> ⚠️ **La matrice ci-dessous est une intention, pas un état.** Les captures contredisent la v1 (Coups de cœur sur Business). **Établis la matrice réelle depuis le code et présente-la-moi avant d'implémenter.** Toute différence entre l'existant et la cible est un changement visible pour des marchands payants et doit être décidée, pas subie.

| Drapeau | Découverte | Business | Pro |
|---|---|---|---|
| `cover_image` | — | — | ✓ |
| `featured_products` | à confirmer | à confirmer | ✓ |
| `custom_domain` | — | — | ✓ |
| `hide_tekkishop_footer` | — | — | ✓ |
| `social_links` | ✓ | ✓ | ✓ |
| `verification_eligible` | ✓ | ✓ | ✓ |
| `product_limit` | 10 | ∞ | ∞ |

Tout le reste — gabarit, page produit, variantes, faits, barre mobile, WhatsApp, tunnel — est identique sur les trois plans.

---

## 10. Performance et partage — nouveau

La boutique publique est la page vue par le client final, sur les réseaux les plus lents du marché. Ces contraintes ne figuraient pas dans la v1.

### 10.1 Budget
- **LCP < 2,5 s en 3G**, mesuré sur la page d'accueil d'une boutique de 20 produits.
- Toutes les images produit via `next/image`, avec `sizes` explicite et formats modernes.
- Les images hors du premier écran en chargement différé.
- Aucune régression du poids de page par rapport à l'existant : mesure avant, mesure après, communique les deux.

### 10.2 Aperçu de partage — critique pour le modèle
Le produit repose sur « partage ton lien sur WhatsApp ». L'aperçu généré est donc le premier contact de la plupart des acheteurs.

- **Page boutique** : `og:title` = nom de la boutique, `og:description` = description, `og:image` = couverture, à défaut logo, à défaut une image générée avec le nom.
- **Page produit** : `og:title` = nom du produit, `og:description` = prix et nom de la boutique, `og:image` = photo principale du produit.
- Format 1200×630, testé sur WhatsApp, Instagram et Facebook.
- Données structurées `Product` avec prix et disponibilité sur la fiche produit.

Vérifie ce qui existe aujourd'hui avant de coder — et dis-moi ce qu'un lien partagé affiche actuellement.

### 10.3 Ne pas casser le compteur de visites
La balise `shop_visits` a été posée récemment sur la page boutique. Vérifie qu'elle fonctionne toujours après refonte, et qu'elle ne se déclenche pas deux fois.

---

## 11. Typographie — décision à prendre avant de coder

Trois appariements coexistent : `AI_RULES.md` annonce **Outfit + DM Sans**, la landing utilise **Bricolage Grotesque + Inter**, les maquettes utilisent **Bricolage Grotesque + Instrument Sans**.

Ne tranche pas seul. Note que changer la typographie du gabarit modifie l'apparence de **1 493 boutiques en ligne** du jour au lendemain — c'est une décision produit, pas un détail d'intégration.

---

## 12. Cas limites à traiter explicitement

- Boutique sans logo → monogramme généré depuis le nom, jamais de silhouette générique.
- Boutique sans description → la carte d'identité se resserre, sans vide.
- Produit sans photo → cadre neutre avec le nom, jamais un pictogramme d'image cassée.
- Nom de produit très long → 2 lignes puis ellipse, nom complet dans `title`.
- Variante supprimée après une commande → la commande conserve `variant_name` figé.
- Boutique à 1 produit → la grille ne s'étire pas sur 4 colonnes.
- Zone de livraison unique → afficher le tarif directement, pas une liste à un choix.
- Couleur marchand très claire → bascule automatique du texte des boutons.
- Deux acheteurs sur la dernière pièce → un seul passe, l'autre reçoit une erreur explicite à la confirmation.
- Boutique `expired` → comportement défini par la spec « 3 commandes offertes », inchangé.
- Catalogue entièrement composé de variantes du même produit → la grille ne doit pas paraître vide après regroupement.

---

## 13. Ce qu'il ne faut pas faire

- Pas de second gabarit, de thème, ni de branche de rendu par plan.
- Ne pas dégrader une information utile à l'acheteur selon le plan du marchand.
- Ne pas afficher un badge de vérification lié à l'abonnement.
- Ne pas modifier le tunnel de paiement Bictorys ni le contrat d'API existant.
- Ne pas exposer le statut d'abonnement ou d'essai du marchand côté acheteur.
- Ne pas migrer les produits existants vers des variantes automatiquement.
- Ne pas inventer de valeur par défaut pour une donnée absente.
- Ne pas retirer un élément visible à un marchand payant sans me le signaler d'abord.
- Aucun emoji dans l'interface.

---

## 14. Ordre de livraison

Chaque lot est livrable, testable et **relu séparément**. Plan avant code sur les lots 1 et 5.

1. **Fondations** — table `product_variants`, matrice de plan réelle, variable `--brand` unifiée, colonnes de vérification.
2. **Page produit** — disposition, sélecteur de variantes, « Avant de commander », séparation faits / mentions, seuil du compteur social, barre mobile, correction des bugs 2.1 à 2.4.
3. **Page d'accueil** — bande de faits, grille normalisée, noms non tronqués, filtres avec repli, liens sociaux, correction des bugs 2.5 à 2.9.
4. **Tunnel** — disposition desktop, barre non recouvrante, rupture bloquante, montant unique serveur, textes au tutoiement.
5. **Réglages marchand** — les 4 points du §9 de la v1, plus la suggestion de regroupement du §3.

---

## 15. Vérifications avant de rendre la main

1. `npm run build` sans erreur ni nouvel avertissement.
2. Les trois pages avec un marchand **Découverte, 4 produits, une photo chacun, une ligne de description, aucune zone de livraison** : aucun bloc vide, aucun libellé orphelin, aucune valeur inventée.
3. Les mêmes avec un marchand **Pro complet**.
4. Un produit à 9 variantes s'affiche comme **une** fiche ; `?v=` ouvre la bonne variante ; une variante en rupture est non sélectionnable.
5. Sur 375 px et 412 px : le premier produit visible sans plus d'un défilement ; **un seul bouton d'achat à l'écran** ; la barre ne recouvre jamais un champ ni un bouton, sur les trois pages.
6. Tunnel complet avec un article en rupture : « Continuer » bloqué jusqu'à résolution.
7. Montant identique à l'étape 3, dans la modale, sur la page de paiement et dans la requête Bictorys.
8. Aucun vouvoiement dans le tunnel, aucun « Je le prends » sur la fiche.
9. Contraste vérifié pour les 8 couleurs marchand proposées.
10. Une boutique `legacy` conserve exactement son comportement de commande.
11. **LCP mesuré avant et après**, sur la même boutique, en 3G simulé.
12. **Aperçu de partage vérifié** sur WhatsApp pour une boutique et un produit.
13. Le compteur `shop_visits` fonctionne et ne compte pas deux fois.
14. Les deux boutiques réelles observées — ABI&CO et Glow Eternel — rendues avant/après, captures à l'appui.

---

En fin de chaque lot : fichiers modifiés, migrations créées sans les exécuter, points où tu as tranché à ma place, et **tout endroit où l'existant contredit cette spec** — la v1 s'est déjà trompée deux fois sur ce que fait le code.
