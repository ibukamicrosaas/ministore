# BeautyDesk — Product Requirements Document

> Document de référence pour la création de BeautyDesk.
> Tout agent IA ou développeur peut démarrer l'implémentation à partir de ce document sans instructions supplémentaires.
> Version 1.0 — Avril 2026

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

**BeautyDesk** est un SaaS de gestion tout-en-un pour salons de coiffure et de beauté africains. Il combine trois outils en un : un système de réservation en ligne accessible aux clients via PWA, un back-office de gestion des employés et des prestations, et un tableau de bord de suivi des performances.

### Le problème résolu

Les salons de beauté africains font face à deux problèmes quotidiens non résolus par aucun outil existant :

**Côté réservations :** Les clients appellent ou écrivent sur WhatsApp pour annoncer leur passage, mais ces "réservations" ne sont jamais formalisées. Résultat : le salon bloque du temps pour une cliente qui n'arrive pas, ou la cliente arrive sans que le salon l'ait noté. Les deux parties sont frustrées. Aucun logiciel occidental de réservation n'est adapté au contexte africain (pas de mobile money, interface trop complexe, pas de version française adaptée).

**Côté gestion employés :** La majorité des salons paient leurs employés à la commission (40 à 60% des prestations effectuées) ou à salaire fixe. Aujourd'hui, ces calculs se font à la main dans un cahier, source d'erreurs et de tensions. Le patron n'a aucune visibilité sur les performances individuelles ni sur la rentabilité réelle de son salon.

### URL cible

`beautydesk.app` (ou sous-domaine configurable par salon : `monbeausalon.beautydesk.app`)

### Principes fondateurs

- **Mobile-first** — 90% des utilisateurs sont sur mobile. Chaque écran est conçu pour mobile d'abord.
- **PWA pour les clients** — pas de téléchargement, accessible via un lien WhatsApp
- **Paiement africain-first** — Moneroo (mobile money Wave, Orange Money, MTN, Free, etc.) + Stripe (carte)
- **Ultra-simple** — une patronne de salon sans formation technique doit pouvoir utiliser le back-office seule
- **WhatsApp natif** — les rappels, confirmations et notifications passent par WhatsApp
- **Multi-salon** — une même instance peut gérer N salons indépendants

---

## 2. Utilisateurs cibles

### Profil 1 — La patronne de salon (Admin)

Propriétaire ou gérante d'un salon de coiffure ou de beauté en Afrique francophone. Gère 2 à 15 employés. Familière avec WhatsApp et les applications mobiles simples, mais pas nécessairement à l'aise avec des logiciels complexes. Principal problème : passer des heures à calculer les commissions et gérer les réservations manuellement.

**Besoins :**
- Voir toutes les réservations du jour en un coup d'œil
- Calculer automatiquement ce qu'elle doit à chaque employée
- Ajouter/modifier les services proposés et leurs prix
- Recevoir une notification WhatsApp à chaque nouvelle réservation

### Profil 2 — La cliente du salon (Client)

Femme de 18 à 45 ans, urbaine, habituée à utiliser WhatsApp et à payer par mobile money. Elle ne veut pas télécharger une application. Elle veut réserver facilement depuis son téléphone, payer en avance pour sécuriser son créneau, et recevoir un rappel avant son rendez-vous.

**Besoins :**
- Voir les services disponibles et leurs prix
- Choisir une date et une heure disponible
- Payer l'acompte par mobile money ou carte
- Recevoir une confirmation et un rappel

### Profil 3 — L'employée du salon (Staff)

Coiffeuse ou esthéticienne employée dans le salon. Elle veut voir ses rendez-vous du jour et connaître ses gains de la semaine sans dépendre de la patronne pour l'information.

**Besoins :**
- Voir son planning du jour
- Consulter ses commissions de la semaine
- Être notifiée d'une nouvelle réservation qui lui est assignée

---

## 3. Fonctionnalités principales

### MODULE 1 — PWA Client (interface publique)

