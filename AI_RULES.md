# AI_RULES.md — TEKKIShop

> Règles obligatoires pour tout agent IA travaillant sur ce projet.
> Ces règles ont priorité sur toute autre instruction.
> Version 3.0 — Août 2026

---

## 0.1. REPRISE

**`REPRISE.md`** (racine du dépôt, local uniquement — comme ce fichier) contient l'état réel du projet au-delà de ce que le code seul raconte : décisions actées et leur raison, ce qui est appliqué en base vs. écrit vs. commité, points ouverts par lot, chiffres mesurés avec leur date, découvertes sur la plateforme. À lire avant toute session longue ou toute reprise après une interruption. À tenir à jour à la fin de tout travail qui change cet état — sinon il devient trompeur, ce qui est pire que rien.

---

## 0.2. SORTIE BRUTE, PAS RÉSUMÉE

Quand on demande un diff complet, un résultat de vérification, une liste de fichiers ou une sortie de commande : montrer le contenu réel, pas une paraphrase. Une reformulation peut lisser ou cacher exactement l'anomalie que l'original aurait montrée — c'est arrivé plusieurs fois sur ce projet (fonction oubliée dans une liste résumée, écart de compte non visible tant que la source n'était pas montrée). Résumer est acceptable en complément, jamais en remplacement du contenu demandé.

---

## 0. AVANT DE COMMENCER — TROIS RÉFLEXES

**Vérifier plutôt que supposer.** Ce dépôt a hérité de deux produits antérieurs (BeautyDesk, Sheka). Des noms, des valeurs et des textes traînent encore. Si une documentation contredit le code, c'est le code qui fait foi — et il faut le signaler.

**Signaler ce qui dépasse le périmètre demandé.** Les bugs les plus graves de ce projet ont tous été trouvés en dehors de la tâche en cours. Ne pas corriger sans demander, mais toujours signaler.

**Plan d'abord, code ensuite** sur tout changement touchant la base, les paiements ou le cycle de vie d'une boutique. Migrations et approche validées avant écriture.

---

## 1. STACK — NE JAMAIS DÉVIER

```
Next.js 15        App Router uniquement — jamais Pages Router
React 19          Hooks uniquement — jamais class components
TypeScript        Mode strict — pas de 'any', pas de 'as unknown'
Tailwind CSS      Par défaut. CSS Modules tolérés uniquement là où ils existent déjà
Supabase          Auth + PostgreSQL + Storage + RLS
Bictorys          Paiements mobile money (Wave, Orange Money, Maxit, Moov, T-Money)
Stripe            Paiements par carte bancaire (marchands d'Europe et du Canada)
Lafricamobile     SMS et WhatsApp
Resend            E-mails transactionnels
Sentry            Supervision des erreurs
Supabase Storage  Images produits et logos
Vercel            Déploiement + Cron jobs
npm               Gestionnaire de paquets — jamais yarn ni pnpm
Branding          #0252EA, Bricolage Grotesque + Inter (boutiques publiques et landing — les
                  maquettes de la refonte boutique utilisent Instrument Sans, c'est Inter qui
                  fait foi, décision prise lors de la refonte des boutiques publiques)
```

⚠️ Si une référence à **Twilio** subsiste dans le code ou la documentation, c'est un reliquat : les envois passent par Lafricamobile. Signaler, ne pas corriger sans demander.

---

## 2. LE MODÈLE D'ESSAI — DEUX MODÈLES COEXISTENT

C'est le point le plus important du projet aujourd'hui, et la première source de régression.

### `shops.trial_model`

| Valeur | Concerne | Comportement |
|---|---|---|
| `legacy` | Les ~1 500 boutiques créées avant août 2026, et tout ce qui passe par `/onboarding` | 30 jours d'essai, paiement obligatoire avant de vendre. `is_active` et `plan` font foi. |
| `free_orders` | Les boutiques créées via `/start` | Boutique publique dès le premier produit, 3 commandes offertes, 14 jours. `status` fait foi. |

**Aucune logique du nouveau modèle ne doit s'appliquer à une boutique `legacy`.** Toute requête, tout cron, tout affichage lié au nouveau modèle doit filtrer explicitement sur `trial_model`.

### `shops.status` — uniquement pour `free_orders`

| Statut | Publique | Commandes |
|---|---|---|
| `draft` | non | non |
| `trial` | oui | comptées (3 offertes) |
| `expired` | oui | retenues |
| `active` | oui | illimitées |

Transitions : `draft → trial` à la **publication du premier produit**, jamais à la création du compte. `trial → expired` sur la première limite atteinte. `→ active` uniquement via le helper `setShopStatus`.

