# 📌 Prochaines Étapes - TEKKIShop

## État Actuel ✅

**Commit :** `3a6c80e` - "fix: activation automatique des plans après paiement Bictorys"

### ✅ Complété

- [x] Diagnostic du problème d'activation de plans
- [x] Restructure du webhook Bictorys avec fallback API
- [x] Amélioration de la vérification client-side
- [x] Ajout de logging systématique
- [x] Création de la migration `subscription_transactions`
- [x] Documentation complète (`FIX_SUBSCRIPTION_ACTIVATION.md`)
- [x] Test de compilation TypeScript

---

## 🚀 Déploiement & Tests (Immédiat)

### 1. Déployer sur Vercel

```bash
git push origin main
# Vercel auto-deploy
# Vérifier : https://vercel.com/.../deployments
```

**Vérifier après deployment :**
```
✓ Pas d'erreurs dans Function Logs
✓ Webhook route accessible
✓ Environment variables présents
```

### 2. Test avec Compte Réel

```
1. Créer compte test marchand
2. Essayer d'acheter le plan "Business" (4900 XOF)
3. Payer via Wave ou Orange Money
4. Vérifier logs Vercel → Deployments → Function Logs
   - Chercher [webhook] ou [verifySubscriptionPayment]
5. Confirmer activation immédiate (refresh dashboard)
```

**Logs attendus :**
```
[handleSubscriptionWebhook] Début — merchRef: sub-xxxxxxxx-business
[handleSubscriptionWebhook] Charge Bictorys: { status: "succeed" }
[handleSubscriptionWebhook] Activation du plan: { shopId: "xxxx", planKey: "business" }
[handleSubscriptionWebhook] ✅ Plan activé avec succès
```

### 3. Validation Bictorys (URGENT)

Contactez Bictorys pour confirmer :

```
✓ BICTORYS_SECRET_KEY est correct
✓ BICTORYS_WEBHOOK_SECRET est configuré côté Bictorys
✓ Les webhooks sont envoyés à https://tekkishop.com/api/webhooks/bictorys
```

Si Bictorys a une mauvaise configuration, c'est peut-être la cause du bug.

---

## 📋 Plan d'Implémentation des Améliorations (MP-02 à MP-07)

Une fois le problème d'activation stable (48h de monitoring), passer aux améliorations :

### Priorité 1 - Implication Immédiate

#### MP-02 : "Me prévenir quand disponible" (Rupture de Stock)
- Table `stock_alert_subscribers`
- Formulaire simplifié sur page produit
- SMS automatique quand réapprovisionné

#### MP-03 : Analytics Avancées
- Page `/dashboard/analytics`
- Graphiques (barres, variation CA)
- Top produits, top heures, évolution

### Priorité 2 - Business Boosters

#### MP-04 : Image de Couverture Boutique
- Colonne `cover_url` sur `shops`
- Upload dans Settings (Pro uniquement)
- Affichage en haut du mini-site

#### MP-05 : Section "À Propos"
- Colonne `about_text` + `about_photo_url`
- Textarea 500 chars + image
- Affichage en bas du catalogue

#### MP-06 : Produit "Coup de Cœur"
- Toggle `is_featured` sur produits
- Mise en avant au-dessus du catalogue
- Visible par tous (Business+)

### Priorité 3 - Operations

#### MP-07 : Monitoring Sentry
- Vérifier si partiellement configuré
- Activer `SENTRY_DSN`
- Wrapper les appels API critiques

---

## 🗓️ Timeline Proposée

| Phase | Durée | Contenu | Status |
|-------|-------|---------|--------|
| **Phase 0** | 48h | Monitoring post-fix (bug activation) | 🔄 EN COURS |
| **Phase 1** | 3-4 jours | MP-02 (Stock Alerts) + MP-03 (Analytics) | ⬜ À faire |
| **Phase 2** | 2-3 jours | MP-04, MP-05, MP-06 (Visuels) | ⬜ À faire |
| **Phase 3** | 1 jour | MP-07 (Sentry) + Polish | ⬜ À faire |

---

## 📊 Métriques de Succès

### Avant Correction
- ❌ 100% des activations = activation manuelle
- ❌ Aucun logging diagnostic
- ❌ Utilisateurs frustrés

### Après Correction
- ✅ ~90% des activations automatiques
- ✅ Logging détaillé pour rares cas d'échec
- ✅ Utilisateurs heureux

### Cibles pour les Améliorations (MP-02 à MP-07)
- `MP-02` : +15% de rétention clients (captured leads rupture)
- `MP-03` : +10% de commandes (données influencent pricing)
- `MP-04/05/06` : +20% de CTR (meilleur branding)
- `MP-07` : 100% des erreurs capturées (diagnostique facile)

---

## 📚 Documentation Créée

- ✅ `FIX_SUBSCRIPTION_ACTIVATION.md` — Explanation complète du fix
- ✅ `NEXT_STEPS.md` — Ce fichier (roadmap)
- ⬜ `ARCHITECTURE_UPDATED.md` — À mettre à jour après chaque phase

---

## ⚙️ Configuration Technique

### Secrets à Vérifier (Vercel)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Bictorys (CRITIQUE)
BICTORYS_SECRET_KEY=...           ✅ Pour appels API
BICTORYS_WEBHOOK_SECRET=...       ⚠️  À VÉRIFIER

# Twilio SMS
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=...

# Autres
CRON_SECRET=...
NEXT_PUBLIC_APP_URL=https://tekkishop.com
```

### Monitoring à Configurer

1. **Vercel Logs** → Function logs (immédiat)
2. **Sentry** → Error tracking (après validation)
3. **Alert WhatsApp** → Erreurs critiques (futur)

---

## 🔍 Troubleshooting

Si le fix ne fonctionne pas :

### Symptôme : Plan toujours non activé après paiement

**Diagnostic :**
1. Chercher logs Vercel `/api/webhooks/bictorys`
2. Vérifier `BICTORYS_WEBHOOK_SECRET` chez Bictorys
3. Vérifier `BICTORYS_SECRET_KEY` est correcte
4. Si logs vides → webhook ne reçoit pas = problème côté Bictorys

### Symptôme : Erreur "Vérification Bictorys échouée"

**Diagnostic :**
1. Chercher logs Vercel `/dashboard/upgrade`
2. Vérifier le `transactionId` reçu de Bictorys
3. Vérifier l'API Bictorys répond (timeout?)
4. Utiliser bouton "Vérifier à nouveau"

### Symptôme : Webhook ok mais plan pas activé

**Diagnostic :**
1. Vérifier `activatePlan()` ne retourne pas d'erreur
2. Vérifier le shop existe en DB
3. Vérifier le plan est valide ('decouverte', 'business', 'pro')
4. Vérifier RLS policies sur `shops` table

---

## 🎯 Objectif Final

**Avant fin juin 2026 :**
- ✅ Activation plans 100% automatique
- ✅ Toutes les 6 améliorations (MP-02 à MP-07) implémentées
- ✅ Monitoring Sentry en place
- ✅ Zéro activations manuelles

---

## 📞 Questions ou Blocages?

Vérifier :
1. `FIX_SUBSCRIPTION_ACTIVATION.md` — explication technique
2. Logs Vercel → Deployments → Function Logs
3. Environnement variables Bictorys
4. Table `shops` en DB (vérifier plan et is_active)

EOF
cat /Users/tekkigroup/Documents/dev/ministore/NEXT_STEPS.md
