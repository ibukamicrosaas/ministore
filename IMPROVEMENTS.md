# TekkiShop — Plan d'amélioration produit

> Ce fichier centralise tous les bugs critiques, les améliorations UX et les nouvelles fonctionnalités à implémenter.
> **Statut** : ✅ Fait · 🔄 En cours · ⬜ À faire · 🚫 Annulé

---

## LÉGENDE DES PRIORITÉS
- 🔴 **Critique** — Bug ou régression qui impacte des utilisateurs aujourd'hui
- 🟠 **Haute** — Feature promise ou amélioration à fort impact business
- 🟡 **Moyenne** — Amélioration UX importante mais non bloquante
- 🟢 **Basse** — Nice-to-have, planifié pour plus tard

---

## 🔴 BUGS CRITIQUES (à implémenter en priorité absolue)

### BUG-01 — Page "Boutique désactivée" au lieu d'une 404 ✅
**Contexte :** Quand une boutique passe à `is_active = false` (essai expiré ou abonnement non renouvelé), le layout `[shop-slug]/layout.tsx` redirige vers `notFound()` → le visiteur voit une page 404 générique.
**Comportement attendu :** Une page propre indiquant que la boutique est temporairement désactivée, avec :
- Le nom et logo de la boutique
- Un message d'explication
- Un bouton "Contacter la boutique" (lien WhatsApp si disponible)
- Un lien "Propriétaire ? Réactivez votre abonnement" → `/dashboard/upgrade`
**Fichier :** `src/app/[shop-slug]/layout.tsx` — le bloc `isInactive` existe déjà mais utilise `notFound()` ; le remplacer par le rendu de la page de suspension.

---

### BUG-02 — Changement d'URL (slug) non pris en compte en temps réel ✅
**Contexte :** Quand un marchand modifie l'URL de son site dans les Paramètres, la mise à jour est sauvegardée en DB mais la navigation ne reflète pas le nouveau slug immédiatement. Les anciennes URLs restent actives et les caches ISR ne sont pas invalidés pour le nouveau slug.
**Comportement attendu :**
- Après la sauvegarde, l'ancien slug redirige (301) vers le nouveau
- `revalidatePath` est appelé sur l'ancien ET le nouveau slug
- Un middleware redirige `/{ancien-slug}` → `/{nouveau-slug}` (ou on stocke les anciens slugs dans une table `shop_slug_history`)
**Fichiers :** `src/lib/actions/settings.ts` (action `updateShopSlug`) · `middleware.ts`

---

## 🟠 HAUTE PRIORITÉ

### HP-01 — Stock atomique via trigger PostgreSQL ✅
**Contexte :** Décrémentation du stock en deux étapes (INSERT commande → UPDATE stock). Race condition possible si deux clients commandent simultanément le dernier article.
**Solution :** Trigger `BEFORE INSERT` ou RPC `decrement_if_available(product_id, qty)` qui vérifie et décrémente dans la même transaction.
**Migration :** `supabase/migrations/020_atomic_stock.sql`
**Fichiers :** `src/app/api/orders/route.ts`

---

### HP-02 — Optimisation images avec next/image ✅
**Contexte :** Toutes les photos produits et logos utilisent des balises `<img>` brutes. Sur un réseau 3G (marché principal), une image de 2 Mo ruine le LCP et le taux de conversion.
**Solution :** Remplacer `<img>` par `<Image>` de `next/image` dans :
- `src/components/pwa/ProductGrid.tsx` (toutes les cards produit)
- `src/app/[shop-slug]/produit/[id]/page.tsx` (galerie)
- `src/app/[shop-slug]/page.tsx` (logo boutique)
- `src/components/dashboard/ProductForm.tsx` (previews)
Ajouter les domaines Supabase Storage dans `next.config.ts` → `images.domains`.

---