- Page d'accueil salon avec logo, nom, description courte
- Catalogue des services sous forme de cartes (nom, durée, prix, photo optionnelle)
- Calendrier de disponibilité par service et par employée
- Formulaire de réservation (service, date, heure, employée optionnelle)
- Paiement de l'acompte en ligne (Moneroo + Stripe)
- Espace client : historique des réservations, statuts, annulation
- Confirmation par WhatsApp + email optionnel
- Rappel automatique 24h avant le rendez-vous

### MODULE 2 — Back-office Salon (interface admin)

**Tableau de bord :**
- CA du jour / semaine / mois
- Nombre de réservations confirmées vs annulées
- Taux de no-show
- Prestation la plus demandée
- Employée la plus productive

**Gestion des réservations :**
- Vue calendrier (jour / semaine)
- Vue liste avec filtres (statut, employée, service, date)
- Actions : confirmer, marquer présent, annuler, rembourser
- Détail complet de chaque réservation

**Gestion des employées :**
- Ajout / modification / désactivation d'une employée
- Type de rémunération : commission (%) ou salaire fixe (montant/mois)
- Calcul automatique des commissions hebdomadaires et mensuelles
- Fiche de paie exportable par employée

**Gestion des services :**
- Ajout / modification / suppression de services
- Champs : nom, description, durée (minutes), prix, photo, actif/inactif
- Assignation de services à des employées spécifiques (optionnel)

**Paramètres du salon :**
- Nom, logo, description, couleur principale
- Horaires d'ouverture par jour de la semaine
- Politique d'acompte : pourcentage requis (ex : 30%, 50%, 100%)
- Politique d'annulation : délai minimum et conditions de remboursement
- Numéro WhatsApp du salon (pour les notifications)
- Intégration Moneroo (clés API) et Stripe (clés API)

### MODULE 3 — Espace Employée (interface staff)

- Planning du jour et de la semaine
- Liste des réservations assignées
- Récapitulatif des commissions de la semaine
- Historique des prestations effectuées

---

## 4. Parcours utilisateurs détaillés

### Parcours A — Réservation client (nouveau client)

```
1. La cliente reçoit le lien du salon sur WhatsApp
   → Ouvre beautydesk.app/[slug-salon] dans son navigateur

2. Elle voit la page d'accueil du salon
   → Logo, nom du salon, services disponibles en cartes

3. Elle clique sur le service qui l'intéresse
   → Ex : "Tresses box braids — 120 min — 15 000 FCFA"

4. Elle choisit une date sur le calendrier
   → Seules les dates disponibles sont affichées

5. Elle choisit un créneau horaire
   → Les créneaux sont générés selon les horaires du salon
      et les réservations existantes

6. Elle renseigne ses informations
   → Prénom, nom, numéro WhatsApp (obligatoire), email (optionnel)

7. Elle voit le récapitulatif + montant de l'acompte
   → Ex : "Acompte requis : 50% = 7 500 FCFA"

8. Elle paie via Moneroo (Wave, Orange Money, etc.) ou Stripe

9. Elle reçoit une confirmation WhatsApp immédiate
   → "Votre réservation chez [Salon] est confirmée !
      Service : Tresses box braids
      Date : Mercredi 25 avril à 10h00
      Acompte payé : 7 500 FCFA
      Solde à régler sur place : 7 500 FCFA"

10. Elle reçoit un rappel WhatsApp 24h avant
    → "Rappel : vous avez RDV demain à 10h00 chez [Salon].
       Besoin de modifier ? [lien]"
```

### Parcours B — Réception d'une réservation (côté salon)

```
1. Le salon reçoit une notification WhatsApp immédiate
   → "Nouvelle réservation !
      Cliente : Aminata Diallo
      Service : Tresses box braids
      Date : Mercredi 25 avril à 10h00
      Acompte reçu : 7 500 FCFA ✓"

2. La réservation apparaît dans le back-office
   → Statut : "Confirmée" (acompte payé)
   → Assignable à une employée depuis le back-office

3. Le jour J, la patronne marque la cliente comme "Présente"
   → La prestation est enregistrée dans les stats du salon
   → La commission de l'employée est calculée automatiquement

4. En fin de semaine, la patronne consulte le récapitulatif
   → Total CA de la semaine
   → Montant dû à chaque employée
```

