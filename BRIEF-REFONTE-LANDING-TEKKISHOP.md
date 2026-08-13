# Brief de refonte — Landing page TEKKIShop

Ce document accompagne le fichier `tekkishop-landing-v6.html`. Le HTML est la **référence visuelle et rédactionnelle**. Ce document explique les intentions, les contraintes, et ce qui reste à faire.

---

## 1. Contexte

TEKKIShop est un SaaS qui permet de créer une boutique en ligne depuis un téléphone, avec encaissement mobile money. Éditeur : Dukka.

**Cible.** Des commerçants d'Afrique de l'Ouest qui vendent aujourd'hui sur WhatsApp, Instagram et TikTok. Beaucoup n'ont **jamais vendu en ligne** et n'ont **jamais utilisé de SaaS**. Certains n'ont pas d'ordinateur.

**Trois conséquences non négociables :**

1. **La clarté prime sur l'élégance.** Aucun jargon. On écrit « Wave, Orange Money » et pas « paiements locaux ». On écrit « produits à télécharger » et pas « produits digitaux ». Si une phrase demande un effort de décodage, elle est mauvaise.
2. **La preuve sociale prime sur la promesse.** Sur ce marché, le nombre de marchands convainc plus vite qu'un slogan. D'où le choix de placer « 1 466 boutiques déjà créées » **avant** le titre H1.
3. **Le mobile est le cas principal, pas le cas dégradé.** Concevoir et tester à 375px d'abord.

---

## 2. Ce qui change par rapport à la landing actuelle

| | Version actuelle | Cible |
|---|---|---|
| Ouverture | Pilule « L'e-commerce enfin simple » | Preuve sociale chiffrée + avatars |
| Sous-titre | 5 idées en une phrase | 3 propositions courtes, opérateurs nommés |
| Aperçus produit | Boutique générique inventée | Interface réelle reproduite fidèlement |
| Étapes | 4 blocs, ordre inexact | 5 blocs alternés, calqués sur le parcours réel |
| Preuve | Logos + témoignages dispersés | Regroupés en un seul bloc de confiance |
| Mobile | Non optimisé | Barre d'action fixe, carrousel, 5 breakpoints |
| SEO | Pas d'OG, pas de données structurées | OG complet + JSON-LD FAQPage |

**Ce qu'on garde de l'existant :** la section 24h/24 (renforcée), la comparaison avant/après, la grille tarifaire à 3 plans avec bascule mensuel/annuel, le tableau comparatif, la FAQ longue.

---

## 3. Système de design

### Couleurs

```
--ink        #0b1830   Texte principal
--ink-2      #26385a   Texte secondaire
--muted      #697893   Texte tertiaire
--blue       #176bff   Bleu de marque (CTA, accents)
--blue-2     #0d54d8   Bleu foncé (libellés)
--blue-3     #eaf2ff   Bleu très clair (fonds)
--sky        #f5f9ff   Fond de section alterné
--green      #12b981   Validation, coches
--amber      #ffb020   Accent UNIQUE, réservé à la timeline et au badge « le plus choisi »
--navy       #071a35   Sections sombres, footer
--border     #dfe7f3   Bordures
```

Bleu de l'application vendeur : `#2f9fe3`. Il est volontairement distinct du bleu de marque — les reproductions d'interface doivent l'utiliser pour rester fidèles.

**Deux règles de discipline :**

1. L'ambre n'apparaît que deux fois dans toute la page. C'est ce qui fait que le moment « 02:47 » de la timeline se remarque. Ne pas l'utiliser ailleurs.
2. **Aucun dégradé bleu → violet, nulle part.** C'est le marqueur visuel le plus reconnaissable des pages générées automatiquement, et il est explicitement rejeté. Les mots mis en valeur dans les titres utilisent la classe `.grad` : encre `--blue-2` avec une bande de surlignage `rgba(23,107,255,.15)` sous la ligne de base, façon marqueur. Les seuls dégradés autorisés sont bleu → bleu (boutons) et les halos marine des sections sombres.

### Typographie

