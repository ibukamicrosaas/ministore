# Additif à la spécification « 3 commandes offertes » — l'argent des commandes retenues

> Complète `SPEC-3-commandes-offertes.md`, qui ne traitait pas ce cas.
> À lire avant d'implémenter, une question conditionne tout le reste.

---

## Le trou dans la spécification initiale

La spécification dit qu'une commande au-delà du quota est « retenue », mais elle ne dit jamais **ce qu'il advient de l'argent**.

Le cas est plus large que les produits digitaux. Pour un produit physique payé en ligne, la conséquence est sérieuse : le client paie, le marchand ne voit pas l'adresse, donc n'expédie rien. Au bout de 48 heures on écrit au client que sa commande n'a pas pu être traitée — mais il a payé, et aucun remboursement n'est prévu. C'est un incident client, pas un cas limite.

## Le principe qui résout les deux cas

> **On ne prend l'argent du client que si on peut le livrer sans le marchand.**

- **Produit digital** : la livraison est automatique. Le client peut payer, il reçoit son fichier, rien ne change pour lui. L'argent, lui, est bloqué côté marchand jusqu'à l'activation.
- **Produit physique** : la livraison dépend du marchand. Le paiement en ligne est désactivé, la commande est enregistrée sans qu'un centime ne bouge.

Aucune dette envers un client, et le levier d'activation passe de l'identité du client à l'argent — ce qui est plus fort.

---

## Question bloquante : contrôlons-nous les règlements ?

**Tout ce qui suit dépend de cette réponse, réponds-moi avant de coder.**

Quand un client paie par Wave ou Orange Money via Bictorys, où va l'argent ?

- **Cas A — les fonds transitent par un compte TEKKIShop**, et nous reversons ensuite au marchand. Alors nous pouvons réellement bloquer, et le chemin décrit ci-dessous s'applique.
- **Cas B — Bictorys règle directement le marchand.** Alors nous ne pouvons rien bloquer, et afficher « en attente d'activation » serait un mensonge. Dans ce cas, applique le chemin de repli en fin de document.

Vérifie dans la configuration Bictorys et dans le code de reversement, et dis-moi lequel des deux s'applique.

---

## Chemin A — nous contrôlons les règlements

### Règles au moment du paiement

Sur une boutique dont `status = 'expired'` :

| Contenu du panier | Paiement en ligne | Livraison | Argent |
|---|---|---|---|
| Uniquement digital | **autorisé** | automatique, normale | **bloqué** jusqu'à activation |
| Contient au moins un physique | **désactivé** | — | aucun mouvement |
| Physique en paiement à la livraison | sans objet | — | aucun mouvement |

**Panier mixte : la règle du plus contraignant s'applique.** Un panier contenant un seul article physique bascule entièrement en commande retenue sans paiement. Ne tente pas de scinder la commande, ça créerait plus de problèmes que ça n'en résout.

### Ce que voit le client

**Panier digital** — rien de particulier. Écran de succès habituel, lien de téléchargement, e-mail automatique. Il n'a pas à connaître la situation commerciale du marchand.

**Panier avec du physique** — le paiement en ligne n'est pas proposé, et le message de la spécification s'affiche :

> Commande enregistrée. Le vendeur va te contacter pour confirmer.

### Ce que voit le marchand

La commande digitale retenue apparaît comme les autres commandes retenues — montant, nombre d'articles, date — avec une mention supplémentaire :

> 🔒 **Payée. Fichier envoyé au client.**
> Les 22 500 F sont bloqués jusqu'à l'activation de ta boutique.

C'est volontairement plus frustrant qu'une commande simplement en attente, et c'est le but : l'argent existe, il est à lui, il ne peut pas y toucher.

### Page Revenus

Deux montants séparés, jamais additionnés dans le même chiffre :

```
Disponible au retrait          0 F      [ Retirer ]
En attente d'activation   22 500 F      🔒
```

