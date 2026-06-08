# TEKKIShop — Product Requirements Document

> Document de référence pour la création de TEKKIShop.
> Tout agent IA ou développeur peut démarrer l'implémentation à partir de ce document sans instructions supplémentaires.
> Version 2.0 — Juin 2026 (Mise à jour depuis BeautyDesk)

---

## Table des matières

1. [Vision & Contexte](#1-vision--contexte)
2. [Utilisateurs cibles](#2-utilisateurs-cibles)
3. [Fonctionnalités principales](#3-fonctionnalités-principales)
4. [Parcours utilisateurs détaillés](#4-parcours-utilisateurs-détaillés)
5. [Modèle économique](#5-modèle-économique)
6. [Schéma de base de données](#6-schéma-de-base-de-données)
7. [Routes & API](#7-routes--api)
8. [Spécifications fonctionnelles détaillées](#8-spécifications-fonctionnelles-détaillées)
9. [Plan d'implémentation par phases](#9-plan-dimplémentation-par-phases)
10. [Règles absolues & contraintes](#10-règles-absolues--contraintes)

---

## 1. Vision & Contexte

### Le produit

**TEKKIShop** est un SaaS e-commerce tout-en-un permettant aux petits vendeurs et entrepreneurs d'Afrique de l'Ouest de créer un mini-site marchand en 5 minutes et vendre leurs produits facilement. Le SaaS combine trois outils en un : une PWA publique accessible aux clients, un back-office de gestion des produits et commandes, et un tableau de bord de suivi des performances et revenues.

### Le problème résolu

Les petits vendeurs (vêtements, alimentation, artisanat, services) africains font face à un problème quotidien non résolu :

**Absence de vitrine digitale simple :** Aujourd'hui, un petit vendeur doit choisir entre :
- Rester offline (bouche-à-oreille, WhatsApp manuel)
- Utiliser Shopify/WooCommerce (trop complexe, trop cher, pas adapté au contexte africain)
- Ouvrir un compte Instagram Shop (limité, pas de paiement mobile money africain)

Il n'existe pas d'outil simple, accessible, mobile-first, avec paiement par mobile money africain (Wave, Orange Money, Maxit) ET à la livraison. **TEKKIShop résout ce problème en 5 minutes.**

### URL cible

`tekki.shop` (ou domaine personnalisé configurable par vendeur : `monboutique.tekki.shop` ou `monboutique.com`)

### Principes fondateurs

- **Mobile-first** — 95% des utilisateurs sont sur mobile. Chaque écran est conçu pour mobile d'abord.
- **PWA pour les clients** — pas de téléchargement, accessible via lien WhatsApp partagé
- **Paiement africain-first** — Bictorys (Wave, Orange Money, Maxit sur SN/CI/BF/BJ/ML/TG) + paiement à la livraison
- **Ultra-simple** — un vendeur sans formation IT doit pouvoir créer sa boutique et recevoir des commandes seul
- **Notifications par SMS** — confirmations, statuts commandes, alertes stock
- **Scalable** — 1 vendeur = 1 boutique, support des domaines personnalisés Pro

---

## 2. Utilisateurs cibles

### Profil 1 — Le marchand vendeur (Shop Owner)

Petit entrepreneur ou commerçant en Afrique francophone (vêtements, alimentation, artisanat, services). Âge 20-50 ans. Vend localement ou via WhatsApp, sans présence digitale formelle. Familier avec WhatsApp et paiement mobile money, mais pas avec les outils e-commerce. Principal problème : aucune vitrine digitale, gestion des commandes manuel, pas de suivi de stock.

**Besoins :**
- Créer sa boutique en 5 minutes sans expertise technique
- Ajouter ses produits avec photos et variantes facilement
- Recevoir les commandes automatiquement (SMS + paiement confirmé)
- Voir ses commandes, clients et revenus au même endroit
- Gérer l'expédition et les livraisons simples

### Profil 2 — Le client acheteur (Customer)

Femme ou homme de 18 à 60 ans, urbain, habituée à utiliser WhatsApp et payer par mobile money. Ne veut pas télécharger une application. Veut commander facilement depuis son téléphone, payer en ligne (Wave, Orange Money, Maxit) ou à la livraison, et être tenu informé de son commande.

**Besoins :**
- Voir les produits disponibles et leurs photos
- Choisir produits, variantes et quantité
- Payer par mobile money ou à la livraison
- Recevoir une confirmation de commande et suivi livraison
- Connaître les délais et zones de livraison

### Profil 3 — L'administrateur TEKKIShop (Admin)

Équipe TEKKIShop responsable du SaaS. Gère les plans d'abonnement, active les boutiques, traite les paiouts, suit les KPIs.

**Besoins :**
- Valider les abonnements payés
- Générer les rapports de revenus
- Supporter les marchands en cas de problème

---

## 3. Fonctionnalités principales

### MODULE 1 — Mini-site public (PWA)

- **Page d'accueil :** Logo, nom, description, adresse, couleur primaire configurable
- **Header :** Logo, nom, boutons "Commander" + "Contact WhatsApp"
- **Catalogue produits :** 
  - Barre de recherche
  - Filtres par catégorie (chips)
  - Toggle liste/grille
  - Section "Coups de cœur" (produits mis en avant)
  - Pagination si > 100 articles
- **Page produit :**
  - Galerie photo (carousel + thumbnails)
  - Vidéo en modal (YouTube embed ou Cloudinary)
  - Prix, stock, description, variantes (couleurs, tailles, etc.)
  - Bouton "Commander" sticky
- **Footer viral :** "Toi aussi, ouvre ta boutique avec TekkiShop →"
- **Footer** : Adresse, téléphone, horaires si disponibles
- **Cache :** ISR 60s sur pages publiques (revalidate = 60)

### MODULE 2 — Checkout & Paiement

**Page Commande (`[shop-slug]/commander/`):**
- Formulaire multi-articles (1 à N articles)
- Sélecteur produit + variante + quantité (+ / -)
- Sélecteur zone de livraison (dropdown) avec prix dynamique
- Sélecteur pays avec flag + indicatif téléphonique
- Total = articles + frais livraison
- Validation client-side et server-side

**Page Checkout (`[shop-slug]/checkout/`):**
- Step 1 : Infos client (nom, téléphone)
- Auto-détection pays depuis préfixe téléphone
- Step 2 : Sélection méthode paiement (Wave, Orange Money, Maxit, Paiement à la livraison)
- Champ OTP si Orange Money (CI/BF)
- Récapitulatif commande
- Redirection Bictorys ou confirmation si paiement à la livraison

**Post-paiement:**
- Confirmation SMS au client
- Confirmation SMS au marchand
- Page succès avec référence commande

### MODULE 3 — Dashboard marchand (back-office)

**Tableau de bord :**
- CA jour / semaine / mois
- Nombre de commandes (pending, confirmed, delivered)
- Top 3 produits par quantité
- Taux de livraison
- État abonnement (plan actif, date renouvellement)

**Gestion des commandes :**
- Vue liste avec filtres (statut, date, montant)
- Statuts : pending → confirmed → preparing → ready → delivered (+ cancelled)
- Actions : confirmer, marquer en préparation, marquer prête, marquer livrée
- Édition notes internes
- Détail complet : produits, client, adresse, montant, paiement, livraison

**Gestion des produits :**
- Ajout / modification / suppression de produit
- Champs : nom, description, prix, photos (galerie), vidéo (YouTube/Cloudinary)
- Catégorie, SKU, stock, variantes (presets : couleur, taille, style, etc.)
- Toggle actif/inactif
- Produits en rupture filtrés (n'apparaissent pas publiquement)
- Toggle "Coup de cœur" (produit mis en avant)

**Gestion des clients :**
- Base clients avec nombre de commandes, montant total, dernière commande
- Pagination (50/page)
- Recherche par nom/téléphone

**Paramètres boutique :**
- Logo, couleur primaire (8 presets + custom), nom, ville, adresse
- Description courte (meta description) + À propos (500 chars)
- Image de couverture (cover_url, Pro uniquement)
- Téléphone WhatsApp, horaires d'ouverture
- URL personnalisée / slug (vérification disponibilité en temps réel)
- Toggle "Paiement à la livraison"
- Zones de livraison : ajout/suppression dynamique (nom + prix FCFA)
- Numéros de reversement (Wave, Orange Money)

**Gestion de l'abonnement :**
- Plan actif (Découverte, Business, Pro)
- Boutons "Upgrade" + "Gérer l'abonnement"
- Date de renouvellement
- Lien facturation Bictorys

**Rapports :**
- Export CSV des commandes (Pro uniquement)
- Graphique CA 30 jours
- Rapport top produits, taux livraison

### MODULE 4 — Notifications

- SMS Twilio à chaque changement de statut commande
- SMS Twilio à chaque nouvelle commande
- SMS Twilio alertes stock faible (< threshold)
- SMS Twilio notifications post-paiement abonnement

---

## 4. Parcours utilisateurs détaillés

### Parcours A — Commande client (nouveau client)

```
1. Le client reçoit le lien de la boutique sur WhatsApp ou réseaux sociaux
   → Ouvre tekki.shop/[slug-boutique] dans son navigateur

2. Il voit la page d'accueil de la boutique
   → Logo, nom, description, couleur primaire, section "Coups de cœur"

3. Il explore le catalogue
   → Recherche, filtre par catégorie, toggle liste/grille
   → Voit les produits disponibles avec photos et prix

4. Il clique sur un produit qui l'intéresse
   → Voir galerie (carousel + thumbnails)
   → Voir prix, stock, description, variantes disponibles
   → Voir vidéo démo si disponible

5. Il ajoute produit(s) au panier
   → Sélectionne variantes (couleur, taille, etc.)
   → Choisit quantité (+ / -)
   → Total mis à jour en temps réel

6. Il clique "Commander"
   → Redirection vers /[shop-slug]/commander/

7. Page commande : remplit infos + sélectionne livraison
   → Nom, téléphone (détection auto du pays)
   → Sélectionne zone de livraison (dropdown avec prix)
   → Voit total = articles + livraison
   → Continue vers paiement

8. Page checkout : choisit méthode de paiement
   → Pays auto-détecté depuis téléphone (+225 → CI)
   → Affichage des moyens disponibles (Wave, Orange Money, Maxit)
   → Si Orange Money CI/BF : saisit code OTP reçu via #144*82#
   → Clique "Payer"

9. Redirection Bictorys checkout (ou confirmation si paiement à livraison)
   → Paiement validé

10. Le client reçoit SMS de confirmation immédiat
    → "Commande reçue ! Réf: #CMD-12345. Livraison estimée : demain. Suivi : [lien]"

11. Le client peut suivre sa commande via SMS + page suivi
    → Statuts : pending → confirmed → preparing → ready → delivered
```

### Parcours B — Réception d'une commande (côté marchand)

```
1. Webhook Bictorys reçoit notification paiement réussi
   → Appel `/api/webhooks/bictorys`

2. Statut commande passe à "confirmed"
   → SMS envoyé au client : confirmation
   → SMS envoyé au marchand : "Nouvelle commande ! Montant : X FCFA"

3. Marchand voit la commande dans son dashboard
   → Détail : produits, adresse, montant, paiement confirmé
   → Peut ajouter notes internes
   → Peut changer statut

4. Marchand marque "En préparation"
   → SMS client : "Votre commande est en préparation"

5. Marchand marque "Prête"
   → SMS client : "Votre commande est prête ! Livraison aujourd'hui."

6. Marchand marque "Livrée"
   → SMS client : "Livraison confirmée. Merci !"
   → Statut visible en dashboard

7. En fin de semaine, marchand consulte rapports
   → Total CA cette semaine
   → Top produits commandés
   → Taux de livraison
```

### Parcours C — Activation abonnement (marchand)

```
1. Marchand crée sa boutique (gratuit, 10 produits max, plan Découverte)
2. Il configure son boutique (logo, description, zone livraison)
3. Au bout de 30 jours (trial), il voit une bannière "Votre essai se termine"
4. Il clique "Upgrade" → page `/dashboard/upgrade`
5. Il choisit un plan (Business ou Pro)
6. Il clique "S'abonner" → page `/dashboard/upgrade/checkout?plan=business`
7. Il remplit infos (nom complet, pays)
8. Il sélectionne méthode de paiement (Wave CI, Orange Money SN, etc.)
9. Il paie via Bictorys
10. Webhook confirme paiement → statut subscription passe à "activated"
11. Son accès est actif, SMS de confirmation reçu
```

### Parcours D — Annulation commande (marchand)

```
1. Commande en statut "pending" ou "confirmed"
2. Marchand clique "Annuler la commande"
3. Saisit motif d'annulation (obligatoire)
4. Si paiement en ligne : remboursement automatique via Bictorys
5. SMS client : "Votre commande a été annulée : [motif]"
6. Statut commande → "cancelled"
```

---

## 5. Modèle économique

### Modèle SaaS par boutique

| Plan | Prix | Inclus |
|---|---|---|
| Découverte | Gratuit | 1 boutique, jusqu'à 10 produits, 30 jours |
| Business | 4 900 FCFA/mois | 1 boutique, produits illimitées, tableau de bord avancé, export CSV, analytics basique |
| Pro | 9 900 FCFA/mois | Business + domaine personnalisé, cover boutique, section À propos, masquage branding TEKKIShop |

> Note implémentation : le modèle de pricing est stocké en base de données et configurable sans toucher au code. Voir `src/lib/constants/pricing.ts`.

### Période d'essai

Plan Découverte : 30 jours gratuits, plafonné à 10 produits. À l'issue, le marchand choisit un plan payant (Business ou Pro) pour continuer. Le back-office devient inaccessible si l'essai expire, mais les commandes existantes restent visibles en lecture seule.

### Commissions de paiement

TEKKIShop ne prend pas commission sur les paiements Bictorys. Le marchand paie uniquement l'abonnement mensuel. Les frais Bictorys (2-3% selon pays et opérateur) sont supportés par le marchand.

### Revenus TEKKIShop

- Abonnements mensuels (Business + Pro)
- Partenariats (commission d'affiliation sur nouveaux marchands)

---

## 6. Schéma de base de données

```sql
-- ============================================================
-- TEKKISHOP — Schéma Supabase PostgreSQL
-- ============================================================

-- 1. BOUTIQUES (shops)
CREATE TABLE shops (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT UNIQUE NOT NULL,
  name                  TEXT NOT NULL,
  description           TEXT,
  about_text            TEXT,
  logo_url              TEXT,
  cover_url             TEXT,
  about_photo_url       TEXT,
  primary_color         TEXT DEFAULT '#0EA5E9',
  address               TEXT,
  city                  TEXT NOT NULL,
  country               TEXT DEFAULT 'SN',
  phone_whatsapp        TEXT NOT NULL,
  email                 TEXT,
  delivery_zones        JSONB DEFAULT '[]',
  -- Ex: [{"id": "zone1", "name": "Centre-ville", "price": 5000}, ...]
  accept_cash_on_delivery BOOLEAN DEFAULT false,
  accept_online_payment BOOLEAN DEFAULT true,
  plan                  TEXT DEFAULT 'trial',
  -- 'trial' | 'business' | 'pro'
  trial_ends_at         TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  subscription_ends_at  TIMESTAMPTZ,
  custom_domain         TEXT,
  hide_branding         BOOLEAN DEFAULT false,
  wave_phone            TEXT,
  orange_money_phone    TEXT,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 2. UTILISATEURS (AUTH via Supabase Auth)
CREATE TABLE profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id               UUID REFERENCES shops(id),
  role                  TEXT NOT NULL DEFAULT 'owner',
  -- 'owner' | 'admin'
  first_name            TEXT,
  last_name             TEXT,
  phone                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUITS
CREATE TABLE products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id               UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  description           TEXT,
  price                 INTEGER NOT NULL,
  -- en FCFA
  category              TEXT,
  stock_count           INTEGER DEFAULT 0,
  stock_alert_threshold INTEGER DEFAULT 3,
  sku                   TEXT,
  photo_urls            TEXT[],
  -- tableau des URLs images (Cloudinary / Supabase Storage)
  image_ratio           TEXT DEFAULT '1:1',
  -- aspect ratio : '1:1' | '3:4' | '16:9' etc.
  video_url             TEXT,
  video_embed_url       TEXT,
  -- YouTube embed ou Cloudinary video URL
  variants              JSONB DEFAULT '[]',
  -- Ex: [{"label": "Couleur", "values": ["Rouge", "Bleu", "Vert"]}, ...]
  is_featured           BOOLEAN DEFAULT false,
  is_active             BOOLEAN DEFAULT true,
  display_order         INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLIENTS (pour historique client)
CREATE TABLE clients (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id               UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  first_name            TEXT NOT NULL,
  last_name             TEXT,
  phone                 TEXT NOT NULL,
  email                 TEXT,
  country               TEXT,
  -- pays du client (détecté depuis téléphone ou manuel)
  notes                 TEXT,
  -- notes internes du marchand
  total_orders          INTEGER DEFAULT 0,
  total_spent           INTEGER DEFAULT 0,
  -- en FCFA
  last_order_at         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, phone)
);

-- 5. COMMANDES
CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id               UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  client_id             UUID REFERENCES clients(id),
  customer_name         TEXT NOT NULL,
  customer_phone        TEXT NOT NULL,
  customer_email        TEXT,
  delivery_address      TEXT NOT NULL,
  delivery_zone_name    TEXT,
  delivery_price        INTEGER DEFAULT 0,
  total_price           INTEGER NOT NULL,
  -- en FCFA (inclut delivery_price)
  payment_method        TEXT NOT NULL,
  -- 'wave' | 'orange_money' | 'maxit' | 'cash'
  payment_status        TEXT DEFAULT 'pending',
  -- 'pending' | 'completed' | 'failed' | 'refunded'
  status                TEXT DEFAULT 'pending',
  -- 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  promo_code            TEXT,
  discount_amount       INTEGER DEFAULT 0,
  cancellation_reason   TEXT,
  notes                 TEXT,
  -- notes client
  internal_notes        TEXT,
  -- notes internes marchand
  reference_number      TEXT UNIQUE,
  -- Ex: #CMD-20260608-001
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ARTICLES COMMANDE
CREATE TABLE order_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES products(id),
  product_name          TEXT NOT NULL,
  price_at_order        INTEGER NOT NULL,
  -- prix du produit au moment de la commande (en FCFA)
  quantity              INTEGER NOT NULL DEFAULT 1,
  variant_selection     JSONB,
  -- Ex: {"Couleur": "Rouge", "Taille": "M"}
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PAIEMENTS
CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shop_id               UUID NOT NULL REFERENCES shops(id),
  amount                INTEGER NOT NULL,
  -- en FCFA
  currency              TEXT DEFAULT 'XOF',
  payment_method        TEXT NOT NULL,
  -- 'wave' | 'orange_money' | 'maxit' | 'cash'
  provider_payment_id   TEXT,
  -- ID de transaction Bictorys
  provider_reference    TEXT,
  status                TEXT DEFAULT 'pending',
  -- 'pending' | 'completed' | 'failed' | 'refunded'
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CODES PROMO
CREATE TABLE promo_codes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id               UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  code                  TEXT NOT NULL,
  discount_pct          INTEGER NOT NULL,
  -- % de réduction (0-100)
  max_uses              INTEGER,
  -- null = illimité
  used_count            INTEGER DEFAULT 0,
  expires_at            TIMESTAMPTZ,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, code)
);

-- 9. PAIEMENTS ABONNEMENT
CREATE TABLE subscription_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id               UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  plan_key              TEXT NOT NULL,
  -- 'business' | 'pro'
  charge_id             TEXT,
  -- ID Bictorys charge
  payment_reference     TEXT,
  -- Reference Bictorys unique
  status                TEXT DEFAULT 'pending',
  -- 'pending' | 'activated' | 'error'
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 10. NOTIFICATIONS (log des messages SMS)
CREATE TABLE notification_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id               UUID NOT NULL REFERENCES shops(id),
  order_id              UUID REFERENCES orders(id),
  recipient_phone       TEXT NOT NULL,
  notification_type     TEXT NOT NULL,
  -- 'order_confirmation' | 'order_status' | 'stock_alert' | 'subscription'
  channel               TEXT DEFAULT 'sms',
  message               TEXT NOT NULL,
  status                TEXT DEFAULT 'sent',
  -- 'sent' | 'failed'
  error_message         TEXT,
  sent_at               TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AFFILIATIONS
CREATE TABLE affiliations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id               UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  referral_code         TEXT UNIQUE NOT NULL,
  total_referrals       INTEGER DEFAULT 0,
  total_commissions     INTEGER DEFAULT 0,
  -- en FCFA
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PAYOUTS (virements aux marchands)
CREATE TABLE payouts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id               UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  amount                INTEGER NOT NULL,
  -- en FCFA
  gross_amount          INTEGER,
  -- avant commissions/frais
  status                TEXT DEFAULT 'pending',
  -- 'pending' | 'completed' | 'failed'
  payment_method        TEXT,
  -- 'wave' | 'orange_money' | 'bank_transfer'
  destination_phone     TEXT,
  bank_account          TEXT,
  bictorys_payout_id    TEXT,
  -- ID de virement Bictorys
  requested_at          TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Products : lecture publique pour le PWA
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (is_active = true AND shop_id IN (SELECT id FROM shops WHERE is_active = true));

-- Orders : lecture/écriture publique pour création
CREATE POLICY "orders_public_insert" ON orders
  FOR INSERT WITH CHECK (true);

-- Shop owner : accès complet à ses données
CREATE POLICY "owner_full_access" ON orders
  FOR ALL USING (
    shop_id IN (
      SELECT shop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_products_shop_id ON products(shop_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_orders_shop_id ON orders(shop_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_clients_shop_id ON clients(shop_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
```

---

## 7. Routes & API

### Routes publiques (PWA mini-site)

```
/[shop-slug]                          → Page d'accueil boutique
/[shop-slug]/produit/[product-id]     → Détail produit (galerie, variantes, vidéo)
/[shop-slug]/commander                → Formulaire commande multi-articles
/[shop-slug]/checkout                 → Page paiement avec sélection méthode
/[shop-slug]/success                  → Confirmation commande (avec référence)
```

### Routes authentifiées (Back-office marchand)

```
/login                                → Connexion propriétaire
/dashboard                            → Tableau de bord (KPIs, estado abonnement)
/dashboard/orders                     → Liste commandes (filtres, recherche)
/dashboard/orders/[id]                → Détail commande + changement statut
/dashboard/products                   → Catalogue produits
/dashboard/products/new               → Ajouter un produit
/dashboard/products/[id]              → Modifier un produit
/dashboard/clients                    → Base clients (historique, montant total)
/dashboard/settings                   → Paramètres boutique (logo, color, zones, etc.)
/dashboard/upgrade                    → Plans d'abonnement (Découverte → Business → Pro)
/dashboard/upgrade/checkout           → Paiement abonnement (Bictorys checkout)
/dashboard/reports                    → Rapports (CA, top produits, export CSV Pro)
/dashboard/affiliate                  → Programme affiliation (code, commissions, historique)

/admin/subscriptions                  → Admin: gestion abonnements (activation, paiements)
```

### API Routes publiques

```
GET  /api/shops/[slug]                → Infos publiques boutique
GET  /api/shops/[slug]/products       → Produits actifs boutique
GET  /api/products/[id]               → Détail produit
POST /api/orders                      → Créer commande
GET  /api/orders/[id]                 → Détail commande (sans auth)

POST /api/checkout/bictorys/create    → Créer session Bictorys commande
POST /api/webhooks/bictorys           → Webhook paiements Bictorys

GET  /api/promo-codes/validate        → Valider code promo (query: code, shopId)
```

### API Routes authentifiées (admin)

```
GET  /api/admin/dashboard             → KPIs tableau de bord
GET  /api/admin/orders                → Liste commandes (filtres, pagination)
PATCH /api/admin/orders/[id]          → Mettre à jour statut commande
DELETE /api/admin/orders/[id]         → Annuler commande

GET  /api/admin/products              → Liste produits boutique
POST /api/admin/products              → Créer produit
PATCH /api/admin/products/[id]        → Modifier produit
DELETE /api/admin/products/[id]       → Supprimer produit

GET  /api/admin/clients               → Liste clients
GET  /api/admin/clients/[id]          → Détail client

PATCH /api/admin/settings             → Mettre à jour paramètres boutique
GET  /api/admin/analytics             → Analytics avancées (Business+Pro)
GET  /api/export/orders               → Export CSV commandes (query: from, to)

POST /api/payments/bictorys/subscription → Créer session abonnement Bictorys
POST /api/admin/activate-subscription → Activation manuelle (admin interne)
POST /api/cron/verify-subscription-payments → Webhook fallback (cron 1/jour)

GET  /api/admin/payouts              → Liste virements
POST /api/admin/payouts              → Demander virement
```

---

## 8. Spécifications fonctionnelles détaillées

### 8.1 Calcul des variantes de produit

Les variantes sont stockées en JSONB dans `products.variants`. Format :
```json
[
  {"label": "Couleur", "values": ["Rouge", "Bleu", "Vert", "Noir"]},
  {"label": "Taille", "values": ["XS", "S", "M", "L", "XL"]}
]
```

Lors d'une commande, l'utilisateur sélectionne une valeur par variante. La sélection est stockée dans `order_items.variant_selection` :
```json
{"Couleur": "Rouge", "Taille": "M"}
```

**Validation server-side** : vérifier que chaque variante sélectionnée existe dans les valeurs possibles.

### 8.2 Gestion du stock atomique

Décrémentation du stock doit être atomique pour éviter les double-ventes.

**Solution** : RPC PostgreSQL `decrement_stock_if_available(product_id, qty)` qui :
1. Vérifie que `stock_count >= qty`
2. Décrémente `stock_count`
3. Retourne le nouveau stock
4. Atomique : une seule query

Appelée depuis `/api/orders` avant de créer la commande. Si retour négatif, rejeter la commande avec message "Stock insuffisant".

### 8.3 Codes promo

Format : code alphanumérique (ex: SOLDES15, NOEL2026)

**Validation:**
- Code doit exister
- Code actif (`is_active = true`)
- Pas expiré (`expires_at > NOW()`)
- Pas dépassé le nombre d'utilisations (`used_count < max_uses`)
- Code appartient à la boutique

**Calcul remise :**
```
discount = total_price_before_delivery × (discount_pct / 100)
total_price = articles + delivery - discount
```

Remise affichée avant paiement. Après paiement validé, `used_count` incrémenté.

### 8.4 Alertes stock faible

Déclenché après chaque décrémentation de stock :
- Si `stock_count <= stock_alert_threshold`
- Envoyer SMS au marchand : "Stock faible pour [produit] : il reste [count] unité(s)."
- Logguer dans `notification_logs`

### 8.5 Statuts commande et transitions

```
pending          → Commande créée, paiement attendu
  ↓
confirmed        → Paiement reçu (webhook Bictorys) OU paiement à livraison sélectionné
  ↓
preparing        → Marchand marque "En préparation"
  ↓
ready            → Marchand marque "Prête à être livrée"
  ↓
delivered        → Livraison complétée
  ✗
cancelled        → Annulée par client ou marchand (à tout moment)
```

**Notifications SMS** à chaque changement de statut (sauf pending).

### 8.6 Paiements Bictorys multi-pays

**Détection du pays :**
1. Extraire le préfixe du téléphone (+225, +221, etc.)
2. Mapper vers code pays (CI, SN, etc.)
3. Envoyer à Bictorys avec champ `country` obligatoire

**Méthodes disponibles par pays :**
- SN : Wave, Orange Money, Maxit
- CI : Wave, Orange Money
- BJ : Wave, Orange Money
- BF : Wave, Orange Money
- ML : Wave, Orange Money
- TG : Wave

**OTP (Orange Money CI/BF)** : champ input distinct, instructions : "#144*82#"

### 8.7 Abonnements boutique

**Plans:**
- Découverte : gratuit 30j (max 10 produits)
- Business : 4 900 FCFA/mois (illimité, export CSV, analytics basique)
- Pro : 9 900 FCFA/mois (Business + domaine custom + cover image + sans branding)

**Cycle :**
1. Marchand crée boutique → plan Découverte auto-activé
2. `trial_ends_at = NOW() + 30 jours`
3. Dashboard affiche bannière "Essai expiration dans X jours"
4. À expiration : `is_active = false` (accès back-office bloqué)
5. Marchand peut upgrader depuis `/dashboard/upgrade`
6. Après paiement validé : `subscription_ends_at = NOW() + 1 mois`, `plan = 'business'` (par ex), `is_active = true`
7. Cron job 1/jour : si `subscription_ends_at < NOW()` et non renouvelé, `is_active = false`

**Webhook Bictorys :**
- Identifie subscription via `sub-{shopId}-{planKey}` dans metadata
- Met à jour `subscription_transactions.status = 'activated'`
- Lance Server Action pour `updateShopPlan(shopId, planKey)`

### 8.8 Domaine personnalisé (Pro)

Stocké dans `shops.custom_domain` (ex: monboutique.com).

**Middleware** : route toutes les requêtes vers `monboutique.com` au slug de la boutique.

Certificat SSL géré par Vercel.

### 8.9 Masquage branding (Pro)

Colonne `shops.hide_branding = true`.

Page footer ne montre pas "Crée avec TEKKIShop →" si true.

---

## 9. Phases d'implémentation et statut

### ✅ Phase 1 — Foundation (COMPLÉTÉE)

Infrastructure de base, authentification, CRUD produits, mini-site PWA, ISR.

**Statut :** ✅ Production

---

### ✅ Phase 2 — Commandes & Paiements (COMPLÉTÉE)

Checkout multi-articles, formulaire commande, intégration Bictorys multi-pays, webhooks, SMS notifications.

**Statut :** ✅ Production

---

### ✅ Phase 3 — Abonnement & Plan (COMPLÉTÉE)

Système d'abonnement 3 plans (Découverte/Business/Pro), activation fiable (webhook + fallback + polling), limites features par plan.

**Statut :** ✅ Production

---

### ✅ Phase 4 — Dashboard & Rapports (COMPLÉTÉE)

Tableau de bord KPIs, gestion commandes, clients, produits, paramètres boutique, rapports basiques, export CSV, analytics.

**Statut :** ✅ Production

---

### ✅ Phase 5 — Avancé (COMPLÉTÉE)

Codes promo, zones de livraison, domaines personnalisés, masquage branding, paiement à la livraison, stock atomique, alertes stock.

**Statut :** ✅ Production

---

### 🔄 Phase 6 — Optimisations & Scale (EN COURS / BACKLOG)

Améliorations UX/perf, monitoring, WhatsApp Business API, multi-boutique, fidélité clients.

---

## 10. Règles absolues & contraintes

### Stack technique (NE PAS modifier)

```
Framework      : Next.js 15 (App Router) + React 19 + TypeScript strict
Styles         : Tailwind CSS uniquement — zéro CSS inline, zéro CSS module
Auth           : Supabase Auth (email + mot de passe pour owners)
Base données   : Supabase PostgreSQL + Row Level Security obligatoire
Paiements      : Bictorys (Wave, Orange Money, Maxit multi-pays)
Notifications  : Twilio SMS (SMS alerts, order status, stock warnings)
Images         : Supabase Storage + Cloudinary (upload délégué)
Déploiement    : Vercel + cron jobs (Vercel Cron)
Package manager: npm
Branding       : #0EA5E9 (sky blue) + Outfit (display) + DM Sans (body)
```

### Règles de code

- TypeScript strict : pas de `any`, pas de `as unknown`
- Tous les appels Supabase dans des Server Actions ou Route Handlers — jamais côté client
- Variables d'environnement : toutes dans `.env.local`, jamais hardcodées
- Gestion d'erreurs : chaque appel API a un bloc try/catch avec message utilisateur clair
- Toutes les mutations de données passent par des Server Actions Next.js
- RLS activé sur **toutes** les tables — jamais utiliser le service role key côté client
- Montants financiers : TOUJOURS calculés côté serveur depuis la DB, jamais du client
- Identifiants (`order_id`, `product_id`, etc.) : TOUJOURS validés côté serveur

### Règles UX/Design

- Mobile-first : concevoir pour 375px, adapter pour desktop (responsive par défaut)
- Couleur primaire boutique : configurable via `shop.primary_color` + CSS variables
- Temps de chargement : LCP < 2s sur 3G lent (réseau principal marché)
- ISR activation : pages publiques revalidate = 60s minimum
- Tous les formulaires : validation client-side (UX) ET server-side (sécurité)
- États de chargement : skeleton ou spinner toujours visible pendant opérations async
- Erreurs claires : messages génériques côté client, details dans logs serveur
- Pas de scrolling horizontal sur mobile (viewport 100% max-width)

### Règles métier

- **Stock atomique** : Vérification + décrémentation dans une seule transaction PostgreSQL
- **Paiements** : Confirmés UNIQUEMENT via webhook Bictorys, jamais sur redirect de retour
- **Montants** : Toujours lus depuis la DB (prix produit + zone livraison + code promo)
- **Commandes double-paiement** : Webhook idempotent — même event traité 2× = une seule mutation
- **Codes promo** : Validés côté serveur avant application, `used_count` incrémenté après paiement confirmé
- **Commandes pending** : Si paiement non confirmé après 30 min, statut → cancelled (optional, TODO)
- **Zone livraison** : Dropdown si zones définies, total = articles + zone.price
- **SMS notifications** : Envoyé à chaque changement de statut significatif (confirmed, preparing, ready, delivered)
- **Alertes stock** : Déclenchées immédiatement après décrémentation si stock <= threshold
- **Abonnement expiration** : Cron job 1/jour, si `subscription_ends_at < NOW()` et non renouvelé → `is_active = false`
- **Numéro téléphone client** : Unique par boutique (UNIQUE constraint `(shop_id, phone)`)
- **Détection pays** : Depuis préfixe téléphone client (+225→CI, +221→SN, etc.), fallback sur shop.country
```