### Parcours C — Annulation par la cliente

```
1. La cliente accède à son espace depuis la confirmation WhatsApp
2. Elle clique sur "Annuler ma réservation"
3. Le système vérifie la politique d'annulation du salon :
   - Si annulation > 24h avant → remboursement intégral automatique
   - Si annulation < 24h avant → acompte retenu (configurable)
4. La cliente reçoit une confirmation d'annulation sur WhatsApp
5. Le salon reçoit une notification d'annulation
6. Le créneau est remis disponible automatiquement
```

---

## 5. Modèle économique

### Modèle SaaS par salon

| Plan | Prix | Inclus |
|---|---|---|
| Starter | 5 000 FCFA/mois | 1 salon, jusqu'à 3 employées, réservations illimitées |
| Pro | 9 000 FCFA/mois | 1 salon, employées illimitées, tableau de bord avancé |
| Multi | 20 000 FCFA/mois | Jusqu'à 5 salons, tout inclus |

> Note implémentation : le modèle de pricing est stocké en base de données et configurable sans toucher au code.

### Période d'essai

30 jours gratuits sans carte bancaire requise. À l'issue, le salon choisit son plan ou perd l'accès au back-office (les réservations existantes restent accessibles en lecture seule).

### Commission sur transactions (optionnel, phase 2)

Possibilité d'activer une micro-commission de 0,5% sur chaque paiement traité via BeautyDesk, en complément de l'abonnement. À activer uniquement si le volume de transactions le justifie.

---

## 6. Schéma de base de données