| Rôle | Police | Usage |
|---|---|---|
| Display | **Bricolage Grotesque** (500/700/800) | H1–H3, chiffres, prix, montants |
| Corps | **Inter** (400–800) | Paragraphes, boutons, listes |
| Utilitaire | **IBM Plex Mono** (500/600) | Libellés de section, horaires, références, prix dans les interfaces |

Le monospace fait le lien visuel entre la timeline, les prix et les écrans d'application. C'est intentionnel, pas décoratif.

**À noter :** l'ancien mockup déclarait `font-family: Inter` sans jamais charger la police. Vérifier que les trois familles sont bien chargées en production (self-host recommandé plutôt que Google Fonts, pour la performance en Afrique de l'Ouest).

### Libellés de section

Filet bleu de 26×2px suivi de capitales monospace, `letter-spacing: .15em`.

**Ne pas utiliser de pilules arrondies avec point coloré.** C'est un marqueur visuel de page générée automatiquement, explicitement rejeté.

### Rayons et ombres

```
--radius     20px    Cartes standard
--radius-lg  30px    Cartes de plan, blocs CTA
--shadow-sm  0 8px 28px rgba(9,40,92,.08)
--shadow-md  0 24px 70px rgba(9,40,92,.13)
--shadow-lg  0 40px 100px rgba(8,26,57,.22)
```

---

## 4. Structure de la page

| # | Section | Rôle | Fond |
|---|---|---|---|
| 1 | Navigation collante | — | Blanc translucide |
| 2 | Hero | Preuve sociale → promesse → CTA | Dégradé clair + grille |
| 3 | Bandeau paiements | Lever l'objection « comment je serai payé » | Blanc |
| 4 | Le vrai problème | Nommer la douleur avant de vendre | Blanc |
| 5 | 5 étapes | **Démontrer** que c'est simple | `--sky` |
| 6 | Vitrine client | Ce que voit l'acheteur | Blanc |
| 7 | **Timeline 24h/24** | Élément signature | Navy |
| 8 | Espace vendeur | Ce que voit le marchand | Blanc |
| 9 | Ce que tu peux vendre | Élargir la cible | `--sky` |
| 10 | Témoignages + chiffres | Preuve sociale | `--sky` |
| 11 | Tarifs | Conversion | Blanc |
| 12 | Fondateur | Légitimité locale | `--sky` |
| 13 | FAQ (15 questions) | Objections + SEO | Blanc |
| 14 | CTA final | Dernière chance | Blanc / carte navy |
| 15 | Footer | — | Navy |

**Élément signature : la timeline 24h/24.** C'est le bloc à ne pas affaiblir. Rail vertical, horaires en monospace, et un seul moment mis en ambre — **02:47, « Tu dors. Une cliente commande depuis Abidjan. »** Toute la proposition de valeur tient dans cette ligne. Si une contrainte technique oblige à couper quelque chose, couper ailleurs.

---

## 5. Règles rédactionnelles

**Tutoiement systématique.** Le vendeur est « tu ». Jamais « vous ».

**Vocabulaire interdit → remplacement :**

| Ne pas écrire | Écrire |
|---|---|
| paiements locaux | Wave, Orange Money, MTN MoMo |
| produits digitaux | produits à télécharger |
| une expérience pensée pour convertir | du produit au paiement, sans sortir de la page |
| back-office, dashboard | ton espace, ton écran |
| intégration, API, no-code | (ne pas mentionner) |
| catalogue | tes produits |
| optimisé, scalable, solution | (reformuler concrètement) |

**Formats.** Prix en `14 000 FCFA` (espace insécable comme séparateur). Boutons à l'infinitif ou à l'impératif, jamais « Soumettre ».

