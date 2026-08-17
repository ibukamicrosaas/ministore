# Refonte du dashboard marchand TEKKIShop

## 0. À lire avant de commencer

Ce document décrit **quoi changer et pourquoi**, page par page. Un mockup HTML interactif (`tekkishop-dashboard-mockup.html`) est fourni à côté de ce fichier : il illustre la structure, la hiérarchie et le ton visuel attendus, en version mobile et desktop. **Le mockup n'est pas du code à porter tel quel** — c'est une référence de structure, de hiérarchie et de comportement. Reste sur les composants, la stack technique et les conventions déjà en place dans le projet TEKKIShop.

**Avant d'écrire la moindre ligne de code :**
1. Explore le code existant du dashboard (pages, composants partagés, système de design/tokens s'il existe, gestion d'état, appels API).
2. Ouvre `tekkishop-dashboard-mockup.html` dans un navigateur pour voir le comportement interactif (bascule mobile/desktop, navigation entre pages).
3. Rends un plan d'exécution : fichiers/composants à toucher par lot, ce que tu comptes réutiliser, ce que tu comptes créer, et la liste des points où cette spec ne dit pas quoi faire ou contredit l'existant.
4. **Ne code rien tant que ce plan n'a pas été validé.**

**Ensuite, un lot à la fois**, dans l'ordre de la section 10. À la fin de chaque lot : build, vérifications applicables, puis arrêt pour test avant d'enchaîner. Ne démarre pas le lot suivant de ta propre initiative.

**Périmètre strict : UI et UX uniquement.** Cette refonte ne touche ni la logique métier, ni les appels API, ni le schéma de données, ni les calculs (commissions, statuts de commande, soldes). Si un changement visuel semble exiger une modification de logique ou de structure de données, **arrête-toi et demande** plutôt que de trancher seul.

---

## 1. Contexte

TEKKIShop est un SaaS qui permet à des marchands d'Afrique de l'Ouest (et, plus récemment, de la diaspora en Europe/Canada) de créer une boutique en ligne depuis leur téléphone, sans compétence technique. La majorité des marchands :
- consultent leur dashboard **depuis un smartphone**, pas un ordinateur ;
- n'ont **jamais utilisé d'outil e-commerce** auparavant (pas de référence mentale "Shopify") ;
- sont à l'aise avec des apps mobiles simples et déjà connues : **WhatsApp, Wave, Orange Money, Yango**.

Le dashboard actuel a été construit fonctionnalité après fonctionnalité, sans hiérarchie d'ensemble. Résultat : un menu à plat de 10 entrées, plusieurs actions concurrentes sur un même écran, des libellés tronqués sur mobile, et des écrans qui découragent plutôt qu'ils n'accompagnent (ex. "-100%" en rouge sur une boutique qui vient d'ouvrir).

**Objectif de cette refonte :** que n'importe quel marchand — y compris quelqu'un qui n'a jamais utilisé d'app professionnelle de sa vie — sache toujours, en un coup d'œil, **où il est** et **quelle est la seule action qui compte à cet instant**.

---

## 2. Principes directeurs

Applique ces 8 principes à chaque page. Ce sont les critères avec lesquels le résultat sera évalué.

1. **Hiérarchie à 3 niveaux, jamais à plat.** Tout écran/menu doit distinguer : ce que le marchand fait chaque jour (Accueil, Commandes, Produits), ce qu'il consulte occasionnellement (Clients, Revenus, Avis, Statistiques), et ce qui est administratif et rare (Facturation, Affiliation, Codes promo, Paramètres).
2. **Une seule action principale par écran.** Chaque page a un bouton principal, visuellement dominant (couleur pleine, large). Toute autre action est secondaire (ghost button, lien texte) et clairement en retrait.
3. **Le vocabulaire du marchand, pas celui du logiciel.** Pas de "Trimestre", "Semestre" sur une vue rapide. Pas de jargon technique. Des mots qu'on utiliserait à l'oral avec quelqu'un qui vend depuis son salon.
4. **Les écrans vides encouragent, ils n'accusent pas.** Une boutique neuve à 0 commande ne doit jamais afficher de variation négative, de "-100%" ou tout signal qui ressemble à un échec. Un écran vide propose une action claire ("Ajoute ton premier produit"), jamais un constat froid.
5. **Aucun texte tronqué, jamais.** Si un libellé ne rentre pas sur mobile, ce n'est pas au texte de se couper — c'est au composant de s'adapter (scroll horizontal, empilement, libellé raccourci intentionnellement, pas coupé par débordement).
6. **Les actions risquées restent accessibles mais discrètes.** Annuler un abonnement, supprimer un produit, etc. : jamais caché, mais jamais non plus un bouton plein de couleur vive au même niveau visuel qu'une action positive.
7. **Le mobile est une app, pas un site rétréci.** Navigation par barre du bas, cartes, zones tactiles larges (44px minimum), pas de tableaux denses ni de menus latéraux qui s'ouvrent par défaut.
8. **Le desktop est un SaaS moderne pensé pour ce public, pas un decalque de Shopify.** Sidebar groupée, densité d'information plus élevée qu'en mobile, mais toujours avec la même hiérarchie et le même vocabulaire.