```sql
-- ============================================================
-- BEAUTYDESK — Schéma Supabase PostgreSQL
-- ============================================================

-- 1. SALONS
CREATE TABLE salons (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT UNIQUE NOT NULL,
  name                  TEXT NOT NULL,
  description           TEXT,
  logo_url              TEXT,
  primary_color         TEXT DEFAULT '#E85D04',
  address               TEXT,
  city                  TEXT NOT NULL,
  country               TEXT DEFAULT 'SN',
  phone_whatsapp        TEXT NOT NULL,
  email                 TEXT,
  opening_hours         JSONB DEFAULT '{}',
  -- Ex: {"monday": {"open": "09:00", "close": "19:00", "closed": false}, ...}
  deposit_percentage    INTEGER DEFAULT 50,
  -- Pourcentage d'acompte requis (0 = pas d'acompte, 100 = paiement total)
  cancellation_hours    INTEGER DEFAULT 24,
  -- Délai minimum avant RDV pour annulation avec remboursement
  cancellation_refund   BOOLEAN DEFAULT true,
  -- true = remboursement si annulation dans les délais
  plan                  TEXT DEFAULT 'trial',
  -- 'trial' | 'starter' | 'pro' | 'multi'
  trial_ends_at         TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  stripe_customer_id    TEXT,
  moneroo_api_key       TEXT,
  stripe_account_id     TEXT,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 2. UTILISATEURS (AUTH via Supabase Auth)
-- Les profils étendent auth.users
CREATE TABLE profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id              UUID REFERENCES salons(id),
  role                  TEXT NOT NULL DEFAULT 'staff',
  -- 'owner' | 'staff' | 'client'
  first_name            TEXT,
  last_name             TEXT,
  phone                 TEXT,
  whatsapp              TEXT,
  avatar_url            TEXT,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EMPLOYÉES
CREATE TABLE staff (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  user_id               UUID REFERENCES profiles(id),
  -- null si l'employée n'a pas de compte
  first_name            TEXT NOT NULL,
  last_name             TEXT NOT NULL,
  phone                 TEXT,
  whatsapp              TEXT,
  photo_url             TEXT,
  remuneration_type     TEXT NOT NULL DEFAULT 'commission',
  -- 'commission' | 'fixed_salary'
  commission_rate       DECIMAL(5,2),
  -- ex: 50.00 pour 50%
  fixed_salary          INTEGER,
  -- en FCFA, si remuneration_type = 'fixed_salary'
  specialties           TEXT[],
  -- ex: ['tresses', 'coupe', 'coloration']
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SERVICES / PRESTATIONS
CREATE TABLE services (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  description           TEXT,
  duration_minutes      INTEGER NOT NULL DEFAULT 60,
  price                 INTEGER NOT NULL,
  -- en FCFA
  photo_url             TEXT,
  category              TEXT,
  -- ex: 'coiffure' | 'beaute' | 'soin'
  staff_ids             UUID[],
  -- liste des employées pouvant effectuer ce service (vide = toutes)
  is_active             BOOLEAN DEFAULT true,
  display_order         INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CLIENTS (pour les clients récurrents)
CREATE TABLE clients (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  first_name            TEXT NOT NULL,
  last_name             TEXT,
  phone                 TEXT NOT NULL,
  whatsapp              TEXT,
  email                 TEXT,
  notes                 TEXT,
  -- notes internes du salon sur la cliente
  total_visits          INTEGER DEFAULT 0,
  total_spent           INTEGER DEFAULT 0,
  -- en FCFA
  last_visit_at         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id, phone)
);

-- 6. RÉSERVATIONS
CREATE TABLE bookings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id             UUID REFERENCES clients(id),
  service_id            UUID NOT NULL REFERENCES services(id),
  staff_id              UUID REFERENCES staff(id),
  -- null si pas d'employée assignée
  booking_date          DATE NOT NULL,
  booking_time          TIME NOT NULL,
  duration_minutes      INTEGER NOT NULL,
  -- copié depuis le service au moment de la réservation
  total_price           INTEGER NOT NULL,
  -- en FCFA
  deposit_amount        INTEGER NOT NULL DEFAULT 0,
  -- montant de l'acompte en FCFA
  deposit_paid          BOOLEAN DEFAULT false,
  remaining_amount      INTEGER GENERATED ALWAYS AS (total_price - deposit_amount) STORED,
  status                TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'confirmed' | 'present' | 'completed' | 'cancelled' | 'no_show'
  cancellation_reason   TEXT,
  cancelled_by          TEXT,
  -- 'client' | 'salon'
  refund_amount         INTEGER DEFAULT 0,
  refund_status         TEXT,
  -- null | 'pending' | 'processed'
  notes                 TEXT,
  -- notes du client lors de la réservation
  internal_notes        TEXT,
  -- notes internes du salon
  reminder_sent_at      TIMESTAMPTZ,
  confirmation_sent_at  TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PAIEMENTS
CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  salon_id              UUID NOT NULL REFERENCES salons(id),
  amount                INTEGER NOT NULL,
  -- en FCFA
  currency              TEXT DEFAULT 'XOF',
  payment_method        TEXT NOT NULL,
  -- 'moneroo' | 'stripe' | 'cash'
  payment_type          TEXT NOT NULL DEFAULT 'deposit',
  -- 'deposit' | 'balance' | 'full' | 'refund'
  provider_payment_id   TEXT,
  -- ID de transaction Moneroo ou Stripe
  status                TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'completed' | 'failed' | 'refunded'
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 8. COMMISSIONS (calculées automatiquement)
CREATE TABLE commissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  staff_id              UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  booking_id            UUID NOT NULL REFERENCES bookings(id),
  service_price         INTEGER NOT NULL,
  commission_rate       DECIMAL(5,2),
  commission_amount     INTEGER NOT NULL,
  -- en FCFA, calculé automatiquement
  week_number           INTEGER NOT NULL,
  year                  INTEGER NOT NULL,
  is_paid               BOOLEAN DEFAULT false,
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DISPONIBILITÉS (créneaux bloqués manuellement)
CREATE TABLE blocked_slots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  staff_id              UUID REFERENCES staff(id),
  -- null = bloqué pour tout le salon
  blocked_date          DATE NOT NULL,
  start_time            TIME NOT NULL,
  end_time              TIME NOT NULL,
  reason                TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 10. NOTIFICATIONS (log des messages envoyés)
CREATE TABLE notification_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id              UUID NOT NULL REFERENCES salons(id),
  booking_id            UUID REFERENCES bookings(id),
  recipient_phone       TEXT NOT NULL,
  notification_type     TEXT NOT NULL,
  -- 'booking_confirmation' | 'booking_reminder' | 'cancellation' | 'new_booking_salon'
  channel               TEXT DEFAULT 'whatsapp',
  message               TEXT NOT NULL,
  status                TEXT DEFAULT 'sent',
  sent_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Policies : un owner ne voit que les données de son salon
-- Les services et disponibilités sont publics en lecture (pour le PWA client)

-- Services : lecture publique
CREATE POLICY "services_public_read" ON services
  FOR SELECT USING (is_active = true);

-- Bookings : lecture publique limitée (pour le client qui vérifie sa résa)
-- Écriture publique pour créer une réservation
CREATE POLICY "bookings_public_insert" ON bookings
  FOR INSERT WITH CHECK (true);

-- Salon owner : accès complet à ses données
CREATE POLICY "owner_full_access_bookings" ON bookings
  FOR ALL USING (
    salon_id IN (
      SELECT salon_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================
-- FONCTIONS UTILITAIRES
-- ============================================================

-- Calcule les créneaux disponibles pour un service/date donnés
CREATE OR REPLACE FUNCTION get_available_slots(
  p_salon_id UUID,
  p_service_id UUID,
  p_date DATE
) RETURNS TABLE(slot_time TIME, is_available BOOLEAN) AS $$
-- Implémentation dans les migrations
$$ LANGUAGE plpgsql;

-- Calcule les commissions d'une semaine pour une employée
CREATE OR REPLACE FUNCTION calculate_weekly_commissions(
  p_salon_id UUID,
  p_week_start DATE
) RETURNS VOID AS $$
-- Implémentation dans les migrations
$$ LANGUAGE plpgsql;
```