**Cohérence des données.** Le mockup utilise :
- **1 468** boutiques créées (chiffre affiché dans le tunnel d'inscription du produit)
- **6** pays d'Afrique + **5** pays d'Occident
- **4,7/5** de note moyenne — affichée dans la barre de chiffres et les témoignages, **pas dans le hero**
- **2 900 / 4 900 / 9 900 FCFA** par mois, **−20 %** en annuel

⚠️ Le site actuel affichait 1466, un ancien mockup 1435, le tunnel d'inscription 1468. **Brancher ce chiffre sur une source unique**, idéalement dynamique depuis la base, et l'afficher partout de la même façon.

---

## 6. Reproductions d'interface

Le mockup reproduit en CSS pur trois écrans réels du produit. **Ils doivent rester fidèles.** Si l'interface évolue, ces blocs évoluent.

**Mise en page.** Dans les deux sections illustrées par un téléphone (« Une boutique qui inspire confiance » et « La même boutique, vue de ton côté »), le téléphone est **à gauche** et le texte **à droite** sur écran large. En dessous de 1060px, empilement avec le téléphone au-dessus. Dans la section des étapes, l'alternance est portée par la classe `.flip` (étapes 02 et 04), pas par un `nth-child`.

**a) Vitrine boutique (hero + section 6 + modale) — toujours en format téléphone.**
95 % des marchands et de leurs clients se connectent depuis un mobile. Aucune de ces trois reproductions ne doit être présentée dans un cadre navigateur de bureau. Le hero montre le haut du profil, la section 6 montre l'état « liste de produits » (recherche, filtres, lignes produit avec « Voir → » et mention de stock), la modale montre le profil complet. Trois états différents du même écran, pour ne pas répéter la même image trois fois.
 Format profil, pas e-commerce classique : bannière de couverture, logo circulaire débordant, nom + badge vérifié bleu, catégorie, description, pilules de confiance, boutons Instagram/TikTok/Facebook, boutons Appeler/Écrire, bouton Commander navy, « ★ Coups de cœur », recherche, filtres, lignes produit avec « Voir → », et le pied « Toi aussi, ouvre ta boutique en 5 min avec TEKKIShop → ».
URL au format `tekki.shop/nomdelaboutique` (chemin, **pas** sous-domaine).

**b) Espace vendeur (section 8).** Fond clair `#f4f7fa`, azur `#2f9fe3`. Barre du haut avec quatre icônes, salutation datée, carte bleue de ventes avec onglets Auj./Hier/Semaine/Mois, deux cartes Produits/En attente, bloc « Lien de ton site » avec WhatsApp/Carte/QR/Copier/Voir mon site, commandes en cours avec référence en monospace et badge « Confirmée », barre de navigation basse avec Assistant IA en pastille flottante.

**c) Écrans des 4 étapes (section 5).** Création de compte, ajout de produit, personnalisation, partage avec QR.

> **En production, remplacer ces reproductions CSS par de vraies captures d'écran** (voir §8). Elles ne sont là que pour tenir la maquette.

---

### Le parcours réel, à respecter à la lettre

La section « étapes » ne raconte pas un parcours idéalisé : elle reproduit le vrai tunnel du produit. **Point critique : la création de compte vient APRÈS la construction de la boutique**, pas avant. C'est un argument de conversion, pas un détail — le marchand voit sa boutique se construire avant qu'on lui demande quoi que ce soit.

| Étape | Ce qui se passe | Écran |
|---|---|---|
| 01 | `/start` — 5 questions, environ 60 secondes, boutique créée en arrière-plan | Question 1/5, nom du business, barre de progression, encadré vert avec l'URL |
| 02 | Création du compte : numéro WhatsApp + code PIN à 6 chiffres | Champ numéro, six cases de PIN, bouton vert « Ouvrir ma boutique » |
| 03 | Ajout des produits depuis le tableau de bord | Formulaire produit : photos, nom, prix, stock |
| 04 | Personnalisation et paramètres | Logo, couverture, nuancier |
| 05 | Activation et partage du lien | Bloc « Lien de ton site » avec QR, WhatsApp, carte |

Aucune inscription n'est demandée avant l'étape 02. Le texte de la page doit continuer à le dire explicitement.

### Animations des écrans d'étapes

La section « 4 étapes » n'est pas illustrée, elle est **jouée**. Chaque écran se met en marche quand il entre dans le champ de vision, une seule fois, à 35 % de visibilité.

