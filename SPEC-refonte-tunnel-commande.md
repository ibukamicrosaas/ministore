# Spec — refonte du tunnel de commande

> Destinataire : Claude Code. Maquette de référence : `tekkishop-commande-v2.html`.
> Régime de travail : plan avant code, un lot à la fois, rien de commité sans relecture.

---

## 1. Objet

Refondre la page `/{shop-slug}/commander` et ses écrans de sortie (confirmation, suivi, e-mail) à partir de la maquette jointe. La maquette fait foi sur la **structure, les textes et le comportement**, pas sur le code : tu la reproduis fonctionnellement en React/Next.js avec les données réelles, tu ne copies pas son HTML.

Fichiers concernés :

- `src/app/[shop-slug]/commander/page.tsx`
- `src/app/[shop-slug]/commander/OrderForm.tsx`
- `src/app/[shop-slug]/commander/pay/page.tsx`
- `src/app/[shop-slug]/commande/[token]/page.tsx` (suivi)
- le gabarit d'e-mail de confirmation (Resend)

Hors périmètre : `src/app/api/orders/route.ts`, les routes Bictorys, `PaymentMethodSelector`, `BictorysCheckout`. Voir §2.

---

## 2. Ce qui ne change pas

**L'autorité serveur sur les montants.** `POST /api/orders` recalcule prix, variante, palier de quantité, livraison, promo et acompte, et c'est cette valeur qui est persistée puis relue à chaque étape. Cette chaîne est saine, vérifiée. Tu n'y touches pas. Les calculs client restent ce qu'ils sont : de l'affichage.

**Le panier sauvegardé** (`SavedCart`, `clearCart`) : comportement conservé à l'identique.

**Le plafond de 5 articles par commande** et la troncature des zones de livraison (`ZONES_VISIBLE` + « voir plus ») : conservés.

**La modale d'engagement avant paiement en ligne** : conservée dans son principe, réécrite dans sa forme (§10).

---

## 3. Défauts constatés, avec leur cause

Chacun est reproductible aujourd'hui en production.

| # | Défaut | Cause dans le code |
|---|---|---|
| 3.1 | Trois sections portent le numéro « 1 » | Le stepper affiche `step`, mais les puces des sections sont écrites en dur |
| 3.2 | La barre collante recouvre le champ e-mail | `pb-32` sur le `<form>` insuffisant, hauteur réelle de la barre non réservée |
| 3.3 | Sur desktop, la page est une colonne étroite centrée | `max-w-lg mx-auto` dans `commander/page.tsx` |
| 3.4 | Après paiement, l'acheteur voit « 4 500 » puis « 225 » sans rien entre les deux | Confirmation, suivi et e-mail n'affichent ni sous-total, ni remise, ni livraison |
| 3.5 | L'e-mail annonce « Retrait en boutique » pour un ebook | `delivery_type: isDigital ? 'store_pickup'` — le gabarit lit ce champ sans tester le type de produit |
| 3.6 | Emojis dans l'interface (`🔒 ✅ 💬`, `💳`, `⚠️`, `😕`) | Interdits par `AI_RULES.md` |
| 3.7 | « Satisfaction garantie » sous le bouton de paiement | Promesse sans auteur, ni plateforme ni marchand |
| 3.8 | Le tunnel alterne tutoiement et vouvoiement | `pay/page.tsx` vouvoie, `OrderForm` tutoie |
| 3.9 | Un code promo appliqué ne peut plus être retiré | Aucun chemin de retour dans l'état `promoStatus` |
| 3.10 | Une remise sur quantité change le prix unitaire sans être annoncée | `getQtyDiscountPct` s'applique dans `itemsSubtotal`, jamais affiché |
| 3.11 | `isDigital` est calculé sur le seul produit présélectionné | `commander/page.tsx` ne teste que `preselectedProductId` ; ajouter un second article ne le recalcule pas |
| 3.12 | Trois requêtes `.single()` séparées sur `shops` dans la même page | `shopData`, `accept_cash_on_delivery`, `target_countries` |

---

## 4. Principes

**A. Un seul écran, pas d'assistant.** Le découpage en trois étapes disparaît. Toutes les sections sont visibles et défilent. Sur une commande d'un à cinq articles, un formulaire qui défile est plus rapide qu'un assistant qui découpe, et il supprime la classe de bugs 3.1.

**B. Le montant est toujours décomposé.** Partout où un total apparaît — tunnel, confirmation, suivi, e-mail — les lignes qui y mènent apparaissent aussi. Un acheteur ne doit jamais avoir à faire une soustraction pour comprendre ce qu'il paie.