---

## 7. Routes & API

### Routes publiques (PWA Client)

```
/[salon-slug]                         → Page d'accueil du salon
/[salon-slug]/services                → Catalogue des services
/[salon-slug]/book/[service-id]       → Sélection date/heure
/[salon-slug]/book/[service-id]/info  → Informations client
/[salon-slug]/book/[service-id]/pay   → Paiement acompte
/[salon-slug]/book/success            → Confirmation réservation
/[salon-slug]/my-bookings             → Espace client (accès par token WhatsApp)
/[salon-slug]/booking/[id]            → Détail réservation + annulation
```

### Routes protégées (Back-office Salon)

```
/dashboard                            → Tableau de bord
/dashboard/bookings                   → Gestion des réservations
/dashboard/bookings/[id]              → Détail réservation
/dashboard/calendar                   → Vue calendrier
/dashboard/staff                      → Gestion employées
/dashboard/staff/new                  → Ajouter une employée
/dashboard/staff/[id]                 → Fiche employée + commissions
/dashboard/services                   → Gestion des services
/dashboard/services/new               → Ajouter un service
/dashboard/services/[id]              → Modifier un service
/dashboard/clients                    → Base clients
/dashboard/clients/[id]               → Fiche cliente
/dashboard/reports                    → Rapports et statistiques
/dashboard/settings                   → Paramètres du salon
/dashboard/settings/payments          → Configuration paiements
/dashboard/settings/notifications     → Configuration WhatsApp
/login                                → Connexion owner/staff
```

### API Routes

```
GET  /api/salons/[slug]               → Infos publiques d'un salon
GET  /api/salons/[slug]/services      → Services actifs d'un salon
GET  /api/salons/[slug]/availability  → Créneaux disponibles (query: date, serviceId)
POST /api/bookings                    → Créer une réservation
GET  /api/bookings/[id]               → Détail réservation (avec token)
PATCH /api/bookings/[id]/cancel       → Annuler une réservation
POST /api/bookings/[id]/present       → Marquer présent (admin)
POST /api/bookings/[id]/complete      → Marquer terminé (admin)

POST /api/payments/moneroo/create     → Créer session Moneroo
POST /api/payments/stripe/create      → Créer session Stripe
POST /api/webhooks/moneroo            → Webhook paiement Moneroo
POST /api/webhooks/stripe             → Webhook paiement Stripe

GET  /api/admin/dashboard             → Stats tableau de bord
GET  /api/admin/bookings              → Liste réservations (filtres)
GET  /api/admin/staff                 → Liste employées
POST /api/admin/staff                 → Créer employée
PATCH /api/admin/staff/[id]           → Modifier employée
GET  /api/admin/staff/[id]/commissions → Commissions d'une employée
GET  /api/admin/services              → Liste services
POST /api/admin/services              → Créer service
PATCH /api/admin/services/[id]        → Modifier service
GET  /api/admin/clients               → Liste clients
GET  /api/admin/reports/revenue       → Rapport revenus
GET  /api/admin/reports/staff         → Rapport performance staff

POST /api/notifications/send          → Envoyer notification WhatsApp
POST /api/cron/reminders              → Cron job rappels 24h
```

