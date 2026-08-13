# Masquage des commandes retenues (modèle free_orders)

## Le problème

Dans le modèle de facturation `free_orders`, une commande peut être créée
alors que le quota d'essai de la boutique est dépassé (ou que l'essai de
14 jours est expiré). Cette commande est marquée `is_held = true` et reste
dans cet état tant que `released_at IS NULL`. Le principe du modèle : le
marchand voit qu'une commande existe, mais **ne doit pas pouvoir en
exploiter les coordonnées** (nom, téléphone, WhatsApp, email, adresse,
zone de livraison, notes) tant qu'il n'a pas activé sa boutique. C'est ce
qui rend l'activation nécessaire — pas un détail d'affichage.

## Pourquoi ce n'est pas géré par RLS ni par une vue Postgres

La quasi-totalité du code serveur de ce projet lit et écrit via
`createAdminClient()` (clé `service_role`), qui **contourne RLS et les
droits par colonne par construction**. Une politique RLS ou une vue
« sécurisée » n'aurait donc aucun effet sur ces chemins de code — la
protection doit être applicative.

## Pourquoi ce n'est pas un type TypeScript à lui seul

Un type (branded type, etc.) empêche seulement un passage de valeur mal
typé dans une fonction. Il n'empêche pas l'interpolation dans un gabarit
de chaîne :

```ts
const msg = `Nouvelle commande de ${nom}` // compile très bien, quel que soit le type de `nom`
```

Un type seul ne suffit donc pas à empêcher une fuite dans un message
WhatsApp, un e-mail, un export CSV, etc.

## La solution retenue

Le masquage se fait **à la source**, immédiatement après la lecture en
base, via `src/lib/orders/redact.ts`. Les fonctions de ce fichier
remplacent la vraie valeur par `null` ou par un libellé neutre
(`REDACTED_LABEL`) quand `isOrderBlocked(order)` est vrai. Une fois passée
par ces fonctions, la commande retenue **ne porte plus la donnée
d'origine** — rien de ce qui la consomme ensuite (affichage, export,
notification) ne peut donc la faire fuiter, quel que soit le code qui
l'utilise.

Deux mécanismes distincts sont utilisés selon la nature de l'usage :

- **Affichage / message** → la valeur est remplacée (`redactClient`,
  `redactLocation`, `redactNotes`).
- **Action qui ferait avancer ou contacter réellement le client**
  (envoyer au livreur, envoyer un lien de téléchargement, avancer le
  statut, annuler, confirmer une livraison) → l'action elle-même est
  **désactivée**, pas seulement nourrie de données masquées. Envoyer une
  commande incomplète à un livreur ne sert à personne.

## Limite structurelle — à lire avant d'ajouter un nouveau point de lecture

Ce mécanisme ne protège que les endroits qui l'appellent. **Rien
n'empêche structurellement un futur endroit du code de relire
`order.clients` / `order.delivery_address` / `order.notes` bruts et de les
exposer.** Il n'y a pas de garde-fou automatique au niveau du compilateur
ou de la base pour ce cas — c'est une limite connue et acceptée.

**Règle à appliquer à chaque nouveau code qui lit une commande pour un
usage marchand** (dashboard, export, notification, intégration future) :
passer immédiatement le résultat par `redactClient` / `redactLocation` /
`redactNotes`, et vérifier `isOrderBlocked` avant toute action qui ferait
avancer la commande ou contacterait réellement le client. Ne jamais
relire les colonnes brutes pour les afficher, les exporter ou les
inclure dans un message.

## Points déjà couverts

- `api/orders/route.ts` (push + email + WhatsApp à la création)
- `api/webhooks/bictorys/route.ts` (alerte WhatsApp marchand)
- `dashboard/orders/page.tsx` (liste)
- `dashboard/orders/[id]/page.tsx` (détail — nom, téléphone, adresse,
  zone, notes, bouton "Contacter", lien avis)
- `SendToDeliveryButton` (désactivé, pas juste masqué)
- `DigitalDeliveryCard` (désactivé, pas juste masqué)
- `api/dashboard/orders/[id]/resend-digital/route.ts` (refuse si retenue)
- `api/export/orders/route.ts` (CSV)
- `lib/actions/orders.ts` — `advanceOrderStatus`, `cancelOrder` (refusent
  si retenue)
- `api/delivery/confirm/route.ts` (refuse si retenue)

## Dérogation documentée

`src/app/admin/payments/page.tsx` lit les coordonnées client d'une commande
retenue sans passer par ce module — voir la justification complète dans
l'en-tête de `src/lib/orders/redact.ts` (pas dupliquée ici). Résumé : la
règle protège le modèle économique (empêcher un marchand de contourner
l'activation), pas les données en général ; l'équipe TEKKIShop a besoin d'y
voir clair pour traiter un incident.