**C. Ce qu'on paie maintenant prime sur le total.** Dans un marché où le paiement à la livraison existe pour des raisons de confiance, la question à l'instant du clic n'est pas « combien » mais « combien tout de suite ». C'est cette valeur qui est mise en avant.

**D. Une décision qui n'en est pas une disparaît.** Quand un seul mode de paiement ou de livraison est disponible, on l'annonce en une phrase au lieu d'afficher une liste à un seul élément.

---

## 5. Structure de la page

Quatre sections dans cet ordre, sans numérotation :

1. **Ce que tu commandes** — lignes d'articles avec image, nom, variante, prix unitaire, sélecteur de quantité, lien « Changer », lien « Ajouter un autre article », note de personnalisation quand le produit l'active.
2. **Comment tu reçois ta commande** — masquée entièrement pour un produit digital. Deux cartes de choix (livraison / retrait), puis zone et adresse quand la livraison est choisie.
3. **Où on te joint** — nom, téléphone avec indicatif, case « même numéro WhatsApp », e-mail.
4. **Comment tu paies** — voir §7.

Puis, hors sections : un bouton discret « Ajouter une précision » qui déplie le champ de notes.

**Disposition.** Mobile : une colonne, relevé en bas, barre collante fixe. Desktop (≥ 960 px) : deux colonnes, formulaire à gauche, relevé collant à droite. Le `max-w-lg mx-auto` de `commander/page.tsx` est remplacé par un conteneur large.

**Barre collante.** La page réserve en bas une hauteur égale à celle de la barre, plus la marge de sécurité iOS (`env(safe-area-inset-bottom)`). Aucun contenu ne doit passer dessous. La barre disparaît en disposition desktop, remplacée par le bouton du relevé.

**Garde anti-ghost-click.** Le garde actuel est lié à `step === 3`. Avec la suppression des étapes il n'a plus d'ancrage : remplace-le par une garde sur l'état de soumission, et dis-moi dans ton plan ce que tu proposes.

---

## 6. Le relevé « Ce que tu paies »

C'est l'élément central de la refonte. Un composant unique, réutilisé tel quel sur les quatre surfaces (tunnel, confirmation, suivi, e-mail — version HTML statique pour ce dernier).

Contenu, dans l'ordre, chaque ligne masquée si elle vaut zéro :

- Sous-total, avec le nombre d'articles
- Remise sur quantité, si un palier s'applique — **nouvelle ligne, aujourd'hui invisible (3.10)**
- Réduction, avec le code et le pourcentage
- Livraison, avec le nom de la zone
- **Total**
- Puis, dans un bloc distinct : **ce que tu paies maintenant** et **ce que tu paies à la livraison**

Le code promo vit **dans ce relevé**, sous le total : un lien « J'ai un code promo » qui déplie le champ, et une fois appliqué un bandeau portant le code, la remise et un lien **« Retirer »** (corrige 3.9).

Rappels de calcul, à respecter pour rester cohérent avec le serveur : la remise promo porte sur le sous-total des articles, **pas sur la livraison** ; elle s'applique aussi à l'acompte ; les remises sur quantité modifient le prix unitaire avant tout le reste.

**Barre mobile.** Elle affiche en gros le montant dû maintenant, avec en dessous une ligne « puis X FCFA à la livraison ». Quand rien n'est dû maintenant, elle affiche le total avec la mention « en espèces à la livraison ».

---

## 7. Modes de paiement et réglages marchand

Trois réglages boutique gouvernent cette section : `accept_online_payment`, `accept_cash_on_delivery`, et l'acompte (`deposit_percentage`, au niveau produit avec repli sur la boutique).

**Règle de composition :**

- Mobile money actif → mode « Tout payer maintenant »
- Paiement à la livraison actif → mode « Payer à la livraison »
- Acompte configuré **et** les deux canaux actifs → mode « Payer un acompte »
- Zéro mode disponible → message neutre, commande impossible

L'acompte suppose les deux canaux, puisqu'il consiste à payer une part en ligne et le reste en espèces. Si le marchand coupe l'un des deux, il disparaît de lui-même.

**Quand un seul mode reste**, la section devient une phrase : « Tu régleras 16 000 FCFA en espèces à la livraison » ou « Tu paies 16 000 FCFA maintenant par mobile money ». Pas de bouton radio unique déjà coché.

