# Spécification — Nouveau modèle d'essai : boutique publique + 3 commandes offertes

> Document destiné à Claude Code. À traiter **après** la refonte de `/start`, et à mettre en production **en même temps qu'elle**.

---

## 1. Le changement, en une phrase

**L'activation cesse d'être une porte d'entrée pour devenir une porte de sortie.**

Aujourd'hui, payer sert à *rendre la boutique visible*. Désormais, payer sert à *continuer à vendre une boutique qui vend déjà*. Le montant est identique, la décision ne l'est pas : on passe de « paie pour avoir le droit d'essayer » à « paie parce que ça marche ».

Trois conséquences :

- La boutique devient **publique dès la publication du premier produit**, sans paiement.
- Le marchand dispose de **3 commandes offertes** et de **14 jours** (au lieu de 30).
- Au-delà, les commandes continuent d'arriver mais sont **retenues** jusqu'à l'activation.

Le mot « activer » change de sens dans tout le produit. Il ne signifie plus « rendre publique » mais « débloquer les commandes ». À corriger partout (§10).

## 2. Ce qui ne doit pas casser

Contrainte prioritaire sur tout le reste de ce document.

- **Les 1 485 boutiques existantes ne changent pas de comportement.** Celles qui sont en essai conservent leurs 30 jours jusqu'à l'échéance en cours. Celles qui sont abonnées ne sont pas touchées.
- Le nouveau modèle ne s'applique **qu'aux boutiques créées après la mise en production**.
- Le tunnel de paiement Bictorys, le checkout client et les webhooks existants ne sont pas modifiés.
- Aucune commande existante ne doit être retenue rétroactivement.

Concrètement : une colonne `trial_model` sur `shops` (`'legacy'` ou `'free_orders'`), `'legacy'` par défaut pour l'existant, `'free_orders'` pour les nouvelles. Toute la logique de ce document est conditionnée à `trial_model = 'free_orders'`.

## 3. Les états d'une boutique

| Statut | Boutique publique | Commandes | Entrée dans l'état |
|---|:---:|---|---|
| `draft` | non | non | Écran 7 de `/start`, avant la création du compte |
| `trial` | **oui** | oui, comptées | Publication du **premier produit** |
| `expired` | oui | **retenues** | 3 commandes atteintes **ou** 14 jours écoulés |
| `active` | oui | illimitées | Paiement d'un plan |

Règles de transition :

- `draft → trial` se déclenche à la **publication du premier produit**, pas à la création du compte. Une boutique vide n'a pas à être publique.
- `trial → expired` se déclenche sur **la première limite atteinte** : 3 commandes ou 14 jours.
- `expired → active` et `trial → active` se déclenchent au paiement.
- Une boutique `active` ne redevient jamais `trial`. Si l'abonnement s'arrête, elle passe en `expired`.

## 4. Le compteur de commandes

**Toute commande reçue est comptée.** Pas seulement les commandes confirmées, parce qu'une partie des ventes est payée à la livraison et ne peut pas être confirmée à la création.

- Une commande annulée **ne restitue pas** le quota. C'est volontaire : simple à expliquer, simple à implémenter.
- Le support peut restituer manuellement un quota en cas de commande frauduleuse. Prévoir une fonction admin, pas une interface.
- Le compteur est atomique : `UPDATE shops SET free_orders_used = free_orders_used + 1 ... RETURNING free_orders_used` dans un trigger `BEFORE INSERT` sur `orders`. Deux commandes simultanées ne doivent pas passer toutes les deux.

## 5. Côté client — la boutique publique

### En `trial`
Comportement normal. Aucune mention de l'essai, du quota ou du statut de la boutique **ne doit apparaître côté client**. C'est la marque du marchand, pas la nôtre.

### En `expired`
La commande est **enregistrée mais retenue** (`orders.is_held = true`).

Le client voit un message neutre à la validation :
> **Commande enregistrée.** Le vendeur va te contacter pour confirmer.

Ni faux, ni alarmant. Mais il ne peut pas rester sans réponse indéfiniment :

**Filet de sécurité à 48 h.** Si la commande est toujours retenue 48 h après sa création, le client reçoit un message :
> Bonjour, ta commande chez {boutique} n'a pas pu être traitée. Tu peux contacter le vendeur au {numéro WhatsApp du marchand}.

Ce message est envoyé une seule fois (`orders.held_notified_at`).

**Fermeture au-delà de 3 commandes retenues.** Si une boutique `expired` accumule 3 commandes retenues non résolues, le bouton de commande se ferme :
> Cette boutique ne prend pas de commandes en ce moment.

