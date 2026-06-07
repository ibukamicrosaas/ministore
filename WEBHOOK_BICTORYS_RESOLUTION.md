# Résolution du problème Webhook Bictorys — Guide complet

## 📋 Résumé exécutif

Ce document détaille la résolution d'un problème critique où les **webhooks Bictorys ne se déclenchaient pas** et les **paiements d'abonnement n'étaient jamais activés**, malgré une configuration correcte en production.

**Cause racine** : Trois problèmes imbriqués ont empêché le webhook de fonctionner :
1. URL webhook sans `www` causant une redirection 307
2. Webhook cherchant `merchantReference` au lieu de `paymentReference`
3. Absence de fallback pour les cas où le webhook n'arrive pas

**Durée totale de résolution** : Identification complète + fixes + test = ~2 heures

---

## 🔍 Diagnostic détaillé

### Problème initial

L'utilisateur teste un paiement d'abonnement :
- ✅ La charge est créée avec succès dans Bictorys
- ✅ La transaction est enregistrée en base (`subscription_transactions` status: `pending`)
- ❌ **Le webhook ne se déclenche jamais**
- ❌ **Le plan n'est jamais activé**
- ❌ **La table `subscription_transactions` reste en status `pending`**

### Logs observés initialement

```
[createBictorysCharge] ✅ Charge créée avec succès
[subscription/create] Charge créée avec succès
[NO WEBHOOK LOGS] ← Rien ici!
```

Aucun log `[webhook/bictorys]` n'apparaît dans Vercel, confirmant que le webhook n'atteint jamais notre serveur.

---

## 🔧 Problème #1 : Redirection 307 (URL sans www)

### Découverte

Test manuellement du webhook endpoint :
```bash
curl -i -X POST https://tekki.shop/api/webhooks/bictorys \
  -H "Content-Type: application/json" \
  -H "X-Secret-Key: ..."
```

**Réponse** :
```
HTTP/2 307 
location: https://www.tekki.shop/api/webhooks/bictorys
```

**Problème** : Vercel redirige automatiquement `tekki.shop` → `www.tekki.shop`. Quand Bictorys essaie d'envoyer le webhook à `https://tekki.shop/...`, il reçoit une redirection 307 et abandonne l'envoi (Bictorys ne suit probablement pas les redirections pour les webhooks).

### Solution

Changer `APP_URL` pour inclure le `www` dans **`src/constants/index.ts`** :

**Avant** :
```typescript
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tekki.shop'
```

**Après** :
```typescript
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.tekki.shop'
```

#### Actions supplémentaires
1. **Vérifier Vercel** : Dashboard → Paramètres → Variables d'environnement
2. Si `NEXT_PUBLIC_APP_URL` existe, la mettre à jour à `https://www.tekki.shop` (avec www)
3. Redéployer

**Résultat** : Le webhook peut maintenant atteindre notre serveur sans redirection.

---

## 🔧 Problème #2 : Webhook cherche `merchantReference` au lieu de `paymentReference`

### Découverte

Après la fix #1, le webhook se déclenche enfin! Log :

```
[webhook/bictorys] 🔔 WEBHOOK REÇU
[error] [webhook] merchantReference manquant dans payload
```

Le payload reçu de Bictorys contient :
```json
{
  "id": "764aa0b3-8b90-4f31-90ff-ec57f6a5ff56",
  "paymentReference": "ts-sub-2af16538",    ← ✅ Ceci est présent
  "merchantReference": null,                  ← ❌ Ceci est null
  "status": "succeeded"
}
```

### Cause

Le code du webhook cherchait `merchantReference` :

```typescript
// ❌ Code problématique
const merchantReference = payload.merchantReference
if (!merchantReference) {
  console.error('[webhook] merchantReference manquant dans payload:', payload)
  return NextResponse.json({ error: 'merchantReference manquant' }, { status: 400 })
}

if (merchantReference.startsWith('sub-')) {
  return handleSubscriptionWebhook(merchantReference, payload)
}
```

**Mais nous n'avons jamais envoyé `merchantReference`** lors de la création de la charge. Nous avons seulement envoyé `paymentReference: 'ts-sub-2af16538'`.

Dans **`src/app/api/payments/bictorys/subscription/route.ts`** :
```typescript
await createBictorysCharge(
  apiKey,
  {
    amount,
    currency: 'XOF',
    paymentReference,      // ← On envoie ceci
    // merchantReference pas envoyé!
    webhookUrl: `${APP_URL}/api/webhooks/bictorys`,
    ...
  },
  paymentType,
)
```

