# Remise en état du suivi des migrations — EXÉCUTÉE

`supabase migration repair --status applied` a été lancée pour les 61 migrations le
2026-08-08 ; `supabase migration list --linked` confirme local/remote synchronisés. Ce
document garde le détail de la vérification schéma-par-schéma pour référence.

À l'origine, `supabase_migrations.schema_migrations` était vide sur la base liée (`fvkamhditdyvadljjrvn`, projet "ministore" — le seul projet Supabase
existant pour cette app, confirmé identique à `NEXT_PUBLIC_SUPABASE_URL` dans `.env.local`).

**Non vérifié : Vercel production.** Je n'ai pas pu confirmer directement quel projet Supabase
l'environnement Vercel production utilise — `vercel env ls production` demande une authentification
interactive que je n'ai pas ici. Vu qu'il n'existe qu'un seul projet Supabase pour cette app dans
le compte lié, c'est très probablement le même — mais "très probablement" n'est pas "confirmé".
À vérifier manuellement (dashboard Vercel → Settings → Environment Variables →
`NEXT_PUBLIC_SUPABASE_URL` en Production) avant de traiter ce plan comme couvrant la prod.

Le dépôt contient 61 fichiers de migration sur cette branche (numérotation à trous : 024 n'a
jamais existé, 062–083 n'existent que sur `refonte-start`/`dev`), pas 84.

## Mise à jour — 018 exécutée et vérifiée, 053 exécutée mais structurellement inefficace

**018_affiliation.sql a été exécutée et est confirmée pleinement appliquée** : `shops.ref_code`,
la table `referral_commissions`, ses 3 index (`referral_commissions_pkey`,
`referral_commissions_referred_shop_id_key`, `referral_commissions_referrer_idx`) et sa policy
`owner_read_commissions` sont tous présents en base, vérifiés directement. Le code de
`/dashboard/affiliation` (qui avait un fallback pour le cas où la migration manquait) fonctionne
maintenant avec les vraies données.

**053_restrict_digital_file_path.sql a été ré-exécutée, sans erreur — mais son effet reste
absent.** `anon` et `authenticated` ont toujours SELECT sur `products.digital_file_path` après
ré-exécution. Cause identifiée : les deux rôles ont aussi un GRANT SELECT **au niveau table**
sur `products` (`information_schema.table_privileges` confirmé) — c'est le réglage standard
Supabase, RLS étant censé être la barrière réelle. Un `REVOKE SELECT (colonne)` ne peut pas
retirer un accès déjà couvert par un GRANT SELECT au niveau table : en Postgres, les privilèges
colonne ne font qu'ajouter un accès, jamais en retrancher un déjà couvert plus largement. Cette
migration ne peut donc **jamais** atteindre son objectif tel qu'écrite, peu importe combien de
fois on la rejoue — ce n'est pas un problème d'exécution, c'est un défaut de conception.

Correction réelle nécessaire (pas dans ce plan, à faire séparément) : soit une vue sur
`products` qui exclut `digital_file_path` et que `anon`/`authenticated` lisent à la place de la
table, soit déplacer la colonne dans une table à part réservée à `service_role`. Vérifié en
parallèle que le bucket `digital-products` est privé (`public: false`) et que le téléchargement
passe par `createSignedUrl` (service_role uniquement) : le chemin seul ne suffit donc pas à
contourner le paiement aujourd'hui — protection en profondeur manquante, pas une brèche
activement exploitable.

**Pour la remise en état elle-même** : le fichier 053 s'est bien exécuté sans erreur SQL (deux
fois maintenant) — c'est ce que `schema_migrations` enregistre, l'historique d'exécution, pas
une garantie de résultat. Le marquer "applied" est donc honnête et correct pour la
synchronisation dépôt/base. Le vrai correctif (vue ou table séparée) sera une **nouvelle**
migration, avec son propre numéro, le jour où c'est traité.

## 1. Migrations confirmées appliquées, vérifiées par l'état du schéma

Les 61 migrations sont maintenant confirmées appliquées (table/colonne/contrainte/fonction/
index/policy vérifiés en direct sur le schéma live, pas déduits de la présence du fichier) :

001, 002, 003, 004, 005, 006, 007, 008, 009*, 010, 011, 012, 013, 014, 015, 016, 017, 018, 019,
020, 021, 022, 023, 025, 026, 027, 028, 029, 030, 031, 032, 033, 034, 035, 036, 037, 038, 039,
040, 041, 042, 043, 044, 045, 046, 047, 048, 049, 050, 051**, 052, 053***, 054, 055, 056, 057**,
058, 059, 060, 061, 084

\*\*\* **053** : exécution confirmée (aucune erreur SQL), mais son objectif n'est pas atteint —
voir la section dédiée plus haut. Marquée "applied" au sens migration-tracking (le fichier a
tourné), pas au sens "la protection existe" (elle n'existe pas). Un futur `db push` ne la
rejouera plus — c'est correct, la rejouer ne changerait rien.

\* **009_plan_rename** : la contrainte `shops_plan_check` est bien appliquée, mais la 4e
instruction du même fichier (`CHECK` sur `products.image_ratio`) n'a pas pris — la colonne
existe déjà sans cette contrainte, probablement parce qu'un `ADD COLUMN IF NOT EXISTS ...
CHECK(...)` sur une colonne déjà existante fait sauter toute la clause, contrainte comprise.
Sans conséquence fonctionnelle connue à ce jour ; si vous voulez la contrainte réellement
appliquée, il faudra une migration de suivi dédiée — la marquer "applied" en l'état ne la
créera pas rétroactivement.

\*\* **051** et la partie `UPDATE` de **057** sont des backfills de données purs, sans
empreinte dans le schéma — impossibles à vérifier par inspection du schéma. Jugement, pas fait
vérifié : rien ne suggère qu'elles n'ont pas tourné (ce sont des `UPDATE` simples, sans raison
de croire à un échec silencieux), mais ce n'est pas la même certitude que les autres.

## 2. Séquence `supabase migration repair` — EXÉCUTÉE

018 et 053 ayant tourné et 018 étant pleinement vérifiée (053 restant à corriger par une
future migration, voir plus haut — mais son historique d'exécution est réel), plus aucune
migration n'est exclue. Commande lancée :

```bash
supabase migration repair --status applied \
  001 002 003 004 005 006 007 008 009 010 011 012 013 014 015 016 017 018 \
  019 020 021 022 023 025 026 027 028 029 030 031 032 033 034 035 036 \
  037 038 039 040 041 042 043 044 045 046 047 048 049 050 051 052 053 054 \
  055 056 057 058 059 060 061 084 \
  --linked
```

## 4. Après la remise en état

Un `supabase db push` sur cette base ne rejouera plus que les migrations réellement absentes
(018/053 selon ce qui aura été tranché point 3, et tout ce qui sera écrit après). C'est
l'objectif de cette remise en état : que "ce qui est dans le dépôt" et "ce qui est en base"
redeviennent la même chose, pour cette base précise. Rien ici ne garantit que la base de
production (si elle diverge de la base liée — non confirmé, voir en haut) est dans le même
état ; la même démarche (dump du schéma, vérification migration par migration) devrait être
refaite dessus avant d'y lancer le moindre `repair` ou `push`.