| Étape | Séquence |
|---|---|
| 01 | Le nom du business se saisit avec curseur, la barre de progression passe à 20 % puis 40 %, l'encadré vert d'URL apparaît, le bouton pulse |
| 02 | Le numéro se saisit, les six cases de PIN se remplissent une par une avec la case active surlignée, la ligne de réassurance apparaît, le bouton vert pulse |
| 03 | Les vignettes photo apparaissent une par une, le nom se saisit, le prix compte jusqu'à 14 000 FCFA, le stock jusqu'à 12 |
| 04 | Logo puis couverture apparaissent, la sélection de couleur parcourt trois nuances avant de se poser, un « ✓ Enregistré » s'affiche |
| 05 | Le QR code apparaît, le lien se saisit, « Copier le lien » bascule en « ✓ Lien copié », les quatre canaux de partage se révèlent |

**Implémentation.** Un moteur générique piloté par attributs, sans dépendance : `data-type` (saisie caractère par caractère), `data-count` + `data-suffix` (compteur avec sortie cubique et séparateur français), `data-appear` (apparition différée), `data-swap` (changement de libellé), `data-swatch` (séquence de sélection), `data-prog` (barre de progression, format `valeur:délai`), `data-pin` (remplissage du code PIN), `data-ready` (pulsation de bouton). Chaque attribut porte son propre `data-delay`.

**Sous `prefers-reduced-motion`,** la fonction `finalState()` applique directement l'état final de chaque écran. Les animations ne doivent jamais être le seul moyen d'accéder à l'information : tous les textes sont présents dans le DOM via les attributs et restitués intégralement.

**Vigilance à l'intégration :** ne pas remplacer ce moteur par une bibliothèque d'animation. Le budget de performance ne le justifie pas, et le comportement attendu tient en 60 lignes.

## 7. Exigences techniques

### Performance
- Budget : **LCP < 2,5 s en 3G**, contexte Afrique de l'Ouest.
- Self-hoster les polices, `font-display: swap`, précharger le WOFF2 du display.
- Images en AVIF/WebP, `loading="lazy"` sauf le visuel du hero, dimensions explicites pour éviter le CLS.
- Aucun framework nécessaire pour cette page. Si le site est en React/Next, la découper en composants mais garder le CSS en modules, sans utilitaire runtime.

### Responsive
Cinq points de rupture, déjà présents : **1060 / 900 / 760 / 520 / 370**.
Tester en priorité à **375px** et **390px**.

### Mobile spécifiquement
- Barre d'action fixe en bas, apparaît après 85 % de la hauteur du hero, disparaît à l'arrivée du CTA final.
- `env(safe-area-inset-bottom)` pour les appareils à encoche.
- Cibles tactiles ≥ 48px (les boutons sont à 52–56px).
- Témoignages en carrousel horizontal avec `scroll-snap`.
- Pas de survol comme seul moyen d'accès à une information.

### Accessibilité
- `:focus-visible` visible partout (contour bleu 3px).
- `aria-expanded` sur la FAQ et le menu mobile ; `aria-pressed` sur la bascule tarifaire.
- Modale : `role="dialog"`, `aria-modal`, piège à focus, fermeture Échap, restitution du focus.
- `prefers-reduced-motion` respecté.
- Contraste : vérifier `--muted` sur `--sky` (limite AA).
- Un seul `<h1>`, hiérarchie de titres continue.

### SEO
- OG + Twitter Card complets. **Produire une vraie image `og-cover.jpg` en 1200×630** — critique, puisque la page sera surtout partagée sur WhatsApp.
- JSON-LD `FAQPage` déjà présent : le tenir synchronisé avec la FAQ visible.
- Ajouter un JSON-LD `SoftwareApplication` ou `Product` avec les tarifs.
- `hreflang` si une version anglaise est prévue.

### Analytique
Événements à poser : `cta_hero_click`, `cta_mobile_bar_click`, `demo_modal_open`, `pricing_toggle_year`, `plan_select` (avec le plan), `faq_open` (avec la question), `scroll_depth` à 25/50/75/100 %, et un marqueur spécifique d'atteinte de la section timeline.

