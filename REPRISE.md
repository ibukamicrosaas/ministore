# Reprise — TEKKIShop

> Document factuel, sans récit. Objectif : qu'une session sans aucune mémoire des échanges puisse reprendre le travail depuis cet état, pas depuis un fil de conversation. Fichier local uniquement (`*.md` est gitignore intentionnellement — voir `AI_RULES.md`), référencé depuis `AI_RULES.md` §0.1.
>
> Dernière mise à jour : 2026-08-10.

---

## 1. État technique

**Appliqué en base (Supabase, projet lié), vérifié :**
- `088_lockdown_activate_free_orders_shop.sql` — verrouille `activate_free_orders_shop` (`EXECUTE` retiré à `anon`/`authenticated`, restauré à `service_role` seul).
- `089_lockdown_remaining_functions.sql` — verrouille les 17 fonctions restantes du schéma `public` (hors `088` et hors les 3 `get_my_*` intouchées).

**Git :**
- Branche `hotfix/lockdown-activate-free-orders-shop` : `088` + `089` + `scripts/check-function-privileges.sql`, poussée sur origin.
- **PR #4 ouverte, non fusionnée** : https://github.com/ibukamicrosaas/ministore/pull/4 — base `main`, autonome (pas de bundle avec la refonte boutique). Fusion prévue par l'utilisateur lui-même après relecture, pas automatique.
- `refonte-start` : plafond committé réel = `085` (vérifié par diff, pas supposé). `086_product_variants.sql`/`087_shops_verification.sql` (migrations du Lot 1) existent en fichiers mais ne sont pas commitées.
- **Tout le Lot 1 (redesign boutique) est non commité sur `refonte-start`, mêlé aux modifications de CGU/politique de confidentialité de l'utilisateur dans le même arbre de travail.** Fichiers Lot 1 : les deux migrations ci-dessus, `src/lib/plan-features.ts`, `src/lib/actions/product-limit.ts` (nouveaux), `SettingsForm.tsx`, `ReviewForm.tsx`, `[shop-slug]/layout.tsx` (pose de `--brand`, retrait de la surcharge `--color-primary` — vérifié : plus aucune référence à `--color-primary` dans `[shop-slug]/`, le renommage est cohérent de bout en bout dans cet arbre), `[shop-slug]/produit/[id]/page.tsx`, `[shop-slug]/commande/[token]/page.tsx`, `import-csv/route.ts`, `onboarding.ts`, `products.ts`. CGU/privacy : `src/app/legal/cgu/page.tsx`, `src/app/legal/privacy/page.tsx` — jamais à modifier par un agent, seulement à afficher pour relecture.
- Une requête de préservation des badges "Pro" mentionnée en session, décrite mais pas encore écrite en fichier de migration ni appliquée — à retrouver et formaliser avant application.