Le catalogue reste consultable. Cela évite qu'un marchand parti sans revenir accumule des clients déçus.

## 6. Côté marchand — le tableau de bord

### Le compteur, visible en permanence
Sous les indicateurs du haut, tant que `status = 'trial'` :
> **Commandes offertes : 1 / 3** · Il te reste 12 jours

### L'alerte à la 2ᵉ commande
Déclenchée à la 2ᵉ commande, pas à la 3ᵉ — pour que le marchand ait le temps d'activer avant de perdre une vente. Notification WhatsApp + bandeau dans le tableau de bord :
> Nouvelle commande de {montant}. Il te reste **1 commande offerte**. Active ta boutique maintenant pour ne pas rater la suivante.

### Les commandes retenues
Le marchand voit **le montant et le nombre d'articles**. Les **coordonnées du client sont masquées** jusqu'à l'activation — nom, téléphone et adresse remplacés par un flou et un cadenas.

C'est délibéré : donner le numéro permettrait de conclure la vente hors plateforme et de ne jamais activer.

> **Une commande de 22 500 F t'attend.** Active ta boutique pour voir le client et la traiter.

### À l'activation
Toutes les commandes retenues sont libérées d'un coup (`is_held = false`), les coordonnées apparaissent, et le marchand reçoit une confirmation :
> Ta boutique est activée. **2 commandes t'attendent**, pour un total de 37 500 F.

## 7. Les deux fins d'essai

C'est le point le plus important de cette spécification. Les deux cas n'ont rien à voir et ne doivent pas partager le même écran.

### Cas A — le quota est atteint (3 commandes)
Le marchand a la preuve que ça marche. Le message s'écrit tout seul :
> **Tes 3 commandes offertes t'ont rapporté 42 000 F.** Active ta boutique pour continuer à recevoir des commandes.

Le montant affiché est le **cumul réel** des 3 commandes. Puis la grille tarifaire.

### Cas B — 14 jours écoulés sans atteindre 3 commandes
**Surtout pas un mur.** Un marchand qui n'a jamais vendu ne paiera pas, et le forcer transforme un utilisateur récupérable en utilisateur perdu.

Écran de bilan honnête :
> **Ta boutique est prête, mais elle n'a pas encore trouvé ses clients.**
> {X} personnes ont ouvert ton lien. Ce qui te manque, ce n'est pas la boutique — ce sont les visiteurs.

Puis, dans cet ordre :
1. Le **plan d'acquisition sur 7 jours** de l'Assistant IA, mis au premier plan.
2. Une **prolongation de 7 jours**, conditionnée à une action concrète : avoir partagé son lien au moins une fois. Bouton « Partager ma boutique » qui déclenche la prolongation.
3. La grille tarifaire, en dernier et sans insistance.

Une seule prolongation possible par boutique (`trial_extended_at`).

## 8. Schéma de données

### Colonnes à ajouter sur `shops`
```sql
ALTER TABLE shops
  ADD COLUMN trial_model       TEXT NOT NULL DEFAULT 'legacy'
    CHECK (trial_model IN ('legacy', 'free_orders')),
  ADD COLUMN trial_started_at  TIMESTAMPTZ,
  ADD COLUMN trial_ends_at     TIMESTAMPTZ,
  ADD COLUMN trial_extended_at TIMESTAMPTZ,
  ADD COLUMN free_orders_used  INTEGER NOT NULL DEFAULT 0;
```
`status` accepte déjà les quatre valeurs (`draft`, `trial`, `active`, `expired`) si la migration 066 a bien été corrigée.

### Colonnes à ajouter sur `orders`
```sql
ALTER TABLE orders
  ADD COLUMN is_held          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN held_notified_at TIMESTAMPTZ,
  ADD COLUMN released_at      TIMESTAMPTZ;
```

### Trigger
`BEFORE INSERT ON orders` :
1. Si la boutique n'est pas en `trial_model = 'free_orders'`, ne rien faire.
2. Incrémenter `free_orders_used` de façon atomique.
3. Si le nouveau compteur dépasse `FREE_ORDERS` **ou** si `status = 'expired'`, positionner `is_held = true`.
4. Si le compteur atteint `FREE_ORDERS`, passer `status = 'expired'`.

### Tâches planifiées (pg_cron)
- **Quotidienne** : passer en `expired` les boutiques `trial` dont `trial_ends_at < now()`.
- **Horaire** : notifier les clients dont la commande est retenue depuis plus de 48 h et dont `held_notified_at IS NULL`.