**Changement de modèle à valider avant de coder.** Aujourd'hui `paymentType` ne connaît que `'online' | 'on_delivery'`, et l'acompte est **déduit** : un acheteur qui choisit « payer maintenant » se voit facturer un acompte sans l'avoir demandé. C'est précisément le genre d'écart qui rend un montant incompréhensible. La maquette en fait un **troisième choix explicite**. Propose-moi la migration : ce que devient `paymentType`, comment `payment_type` continue d'être envoyé au serveur avec ses valeurs actuelles (`online_full`, `online_deposit`, `on_delivery`, `on_site`), et ce qui se passe pour un panier mixte où seuls certains produits ont un acompte.

**Libellé de l'acompte.** Le pourcentage est par produit, avec repli boutique — il n'est pas nécessairement de 50 %. Le libellé doit refléter le montant réellement calculé, et non un pourcentage écrit en dur.

---

## 8. Produits digitaux

Le drapeau `isDigital` disparaît au profit de deux informations dérivées du **contenu réel du panier**, recalculées à chaque changement d'article (corrige 3.11) : le panier contient-il au moins un fichier, et contient-il au moins un article physique.

**Règle décidée — un fichier impose le paiement en ligne intégral.** Dès qu'un article digital est présent, quel que soit le reste du panier :

- le paiement à la livraison n'est pas proposé — il faudrait délivrer le fichier avant tout encaissement ;
- l'acompte n'est pas proposé non plus : un acheteur qui règle une part, télécharge, puis refuse la livraison repart avec le fichier et laisse l'impayé ;
- la commande part donc en `online_full`, et uniquement par les moyens en ligne que la boutique propose.

**Règle décidée — la livraison suit les articles physiques.** La section livraison s'affiche dès qu'un article physique est présent, même si le panier contient aussi un fichier. Elle est masquée pour un panier entièrement digital, où l'e-mail devient obligatoire.

**La bascule doit être annoncée, jamais subie.** Un acheteur qui avait choisi « payer à la livraison » et qui ajoute un fichier voit son choix disparaître : affiche la raison à cet endroit — « Ta commande contient un fichier à télécharger, elle se règle en ligne. » Le silence ici reproduirait le défaut de l'acompte implicite du §7.

**Panier mixte non finançable.** Si la boutique n'accepte aucun paiement en ligne, un panier contenant un fichier n'a aucun mode de paiement. Empêche l'ajout du fichier au panier, avec un message clair, plutôt que de laisser l'acheteur arriver en bas d'un formulaire sans issue.

**À vérifier avant de coder quoi que ce soit dans ce lot.** Le code actuel écrit `payment_type: isDigital ? (acceptOnlinePayment ? 'online_full' : 'on_site')`. Chez un marchand sans paiement en ligne, une commande digitale part donc en `on_site`, c'est-à-dire sans encaissement attendu. Trace ce qui autorise l'accès au fichier : si la page de téléchargement s'ouvre sur le statut de la commande plutôt que sur un paiement encaissé, le fichier est distribué gratuitement. Donne-moi le fichier et la ligne qui décident de cet accès, et dis-moi si des commandes `on_site` portant un produit digital existent déjà en base.

**`delivery_type` pour un panier entièrement digital.** Il vaut aujourd'hui `'store_pickup'`, ce qui produit le « Retrait en boutique » de l'e-mail (3.5). Propose une correction : soit une valeur dédiée, soit un champ nul avec un gabarit d'e-mail qui teste le contenu de la commande. Une migration de données n'est pas souhaitable si elle peut être évitée — dis-moi ce que ça coûte dans les deux sens.

---

## 9. Après la commande

Les trois surfaces de sortie reprennent le relevé complet du §6.

**Page de confirmation** et **page de suivi** : sous-total, remises, livraison, total, et la répartition maintenant / à la livraison quand elle s'applique. Pour un produit digital, le bloc de téléchargement reste en tête, inchangé.

**E-mail de confirmation** : même décomposition, en HTML statique. Corrige au passage la ligne de livraison (3.5) et retire les emojis (3.6).

**Page de paiement** (`pay/page.tsx`) : passage au tutoiement (3.8), suppression du `😕` de l'écran d'annulation, et affichage de la décomposition à côté du montant à payer, pour qu'un acheteur qui voit « 225 FCFA » comprenne d'où il vient.

---

## 10. Textes et style

**Tutoiement partout**, y compris `pay/page.tsx` et les gabarits d'e-mail.

**Aucun emoji** dans l'interface ni dans les e-mails.

