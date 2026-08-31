# Croissance, rétention et modération — à creuser plus tard

> Document de réflexion, pas une spec. Déposé le 2026-08-30, pas de plan d'exécution, rien à coder maintenant. Objectif : que ce diagnostic et ces pistes ne se perdent pas d'ici que ces chantiers remontent dans la file.

---

## 1. Modération de contenu — risque prioritaire, à traiter en premier quand ce document sera repris

### Constat

Boutique découverte le 2026-08-30 (« Rose photos », Bénin, ville affichée « Lille ») : un seul produit digital, un PDF de photos à caractère intime d'une personne, vendu 10 €. Aucune vérification de consentement possible depuis la plateforme.

### Pourquoi c'est grave, pas juste un cas isolé

1. **Risque légal direct** — diffusion commerciale d'image intime sans preuve de consentement, potentiellement une infraction pénale selon la juridiction de la personne concernée (indiquée comme étant en France).
2. **Risque existentiel pour toute la plateforme.** Bictorys/Stripe interdisent presque certainement ce type de contenu dans leurs conditions marchand. Une détection de leur part peut entraîner une coupure de l'accès aux paiements pour **l'ensemble des boutiques**, pas seulement celle en cause.
3. **Signal, pas exception.** Un produit digital (PDF, fichier) est le format le plus facile à détourner — pas de livraison physique, pas de contrôle tiers, vérifiable seulement par la description/l'image au moment de la publication.

### Pistes de solution à creuser

- **CGU explicites** : vérifier qu'une interdiction claire du contenu à caractère sexuel/adulte y figure déjà ; sinon, l'ajouter en priorité (correctif texte seul, rapide).
- **Mécanisme de signalement** : bouton « signaler cette boutique/ce produit » côté acheteur, file de revue côté admin.
- **Vérification a minima sur les nouvelles boutiques 100% digitales** dans leurs premiers jours — catégorie la plus exposée, à définir : revue manuelle ponctuelle ? mots-clés suspects détectés automatiquement à la publication ? seuil de volume avant revue ?
- **Action immédiate déjà faite (2026-08-30)** : boutique « Rose photos » désactivée manuellement depuis l'admin, sans passer par Claude Code.

### Position dans la file, décidée le 2026-08-30

À placer devant les Lots 2-5 de la refonte des boutiques publiques — priorité au-dessus de la plupart des chantiers produit déjà documentés, vu le risque sur l'accès aux paiements pour toute la plateforme. Décision exacte de séquencement (avant/après le double middleware notamment) à reconfirmer au moment de la reprise.

---

## 2. Taux d'activation et de rétention — problème structurel, pas un bug

### Chiffres observés le 2026-08-30 (admin TEKKIShop)

- 1688 boutiques créées au total.
- 203 actives, 178 payantes (≈ 10,5 % du total).
- 1084 boutiques « fantômes » (essai, aucune activité).
- Taux de conversion trial → payant : 11 %.
- Taux d'activation (boutiques avec ≥ 1 produit) : 30 %.
- Churn ce mois : 52 % (56 boutiques parties sur 107 actives en début de mois).
- Aucune action marketing active depuis la dernière publication TikTok/Instagram du 2026-06-06.

### Diagnostic qualitatif (enquête auprès de marchands churnés)

La quasi-totalité des marchands qui ont payé, activé leur boutique, puis ne se sont pas réabonnés au 2ᵉ mois n'ont fait **aucune vente** lors du premier mois — et n'ont fait aucune action de leur côté pour attirer des clients, parce qu'ils pensaient que TEKKIShop leur amènerait des clients automatiquement (confusion avec une marketplace).

Segmentation observée :
- Marchands sans expérience e-commerce : comprennent mal ce qu'est TEKKIShop, n'entreprennent aucune action marketing de leur côté, churnent après un mois sans vente.
- Marchands avec expérience e-commerce préalable (Shopify, WhatsApp, TikTok...) : comprennent immédiatement l'outil, font leur propre promotion (contenu organique, UGC, publicité payante, influenceurs), ont un usage sain du produit.

### Tension de fond

TEKKIShop a bien tenu sa promesse de départ (simplifier la création d'une boutique en ligne), mais ne résout pas le vrai problème d'une partie significative des marchands ciblés : trouver des clients. Ce n'était pas la promesse initiale — construire une vraie solution à ce problème est un métier différent (accompagnement/marketing), pas juste du logiciel.

### Pistes de solution, trois angles distincts à ne pas confondre

**A. Corriger l'attente dès l'inscription — rapide, peu coûteux.**
Un point d'étape explicite pendant `/start` qui prévient : « TEKKIShop simplifie ta boutique, mais c'est toi qui dois faire venir tes clients ». Utiliser les colonnes déjà collectées et jamais exploitées `seller_stage` / `selling_channel` / `pain_point` (écrites à la création de boutique, jamais relues nulle part dans le code — voir REPRISE.md §21) pour distinguer un marchand expérimenté d'un marchand néophyte et adapter le message/l'onboarding en conséquence.

**B. Outils de traction, sans devenir une agence marketing.**
- L'annuaire des boutiques (déjà documenté comme chantier séparé, en file d'attente) — canal de découverte qui ne dépend pas de l'effort du marchand.
- Modèles de partage WhatsApp/statut préremplis, code de parrainage facile à partager — outillage, pas service géré.