### RLS
La page boutique publique doit servir les boutiques en `trial`, `active` et `expired`. Jamais `draft`. Vérifier que la politique existante ne filtre pas sur un statut d'abonnement.

## 9. Constantes

Dans `src/constants` — aucune valeur en dur ailleurs :

```ts
export const FREE_ORDERS = 3;
export const TRIAL_DAYS = 14;              // remplace la valeur actuelle de 30
export const TRIAL_EXTENSION_DAYS = 7;
export const HELD_ORDER_NOTICE_HOURS = 48;
export const MAX_HELD_ORDERS = 3;
```

⚠️ `TRIAL_DAYS` est déjà utilisée ailleurs (notamment `OnboardingForm`). Vérifier chaque usage : la valeur ne doit passer à 14 que pour le nouveau modèle. Si nécessaire, introduire `TRIAL_DAYS_LEGACY = 30`.

## 10. Textes à corriger ailleurs

La promesse actuelle devient fausse. À reprendre :

| Endroit | Avant | Après |
|---|---|---|
| Landing — tarifs | « Crée gratuitement. Paie seulement pour vendre. » | « Vends dès aujourd'hui. Tes 3 premières commandes sont offertes. » |
| Landing — tarifs | « 30 jours pour créer et configurer ta boutique » | « Ta boutique est en ligne dès le premier jour. Tu paies après avoir vendu, pas avant. » |
| Landing — FAQ | « Les 30 jours gratuits me permettent-ils de vendre ? » | « Est-ce que je peux vendre avant de payer ? » — réponse : oui, 3 commandes offertes, puis activation |
| `/start` écran 11 | déjà conforme | vérifier que `FREE_ORDERS` alimente bien le texte |
| Emails et messages WhatsApp | toute mention de 30 jours | 14 jours |

Chercher `30 jours`, `TRIAL_DAYS`, `activer ta boutique` dans tout le dépôt et traiter chaque occurrence.

## 11. Mesure

Événements à poser, sans quoi on ne saura pas si le modèle fonctionne :

`shop_published` (draft → trial) · `first_order_received` (avec le délai depuis la publication) · `free_order_used` (avec le rang 1/2/3) · `quota_warning_shown` (2ᵉ commande) · `trial_expired` (avec le motif : quota ou date) · `order_held` · `order_released` · `trial_extended` · `plan_activated` (avec le motif d'entrée et le nombre de commandes retenues au moment du paiement).

L'indicateur qui compte : **taux d'activation selon le motif de sortie d'essai**. Si le cas A convertit bien et le cas B mal, c'est le parcours de rattrapage qu'il faudra travailler, pas le prix.

## 12. Cas limites à traiter

- Boutique en `trial` dont le marchand supprime tous ses produits → reste `trial`, ne repasse pas en `draft`.
- Commande créée à la seconde exacte où l'essai expire → le trigger fait foi, pas le cron.
- Marchand qui active puis résilie → `expired`, avec les commandes de nouveau retenues. Les commandes déjà libérées le restent.
- Boutique `expired` avec 3 commandes retenues, puis activation → les 3 sont libérées, le compteur de retenues repart à zéro.
- Deux commandes simultanées sur la 3ᵉ place → une seule passe en `trial`, l'autre est retenue.

## 13. Ce qu'il ne faut pas faire

- Ne pas modifier le comportement des boutiques `trial_model = 'legacy'`.
- Ne pas afficher au client la moindre information sur le statut d'abonnement du marchand.
- Ne pas révéler les coordonnées client d'une commande retenue, y compris via l'API, l'export CSV ou les notifications.
- Ne pas envoyer plus d'un message de filet de sécurité par commande.
- Ne pas toucher au tunnel de paiement Bictorys.

## 14. Vérifications avant de rendre la main

1. `npm run build` passe sans erreur ni nouvel avertissement.
2. Une boutique existante en essai de 30 jours conserve exactement son comportement.
3. Un parcours complet neuf : `/start` → premier produit → boutique publique → 3 commandes → `expired` → activation → commandes libérées.
4. Les coordonnées client d'une commande retenue sont inaccessibles côté marchand, y compris en interrogeant l'API directement.
5. Deux commandes simultanées sur la dernière place gratuite ne passent pas toutes les deux.
6. Le cron de bascule à 14 jours fonctionne, testé en avançant `trial_ends_at`.
7. Aucune occurrence de `30 jours` ne subsiste dans les textes du nouveau modèle.

Liste-moi les fichiers modifiés, les migrations créées, les tâches planifiées ajoutées, et les points où tu as dû faire un choix à ma place.
