# Note technique — erreurs Supabase non vérifiées

## Constat

`supabase-js` ne lève jamais d'exception sur une erreur DB. Chaque appel
(`.insert()`, `.update()`, `.select()`, ...) retourne `{ data, error }`, y
compris en cas d'échec. Si l'appelant ne déstructure pas `error`, l'échec est
totalement silencieux : le code continue comme si l'écriture avait réussi.

C'est la cause racine de deux bugs trouvés en testant (pas en revue de code) :

- `orders.payment_method` n'autorisait pas `'stripe_card'` → l'UPDATE de
  confirmation de commande échouait entièrement, sans qu'aucune ligne de code
  ne le remarque. Un client payait, ne recevait rien, personne n'était alerté.
- `processPayout` (reversements marchands) écrivait le statut `'completed'`
  après un virement Bictorys réussi sans vérifier l'erreur — un échec de cette
  écriture spécifique aurait laissé le payout bloqué en `'processing'`, avec
  le risque qu'un opérateur relance un second virement pour le même argent.

Le pattern est probablement présent ailleurs dans le dépôt (non audité — hors
scope du hotfix qui a corrigé ces deux cas précis).

## Deux options pour empêcher la récidive

**Option A — règle ESLint**
Interdire un appel Supabase dont le résultat n'est pas déstructuré avec
`error` explicitement nommé (ou au moins vérifié). Avantage : détection à la
compilation, zéro changement d'API. Inconvénient : à écrire/maintenir
soi-même (pas de règle générique existante pour ce cas précis), risque de
faux positifs sur les appels où l'erreur est volontairement ignorée (rare
mais existe, ex. lectures non critiques).

**Option B — wrapper qui lève**
Un client Supabase custom (ou des helpers `insertOrThrow`, `updateOrThrow`,
...) qui lance une exception si `error` est non-null, à la place du client
brut. Avantage : impossible d'oublier, le comportement par défaut devient
sûr. Inconvénient : migration progressive de l'existant, et certains appels
veulent légitimement gérer l'erreur eux-mêmes (ex. `PGRST116` = ligne
introuvable, traité comme cas normal dans le webhook Stripe) — le wrapper
devrait pouvoir distinguer ces cas ou offrir une variante non-throwing.

## Décision

Non tranchée — à date de ce hotfix. Cette note documente le problème pour
que la décision (et l'audit du reste du dépôt) se fasse consciemment plus
tard, plutôt que par oubli.