**C. Service de croissance géré — plus lourd, décision séparée, pas pour maintenant.**
Répond le mieux au problème identifié, mais change la nature de l'activité (accompagnement humain, pas seulement du logiciel), avec un vrai coût opérationnel. À rapprocher de la réflexion déjà mise de côté sur le plan « marques » (cible différente : marques établies vs petits marchands néophytes, mais tension similaire — faut-il porter la partie marketing, ou seulement l'outil). Sujet de réflexion stratégique séparé, pas un chantier technique à lancer maintenant.

---

## 3. Question stratégique posée le 2026-08-30 — séquencement acquisition vs rétention

**Objectif énoncé par l'utilisateur** : si 10 000 boutiques sont créées, en avoir au minimum 5000 actives et payantes (50 %), contre ≈ 10,5 % aujourd'hui.

**Question ouverte** : relancer la machine marketing maintenant (contenu organique, UGC, témoignages, influenceurs, publicité payante) quitte à ce que le taux d'activation/rétention reste faible à grande échelle, ou d'abord corriger le tunnel avant de relancer l'acquisition ?

**Avis donné le 2026-08-30, à rediscuter le moment venu** : ne pas relancer immédiatement, mais ne pas non plus attendre d'avoir tout corrigé. Une liste courte et ciblée avant relance, pas une refonte complète :

1. Correctif d'attente dès `/start` (piste A ci-dessus) — le plus gros effet de levier, le moins cher.
2. Minimum de modération (clause CGU explicite + bouton de signalement) — pas tout le système, juste de quoi ne pas être exposé sans rien pendant un afflux de nouvelles boutiques.
3. Bugs déjà identifiés qui cassent la confiance ou bloquent une vente : barre récapitulative mobile qui cache le formulaire de commande, absence de confirmation après paiement d'abonnement (voir investigations en cours, REPRISE.md).
4. Instrumentation du tunnel : mesurer combien de boutiques activées font une première vente dans les 30 jours — sans cette mesure, impossible de savoir si les correctifs ont un effet réel une fois le marketing relancé.