### HP-03 — Suivi commande client par SMS ✅
**Contexte :** Le client reçoit un SMS à la création mais rien lors des changements de statut. Il contacte le marchand sur WhatsApp pour savoir où en est sa commande.
**Solution :** Envoyer un SMS au client à chaque transition de statut :
- `pending → confirmed` : "Votre commande chez {shop} est confirmée !"
- `confirmed → preparing` : "Votre commande est en préparation."
- `preparing → ready` : "Votre commande est prête ! {details livraison}"
- `ready → delivered` : "Livraison confirmée. Merci !"
**Fichiers :** `src/app/dashboard/orders/[id]/page.tsx` (action de changement de statut) · `src/lib/notifications/whatsapp.ts` (nouveaux builders)

---

### HP-04 — Annulation commande par le marchand ✅
**Contexte :** Une commande confirmée ne peut pas être annulée dans l'interface. Le marchand doit contacter le support ou modifier directement en DB.
**Solution :** Bouton "Annuler la commande" accessible jusqu'au statut `preparing`, avec :
- Saisie obligatoire d'un motif
- SMS de notification au client
- Remboursement automatique si paiement en ligne (via API Bictorys refund si disponible)
**Fichiers :** `src/app/dashboard/orders/[id]/page.tsx` · `src/app/api/orders/[id]/cancel/route.ts` (nouveau)

---

### HP-05 — Export CSV des commandes (Plan Pro) ✅
**Contexte :** Feature affichée dans la page upgrade mais non implémentée. Les marchands Pro l'attendent.
**Solution :** Route `GET /api/export/orders?from=YYYY-MM-DD&to=YYYY-MM-DD` qui génère un CSV (UTF-8 avec BOM pour Excel) avec les colonnes : Date, Client, Téléphone, Produits, Total, Statut, Paiement, Livraison.
**Fichiers :** `src/app/api/export/orders/route.ts` (nouveau) · `src/app/dashboard/orders/page.tsx` (bouton "Exporter CSV")

---

### HP-06 — Alertes stock faible ✅
**Contexte :** Le marchand découvre une rupture de stock quand un client se plaint. Aucune alerte proactive.
**Solution :**
- Colonne `stock_alert_threshold INT DEFAULT 3` sur `products`
- Après chaque décrémentation de stock, vérifier si `stock_count <= threshold`
- Si oui, envoyer un SMS au `phone_whatsapp` du marchand : "Stock faible pour [produit] : il ne reste que X unité(s)."
**Migration :** `supabase/migrations/021_stock_alert.sql`

---

### HP-07 — Codes promo ⬜
**Contexte :** Outil marketing essentiel. Un marchand qui peut créer `SOLDES15` (-15% pendant 3 jours) va générer plus de commandes et fidéliser ses clients.
**Solution :**
- Table `promo_codes` : `code`, `shop_id`, `discount_pct`, `max_uses`, `used_count`, `expires_at`, `is_active`
- Champ dans `OrderForm.tsx` pour saisir un code
- Validation server-side dans `/api/orders`
- Page de gestion dans `/dashboard/promo-codes`
**Migration :** `supabase/migrations/022_promo_codes.sql`

---

## 🟡 PRIORITÉ MOYENNE

### MP-01 — Panier persistant entre sessions ⬜
**Contexte :** Si un client ferme l'onglet en plein milieu du formulaire, tout est perdu.
**Solution :** Sauvegarder le contenu du formulaire (articles, coordonnées partielles) dans `localStorage` avec TTL de 24h. Restaurer au rechargement avec une bannière "Vous avez un panier en attente".
**Fichiers :** `src/app/[shop-slug]/commander/OrderForm.tsx`

---

### MP-02 — Page produit : "Me prévenir quand disponible" ⬜
**Contexte :** Produit en rupture → client repart sans laisser de trace. Perte de vente et de données.
**Solution :** Sur la page produit quand `stock_count === 0`, afficher un formulaire minimal (nom + téléphone) qui insère dans une table `stock_alerts`. Quand le stock est remis à jour, SMS automatique aux inscrits.
**Migration :** `supabase/migrations/023_stock_alerts_subscribers.sql`