Le bouton de retrait ne porte que sur le montant disponible. S'il est à zéro, il est désactivé avec l'explication :

> Tes 22 500 F sont bloqués tant que ta boutique n'est pas activée. Choisis un plan pour les débloquer.

**Ne grise jamais la page entière.** Le marchand doit voir son argent, sinon le levier ne fonctionne pas.

### À l'activation

La RPC `activate_free_orders_shop` doit, dans la même transaction, libérer les fonds en même temps que les commandes. Le message de confirmation prévu au §6 de la spécification devient :

> Ta boutique est activée. 2 commandes t'attendent, et 22 500 F sont maintenant disponibles au retrait.

### Impact sur `MAX_HELD_ORDERS`

La règle actuelle ferme le bouton de commande au-delà de 3 commandes retenues, pour éviter d'accumuler des clients sans réponse.

**Elle ne doit compter que les commandes non servies.** Une commande digitale payée et livrée n'a laissé personne en attente : elle ne doit pas compter dans le plafond. Sinon on fermerait une boutique qui fonctionne parfaitement, et on couperait un flux de revenus qui incite justement à activer.

Compte donc les commandes `is_held = true AND released_at IS NULL` **qui contiennent au moins un produit physique**.

### Modèle de données

**N'ajoute pas de colonne `funds_locked`.** Le montant bloqué se dérive :

```sql
SELECT COALESCE(SUM(total), 0)
FROM orders
WHERE shop_id = $1
  AND is_held = true
  AND released_at IS NULL
  AND payment_status = 'paid';   -- adapte au nom réel
```

C'est la leçon de `status` / `is_active` / `plan` : trois champs qui décrivent la même chose finissent par diverger. Ici `is_held` et le statut de paiement suffisent, ne crée pas un troisième état à synchroniser.

Ajoute simplement l'index correspondant si le calcul se révèle coûteux sur la page Revenus.

---

## Cas limites

- **Commande digitale retenue, puis marchand qui n'active jamais.** L'argent lui reste dû, sans limite de temps. Aucune expiration, aucun reversement automatique. Dis-le explicitement sur la page Revenus.
- **Remboursement d'une commande digitale retenue.** Le client a reçu son fichier : pas de remboursement automatique. Traitement au cas par cas par le support.
- **Produit digital en paiement à la livraison.** Vérifie si c'est possible aujourd'hui. Si oui, la livraison automatique ne peut pas avoir lieu sans encaissement — traite-la alors comme une commande physique.
- **Le marchand active pendant qu'une commande digitale est en cours de paiement.** La transaction en cours doit aboutir normalement et les fonds être disponibles, pas bloqués.

---

## Chemin B — si Bictorys règle directement le marchand

Alors nous ne pouvons rien bloquer, et il ne faut surtout pas prétendre le contraire.

Dans ce cas : **désactive le paiement en ligne pour tous les paniers**, digitaux compris, dès que `status = 'expired'`. La commande est enregistrée, aucun paiement n'est pris, le client voit le message habituel.

C'est moins puissant — on perd le levier de l'argent bloqué — mais c'est honnête, et ça reste cohérent avec le principe : on ne prend pas l'argent d'un client qu'on ne peut pas servir.

Dans cette hypothèse, dis-le-moi : ça changera aussi les textes de la page Revenus, qui n'aura alors rien de particulier à afficher.

---

## Tests attendus

1. Boutique `expired`, panier 100 % digital : paiement passe, fichier reçu, commande retenue, montant visible et bloqué côté marchand.
2. Boutique `expired`, panier mixte : paiement en ligne indisponible, commande enregistrée sans mouvement d'argent.
3. Boutique `expired`, trois commandes digitales retenues : le bouton de commande **reste actif**.
4. Boutique `expired`, trois commandes physiques retenues : le bouton de commande se ferme.
5. Activation : commandes libérées, fonds passés en disponible, retrait possible.
6. Boutique `legacy` : aucun de ces comportements.