**Retire « Satisfaction garantie »** (3.7). Les mentions de réassurance sous le bouton se limitent à des faits vérifiables : le traitement du paiement par Bictorys, et l'envoi d'un lien de suivi. Si le marchand veut ajouter une promesse, elle passe par ses propres champs et se distingue visuellement d'un fait plateforme — même règle que la séparation faits/mentions de la fiche produit.

**Un libellé de bouton ne change pas de nom en cours de route.** Le bouton qui dit « Payer maintenant » mène à un écran qui parle de paiement, pas de confirmation.

**Typographie** : Bricolage Grotesque en display, Inter en texte, conformément à la décision portée dans `AI_RULES.md`.

**Couleur** : `var(--brand)`, jamais un recalcul local de `shop.primary_color` ni le repli `#0EA5E9` en dur.

---

## 11. Performance

Cette page est vue par l'acheteur final, sur les réseaux les plus lents du marché. Mesure avant et après, sur les deux boutiques de référence, et joins les chiffres au rapport de lot.

Le budget et la mesure de référence sont ceux consignés dans `REPRISE.md` — utilise les valeurs postérieures au correctif du favicon, pas les mesures initiales.

Aucune bibliothèque supplémentaire pour cette page.

**Requêtes serveur** : `commander/page.tsx` interroge trois fois la table `shops` avec trois `.single()` (3.12). Regroupe-les en une seule requête, en gérant l'absence éventuelle de colonne comme le fait le code actuel.

---

## 12. Accessibilité

Champs étiquetés, champs obligatoires signalés autrement que par la seule couleur, focus visible au clavier sur tous les contrôles, `prefers-reduced-motion` respecté, modale fermable par Échap et par clic sur le fond, focus renvoyé au déclencheur à la fermeture.

---

## 13. Découpage

Quatre lots, livrés et relus séparément.

**A — Structure.** Suppression du stepper, quatre sections, disposition deux colonnes sur desktop, barre collante non recouvrante, regroupement des requêtes `shops`, `--brand`, typographie. Aucun changement de logique de calcul.

**B — Le relevé.** Composant partagé, décomposition complète, lignes de remise sur quantité et de promo, répartition maintenant / à la livraison, code promo déplacé dans le relevé avec possibilité de le retirer.

**C — Modes de paiement.** Composition selon les réglages marchand, mode unique affiché comme une phrase, acompte en choix explicite, recalcul de `isDigital` sur le panier.

**D — Sorties.** Confirmation, suivi, e-mail : relevé complet, correction de la ligne de livraison pour les commandes digitales, tutoiement, retrait des emojis.

Le lot C est le seul qui touche au modèle de données envoyé au serveur : plan obligatoire avant code, avec la migration de `paymentType` décrite au §7.

---

## 14. Recette

- Le montant affiché à l'étape finale, dans la modale, sur la page de paiement et dans la requête Bictorys est identique. Test de non-régression permanent.
- Aucun contenu masqué par la barre collante, sur iPhone SE, iPhone 15 et Android 360 px.
- Une commande avec code promo, une commande sans, une commande avec remise sur quantité : dans les trois cas, la décomposition affichée reconstitue le total exactement.
- Un code promo appliqué peut être retiré, et le total revient à sa valeur d'origine.
- Boutique sans paiement à la livraison, boutique sans mobile money, boutique sans acompte : dans chaque cas, la section paiement affiche ce qu'il faut et rien de plus.
- Commande entièrement digitale : aucune mention de livraison ni de retrait, nulle part, e-mail compris.
- Panier mixte : la livraison est demandée, le paiement à la livraison et l'acompte ont disparu, et la raison est affichée. Après paiement, le fichier est accessible et l'article physique apparaît en préparation.
- Boutique sans paiement en ligne : un produit digital ne peut pas être ajouté au panier, et le message l'explique.
- Aucun emoji dans le rendu final, e-mails inclus.
- Recherche de `if (plan === 'pro')` et de recalculs de `shop.primary_color` dans les fichiers touchés : aucun restant.
- `npm run build` sans nouvel avertissement.

---

## 15. Ce qui reste à trancher

À me remonter par écrit avant le lot correspondant, sans décider seul :

1. La migration de `paymentType` vers un acompte explicite, et son comportement sur un panier à plusieurs articles dont certains seulement portent un acompte (§7).
2. Le traitement de `delivery_type` pour les commandes entièrement digitales, avec le coût des deux options (§8).
3. Ce qui autorise l'accès au fichier téléchargeable, et l'existence éventuelle de commandes `on_site` portant un produit digital (§8).