### Règle absolue sur `is_active`

> **`is_active = false` l'emporte toujours sur `status`.** Une boutique avec `is_active = false` n'est jamais publique et n'accepte aucune commande, quel que soit son statut.

### Parcours de création

- `/start` — parcours actuel, crée des boutiques `free_orders`. **Tous les CTA marketing pointent ici.**
- `/onboarding` — parcours historique, crée des boutiques `legacy`. Accessible uniquement aux utilisateurs déjà engagés dedans, jamais comme point d'entrée.

---

## 3. RÈGLES DE SÉCURITÉ — ABSOLUES

### Supabase
- **JAMAIS** la clé `service_role` côté client. Uniquement dans `/api/webhooks/` et `/api/cron/`.
- **TOUTES** les tables ont RLS activé — vérifier avant chaque migration.
- Tester les policies avec un utilisateur anonyme **et** authentifié.
- `service_role` contourne RLS : une politique ne protège pas un chemin qui l'utilise. La protection doit alors être applicative.
- **Toute migration qui crée une fonction dans `public` doit porter, dans le même fichier, son `REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC, anon, authenticated` et le `GRANT` nommé vers le seul rôle qui en a besoin.** Raison : sur cette base, `ALTER DEFAULT PRIVILEGES` ne suffit pas — un mécanisme de plateforme accorde `EXECUTE` à `PUBLIC` inconditionnellement à la création, quels que soient les privilèges par défaut (constat vérifié dans `supabase/migrations/089_lockdown_remaining_functions.sql`). Revérifier avec `scripts/check-function-privileges.sql` après toute migration touchant une fonction.
- **`@beautydesk.app` (domaine de l'e-mail synthétique d'authentification) ne doit jamais être changé, nulle part.** Écrit à deux endroits non partagés — `src/lib/actions/auth.ts` (`phoneToEmail`) et `src/app/start/actions.ts` (même fonction, dupliquée) — utilisé pour reconstruire l'identifiant Supabase à chaque connexion (`signIn`) à partir du numéro de téléphone. La fonction est pure et déterministe : `auth.users.email` de chaque compte existant a été écrit avec ce domaine à la création et ne change pas tout seul. Le changer dans le code sans réécrire `auth.users.email` pour tous les comptes existants déconnecte immédiatement la totalité de la base d'utilisateurs, sans exception — un verrouillage total, pas une dégradation. Découvert et confirmé le 2026-08-13 (REPRISE.md §16 point 2).

### Application des migrations — RÈGLE CRITIQUE

Deux chemins, jamais un troisième improvisé.

**Chemin normal :** `supabase db push --linked`. Exécute le SQL et enregistre la version dans l'historique distant en une seule opération — c'est le chemin par défaut, à utiliser dès que tout ce qui est local et absent de l'historique distant peut partir dans l'ordre.

**Chemin hors séquence**, pour appliquer une migration précise sans les autres qui la précèdent dans la numérotation : `supabase db query --linked -f <fichier>` (exécute réellement, en lecture-écriture directe, sans Docker) **puis, immédiatement après un succès confirmé**, `supabase migration repair --status applied <version> --linked` (enregistre dans l'historique, sans réexécuter le SQL). **Jamais l'un sans l'autre, jamais dans l'ordre inverse** — exécuter sans enregistrer laisse l'historique mentir sur ce qui a été appliqué ; enregistrer sans avoir exécuté fait croire qu'un correctif est en place alors qu'il ne l'est pas.

**Cause à éviter, celle qui rend `db push` dangereux sur ce projet précisément :** `db push` ne distingue pas un fichier prêt d'un fichier local en attente — il pousse tout ce que l'historique distant ne connaît pas encore, dans l'ordre, sans trier. Tant qu'un fichier de migration non destiné au prochain déploiement se trouve dans `supabase/migrations/`, aucun `db push` n'est sûr sur cette branche. Ne jamais utiliser `--include-all` : ce flag transforme un fichier oublié ou volontairement en attente en déploiement involontaire — c'est ce qui a produit l'incident du 2026-08-11 (tentative de rejouer 22 migrations déjà appliquées, faute d'historique à jour).

**Vérifier l'état réel avant toute action de migration** : `supabase migration list --linked` (compare fichiers locaux et historique distant, mais seulement pour les fichiers présents sur la branche courante) et, si un doute subsiste sur une migration absente de la branche courante, une requête directe sur `supabase_migrations.schema_migrations` via `db query`. **Une migration appliquée directement sans passer par `db push` puis sans réparation n'apparaît dans aucun des deux** — c'est le signal qu'elle doit être vérifiée objet par objet avant d'être réparée, jamais réparée sur la seule foi d'une note dans `REPRISE.md`.