---

## 3. Design tokens à reprendre

Reprends le système de tokens du mockup comme base (à ajuster si une charte de marque existante prime) :

| Rôle | Valeur | Usage |
|---|---|---|
| Primaire | `#155EEF` | Navigation active, boutons secondaires forts, liens |
| Primaire (fond doux) | `#E7EFFF` | Fonds d'icônes, états actifs discrets |
| Action de partage | `#22B559` (vert WhatsApp) | Le bouton principal "Partager", car c'est le réflexe naturel des marchands |
| Argent / positif | `#128A4C` | Carte Revenus, badges "Livrée", montants positifs |
| Attention | `#B4740E` sur fond `#FBF0DD` | Badges "En attente", alertes non bloquantes |
| Danger | `#C4321F` sur fond `#FBEAE7` | Annulations, suppressions — jamais en bouton plein |
| Fond app | `#F7F7F5` | Fond général des pages |
| Surface | `#FFFFFF` | Cartes, panneaux |
| Encre | `#14171F` (texte), `#5B6072` (texte secondaire), `#9297A6` (texte tertiaire/placeholder) |

Typographie : une police display à personnalité pour les titres et les montants (le mockup utilise Sora), une police utilitaire lisible pour le corps de texte (le mockup utilise Inter). Les montants en FCFA utilisent des chiffres tabulaires.

Si le projet a déjà un système de tokens (variables CSS, thème Tailwind, etc.), **adapte ces valeurs à ce système existant** plutôt que d'en créer un second en parallèle — signale ce choix dans ton plan d'exécution.

---

## 4. Navigation — la fondation de toute la refonte

C'est le changement le plus structurant. Tout le reste en découle.

### 4.1 Mobile — barre de navigation basse (5 emplacements)

| Position | Élément | Comportement |
|---|---|---|
| 1 | Accueil | Page actuelle en surbrillance |
| 2 | Commandes | — |
| 3 (centre, surélevé) | Assistant IA | Bouton rond, distinct visuellement (couleur pleine sombre), ouvre le chat en tiroir plein écran depuis le bas |
| 4 | Produits | — |
| 5 | Plus | Ouvre une feuille (bottom sheet) listant : Clients, Avis clients, Revenus, Statistiques, Facturation, Affiliation, Codes promo, Paramètres, Support WhatsApp, Déconnexion — dans cet ordre, sans sous-catégories supplémentaires |

Le menu latéral actuel (hamburger) est remplacé par cette structure. Le hamburger disparaît de l'écran d'accueil mobile.

### 4.2 Desktop — sidebar groupée (persistante, jamais masquée)

```
[Avatar] Nom du marchand
         Plan actuel

AUJOURD'HUI
  Tableau de bord
  Commandes
  Produits

MA BOUTIQUE
  Clients
  Avis clients
  Revenus
  Statistiques

COMPTE
  Facturation
  Affiliation
  Codes promo
  Paramètres
  ──────────────
  Assistant IA
  Support WhatsApp
  Déconnexion
```

Les libellés de groupe (AUJOURD'HUI, MA BOUTIQUE, COMPTE) sont en majuscules, petite taille, couleur tertiaire — ils structurent sans prendre de place visuelle.

Le bouton "Espace Admin" actuel ne doit s'afficher **que pour les comptes ayant le rôle administrateur TEKKIShop** (ce n'est pas un élément du dashboard marchand standard — vérifie comment ce rôle est déterminé dans le code existant avant de le déplacer).

---

## 5. Page Accueil / Tableau de bord

**Objectif de la page :** répondre en un regard à "comment vont mes ventes ?" et donner une seule action à faire ensuite.

- **En-tête** : date du jour + "Bonjour/Bonsoir, [Prénom]" — garder tel quel, c'est déjà correct.
- **Carte Ventes** (composant hero, couleur pleine) :
  - Montant du jour en grand, chiffres tabulaires.
  - Sélecteur de période réduit à **3 choix** : Aujourd'hui / Semaine / Mois. Supprimer Hier, Trimestre, Semestre, Année, Tout — ces vues existent ailleurs (Statistiques) pour qui en a besoin, mais pas ici.
  - **Aucune variation en pourcentage affichée si l'historique est insuffisant** (boutique de moins de 30 jours, ou comparaison à une période à zéro commande). Dans ce cas, ne rien afficher plutôt qu'un "-100%".