---

## 8. Spécifications fonctionnelles détaillées

### 8.1 Calcul des créneaux disponibles

La logique de disponibilité doit prendre en compte :
1. Les horaires d'ouverture du salon (table `salons.opening_hours`)
2. La durée du service sélectionné
3. Les réservations existantes confirmées pour la même date
4. Les créneaux bloqués manuellement (`blocked_slots`)
5. Le nombre d'employées disponibles pour ce service

Un créneau est disponible si : horaires ouverts ET (pas de conflit avec une réservation existante OU une autre employée est disponible).

**Granularité des créneaux :** 30 minutes par défaut (configurable dans les paramètres du salon).

### 8.2 Calcul automatique des commissions

Déclencheur : quand une réservation passe au statut `completed`.

```
commission_amount = total_price × (commission_rate / 100)
```

Si l'employée est à salaire fixe, aucune commission n'est calculée — la prestation est simplement enregistrée pour les statistiques.

Les commissions sont agrégées par semaine (lundi → dimanche). La patronne peut les marquer comme "payées" depuis le back-office.

### 8.3 Politique d'acompte et remboursements

- Le pourcentage d'acompte est défini par le salon (0 à 100%)
- Si 0% : réservation sans paiement (confirmation simple)
- Si > 0% : le paiement est requis pour confirmer la réservation
- Si annulation dans les délais : remboursement automatique via l'API de paiement
- Si annulation hors délais : acompte retenu, notification envoyée aux deux parties

### 8.4 Notifications WhatsApp

Utiliser l'API WhatsApp Business (via Twilio ou WABA directe) pour envoyer :

| Événement | Destinataire | Message |
|---|---|---|
| Réservation créée | Client | Confirmation avec détails |
| Réservation créée | Salon (owner) | Alerte nouvelle réservation |
| Réservation créée | Staff assigné | Alerte nouveau RDV |
| 24h avant RDV | Client | Rappel avec lien de gestion |
| Annulation client | Salon | Notification + créneau libéré |
| Annulation salon | Client | Notification + info remboursement |
| No-show | Interne | Log pour statistiques |

### 8.5 Espace client (sans compte)

Le client n'a pas de compte BeautyDesk. Son identifiant est son numéro WhatsApp + un token de session généré à la réservation. Le lien envoyé sur WhatsApp contient ce token et donne accès à ses réservations pour ce salon.

---

## 9. Plan d'implémentation par phases

### Phase 1 — Foundation (Semaine 1-2)

**Objectif :** Infrastructure de base fonctionnelle

- [ ] Initialisation projet Next.js + Supabase + Tailwind
- [ ] Schéma de base de données complet (migration 001)
- [ ] Authentification owner (email + mot de passe simple)
- [ ] Création d'un salon (onboarding admin)
- [ ] CRUD services (back-office)
- [ ] CRUD staff (back-office)
- [ ] Page publique du salon (PWA) avec liste des services

**Critère de validation :** Un salon peut être créé, ses services configurés, et la page publique est accessible.

---

### Phase 2 — Réservations (Semaine 2-3)

**Objectif :** Parcours de réservation complet

- [ ] Calcul des créneaux disponibles (API)
- [ ] Formulaire de réservation client (sélection service → date → heure → infos)
- [ ] Intégration Moneroo (paiement mobile money)
- [ ] Intégration Stripe (paiement carte)
- [ ] Webhooks de confirmation de paiement
- [ ] Création automatique du client dans la base
- [ ] Envoi confirmation WhatsApp (client + salon)
- [ ] Back-office : vue liste des réservations
- [ ] Back-office : actions (confirmer, présent, annuler)

