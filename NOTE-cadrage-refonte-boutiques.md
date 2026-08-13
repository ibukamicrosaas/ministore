# Note de cadrage — refonte des boutiques publiques

> Pour vous, pas pour Claude Code. À lire avant de lancer le chantier.

---

## 1. Quand lancer

**Pas maintenant.** Dans l'ordre :

| # | Chantier | État |
|---|---|---|
| 1 | Correctif paiements | Commit et relecture en attente, puis fusion dans `main` |
| 2 | Modèle 3 commandes + `/start` + landing | `refonte-start`, il reste les lots 4 à 6 du fichier « reste à faire » |
| 3 | Documents de référence | Instructions transmises, non exécutées |
| 4 | **Refonte boutiques** | ← ce chantier |

Trois raisons de tenir cet ordre. Le correctif de paiement traite un risque de perte d'argent qui existe aujourd'hui en production. Le modèle à 3 commandes est prêt et attend depuis des semaines. Et les boutiques touchent les mêmes fichiers que le modèle d'essai : les mener en parallèle produirait des conflits permanents.

**La v1 de la spec disait que les deux devaient sortir ensemble. C'était une erreur de ma part**, et je l'ai corrigée en tête de la v2. La refonte boutique doit *respecter* le modèle à 3 commandes, qui est déjà implémenté — la dépendance ne va que dans un sens.

## 2. Comment envoyer

**Lot par lot, jamais la spec entière d'un coup.**

Cinq lots, chacun de la taille d'un chantier complet. Envoyer les cinq ensemble produirait une branche énorme, impossible à relire et impossible à annuler partiellement. Vous avez vu ce que la méthode « plan d'abord, un lot à la fois » a permis de rattraper sur le modèle d'essai.

Séquence recommandée pour chaque lot :

1. Vous envoyez la spec complète **une fois**, en précisant : « on ne traite que le lot 1 ».
2. Il rend son plan — migrations, matrice réelle, choix qu'il doit trancher.
3. Vous validez, il code.
4. Rapport, relecture, commit.
5. Lot suivant.

Les lots 1 et 5 méritent obligatoirement un plan avant code : le premier crée une table et modifie le modèle de données, le dernier touche au tableau de bord.

## 3. Trois décisions qui vous appartiennent

Elles sont signalées dans la spec, mais autant les avoir en tête.

**La typographie.** Trois appariements coexistent aujourd'hui dans le produit. Trancher change l'apparence de 1 493 boutiques en ligne du jour au lendemain. C'est une décision produit, pas d'intégration.

**Le badge de vérification des Pro.** La v1 les faisait passer en « en attente », c'est-à-dire leur retirer un signe visible sur leur vitrine alors qu'ils paient 9 900 FCFA. J'ai modifié la spec pour qu'ils le conservent pendant l'instruction, mais il faudra tout de même leur écrire avant tout changement visible.

**Les fonctionnalités qui pourraient disparaître.** La matrice de la v1 s'est trompée : Glow Eternel est en Business et affiche « Coups de cœur », que la spec réservait au Pro. Une fois la matrice réelle établie, chaque écart entre l'existant et la cible est soit une amélioration offerte, soit un retrait. Les retraits doivent être décidés, jamais subis.

## 4. Ce que les captures ont appris

Vos captures de production valent mieux que la spec pour comprendre le problème. Elles montrent **dix défauts observables aujourd'hui**, que j'ai listés au §2 de la v2 — dont trois qui n'étaient pas dans la v1 :

- **Le bouton d'achat s'affiche deux fois** sur la fiche produit mobile, sur les deux boutiques.
- Le prix ne semble pas apparaître sur la fiche mobile de Glow Eternel.
- Le badge « NOUVEAU » figure sur l'intégralité du catalogue d'ABI&CO — un signal porté par tous ne distingue personne.

Et surtout : **Pro et Business n'ont pas deux variantes du même gabarit, mais deux structures différentes.** ABI&CO a une bannière puis une colonne d'identité à gauche ; Glow Eternel a un bandeau coloré pleine largeur sans colonne. La règle « un seul gabarit » n'est donc pas un nettoyage, c'est une unification — le chantier est plus gros que la v1 ne le laissait croire.

## 5. Le cas ABI&CO justifie tout le chantier à lui seul

Neuf couleurs du même sac, publiées comme neuf produits. Le catalogue est illisible, le stock est faux, et la fiche produit ne peut pas faire son travail.

J'ai ajouté à la spec un point que la v1 n'avait pas : **une aide au regroupement**. Créer la table des variantes ne sert à rien si aucun marchand existant ne l'utilise — et ABI&CO ne refera pas neuf fiches à la main. Le tableau de bord doit proposer « Regrouper ces 9 produits en un seul avec 9 couleurs ? », avec aperçu et confirmation. Jamais automatique.

Si ce point vous paraît trop lourd pour le lot 5, on peut le sortir — mais alors les variantes ne serviront qu'aux nouveaux produits, et le problème que vous voyez sur ABI&CO restera entier.

## 6. Sur les maquettes

Je ne les ai pas refaites. Elles sont bonnes, cohérentes avec la spec, et elles embarquent un basculement « boutique minimale » qui est exactement le critère de recette du §1.

Deux ajustements seulement : la typographie, une fois votre décision prise, et le `🔥` du compteur social présent dans le texte de la spec — que j'ai déjà retiré dans la v2, puisque votre `AI_RULES.md` interdit désormais les emojis dans l'interface.

## 7. Deux ajouts absents de la v1

**La performance.** C'est la page vue par le client final sur les réseaux les plus lents de votre marché, et la v1 ne fixait aucun budget. Une grille carrée avec de vraies photos peut facilement doubler le poids de la page. J'ai ajouté un budget LCP et l'obligation de mesurer avant et après.

**L'aperçu de partage.** C'est le manque le plus coûteux de la v1. Tout votre modèle repose sur « partage ton lien sur WhatsApp » — l'aperçu généré est donc le premier contact de la plupart des acheteurs. Ni la boutique ni le produit n'ont de métadonnées Open Graph définies dans la spec.

Une image, un nom de boutique et un prix dans l'aperçu WhatsApp valent probablement plus, en conversion, que la moitié des améliorations visuelles listées. Et ça ne coûte presque rien.

Je vous conseille même de le sortir du chantier : **c'est une amélioration d'une demi-journée qui peut partir avec le modèle à 3 commandes**, sans attendre la refonte complète.
