# Spécification produit — MiniStore

## Mini site public (`/[shop-slug]`)

### Page d'accueil boutique
- Header : logo, nom de la boutique, ville, description courte
- Statut ouverture (optionnel : "Livraisons disponibles" / "Fermé le dimanche")
- Bouton "Contacter" (WhatsApp)
- Catalogue produits avec **toggle Liste / Grille** (même que Sheka)
- Groupement par catégorie si plusieurs catégories

### Carte produit (vue liste)
- Photo principale
- Nom du produit
- Description courte (2 lignes max)
- Prix — ou "À partir de X FCFA" si variantes
- Bouton "Commander"

### Carte produit (vue grille)
- Photo carrée
- Nom
- Prix
- Pas de description (manque de place)

### Page détail produit (`/[slug]/produit/[id]`)
- Galerie photos (scrollable horizontalement)
- Nom + description complète
- Prix / variantes (ex : "Format Entier — 12 000 FCFA", "Format Demi — 7 000 FCFA")
- Bouton "Commander ce produit" → ouvre le formulaire de commande

---

## Formulaire de commande (`/[slug]/commander`)

Le formulaire est unique, pas un tunnel multi-étapes.
Il s'adapte selon ce que le client commande.

### Structure du formulaire

```
[ Article 1 ]
  Produit *        [dropdown : tous les produits actifs]
  Variante         [dropdown : si le produit a des variantes]
  Quantité *       [number, max 5 ou paramétré par la boutique]

[ + Ajouter un article ]  ← jusqu'à 5 articles par commande

---

Date souhaitée *   [dropdown : dates disponibles sur 14 jours]
                   (optionnel si la boutique livre sur commande ouverte)

Nom complet *      [text]
Téléphone *        [tel, préfixe pays auto-détecté]
WhatsApp           [tel, "Même que téléphone" checkbox]

Mode de réception *
  ○ Livraison à domicile
  ○ Retrait en boutique

Adresse de livraison *  [textarea, visible si "Livraison"]

Notes              [textarea, optionnel — allergies, instructions...]

---

Mode de paiement *
  ○ Payer maintenant (Wave / Orange Money)
  ○ Payer à la réception

[CONFIRMER LA COMMANDE]
```

### Comportement paiement
- **"Payer maintenant"** → si acompte défini sur la boutique ou le produit : charge l'acompte via Bictorys (même flow que Sheka). Sinon : charge le total.
- **"Payer à la réception"** → commande créée en statut `pending`, pas de charge, vendeur confirmera manuellement.

### Confirmation
- Toast de succès
- Message WhatsApp au client : récap de commande + instructions paiement si "à la réception"
- Alerte WhatsApp au vendeur : nouvelle commande avec tous les détails

---

## Dashboard vendeur

### Vue d'ensemble (`/dashboard`)
- Chiffres du jour : CA, commandes reçues
- Chiffres de la semaine
- Liste des commandes du jour
- Checklist de démarrage (identique Sheka, adaptée)

### Commandes (`/dashboard/orders`)
- Liste toutes les commandes, filtrée par statut
- Statuts : `pending` → `confirmed` → `preparing` → `ready` → `delivered` / `cancelled`
- Clic sur une commande → page détail

### Détail commande (`/dashboard/orders/[id]`)
- Récap articles commandés (produit, variante, quantité, prix unitaire, sous-total)
- Infos client (nom, téléphone, adresse de livraison)
- Statut paiement (payé en ligne / à la réception)
- Actions de statut : Confirmer → En préparation → Prêt → Livré
- Bouton contact WhatsApp client

### Produits (`/dashboard/products`)
- Liste des produits actifs/inactifs
- Drag & drop pour réordonner (identique Sheka)

### Nouveau produit / Édition (`/dashboard/products/new`, `/dashboard/products/[id]`)
- **Champs :**
  - Nom *
  - Description
  - Catégorie (dropdown + custom)
  - **Photos** (multiple — jusqu'à 5 photos, uploadées sur Supabase Storage)
  - Prix de base *
  - Variantes (toggle) : ex. "Format Entier — 12 000 F", "Format Demi — 7 000 F"
  - Acompte (toggle) : % du prix à payer en ligne
  - Statut actif/inactif

### Revenus (`/dashboard/revenues`)
- Identique à Sheka — solde, historique, demande de reversement Wave/OM

### Paramètres (`/dashboard/settings`)
- Infos boutique : nom, description, logo, ville, adresse, téléphone WhatsApp
- Options de livraison : activer/désactiver livraison à domicile / retrait boutique
- Jours de livraison disponibles (lundi-dimanche)
- Couleur primaire du mini site

---

## Ce qui est SUPPRIMÉ par rapport à Sheka

| Fonctionnalité Sheka | Raison de suppression |
|---|---|
| Gestion des employées (`/dashboard/staff`) | Non pertinent pour vendeurs |
| Calendrier (`/dashboard/calendar`) | Pas de créneaux horaires |
| Mon planning (`/dashboard/my-schedule`) | Lié aux employées |
| Disponibilité des créneaux (API `/availability`) | Remplacé par jours de livraison |
| Créneaux bloqués (`blocked_slots`) | Inutile |
| Commissions sur employées | Inutile |
| Horaires d'ouverture au format heures | Remplacé par jours disponibles |

## Ce qui est GARDÉ tel quel

- Auth téléphone + PIN
- Mini site public avec personnalisation couleur
- Paiements Bictorys (Wave / Orange Money / Maxit)
- Notifications WhatsApp (Twilio)
- Admin Sheka/plateforme (gestion des boutiques, plans, reversements)
- Système trial + abonnement
- Reversements Wave/OM
- Page de suspension (boutique inactive)
- Crons trial reminder + expiry

## Ce qui est MODIFIÉ

| Composant | Modification |
|---|---|
| Page publique boutique | Services → Produits, photos multiples |
| Tunnel de réservation | 3 étapes → 1 formulaire de commande |
| Dashboard home | Réservations → Commandes |
| Onboarding | Étape "première prestation" → "premier produit" |
| SetupChecklist | Horaires → Jours de livraison |
| Landing page | Nouvelle copie orientée commerce |