---

### MP-03 — Analytics avancées dashboard (Business + Pro) ⬜
**Contexte :** La page Rapports montre le CA et les commandes. Les marchands demandent : meilleur jour/heure, produit avec le plus de ventes, évolution mensuelle, taux de livraison.
**Solution :** Page `/dashboard/analytics` (déjà spécifiée dans l'ancien IMPROVEMENTS.md — voir spec complète ci-dessous).
**Voir :** Section "Spécifications détaillées — Analytics" en bas de ce fichier.

---

### MP-04 — Image de couverture boutique (Plan Pro) ⬜
**Contexte :** La home de la boutique n'a qu'une couleur de fond. Une bannière photo valorise le marchand.
**Solution :** Colonne `cover_url` sur `shops`, upload dans les Paramètres (Pro uniquement), affichage en haut du mini-site.
**Migration :** `supabase/migrations/024_cover_about_featured.sql`
**Voir :** Section "Spécifications détaillées — Cover & About" en bas de ce fichier.

---

### MP-05 — Section "À propos" enrichie (Business + Pro) ⬜
**Contexte :** Aucune présentation de la boutique au-delà du nom et de la description courte.
**Solution :** Champ `about_text` (500 chars) + `about_photo_url`, affichés en bas du mini-site.
**Migration :** Incluse dans `024_cover_about_featured.sql`

---

### MP-06 — Produit mis en avant "Coup de cœur" (Business + Pro) ⬜
**Contexte :** Tous les produits ont le même poids visuel. Le marchand ne peut pas mettre en avant son bestseller.
**Solution :** Colonne `is_featured` sur `products`, toggle dans le dashboard, bloc spécial en haut du catalogue.
**Migration :** Incluse dans `024_cover_about_featured.sql`

---

### MP-07 — Monitoring Sentry ⬜
**Contexte :** Aucune remontée d'erreur proactive. Les bugs en prod ne sont découverts que sur plainte client. (Note : `sentry.server.config.ts` et `sentry.edge.config.ts` existent déjà → vérifier si Sentry est partiellement configuré.)
**Solution :** Vérifier et activer la configuration Sentry existante. Ajouter `SENTRY_DSN` dans Vercel. Wrapper les server actions critiques (`activatePlan`, `createBictorysCharge`) avec `Sentry.captureException`.

---

## 🟢 PRIORITÉ BASSE (backlog stratégique)

### LP-01 — WhatsApp Business API ⬜
**Contexte :** WhatsApp est l'email de l'Afrique de l'Ouest. Taux d'ouverture ~95% vs ~20% SMS. Dès l'accès à l'API Meta, migration de toutes les notifications SMS vers WhatsApp.
**Solution :** La couche `sendSMS` / alias `sendWhatsApp` est déjà prête. Remplacer l'implémentation Twilio SMS par `@WhatsApp/cloud-api` ou une lib compatible Meta WABA. Impact : 0 changement dans les appelants.

---

### LP-02 — Multi-boutique (1 compte → N boutiques) ⬜
**Contexte :** Certains marchands ont plusieurs activités (vêtements + alimentation, franchise). Aujourd'hui 1 compte = 1 boutique.
**Solution :** Dissocier `profile.shop_id` (relation 1-1) vers une table `shop_memberships(profile_id, shop_id, role)`. Ajouter un sélecteur de boutique dans la sidebar.

---

### LP-03 — PWA installable (icône d'accueil) ⬜
**Contexte :** `manifest.json` existe déjà. Le mini-site est mobile-first mais pas encore installable comme une vraie app.
**Solution :** Vérifier le manifest, ajouter les Service Worker hooks Next.js, tester l'installation sur Android/iOS.

---

### LP-04 — Programme de fidélité clients ⬜
**Contexte :** Aucun mécanisme de rétention des clients d'une boutique. Un client qui commande 5 fois est traité comme un nouveau client.
**Solution :** Système de points simple : X points par FCFA dépensé, réduction sur prochaine commande. Dashboard marchand pour voir les clients fidèles.

---

## AMÉLIORATIONS DÉJÀ IMPLÉMENTÉES ✅

| # | Amélioration | Date |
|---|---|---|
| ✅ | Sécurité : 14 CVE corrigés (rate limiting, IDOR, AES-256-GCM, timingSafeEqual) | Mai 2026 |
| ✅ | Système abonnement mensuel (subscription_ends_at, crons, banners dashboard) | Mai 2026 |
| ✅ | Activation plan fiable (webhook fallback API Bictorys, cookie txn, polling) | Juin 2026 |
| ✅ | OG metadata par boutique (og:title, og:description, og:image = logo shop) | Mai 2026 |
| ✅ | Checklist démarrage auto-dismiss + "Voir mon site" + https | Mai 2026 |
| ✅ | Page Affiliation (lien parrainage, commissions, historique) | Mai 2026 |
| ✅ | Page Rapports dashboard (CA, commandes, top produits) | Mai 2026 |
| ✅ | Domaine personnalisé Pro (custom_domain + middleware hostname routing) | Juin 2026 |
| ✅ | Masquer mention TekkiShop Pro (hide_branding) | Juin 2026 |
| ✅ | Validation inline OrderForm (erreurs champ par champ) | Mai 2026 |
| ✅ | Bouton + désactivé au stock max dans OrderForm | Mai 2026 |
| ✅ | Confirmation stylée avant suppression produit | Mai 2026 |
| ✅ | Référence commande sur page succès | Mai 2026 |
| ✅ | Produits en rupture filtrés sur home mini-site | Mai 2026 |
| ✅ | Vérification slug disponible en temps réel (Settings) | Mai 2026 |
| ✅ | Pagination liste clients (50/page) | Mai 2026 |
| ✅ | Notifications SMS Twilio (remplacement WhatsApp, volume réduit) | Juin 2026 |
| ✅ | Timeout 10s sur appels Bictorys | Mai 2026 |
| ✅ | Fix flow paiement annulé (bouton "Réessayer le paiement") | Mai 2026 |
| ✅ | WhatsApp SMS post-activation plan | Juin 2026 |
| ✅ | Fix OG tags boutiques (partage réseaux sociaux) | Mai 2026 |
| ✅ | Variantes produit avec presets (7 templates) | Mai 2026 |
| ✅ | Toggle paiement à la livraison (accept_cash_on_delivery) | Mai 2026 |

---

## SPÉCIFICATIONS DÉTAILLÉES

### Spec : Analytics dashboard (MP-03)
*(Ancienne Improvement 5 — spécification complète conservée)*

**Page** : `src/app/dashboard/analytics/page.tsx`
**Plan** : Business + Pro uniquement (page locked pour trial/découverte)
**Métriques :**
- Commandes ce mois vs mois dernier (variation %)
- CA confirmé ce mois
- Top 3 produits par quantité commandée
- Graphique barres : commandes par jour sur 30 jours (SVG pur, pas de lib externe)

**Données** : Requêtes Supabase en parallèle sur `orders` et `order_items`.

**Navigation** : Ajouter "Statistiques" dans la sidebar (`BarChart2` icon), visible par tous, page gère la restriction.

---

### Spec : Cover image & About section (MP-04 / MP-05 / MP-06)
*(Anciennes Improvements 1, 2, 4 — spécification complète conservée)*

**Migration** `024_cover_about_featured.sql` :
```sql
ALTER TABLE shops ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS about_text TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS about_photo_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;
```

**Bucket Storage** : Créer `shop-covers` (public, max 5 Mo, image/*).

**Cover image** (Pro) : Upload dans Settings, affichée en bandeau 16:7 en haut du mini-site.

**About section** (Business + Pro) : Textarea 500 chars + photo, affichés en bas du catalogue.

**Featured product** (Business + Pro) : Toggle dans ProductForm, carte mise en avant au-dessus du catalogue.

---

*Dernière mise à jour : Juin 2026*
