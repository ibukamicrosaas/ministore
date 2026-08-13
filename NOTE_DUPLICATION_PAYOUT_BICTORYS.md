# Note technique — duplication de la logique de reversement Bictorys

## Constat

Deux implémentations indépendantes déclenchent un virement Bictorys et
gèrent son résultat :

- `processPayout` (`src/lib/actions/payouts.ts`) — appelée par le cron
  quotidien (`process-pending-payouts`) et par l'admin
  (`/api/admin/payouts/[id]/complete`).
- `POST /api/payouts/request` (`src/app/api/payouts/request/route.ts`) —
  le bouton "Retirer" du marchand, dans son dashboard. C'est le seul chemin
  que les marchands empruntent eux-mêmes.

Elles dupliquent : le calcul de commission, l'appel à `createBictorysPayout`,
la gestion des trois issues possibles (succès / refus explicite / incertain),
et l'écriture du statut `payouts`. Trouvé en corrigeant le risque de double
reversement (voir `NOTE_ERREURS_SUPABASE_NON_VERIFIEES.md`) : le bug d'origine
n'existait que dans `processPayout`, mais le chemin réellement emprunté par
les marchands — `/api/payouts/request` — portait le même défaut, avec une
divergence aggravante (statut d'échec repositionné en `'pending'`, qui
alimente le rejeu automatique du cron, contrairement au `'failed'` de
`processPayout` qui n'est repris par rien). Les deux ont été corrigées à
l'identique dans le hotfix `hotfix/erreurs-non-verifiees-paiements`, sans être
fusionnées.

## Pourquoi ne pas fusionner maintenant

Le hotfix visait la correction la plus courte et la plus sûre à relire. Une
fusion des deux chemins en une seule fonction partagée change la structure du
code, pas seulement son comportement — plus difficile à relire ligne par
ligne dans un lot qui touche à l'argent réel.

## Ce qu'il faudra faire, hors correctif

Extraire une fonction commune (proche de `processPayout` actuelle) que les
deux points d'entrée appellent, avec un seul endroit où :
- le calcul de commission est fait,
- l'appel Bictorys est déclenché,
- les trois issues (succès / refus explicite / incertain) sont traitées et
  écrites en DB.

Point d'attention pour cette fusion : les deux chemins ne calculent PAS le
montant de la même façon aujourd'hui — `processPayout` reçoit `grossAmount`
en paramètre (calculé par l'appelant), `/api/payouts/request` le calcule
lui-même côté serveur à partir de `payments`/`payouts`. Il faudra choisir
lequel fait foi avant de fusionner, pas pendant.

## Décision

Non tranchée — la duplication reste en l'état, corrigée des deux côtés,
jusqu'à ce regroupement.