Bictorys retourne dans le webhook ce qu'on a envoyé :
- `paymentReference: 'ts-sub-2af16538'` (ce qu'on a envoyé)
- `merchantReference: null` (on ne l'a pas envoyé)

### Solution

Modifier **`src/app/api/webhooks/bictorys/route.ts`** pour chercher `paymentReference` en premier :

**Avant** :
```typescript
const merchantReference = payload.merchantReference
if (!merchantReference) {
  console.error('[webhook] merchantReference manquant dans payload:', payload)
  return NextResponse.json({ error: 'merchantReference manquant' }, { status: 400 })
}

console.log('[webhook] Webhook reçu — merchRef:', merchantReference, ...)

if (merchantReference.startsWith('sub-')) {
  return handleSubscriptionWebhook(merchantReference, payload)
}
```

**Après** :
```typescript
// Chercher la référence : paymentReference (abonnements + commandes) ou merchantReference (commandes)
const reference = payload.paymentReference ?? payload.merchantReference
if (!reference) {
  console.error('[webhook] Aucune référence (paymentReference/merchantReference) dans payload:', payload)
  return NextResponse.json({ error: 'Référence manquante' }, { status: 400 })
}

console.log('[webhook] Webhook reçu — reference:', reference, 'status:', payload.status, 'id:', payload.id)

// Accepter les deux formats d'abonnements : 'ts-sub-*' et 'sub-*'
if (reference.startsWith('ts-sub-') || reference.startsWith('sub-')) {
  return handleSubscriptionWebhook(reference, payload)
}

const merchantReference = reference
```

**Résultat** : Le webhook détecte maintenant correctement les abonnements et appelle `handleSubscriptionWebhook`.

---

## 🔧 Problème #3 : Aucun fallback si le webhook n'arrive pas

### Problème

Même avec les deux fixes précédentes, les webhooks ne garantissent **jamais** une livraison à 100%. Bictorys peut avoir des délais ou abandonnera après 3 tentatives si le serveur n'est pas accessible.

**Solution idéale** : Implémenter un **cron job** qui vérifie régulièrement les paiements en attente et les active si Bictorys confirme qu'ils ont réussi.

### Solution implémentée

Créer **`src/app/api/cron/verify-subscription-payments/route.ts`** :

```typescript
/**
 * Cron job : Vérifie les transactions d'abonnement "pending"
 * auprès de Bictorys et les active si le paiement a réussi.
 *
 * Déclenché toutes les minutes par Vercel Cron.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET ?? ''

  // Vérifier l'authentification
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Retrouver toutes les transactions pending depuis < 24h
  const { data: pendingTransactions } = await supabase
    .from('subscription_transactions')
    .select('id, shop_id, plan_key, charge_id, created_at')
    .eq('status', 'pending')
    .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(50)

  // 2. Pour chaque transaction, vérifier le status chez Bictorys
  for (const txn of pendingTransactions) {
    try {
      const charge = await getBictorysCharge(apiKey, txn.charge_id)
      
      if (charge.status === 'succeed') {
        // 3. Vérifier le montant
        const expectedAmount = PLAN_PRICES[txn.plan_key]
        if (charge.amount === expectedAmount) {
          // 4. Activer le plan
          await activatePlan(txn.shop_id, txn.plan_key)
          
          // 5. Marquer comme activé
          await supabase
            .from('subscription_transactions')
            .update({
              status: 'activated',
              activated_at: new Date().toISOString(),
              ...
            })
            .eq('id', txn.id)
        }
      }
    } catch (error) {
      console.error('Erreur traitement transaction', error)
    }
  }
}
```

### Configuration dans `vercel.json`

Ajouter le cron job pour s'exécuter **toutes les minutes** :

```json
{
  "crons": [
    {
      "path": "/api/cron/verify-subscription-payments",
      "schedule": "* * * * *"  // Chaque minute
    },
    // ... autres crons
  ]
}
```

**Avantages** :
- ✅ Activation quasi-immédiate (< 1 minute)
- ✅ Pas de dépendance aux webhooks Bictorys
- ✅ Fonctionne même si Bictorys a des délais
- ✅ Vérification directe via l'API Bictorys
- ✅ Gère les montants erronés (fraude détectée)

---

## 📝 Problème bonus : Fallback `ActivationChecker`

### Contexte

Les utilisateurs pouvaient cliquer sur "J'ai déjà payé" dans les paramètres pour vérifier manuellement l'activation du plan. Mais le fallback n'appelait que `pollShopActivation()` qui vérifiait juste la base de données.

### Solution

Modifier **`src/app/dashboard/settings/ActivationChecker.tsx`** pour lire les cookies et appeler `verifySubscriptionPayment()` avec la transaction ID :

```typescript
async function handleCheck() {
  // Lire les cookies
  const txnCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('pending_sub_txn='))
    ?.split('=')[1]
  const planCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('pending_sub_plan='))
    ?.split('=')[1]

  // Si les cookies existent, vérifier via l'API Bictorys
  if (txnCookie && planCookie) {
    const result = await verifySubscriptionPayment(txnCookie, planCookie)
    if (result.success) {
      router.refresh()
      return
    }
  }

  // Fallback : vérifier juste si la boutique est active
  const { isActive } = await pollShopActivation()
  if (isActive) {
    router.refresh()
  } else {
    setNotFound(true)
  }
}
```

---

## 🎯 Résumé des fixes appliquées

| # | Problème | Fichier | Fix | Impact |
|---|----------|---------|-----|--------|
| 1 | URL webhook sans `www` → redirection 307 | `src/constants/index.ts` | Changer `APP_URL` à `https://www.tekki.shop` | **Critique** : Permet au webhook d'atteindre le serveur |
| 2 | Webhook cherche `merchantReference` null | `src/app/api/webhooks/bictorys/route.ts` | Vérifier `paymentReference` en premier | **Critique** : Webhook peut maintenant traiter les abonnements |
| 3 | Aucun fallback si webhook n'arrive pas | `src/app/api/cron/verify-subscription-payments/route.ts` | Cron job toutes les minutes | **Important** : Activation garantie même sans webhook |
| 4 | Fallback manuel inefficace | `src/app/dashboard/settings/ActivationChecker.tsx` | Lire cookies et vérifier l'API Bictorys | **Bonus** : Fallback utilisateur amélioré |

---

## ✅ Checklist pour reproduire la solution

### Si vous rencontrez le même problème :

- [ ] **Vérifier l'URL du webhook** : La webhookUrl envoyée à Bictorys ne cause-t-elle pas de redirection?
  ```bash
  curl -i -X POST https://votre-url/api/webhooks/bictorys
  # Doit retourner 200 ou 401, pas 307
  ```

- [ ] **Vérifier le format du payload reçu** : Cherche-t-on `paymentReference` ou `merchantReference`?
  ```json
  // Ajouter un log du payload reçu
  console.log('Webhook payload:', payload)
  ```

- [ ] **Implémenter un cron job de vérification** : Ne pas dépendre 100% des webhooks
  - Créer `src/app/api/cron/verify-subscription-payments/route.ts`
  - Ajouter à `vercel.json` : `schedule: "* * * * *"`

- [ ] **Tester manuellement** : Faire un paiement test et vérifier:
  - ✅ Logs du webhook dans Vercel
  - ✅ Table `subscription_transactions` passe à `activated`
  - ✅ Table `shops` : `is_active=true` et `plan=<planKey>`

---

## 📚 Documentation de référence utilisée

### Bictorys Integration Guide
- **Webhooks** : Configuration requise dans Dashboard → Developers → Webhooks
- **Payload format** : Les champs `paymentReference` et `merchantReference` ont des rôles distincts
- **Livraison** : Les webhooks ne sont pas garantis à 100% (recommande des fallbacks)

### Architecture de la solution

```
┌─────────────────────────────────────────────────────────┐
│ Paiement d'abonnement                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─→ Crée transaction en `subscription_transactions` (pending)
                 │
                 ├─→ [WEBHOOK] Bictorys → https://www.tekki.shop/api/webhooks/bictorys
                 │   │
                 │   └─→ ✅ Valide montant
                 │   └─→ ✅ Active plan via activatePlan()
                 │   └─→ ✅ Marque transaction comme activated
                 │
                 └─→ [FALLBACK] Cron job (chaque minute)
                     │
                     ├─→ Retrouve transactions pending
                     ├─→ Vérifie status chez Bictorys
                     └─→ Active si succeed + montant OK
```

---

## 🚀 Leçons apprises

1. **Webhooks ne sont jamais garantis** → Implémenter toujours un fallback
2. **Tester l'accessibilité de l'endpoint** → `curl -i` révèle les redirections
3. **Logs précoces sont critiques** → Ajouter des logs au tout début du handler
4. **Vérifier le payload réel vs le type** → Bictorys retourne ce qu'on envoie
5. **Configuration séparée test/production** → Vérifier le dashboard Bictorys dans le bon environnement

---

## 📞 Support

Si vous rencontrez un problème similaire :
1. Vérifier d'abord que le webhook atteint votre serveur (pas de redirection)
2. Logger le payload reçu pour voir la structure réelle
3. Implémenter un cron job de fallback dès le départ (meilleure pratique)
4. Tester avec un paiement réel et vérifier les logs Vercel