**Critère de validation :** Une cliente peut réserver et payer depuis son téléphone. Le salon reçoit la notification.

---

### Phase 3 — Gestion employées & commissions (Semaine 3-4)

**Objectif :** Module RH complet

- [ ] Fiche employée complète
- [ ] Calcul automatique des commissions à la complétion d'une réservation
- [ ] Vue hebdomadaire des commissions par employée
- [ ] Marquage "payé" par la patronne
- [ ] Espace staff : planning du jour + commissions

**Critère de validation :** La patronne peut voir en un clic ce qu'elle doit à chaque employée cette semaine.

---

### Phase 4 — Rappels & Notifications (Semaine 4)

**Objectif :** Automatisation des communications

- [ ] Cron job rappels 24h avant (Vercel Cron)
- [ ] Notifications d'annulation automatiques
- [ ] Politique d'annulation et remboursement automatique
- [ ] Log complet des notifications envoyées

**Critère de validation :** Les rappels partent automatiquement sans intervention humaine.

---

### Phase 5 — Tableau de bord & Rapports (Semaine 5)

**Objectif :** Visibilité sur les performances

- [ ] Dashboard : CA jour / semaine / mois
- [ ] Dashboard : taux de no-show, taux de confirmation
- [ ] Dashboard : top services, top employées
- [ ] Rapport mensuel exportable (PDF ou CSV)
- [ ] Vue calendrier (jour / semaine)

**Critère de validation :** La patronne peut voir la performance de son salon sans ouvrir un cahier.

---

### Phase 6 — Polish & Multi-salon (Semaine 6)

**Objectif :** Finalisation et scalabilité

- [ ] Onboarding guidé pour les nouveaux salons
- [ ] Gestion des plans (trial, starter, pro)
- [ ] Interface de configuration complète du salon
- [ ] Blocage de créneaux manuels
- [ ] Tests complets du parcours client
- [ ] Optimisation mobile (PWA manifest, performance)
- [ ] SEO basique pour les pages publiques de salon

---

## 10. Règles absolues & contraintes

### Stack technique (NE PAS modifier)

```
Framework      : Next.js 15 (App Router) + React 19 + TypeScript strict
Styles         : Tailwind CSS uniquement — zéro CSS inline, zéro CSS module
Auth           : Supabase Auth (email + mot de passe pour owners/staff)
Base données   : Supabase PostgreSQL + Row Level Security obligatoire
Paiements      : Moneroo (mobile money) + Stripe (carte bancaire)
Notifications  : WhatsApp Business API (Twilio ou WABA)
Images         : Cloudinary (logos salon, photos services, photos staff)
Déploiement    : Vercel
Package manager: npm
```

### Règles de code

- TypeScript strict : pas de `any`, pas de `as unknown`
- Tous les appels Supabase dans des Server Actions ou Route Handlers — jamais côté client
- Variables d'environnement : toutes dans `.env.local`, jamais hardcodées
- Gestion d'erreurs : chaque appel API a un bloc try/catch avec message utilisateur
- Toutes les mutations de données passent par des Server Actions Next.js
- RLS activé sur toutes les tables — jamais utiliser le service role key côté client

### Règles UX/Design

- Mobile-first : concevoir pour 375px, adapter pour desktop
- Couleur principale du salon : configurable via `salon.primary_color` (CSS variable)
- Temps de chargement : chaque page doit afficher du contenu en moins de 1,5s
- Tous les formulaires ont une validation côté client ET côté serveur
- Les états de chargement sont toujours indiqués (skeleton ou spinner)
- Les erreurs de paiement sont toujours affichées clairement avec une action corrective

### Règles métier

- Un créneau ne peut jamais être double-booké
- Un paiement confirmé par webhook = réservation confirmée automatiquement
- Les commissions ne sont calculées que sur les réservations au statut `completed`
- Une réservation `pending` sans paiement après 30 minutes est automatiquement annulée
- Le numéro WhatsApp du client est l'identifiant unique dans la table `clients` par salon
```