- **Deux indicateurs secondaires** (Produits actifs, Commandes en attente) : cartes discrètes sous la carte Ventes, pas au même niveau visuel.
- **Bloc "Fais connaître ta boutique"** (remplace l'actuel bloc à 5 boutons) :
  - Lien de la boutique affiché en lecture seule (tronqué proprement si trop long, jamais débordant).
  - **Un seul bouton principal plein, vert** : "Partager sur WhatsApp".
  - Sous ce bouton, en actions secondaires discrètes (ghost buttons ou icônes) : Copier le lien, QR code, Voir mon site. Retirer "Carte" comme action de premier niveau si elle est peu utilisée — vérifier les données d'usage avant de la supprimer complètement ; sinon la conserver en action secondaire.
- **Commandes en cours** : liste des 3-5 dernières, avec lien "Voir toutes →" vers la page Commandes. Garder le point de statut coloré, mais aligner les couleurs sur la palette de badges définie section 6.

---

## 6. Page Commandes

**Objectif de la page :** trouver rapidement une commande et comprendre son état sans ambiguïté.

- **Filtres par statut** en chips horizontales scrollables (pattern déjà présent, à conserver) : Toutes, En attente, Confirmées, En préparation, Prêtes, Livrées, Annulées.
- **Badges de statut — palette unique à appliquer partout dans l'app** (dashboard, liste, détail) :
  | Statut | Couleur badge |
  |---|---|
  | En attente | Ambre (`#B4740E` sur `#FBF0DD`) |
  | Confirmée | Primaire (`#155EEF` sur `#E7EFFF`) |
  | En préparation | Primaire |
  | Prête | Vert doux (`#128A4C` sur `#E4F6EC`) |
  | Livrée | Vert plein (`#128A4C`, texte blanc) |
  | Annulée | Rouge doux (`#C4321F` sur `#FBEAE7`) |
- **Page de détail d'une commande** : conserver le stepper visuel à 5 étapes (En attente → Confirmée → En préparation → Prête → Livrée), c'est déjà un bon pattern — le généraliser plutôt que le modifier. L'appliquer aussi, sous une forme adaptée, à la page Revenus pour le statut d'un retrait (voir section 8).
- Les commandes annulées ne doivent pas afficher un stepper qui progresse normalement jusqu'à l'étape où elle a été annulée sans le signaler visuellement — vérifie le comportement actuel et corrige si le stepper est trompeur pour une commande annulée.

---

## 7. Page Produits

**Objectif de la page :** ajouter un produit doit sembler prendre 30 secondes, pas être un formulaire intimidant.

- **État vide** (0 produit) : à remplacer entièrement.
  - Icône ou illustration simple, pas une icône générique grise.
  - Titre encourageant : "Ajoute ton premier produit".
  - Sous-titre concret : ce que ça prend (une photo, un nom, un prix), pas une description abstraite.
  - **Un seul bouton principal** : "+ Ajouter un produit".
  - "Importer CSV" redescend en lien texte secondaire sous le bouton principal — ce n'est pas une action de premier niveau pour 95% des marchands.
- **Liste de produits** (une fois qu'il y en a) : vérifier que chaque carte produit affiche clairement photo, nom, prix, stock, et statut actif/inactif, avec une action rapide (activer/désactiver, modifier) accessible sans ouvrir une page de détail.

---

## 8. Page Revenus

**Objectif de la page :** répondre à "combien puis-je retirer maintenant ?" avant tout le reste.

- **Carte "portefeuille"** en haut de page, inspirée des apps de mobile money que les marchands connaissent déjà (Wave, Orange Money) :
  - Couleur pleine distincte (verte, cohérente avec "argent positif").
  - Solde disponible en très grand.
  - **Un seul bouton principal, blanc sur fond de couleur** : "Retirer mon argent".
  - Deux indicateurs secondaires seulement dans cette carte (Total gagné, Total retiré) — pas plus.
- **Le détail (commission TEKKIShop, répartition, montant en attente, historique des retraits)** est replié derrière un accordéon "Voir le détail", fermé par défaut. Il reste entièrement accessible en un clic — ce n'est pas supprimé, seulement hiérarchisé.
- Si un retrait est en cours ou a échoué, afficher un statut clair (badge + explication courte de ce qui se passe et, si pertinent, quoi faire), pas seulement un mot ("Échoué") sans contexte.

---

## 9. Page Clients

**Objectif de la page :** identifier rapidement les meilleurs clients, sans surcharger l'écran de données pour les nouveaux marchands qui n'en ont pas encore.

- Les compteurs de fidélité (Or / Argent / Bronze) restent en haut, mais **seulement si le marchand a au moins un client fidèle** — sinon, ne pas afficher deux cartes à "0" qui n'apportent rien.
- Liste des clients : nom, téléphone, badge de palier si applicable, nombre de commandes. Un client à 0 commande n'a pas besoin d'un badge ni d'une ligne de statistique — juste son nom et son téléphone, discrètement.
- Barre de recherche : conserver, elle est déjà bien positionnée.

---

## 10. Page Paramètres

**Objectif de la page :** corriger le bug de troncature et rendre la page navigable sans confusion.

- **Corriger en priorité absolue** : les onglets actuellement tronqués ("Bout", "Vent", "Cont", "Comp") doivent afficher des libellés complets et compréhensibles, par exemple : **Boutique**, **Paiement & livraison**, **Apparence**, **Mon compte**. Si l'espace horizontal mobile ne suffit pas pour tout afficher sans troncature, les onglets doivent défiler horizontalement (scroll), jamais se couper.
- Chaque onglet regroupe logiquement les champs qui existent déjà dans le code — cette spec ne demande pas de nouveaux champs, seulement une réorganisation lisible.
- **Annuler l'abonnement** : redescend en lien texte simple, rouge, en bas de la page Facturation — jamais un bouton plein au même niveau visuel que "Renouveler / Changer de plan". Il doit rester à un clic d'accès (pas de sous-menu caché), mais visuellement, il ne doit plus attirer l'œil autant qu'une action positive.

---

## 11. Assistant IA

**Objectif :** un point d'entrée cohérent avec le reste de l'app, pas un widget qui semble ajouté après coup.

- **Mobile** : le chat s'ouvre en **tiroir plein écran glissant depuis le bas** (comme une conversation WhatsApp), déclenché par le bouton central de la barre de navigation. Il ne doit plus apparaître comme une bulle flottante qui recouvre partiellement le contenu de la page en dessous.
- **Desktop** : panneau latéral ancré à droite, qui pousse ou superpose proprement le contenu (à trancher selon la largeur d'écran disponible dans le code existant), pas une fenêtre flottante libre.
- Conserver les suggestions de questions pré-remplies à l'ouverture (bon pattern déjà en place) et le compteur de messages restants.

---

## 12. Ce qui ne change PAS dans ce chantier

Pour éviter toute ambiguïté :
- Les calculs de commission, de solde, de statut de commande : **aucune modification**.
- Les intégrations de paiement (Wave, Orange Money, MaxIt, MTN, Moov) : **aucune modification**.
- Le contenu et la logique de l'Assistant IA lui-même (ce qu'il répond) : **aucune modification**, seulement son enveloppe visuelle et son point d'entrée.
- Les migrations de base de données ne devraient normalement pas être nécessaires pour ce chantier, qui est un chantier d'UI. **Si tu identifies un besoin de migration, arrête-toi et demande avant d'en écrire une** — ne l'exécute jamais toi-même.

---

## 13. Ordre d'exécution (lots)

Un lot = une mise en production testable indépendamment. Ne pas enchaîner sans validation.

1. **Lot 1 — Fondations** : design tokens (section 3) + composants partagés réutilisés partout ensuite (badges de statut, bouton principal/secondaire, carte, état vide, stepper).
2. **Lot 2 — Navigation** : barre de navigation mobile basse + feuille "Plus" ; sidebar desktop groupée. C'est le changement qui touche le plus de fichiers, à isoler seul.
3. **Lot 3 — Accueil / Tableau de bord**.
4. **Lot 4 — Commandes** (liste + détail, y compris la correction du stepper sur commandes annulées).
5. **Lot 5 — Produits** (état vide + liste).
6. **Lot 6 — Revenus** (carte portefeuille + accordéon détail).
7. **Lot 7 — Clients**.
8. **Lot 8 — Paramètres** (correction prioritaire des onglets tronqués + réorganisation).
9. **Lot 9 — Assistant IA** (tiroir mobile + panneau desktop).

À la fin de chaque lot, fournir : liste des fichiers modifiés, captures d'écran avant/après si possible, et tout endroit où l'existant contredisait cette spec et où un choix a dû être fait à ma place.

---

## 14. Checklist de validation par page

Avant de considérer une page terminée, vérifier qu'elle répond à tous ces points :

- [ ] Aucun texte tronqué ou débordant sur un écran mobile de 375px de large.
- [ ] Une seule action visuellement dominante sur l'écran.
- [ ] Les couleurs de badges/statuts suivent la palette unique définie section 6.
- [ ] Aucun écran vide n'affiche de variation négative ou de constat décourageant.
- [ ] Toute action destructive ou risquée (annuler, supprimer) est accessible mais visuellement en retrait.
- [ ] La page fonctionne et reste lisible en desktop (≥1280px) ET en mobile (375px) sans réécrire deux fois la logique.
- [ ] Aucune donnée, calcul ou appel API existant n'a été modifié — seulement leur présentation.