**Ordre de réconciliation avec `main` — à respecter strictement, ne pas inverser :**
1. Relecture du diff du Lot 1 par l'utilisateur (en cours).
2. Commit du Lot 1 sur `refonte-start` (l'utilisateur indique lesquels regrouper — ne pas décider seul).
3. Seulement ensuite : fusionner `main` (qui contiendra `088`+`089` une fois la PR #4 fusionnée) dans `refonte-start`.

Ne jamais fusionner `main` dans `refonte-start` tant que l'arbre de travail contient encore le Lot 1 et les modifications CGU non commitées — fusionner dans un arbre sale mélangerait ce que la session a explicitement pris soin de séparer.

---

## 2. La découverte plateforme

**`ALTER DEFAULT PRIVILEGES ... REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC` ne protège pas les fonctions futures sur cette base Supabase.** Un mécanisme de plateforme — invisible dans `pg_proc`, `pg_event_trigger` et `pg_default_acl` — ajoute `EXECUTE` à `PUBLIC` de façon inconditionnelle à la création d'une fonction dans `public`, quel que soit l'état des privilèges par défaut.

**Méthode d'élimination** (voir commentaire complet dans `supabase/migrations/089_lockdown_remaining_functions.sql`, au-dessus de la clause `ALTER DEFAULT PRIVILEGES`) :
1. `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated` appliqué et vérifié par `SELECT` direct sur `pg_default_acl` — la ligne ne contenait effectivement plus `PUBLIC`/`anon`/`authenticated`.
2. Une fonction créée juste après, dans la même transaction, obtenait quand même `EXECUTE` pour `PUBLIC` (`proacl` le montrait explicitement).
3. Les 7 event triggers de la base lus un par un pour écarter cette piste : `rls_auto_enable` ne cible que les `CREATE TABLE` ; `grant_pg_cron_access`, `grant_pg_net_access`, `grant_pg_graphql_access` ne se déclenchent que sur `CREATE EXTENSION` ; `pgrst_ddl_watch` se contente d'un `NOTIFY`. Aucun n'accorde `EXECUTE` sur une fonction.
4. Conclusion : le mécanisme responsable n'est identifiable par aucune requête SQL disponible — probablement un hook de plateforme (type `supautils`), hors de portée de ce dépôt.

**Décision prise en conséquence :** pas d'event trigger maison pour contourner ce mécanisme — tant qu'il reste une boîte noire, un trigger pourrait s'exécuter avant une éventuelle réinjection et donner un faux sentiment de protection sans le signaler. La protection fiable est le `REVOKE` explicite posé dans la même migration que chaque `CREATE FUNCTION` (règle dans `AI_RULES.md` §3), avec `scripts/check-function-privileges.sql` comme filet rejouable à la demande — il détecte l'anomalie quelle qu'en soit la cause, sans dépendre de comprendre le mécanisme.

**Reste à faire, hors ingénierie** : demander au support Supabase quel composant ajoute `EXECUTE` à `PUBLIC` sur les fonctions de `public`, et s'il est désactivable.

---

## 3. L'enquête de ce soir — décomposition des montants de commande

Déclenchée par un constat d'affichage sur une commande de test (§7) : le récapitulatif de suivi de commande n'affiche ni sous-total ni remise, seulement le total. Investigation menée jusqu'à la portée réelle du problème avant d'écrire une migration.

**Constat central : la décomposition d'une commande n'est pas persistée, seul le total final l'est.**
- `order_items.line_total` intègre déjà la remise sur quantité (le prix unitaire est réduit avant insertion) — pas de perte là.
- `orders.delivery_price` est persisté correctement.
- La remise promo, elle, est calculée en mémoire dans `src/app/api/orders/route.ts` puis jetée : ni le code promo, ni son pourcentage, ni le montant de remise ne sont écrits sur `orders` ou `order_items`.
- Le taux d'acompte (`deposit_percentage`) subit le même sort : seul le montant final (`orders.deposit_amount`) est conservé, jamais le taux qui l'a produit.
- `reserve_promo_code`/`release_promo_code` (`supabase/migrations/045_security_promo_atomic.sql`) ne touchent que `promo_codes.used_count` — aucun lien order↔code n'existe nulle part, même indirectement.

**Deux agrégats de chiffre d'affaires par produit surestiment le CA sur les commandes remisées** (le CA global, lui, est fiable partout — vérifié poste par poste) :
- `src/app/dashboard/rapports/page.tsx:156-165` (« Top produits du mois »)
- `src/lib/ai/tools.ts:223-236` (`get_products`, assistant IA marchand)

Les deux somment `order_items.line_total` au lieu d'imputer la remise par ligne. **Le schéma validé ci-dessous ne corrige pas ces deux endroits** — la remise est stockée au niveau de la commande, pas répartie par ligne. Point ouvert, non tranché, à trancher en tout début de prochaine session :
- soit répartir la remise au prorata sur les lignes à la création de la commande (colonne supplémentaire sur `order_items`, arrondi à gérer pour que la somme des parts retombe sur le total) ;
- soit renommer honnêtement l'indicateur en chiffre d'affaires brut par produit dans les deux endroits, et l'assumer comme tel.

**Ampleur mesurée, base de production, 514 commandes au total :**
- Invariant vérifié : `somme(order_items.line_total) + orders.delivery_price − orders.total_price` — **14 commandes** à écart non nul, **aucune** à écart négatif ou inexpliqué (l'invariant tient à 100 %, aucune composante inconnue).
- Montant total concerné : **54 325 FCFA**, réparti sur des commandes du 22 juin au 9 août 2026 (dont les deux commandes de test de ce soir).
- **Écart non résolu, à signaler tel quel** : `promo_codes.used_count` ne totalise que **7** sur l'ensemble des codes (4 codes à usage non nul), contre 14 commandes montrant une remise effective. Cause non vérifiable depuis cet environnement (lignes `promo_codes` potentiellement supprimées/recréées — motif plausible vu la répétition de paniers identiques dans les 14, mais c'est une inférence, pas une preuve). **Le nombre qui fait foi pour l'ampleur historique est 14 (invariant), pas 7 (`used_count`).**

**Schéma validé, à écrire dans une migration au tout début de la prochaine session :**
- `orders.promo_code text NULL`, `orders.promo_discount_pct integer NULL`, `orders.discount_amount integer NOT NULL DEFAULT 0`, `orders.deposit_percentage integer NULL`.
- `order_items.quantity_discount_pct integer NULL`.
- `line_total` et `unit_price` ne changent pas de sens — du code les lit déjà, ne pas y toucher.
- Backfill historique : `discount_amount` est dérivable pour les 514 commandes existantes (via l'invariant ci-dessus) — seul champ rétro-rempli. `promo_code`, `promo_discount_pct`, `deposit_percentage`, `quantity_discount_pct` restent `NULL` pour tout ce qui précède la migration : définitivement perdus, jamais devinés.
- Affichage : une ligne « Réduction » apparaît dès que `discount_amount > 0` (donc aussi pour les 14 commandes historiques, avec le bon montant) ; jamais de code/pourcentage affiché si `promo_code IS NULL`. Jamais de « 0 % » ou « aucun code » là où la donnée est simplement absente.
- Vérification auto-portante : pas de `CHECK` (Postgres interdit les sous-requêtes inter-tables dedans), pas de trigger vivant sur le chemin de paiement — un script rejouable `scripts/check-order-totals-invariant.sql`, même principe que `scripts/check-function-privileges.sql` pour `089`.

**Séquencement validé** : migration séparée, **avant** le sous-lot 2a (voir §4) — les deux touchent `order_items`, mais pas les mêmes colonnes ; celle-ci d'abord évite que 2a doive fusionner son diff avec un calcul de totaux encore en mouvement.

---

## 4. Travaux dus, dans cet ordre

1. **Migration de la décomposition des montants** (§3 ci-dessus) — schéma validé, prête à écrire.
2. **Favicon** — meilleur rapport effort/gain du reste : `https://www.tekki.shop/favicon.png` pèse à lui seul 834,4 Kio, servi sur les 1 493 boutiques, sans toucher une ligne de rendu (voir §7 pour les chiffres). Jeu 16/32/180/192px, cible < 20 Kio, source `public/favicon.png` (269 Kio, 500×500, modifié localement jamais poussé) ; corriger le `theme_color` obsolète de `manifest.json` ; vérifier si `/icons/[size]/route.tsx` est référencé avant d'en décider le sort. **Nouvelle mesure de référence LCP/poids immédiatement après** — c'est elle qui fera foi pour le §10.1 de `AI_RULES.md`, pas les chiffres actuels de §7.
3. **Unification du calcul de commission** — supprimer `COMMISSION_RATES` de `src/lib/actions/payouts.ts`, une seule fonction partagée, taux à 0 % uniquement si `shops.bictorys_secret_key IS NOT NULL` (jamais dérivé de `plan`), utilisée par `payouts/request`, `processPayout`, `api/admin/payouts/manual`.
4. **Sous-lot 2a** — bascule des variantes vers la table relationnelle : lecture/écriture schéma→table, `POST /api/orders`, nouvelles RPC `decrement_variant_stock_v2`/`increment_variant_stock_v2`. Plan avant code, comme d'habitude. **`REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` explicite dans la même migration qui crée ces deux RPC** — règle `AI_RULES.md` §3, issue de la découverte du §2 ci-dessus.
5. **Lots 2 à 5** du redesign boutique (Lot 3 inclut le découpage de `updateBusinessDesign`, trop large aujourd'hui, et le calcul de `response_time_minutes`).
6. **Page Tarifs** — différée, pas encore ouverte. À l'ouverture, séparer explicitement ce qui peut partir immédiatement (corrections de texte, ce qui est déjà tranché — voir §5) de ce qui dépend de la matrice `plan-features.ts` définitive (celle-ci reflète encore une version antérieure, voir §5) : ne pas mélanger les deux dans un même chantier.
7. **Gating des codes promo** (Business/Pro uniquement, codes Découverte existants continuent de fonctionner) — **non chiffré, à instrumenter** : il manque le nombre de boutiques Découverte ayant des codes actifs. Ne pas confondre avec le chiffre du §7 (9 boutiques Découverte à 11-17 produits) : celui-là concerne la limite de produits du plan, pas les codes promo — deux mesures distinctes.
8. **Gating des SMS par plan** — **non chiffré, à instrumenter** : volume mensuel de SMS par plan, coût correspondant, part des commandes payées à la livraison, taux de remplissage du champ e-mail.

---

## 5. Décisions produit arrêtées

**Règle qui gouverne la matrice des trois plans (Découverte, Business, Pro) :** rien de ce que voit l'acheteur ne dépend du plan du marchand ; seuls la capacité (nombre de produits, limites), l'outillage (fonctionnalités de gestion) et l'appropriation de la marque (personnalisation) en dépendent. Cette règle tranche les cas ambigus futurs.

Conséquences déjà actées :
- **Images de description** : ouvertes aux trois plans (ce que voit l'acheteur).
- **Liens sociaux** : ouverts aux trois plans, même raison.
- **Image de couverture** : descendue en disponibilité — accessible dès le plan Business, plus réservée à Pro.
- **Typographie boutiques publiques et landing** : Bricolage Grotesque + Inter (documentée dans `AI_RULES.md` §1). Les maquettes utilisent Instrument Sans dans les fichiers de design, mais c'est Inter qui fait foi en production.

**`src/lib/plan-features.ts` (Lot 1, non commité) implémente une version antérieure de cette matrice** — `coverImage` et `richDescription` y sont encore réservés à `pro` uniquement, alors que la décision ci-dessus les ouvre plus largement. **À revoir explicitement quand la page Tarifs sera ouverte** (§4, point 6) — ne pas corriger isolément avant.

**§6.4 (revue de la refonte boutique) — clos.** Un bug suspecté (montant incohérent entre deux captures d'écran) s'est révélé être un artefact du test lui-même : un article retiré du panier entre les deux captures, pas une régression de code. Seul point conservé : une vérification de cohérence des montants à titre de garde-fou.

---

## 6. Points ouverts du tunnel de commande

Spec complète : `SPEC-refonte-tunnel-commande.md` (racine du dépôt). Maquette de référence : `tekkishop-commande-v2.html` (racine du dépôt). Les trois points de son §15, à remonter par écrit avant le lot correspondant, sans trancher seul :

1. La migration de `paymentType` vers un acompte explicite, et son comportement sur un panier à plusieurs articles dont certains seulement portent un acompte (§7 de la spec).
2. Le traitement de `delivery_type` pour les commandes entièrement digitales, avec le coût des deux options (§8 de la spec).
3. **Vérification urgente, avant tout le reste** : ce qui autorise l'accès au fichier téléchargeable, et l'existence éventuelle de commandes `on_site` portant un produit digital (§8 de la spec). Non encore vérifié cette session.

Prérequis explicite pour le Lot D de la spec (reprise du relevé complet sur confirmation/suivi/e-mail) : la migration de décomposition du §3 doit être appliquée avant — sans elle, ce lot n'a rien à afficher.

---

## 7. Chiffres mesurés, avec leur date

Mesurés le 2026-08-09/10, cette session, sauf mention contraire :

- **Favicon en production** : `https://www.tekki.shop/favicon.png` pèse **834,4 Kio** (853 708 octets), confirmé par inspection réseau Lighthouse — pas le fichier local `public/favicon.png` (269 Kio), pas encore déployé.
- **Reversements (`payouts`)** : les **15 lignes historiques** en base sont **toutes à 3 %** de commission — aucune n'a jamais été enregistrée à 0 %. Confirme que l'unification du calcul de commission (§4) ne corrige pas une perte déjà survenue, seulement un risque futur.
- **Boutiques Découverte proches ou au-delà de la limite de produits** : **9 boutiques**, entre **11 et 17 produits** chacune — pertinent pour l'application du plafond de 10 produits (`plan-features.ts`), sans lien avec les codes promo (voir §4, point 7, la distinction a été corrigée après une confusion des deux chiffres).
- **Boutiques Pro** : **3 boutiques** sans clé Bictorys propre (`bictorys_secret_key IS NULL`) — pertinent pour la règle de commission du §4.
- **Audit sécurité** : **zéro preuve d'exploitation** trouvée sur les deux angles vérifiés cette session (angles non retranscrits précisément ici, faute de note exacte au moment d'écrire ce document).
- **Décomposition des commandes (§3)** : 514 commandes au total, 14 à écart de remise non nul, 54 325 FCFA concernés, invariant vérifié sans exception.

**Mesures de référence LCP/poids, 9 août 2026, avant toute modification de rendu :**

| | ABI&CO | Glow Eternel |
|---|---|---|
| LCP | 10,6 s | 9,1 s |
| Poids total | 1 620 Kio | 1 615 Kio |
| Other | 840,6 Kio | 844,2 Kio |
| Script | 307,6 Kio | 307,6 Kio |
| Image | 315,7 Kio | 302,7 Kio |
| Font | 117,4 Kio | 117,6 Kio |

Budget visé au §10.1 de `AI_RULES.md` : **2,5 s**. Les deux boutiques sont donc à environ **quatre fois le budget**.

**Cause principale identifiée** : le favicon (834,4 Kio, voir ci-dessus), servi sur chaque page indépendamment de la boutique. Le fichier réellement servi correspond à `public/old-favicon.png` (853 708 octets sur disque) ; `public/favicon.png` (269 Kio) existe localement mais n'est pas déployé.

`Other` et `Script` sont quasi identiques à l'octet près entre les deux boutiques, dont les catalogues diffèrent : c'est une **charge fixe**, pas du contenu marchand — cohérent avec le favicon comme cause principale.

**Ces chiffres seront caducs dès que le sous-lot 2a touchera `ProductGrid.tsx`** (partagé par l'accueil et la fiche produit). Nouvelle mesure de référence à prendre juste après le correctif favicon (§4, point 2) — c'est celle-là, pas celle-ci, qui fera foi pour le §10.1.