**`supabase db query` ne restitue pas les messages `RAISE NOTICE`** — seulement les lignes de résultat d'un `SELECT`. Une migration qui rapporte son propre résultat par `RAISE NOTICE` (nombre de lignes touchées, delta avant/après) s'exécute silencieusement par ce chemin : aucune erreur, mais aucun message non plus, ce qui fait facilement prendre une migration muette pour une migration réussie. **Toute vérification du résultat d'une migration appliquée par `db query -f` doit passer par des requêtes `SELECT` avant et après, séparées, jamais par la lecture des messages produits pendant l'exécution.**

### Vérification des erreurs — RÈGLE CRITIQUE

Le client Supabase **ne lève pas d'exception**. Oublier `{ error }` est silencieux par défaut. Ce piège a produit quatre bugs en production, dont un risque de double reversement.

```typescript
// INTERDIT — l'erreur tombe par terre, personne ne le saura jamais
await supabase.from('orders').update({ status: 'completed' }).eq('id', id)

// OBLIGATOIRE
const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', id)
if (error) {
  console.error('[updateOrderStatus]', error.message)
  Sentry.captureException(error, { extra: { orderId: id } })
  throw new Error('Impossible de mettre à jour la commande')
}
```

Sur tout chemin touchant à l'argent — encaissement, reversement, libération de fonds, envoi de fichier digital, compteur de commandes — trois obligations cumulatives :

1. **Lire l'erreur**, systématiquement.
2. **La remonter à Sentry** avec le contexte utile.
3. **Échouer bruyamment** : ne pas continuer comme si de rien n'était.

### Contraintes CHECK

Avant d'écrire une valeur dans une colonne contrainte, vérifier qu'elle figure dans le `CHECK`. Une contrainte violée fait échouer **toute la requête**, y compris les autres champs de la même mise à jour — et le bloc conditionné à sa réussite ne s'exécute jamais.

### Paiements
- Montants **toujours** calculés côté serveur depuis la base, jamais reçus du client.
- Signatures webhook vérifiées avec `timingSafeEqual()`, jamais `===`.
- Seul le webhook confirme un paiement, jamais la redirection de retour.
- Clés et secrets via `process.env`, jamais en dur.

### Autorisation
- `/dashboard/*` : protégé par middleware.
- `/api/cron/*` : `Authorization: Bearer CRON_SECRET` vérifié en `timingSafeEqual()`.
- `/api/*` : vérifier que l'utilisateur a accès à la ressource (contrôle IDOR).

---

## 4. MASQUAGE DES COMMANDES RETENUES — RÈGLE CRITIQUE

Sur une boutique `free_orders` en `expired`, les commandes sont retenues et **les coordonnées du client ne doivent jamais atteindre le marchand**. C'est ce qui fait tenir tout le modèle : un marchand qui récupère le numéro conclut la vente hors plateforme et n'active jamais.

**Toute lecture d'une commande à destination du marchand passe par `loadOrderForMerchant` / `loadOrdersForMerchant`.** Sans exception.

Les seules dérogations documentées, dans l'en-tête de `redact.ts` : construction d'une commande avant insertion, et `isOrderBlocked` utilisé seul comme garde d'action.

Masqués sur une commande retenue : nom, téléphone, WhatsApp, e-mail, adresse, ville, notes.
Visibles : montant, nombre d'articles, date.

Cela vaut aussi pour l'export CSV, les routes API sans écran, les e-mails et les messages WhatsApp. Trois fuites ont déjà été trouvées par accident dans ces canaux.

---

## 5. RÈGLES DE CODE

### TypeScript
Pas de `any`, pas de `as unknown as`. Valider avant de caster.

### Mutations
Server Actions ou Route Handlers. **Jamais** d'appel Supabase direct dans un composant `use client`.

### Erreurs exposées au client
Message générique côté client, détail complet côté serveur.

```typescript
console.error('[createOrder]', error.message)
return { error: 'Impossible de créer la commande. Réessayez.' }
```

### Aucune donnée dynamique en dur

Nombre de boutiques, pays couverts, moyens de paiement, devises, tarifs, durées : toujours depuis la base ou une constante nommée. Chercher `1483`, `1493`, `30 jours`, `FCFA`, `Wave et Orange Money` avant de livrer.

---

## 6. RÈGLES UI