**Risque à ne pas relancer sans corriger** : un afflux massif de nouveaux marchands avec le même malentendu aggrave le churn au lieu de le maintenir, et une mauvaise première impression à grande échelle est difficile à rattraper (contrairement à un délai de quelques semaines, peu coûteux vu l'absence de campagne active depuis juin).

---

## 4. Chantiers déjà documentés qui se rattachent à ce sujet

- Annuaire des boutiques (REPRISE.md §29) — canal de découverte, en file d'attente, position à reconfirmer.
- Retours produits fusionnés dans les Lots 2-5 boutiques publiques (badges de réassurance, GIFs, barre collante mobile, champs pays/ville) — certains de ces points rejoignent directement la confiance/conversion évoquée ici.
- Colonnes `seller_stage` / `selling_channel` / `pain_point` — jamais exploitées, piste déjà notée pour une personnalisation future (Assistant IA), maintenant aussi pertinente pour l'onboarding.
- Investigations en cours (non closes au moment de ce document) : produits disparus après réactivation d'abonnement, absence de confirmation après paiement Wave.

---

## 6. Ajouts du 2026-08-30, en cours de session — trois observations supplémentaires

### 6.1 Notification marchand prématurée sur commande en ligne — investigation prévue

Constat : dès la validation du formulaire de commande, avant que le client n'ait choisi un mode de paiement en ligne et payé, le marchand reçoit déjà un e-mail de nouvelle commande, et la commande apparaît dans le dashboard (accueil + page Commandes). Pour un paiement en ligne, ça peut induire en erreur — le client peut encore annuler à ce stade. Pour un paiement à la livraison, c'est normal, il n'y a pas d'étape supplémentaire après le clic.

Incohérence probable avec une règle déjà appliquée ailleurs : l'e-mail de confirmation **client** ne part qu'après confirmation du paiement (webhook) pour un paiement en ligne — jamais à la création de la commande (`api/orders/route.ts`, condition `!isOnlinePayment`). Si la notification/l'affichage **marchand** ne suit pas la même règle, c'est une divergence entre deux parties du même flux.

À traiter comme investigation factuelle, dans le même lot que les deux déjà lancées le 2026-08-30 (produits disparus après réactivation, absence de confirmation après paiement Wave) — même domaine, cycle de vie de la commande.

### 6.2 Absence de données de trafic et de performance réelle dans l'admin

L'espace admin ne donne aucune donnée sur le nombre de visites (ni du site TEKKIShop, ni par boutique), et le classement de performance des boutiques ne peut pas se baser uniquement sur les commandes payées en ligne (beaucoup de commandes sont réglées à la livraison). Rejoint directement le point d'instrumentation du tunnel déjà noté au §3 ci-dessus — sauf qu'ici, l'enjeu dépasse la seule mesure d'activation/rétention : ces chiffres serviront aussi de preuve de traction (crédibilité commerciale, pitch licence/investisseurs).

Fonctionnalité à construire, pas un correctif — nécessite un vrai suivi de vues de page (rien de tel n'existe aujourd'hui, à distinguer du Pixel Meta qui sert le tracking publicitaire du marchand, pas un suivi interne). Chantier à documenter séparément, pas à specifier maintenant.

### 6.3 Aperçu des produits digitaux avant achat

Des clients demandent à voir un extrait/aperçu (ex. quelques pages d'un ebook) avant d'acheter un produit digital — fonctionnalité absente aujourd'hui. Même famille de question technique que le support GIF déjà noté au Lot 2 (page produit, boutiques publiques) : le système de stockage doit-il gérer un second fichier « aperçu » distinct du fichier final, ou une extraction automatique ? Fusionné dans le même lot que GIF et badges de réassurance (Lot 2, Lots 2-5 boutiques publiques).

---

## 7. Authentification par e-mail en plus du téléphone — déposé le 2026-08-31, sans urgence

### Constat

Aujourd'hui, seule l'authentification téléphone + code PIN existe. Choix délibéré à l'origine : la cible principale n'utilise pas ou peu l'e-mail, et un code PIN évite le problème du mot de passe oublié. Mais certains marchands ne veulent pas exposer leur numéro de téléphone et préféreraient s'inscrire/se connecter avec une adresse e-mail — comportement observé chez des marchands ayant déjà une expérience e-commerce ailleurs (Shopify, etc.), le même segment déjà identifié au §2 de ce document.

### Direction retenue, décidée le 2026-08-31

**Ne pas construire un système à deux mécanismes (téléphone+PIN vs e-mail+mot de passe, à la PayPal).** Réintroduire un mot de passe reviendrait sur le problème que le PIN a été choisi pour éviter (mot de passe oublié, flux de réinitialisation à construire et maintenir, fiabilité de livraison e-mail à garantir pour un flux critique).

**Direction choisie : garder le PIN comme seul mécanisme, laisser le choix de l'identifiant.** Téléphone ou e-mail au choix, tous deux vérifiés par un code à usage unique (SMS/WhatsApp pour l'un, e-mail pour l'autre) — jamais de mot de passe. Plus petite surface à construire et à maintenir qu'un système complet à la PayPal, tout en répondant au vrai besoin (ne pas être obligé d'exposer son numéro).

### Avant de construire quoi que ce soit

Mesurer l'ampleur réelle du besoin plutôt que de partir sur une supposition — combien de personnes abandonnent précisément à l'étape du numéro de téléphone pendant `/start` ? Rejoint directement le besoin d'instrumentation du tunnel déjà noté aux §3/§6.2 de ce document. Ne pas lancer le chantier de construction avant d'avoir cette mesure.

### Position dans la file

Documenté, en file d'attente, sans urgence — pas de position précise fixée pour l'instant.

---

## 8. Bug — bouton flottant "Créer ma boutique" (landing mobile) pointe vers `/inscription` au lieu de `/start`

Signalé par des visiteurs le 2026-08-31. Le bouton sticky affiché au scroll sur mobile sur la landing page renvoie vers une route inexistante (`/inscription`) au lieu de `/start`. Bug simple, correction ciblée, pas encore envoyé à Claude Code au moment de ce document — en attente de la clôture de la Vague 3 du middleware pour ne pas interrompre.

---

## 5. Non tranché — à discuter avec Claude Code quand ce document sera repris

- Contenu exact du message d'attente à `/start` (piste A) — à rédiger avec le même souci de clarté que le reste du produit, pas encore fait.
- Mécanisme technique de modération (détection automatique de mots-clés à risque ? seuil de revue manuelle ? fréquence ?) — à concevoir, aucune décision prise.
- Faut-il utiliser `seller_stage`/`selling_channel`/`pain_point` seulement pour adapter le message, ou aussi pour adapter des fonctionnalités visibles (ex. masquer certains outils avancés pour un néophyte) ? Non tranché.
- Dimensionnement et calendrier d'un éventuel service de croissance géré (piste C) — pure réflexion stratégique, aucun travail technique associé pour l'instant.