---

## 8. Ce qui reste à faire avant mise en ligne

**Bloquant :**

1. **Photos produits réelles.** Toutes les vignettes sont des dégradés CSS. Récupérer les visuels de marchands existants (avec autorisation).
2. **Témoignages réels.** Les 6 témoignages du mockup sont des placeholders. Les remplacer par ceux du site actuel, avec noms, photos et activités vérifiés.
3. **Captures d'écran réelles** pour les 4 étapes, la vitrine et l'espace vendeur.
4. **Image og-cover.jpg** en 1200×630.
5. **Câbler les liens.** Les CTA principaux pointent vers `/start` (le tunnel des 5 questions), pas vers un formulaire d'inscription. Autres chemins provisoires : `/start?plan=essentiel|business|pro`, `/connexion`, `/contact`, `/cgu`, `/confidentialite`, `/mentions-legales`, le compte TikTok et le numéro WhatsApp (`wa.me/000000000`).

   **Footer :** le blog et les boutiques d'exemple ont été retirés (ils n'existent pas). La colonne « Apprendre & être aidé » renvoie vers TikTok, le support WhatsApp et le contact. **Ajouter le Centre d'aide quand il sera créé**, et les boutiques d'exemple quand le contenu sera arbitré.
6. **Valider le contenu des plans.** Le tableau comparatif contient des valeurs plausibles mais inventées (50/500/illimité produits, 1/3/10 comptes). À confirmer avec le produit.
7. **Trancher le chiffre de boutiques** et le brancher sur une source unique.

**Recommandé :**

8. Demander l'accord de « Viens on s'connaît » pour figurer comme boutique de démonstration, ou basculer sur une boutique fictive.
9. **Confirmer les moyens de paiement affichés.** Le tunnel d'inscription annonce « Wave et MaxIt déjà intégrés » alors que la landing liste aussi MTN MoMo et Moov Money. Aligner les deux discours pour ne pas promettre ce qui n'est pas encore branché par pays.
10. Ajouter une bascule FR/EN si la diaspora et les 5 pays d'Occident sont une cible réelle.
11. Prévoir un test A/B sur le H1 : promesse temporelle (« en 5 minutes ») contre promesse de résultat.

---

## 9. Points de vigilance

**Ne pas réintroduire :**
- Les pilules arrondies avec point coloré.
- Un bandeau de logos marchands au-dessus du bandeau des paiements (surcharge le haut de page — les logos vivent près des témoignages).
- Un aperçu de boutique générique : la vitrine réelle est un profil, pas un site e-commerce classique.
- Un espace vendeur sombre : l'application réelle est claire.
- Une étape « crée ton compte » en première position.
- La note et les étoiles dans le hero : la preuve sociale y tient au nombre de boutiques, pas à une note.
- L'ambre ailleurs que sur la timeline et le badge « le plus choisi ».
- **Tout dégradé bleu vers violet**, y compris sur un mot de titre, un halo de fond ou un bouton.
- Un cadre navigateur de bureau pour montrer une boutique.

**Ne pas affaiblir :**
- La preuve sociale en ouverture du hero.
- Les 4 étapes en blocs alternés avec un écran par étape. La version en 4 petites cartes identiques avait été testée et rejetée : elle affirme au lieu de démontrer.
- La ligne 02:47 de la timeline.
- La FAQ à 15 questions (valeur SEO et levée d'objections).
- Les animations des écrans d'étapes : elles transforment une affirmation (« c'est simple ») en démonstration.
- L'ordre du parcours : les 5 questions d'abord, le compte ensuite.
- La mention de l'Assistant IA dans l'espace vendeur, décrite par ce qu'il fait (expliquer, guider, conseiller) et non par sa technologie.

---

## 10. Fichier fourni

`tekkishop-landing-v6.html` — page autonome, ~115 Ko, sans dépendance autre que les polices Google. CSS et JS inclus. Toutes les interactions fonctionnent : menu mobile, bascule tarifaire, accordéons FAQ et comparatif, modale de démonstration, barre d'action mobile, animations d'apparition au défilement.