### Mobile-first
Concevoir pour 375px d'abord, réseau lent. LCP < 2 s en 3G. Aucun défilement horizontal.

### Aucun emoji dans l'interface
Icônes **Lucide** uniquement. Seule exception tolérée : les drapeaux de pays.

### Tailwind
Pas de style inline. Couleur de boutique injectée en variable CSS :

```tsx
<div style={{ '--color-primary': shop.primary_color } as React.CSSProperties}>
  <button className="bg-[var(--color-primary)] hover:opacity-90">
```

### États et retours
Chaque action asynchrone affiche un état de chargement. Chaque succès et chaque erreur donnent un retour explicite avec, si possible, une action corrective.

---

## 7. RÈGLES DE RÉDACTION — FRANÇAIS

La cible principale n'a jamais vendu en ligne et n'a souvent jamais utilisé de logiciel de gestion. La clarté prime sur l'élégance.

**Tutoiement** partout côté marchand. **Vouvoiement** uniquement sur `/licence`, qui s'adresse à des entrepreneurs investisseurs.

| Ne pas écrire | Écrire |
|---|---|
| paiements locaux | Wave, Orange Money, MTN MoMo |
| produits digitaux (en interface marchand) | produits à télécharger |
| essai gratuit, période d'essai | (proscrit : le marchand vend, il n'essaie pas) |
| activer ta boutique, au sens de « la rendre visible » | (proscrit : elle est publique dès le premier produit) |
| back-office, dashboard | ton espace, ton écran |

**Ne jamais inventer un chiffre.** Aucune statistique, aucun pourcentage, aucun délai qui ne provienne pas d'une donnée réelle. En cas de doute, formuler en capacité plutôt qu'en mesure.

---

## 8. RÈGLES MÉTIER

### Commandes
- Stock décrémenté via RPC atomique.
- Seul le webhook confirme le paiement.
- Chaque webhook **idempotent** : deux fois le même événement, une seule mutation.
- Sur une boutique `expired` : panier 100 % digital → paiement autorisé, fichier livré, **fonds bloqués**. Panier contenant du physique → **paiement en ligne désactivé**, commande enregistrée.
- Le plafond de commandes retenues ne compte que les commandes **contenant du physique**.

### Abonnements
- Plans : **Découverte, Business, Pro**. Tarifs en base, jamais en dur.
- **Commission de 3 %** sur les paiements en ligne, qui couvre les frais des opérateurs et du reversement. Ce n'est pas une marge : la formuler ainsi.
- Les abonnés conservent leur tarif en cas de changement de grille.

### Reversements
- Vérifier le solde disponible avant tout reversement.
- Le solde disponible **exclut** les fonds bloqués d'une boutique non activée.
- Idempotence obligatoire : un reversement rejoué ne doit jamais envoyer deux fois.

---

## 9. CE QUE L'AGENT NE DOIT PAS FAIRE

- ❌ Ignorer une erreur Supabase — **la plus grave de cette liste**
- ❌ Appliquer une logique `free_orders` à une boutique `legacy`
- ❌ Lire une commande côté marchand sans passer par `loadOrderForMerchant`
- ❌ Coder en dur une valeur qui vient de la base
- ❌ Utiliser un emoji dans l'interface
- ❌ Inventer une statistique ou un délai
- ❌ Créer une table sans RLS
- ❌ Appeler Supabase depuis un composant `use client`
- ❌ Utiliser `===` pour comparer un secret
- ❌ Modifier `AI_RULES.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `PRD.md`, `SECURITY.md`
- ❌ Utiliser `yarn` ou `pnpm`
- ❌ Nettoyer des lints pré-existants ou refactorer en marge d'une tâche
- ❌ Créer des comptes ou des commandes de test en base sans prévenir

---

## 10. VARIABLES D'ENVIRONNEMENT

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Bictorys — mobile money
NEXT_PUBLIC_BICTORYS_PUBLIC_KEY=
BICTORYS_API_KEY=
BICTORYS_WEBHOOK_SECRET=
BICTORYS_API_TIMEOUT_MS=10000

# Stripe — carte bancaire
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Notifications
LAFRICAMOBILE_API_KEY=
RESEND_API_KEY=

# Assistant IA
# (clé du fournisseur de modèle — à documenter)

# Application
NEXT_PUBLIC_APP_URL=https://tekki.shop
NEXT_PUBLIC_APP_NAME=TEKKIShop

# Sécurité et cron
CRON_SECRET=
NODE_ENV=production

# Supervision
SENTRY_DSN=
```

Validation au démarrage : lever une erreur explicite si une variable obligatoire manque.
