# TEKKIShop AI Assistant — Spécifications d'implémentation

> Document de référence pour la création du chatbot IA intégré au dashboard TEKKIShop.
> À lire intégralement avant d'écrire la moindre ligne de code.

---

## Sommaire

1. [Contexte et objectif](#1-contexte-et-objectif)
2. [Ce que l'agent peut et ne peut pas faire](#2-ce-que-lagent-peut-et-ne-peut-pas-faire)
3. [Limites de messages par plan](#3-limites-de-messages-par-plan)
4. [Architecture technique](#4-architecture-technique)
5. [Tools — accès données boutique](#5-tools--accès-données-boutique)
6. [System prompt](#6-system-prompt)
7. [API route — backend](#7-api-route--backend)
8. [Composants frontend](#8-composants-frontend)
9. [Gestion des limites et erreurs](#9-gestion-des-limites-et-erreurs)
10. [Contraintes de sécurité](#10-contraintes-de-sécurité)
11. [UX et design](#11-ux-et-design)
12. [Liste des fichiers à créer](#12-liste-des-fichiers-à-créer)
13. [Checklist avant livraison](#13-checklist-avant-livraison)

---

## 1. Contexte et objectif

### Problème

Une partie des marchands TEKKIShop n'a jamais créé de site e-commerce ni même de catalogue WhatsApp. Ils ne comprennent pas certains concepts du dashboard (activation du site, configuration des paiements, gestion des produits) et contactent le support via WhatsApp pour des questions dont les réponses sont déjà disponibles. Cela génère une charge de support significative.

### Solution

Un **widget de chatbot IA** discret intégré dans toutes les pages du dashboard. Lorsqu'un utilisateur clique dessus, une interface de chat s'ouvre avec un agent conversationnel alimenté par Claude (Anthropic) capable de :

- Répondre à toutes les questions sur le fonctionnement de TEKKIShop
- Expliquer les éléments du dashboard
- Guider l'utilisateur dans la configuration et l'activation de son site
- Accéder en temps réel aux données de la boutique de l'utilisateur (commandes, produits, clients, revenus) pour donner des réponses contextualisées
- Suggérer des actions concrètes pour améliorer les performances de la boutique

### Ce que ça n'est pas

Ce n'est pas un agent qui agit à la place de l'utilisateur. Il **explique**, **guide** et **suggère**. L'utilisateur effectue lui-même toutes les actions. Cela évite tout risque d'hallucination entraînant une modification involontaire des données.

---

## 2. Ce que l'agent peut et ne peut pas faire

### ✅ Peut faire

- Lire les données de la boutique via des tools (lecture seule, RLS Supabase)
- Répondre à des questions sur TEKKIShop (plans, fonctionnalités, paiements, activation)
- Donner des instructions étape par étape pour accomplir une action dans le dashboard
- Analyser les performances et suggérer des améliorations
- Détecter ce qui bloque l'activation du site et expliquer comment y remédier
- Répondre en français (langue principale des marchands)

### ❌ Ne peut pas faire

- Modifier des données (aucun tool d'écriture, aucun `UPDATE`, `INSERT`, `DELETE`)
- Accéder aux données d'autres boutiques que celle de l'utilisateur connecté
- Envoyer des messages WhatsApp ou emails au nom de l'utilisateur
- Accéder aux informations de paiement sensibles (numéros de carte, etc.)
- Effectuer des payouts ou transactions financières

---

## 3. Limites de messages par plan

Les limites sont calculées par **jour calendaire** (remise à zéro à minuit UTC).

| Plan | Messages / jour | Comportement à la limite |
|---|---|---|
| `decouverte` | **20 messages** | Message d'upsell + blocage |
| `business` | **50 messages** | Message d'upsell doux + blocage |
| `pro` | **Illimité** | Aucune limite |

Un "message" = un envoi de l'utilisateur (pas le streaming de la réponse).

### Comptage

Stocker le compte dans une table Supabase `ai_chat_usage` :

```sql
CREATE TABLE ai_chat_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, date)
);

-- RLS : chaque boutique ne voit que ses propres données
ALTER TABLE ai_chat_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Boutique voit ses propres stats"
  ON ai_chat_usage FOR SELECT
  USING (shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()));
```

### Message d'upsell à la limite

**Plan Découverte (20 messages atteints) :**
> "Tu as atteint ta limite de 20 messages aujourd'hui. Passe au plan Business ou Pro pour continuer à utiliser l'assistant sans interruption. Ta limite se renouvelle demain à minuit."

**Plan Business (50 messages atteints) :**
> "Tu as atteint ta limite de 50 messages aujourd'hui. Passe au plan Pro pour un accès illimité à l'assistant. Ta limite se renouvelle demain à minuit."

---

## 4. Architecture technique

### Stack

```
Vercel AI SDK (ai + @ai-sdk/anthropic)
Next.js 15 App Router
Supabase (PostgreSQL + RLS)
React useState (historique en mémoire, pas de persistance)
Tailwind CSS (design cohérent avec le dashboard)
```

### Modèle IA

- **Modèle principal :** `claude-haiku-4-5-20251001` — rapide, peu coûteux, adapté aux questions FAQ et lectures de données
- **Pourquoi Haiku :** coût ~$0.001–0.003 par conversation, suffisant pour FAQ + tool calls simples
- **Fallback :** si un tool call retourne une erreur, l'agent répond sans les données en précisant qu'il ne peut pas y accéder

### Flow de données

```
1. Utilisateur clique sur le bouton flottant
2. ChatWidget s'ouvre — message d'accueil avec le prénom et le nom de la boutique
3. Utilisateur envoie un message
4. Frontend vérifie la limite (optionnel, mais fait aussi côté serveur)
5. POST /api/ai/chat avec { messages: [...], shopId }
6. Route vérifie auth + limite → si dépassée, retourne 429 avec message upsell
7. Route incrémente le compteur dans ai_chat_usage
8. Route appelle streamText() avec tools et system prompt
9. Claude appelle les tools nécessaires silencieusement
10. Réponse streamée vers le frontend
11. Frontend affiche le texte au fur et à mesure (effet typing)
```

---

## 5. Tools — accès données boutique

Chaque tool fait **uniquement des lectures** depuis Supabase avec `createAdminClient()` filtré sur `shop_id`. Le `shop_id` est **toujours injecté côté serveur** depuis la session — jamais depuis le client.

### Tool 1 : `get_shop_info`

Retourne les informations de configuration de la boutique.

```typescript
{
  description: "Récupère les informations générales de la boutique : nom, plan, pays, statut d'activation, URL du site, moyens de paiement configurés, logo uploadé.",
  parameters: z.object({}), // Aucun paramètre — shop_id vient du contexte serveur
  execute: async () => {
    // Lire shops + payment_configs
    // Retourner : { name, plan, country, is_active, site_url, has_logo, wave_configured, om_configured, created_at }
  }
}
```

### Tool 2 : `get_setup_checklist`

Retourne l'état de complétion de la configuration (utile pour guider l'activation).

```typescript
{
  description: "Vérifie l'état de configuration de la boutique : quelles étapes sont complètes et lesquelles manquent pour activer le site.",
  parameters: z.object({}),
  execute: async () => {
    // Retourner : {
    //   has_logo: boolean,
    //   has_products: boolean,
    //   product_count: number,
    //   has_payment_method: boolean,
    //   wave_configured: boolean,
    //   om_configured: boolean,
    //   site_active: boolean,
    //   domain_configured: boolean,
    //   missing_steps: string[]  // liste des étapes manquantes en français
    // }
  }
}
```

### Tool 3 : `get_orders`

Retourne un résumé des commandes récentes.

```typescript
{
  description: "Récupère les commandes de la boutique : nombre total, montant total, commandes récentes, répartition par statut.",
  parameters: z.object({
    days: z.number().optional().describe("Nombre de jours à analyser (défaut: 30)")
  }),
  execute: async ({ days = 30 }) => {
    // Retourner : {
    //   total_orders: number,
    //   total_revenue: number,
    //   orders_by_status: { pending, confirmed, shipped, delivered, cancelled },
    //   recent_orders: [{ id, amount, status, created_at, customer_name }], // 5 dernières
    //   period_days: number
    // }
  }
}
```

### Tool 4 : `get_products`

Retourne le catalogue produits de la boutique.

```typescript
{
  description: "Récupère les produits de la boutique : nombre total, produits actifs/inactifs, ruptures de stock, produits les plus vendus.",
  parameters: z.object({}),
  execute: async () => {
    // Retourner : {
    //   total_products: number,
    //   active_products: number,
    //   inactive_products: number,
    //   out_of_stock: number,
    //   top_products: [{ name, sales_count, revenue }] // top 5
    // }
  }
}
```

### Tool 5 : `get_customers`

Retourne les statistiques clients.

```typescript
{
  description: "Récupère les statistiques clients de la boutique : nombre total, nouveaux clients récents, clients récurrents.",
  parameters: z.object({
    days: z.number().optional().describe("Nombre de jours à analyser (défaut: 30)")
  }),
  execute: async ({ days = 30 }) => {
    // Retourner : {
    //   total_customers: number,
    //   new_customers_period: number,
    //   returning_customers: number,
    //   period_days: number
    // }
  }
}
```

### Tool 6 : `get_revenues`

Retourne les informations de revenus et reversements.

```typescript
{
  description: "Récupère les revenus de la boutique : total collecté, solde disponible, historique des reversements.",
  parameters: z.object({}),
  execute: async () => {
    // Retourner : {
    //   total_collected: number,
    //   available_balance: number,
    //   pending_payout: number,
    //   total_paid_out: number,
    //   commission_rate: number, // en %
    //   recent_payouts: [{ amount, status, created_at }] // 3 derniers
    // }
  }
}
```

---

## 6. System prompt

Le system prompt est composé de deux parties assemblées dynamiquement côté serveur.

### Partie 1 — Identité et comportement (statique)

```
Tu es l'assistant IA officiel de TEKKIShop, disponible directement dans le dashboard des marchands.

TEKKIShop est une plateforme SaaS qui permet aux entrepreneurs et petits commerçants d'Afrique de l'Ouest de créer leur boutique en ligne en quelques minutes, sans compétences techniques. Les marchands peuvent vendre leurs produits via un lien de boutique partageable, accepter des paiements mobile money (Wave, Orange Money) et gérer leurs commandes.

Ton rôle :
- Répondre aux questions sur le fonctionnement de TEKKIShop
- Guider les marchands dans la configuration et l'activation de leur boutique
- Expliquer les éléments du dashboard
- Analyser les performances de la boutique et suggérer des améliorations concrètes
- Donner des instructions claires étape par étape pour que le marchand effectue lui-même les actions

Ce que tu ne fais jamais :
- Modifier des données (tu guides, tu n'agis pas)
- Inventer des informations que tu ne connais pas
- Répondre dans une autre langue que le français sauf si le marchand écrit dans une autre langue

Ton ton : bienveillant, direct, simple, adapté à des entrepreneurs non-techniques. Évite le jargon technique. Utilise des listes à puces et des étapes numérotées pour les instructions.

--- CONNAISSANCE TEKKISHOP ---

PLANS ET TARIFS :
- Plan Découverte : gratuit, commission de 3% sur les ventes, fonctionnalités de base
- Plan Business : payant mensuel, commission de 3%, fonctionnalités avancées (analytics, domaine personnalisé, etc.)
- Plan Pro : payant mensuel ou annuel, 0% de commission, toutes les fonctionnalités, assistant IA illimité

ACTIVATION DU SITE :
Pour activer leur site, les marchands doivent :
1. Uploader un logo (dans Paramètres → Apparence)
2. Ajouter au moins un produit actif (dans Produits → Ajouter un produit)
3. Configurer au moins un moyen de paiement (dans Paramètres → Paiements — Wave ou Orange Money)
4. Cliquer sur "Activer mon site" dans le dashboard principal

MOYENS DE PAIEMENT DISPONIBLES PAR PAYS :
- Sénégal : Wave, Orange Money
- Côte d'Ivoire : Wave, Orange Money, MTN Money, Moov Money
- Burkina Faso : Wave, Orange Money, Moov Money
- Mali : Wave, Orange Money
- Togo : Moov Money (Flooz)
- Bénin : MTN Money, Moov Money

REVERSEMENTS (PAYOUTS) :
- Les reversements sont effectués via Wave ou Orange Money selon le pays
- Le solde disponible est le total collecté moins la commission TEKKIShop et les reversements déjà effectués
- Les reversements sont généralement instantanés via mobile money
- Le marchand configure son numéro de reversement dans Paramètres → Paiements

COMMANDES :
- Les commandes arrivent avec le statut "En attente" (le client a passé commande mais le paiement n'est pas encore confirmé)
- Une fois le paiement confirmé, la commande passe à "Confirmée"
- Le marchand peut ensuite passer à "Expédiée" puis "Livrée"
- Statut "Annulée" : la commande a été annulée

PRODUITS :
- Un produit inactif n'est pas visible sur la boutique
- La rupture de stock désactive automatiquement le produit si le stock atteint 0
- Les marchands peuvent organiser leurs produits par catégories
```

### Partie 2 — Contexte utilisateur (dynamique, injectée à chaque session)

```typescript
// Construire dynamiquement côté serveur
const userContext = `
--- CONTEXTE DE LA BOUTIQUE ACTUELLE ---
Nom de la boutique : ${shop.name}
Plan actuel : ${shop.plan}
Pays : ${shop.country}
Statut : ${shop.is_active ? 'Site actif ✅' : 'Site non activé ❌'}
${shop.site_url ? `URL de la boutique : ${shop.site_url}` : ''}
Date de création : ${formatDate(shop.created_at)}

Tu es en train d'aider le marchand de la boutique "${shop.name}". Personnalise tes réponses en conséquence.
Quand tu mentionnes la boutique, utilise son nom.
`
```

---

## 7. API route — backend

### Fichier : `src/app/api/ai/chat/route.ts`

```typescript
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildAiTools } from '@/lib/ai/tools'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'

const PLAN_LIMITS: Record<string, number> = {
  decouverte: 20,
  business:   50,
  pro:        Infinity,
}

export async function POST(req: NextRequest) {
  // 1. Authentification
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // 2. Récupérer le profil et la boutique
  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id) {
    return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data: shop } = await admin
    .from('shops')
    .select('id, name, plan, country, is_active, site_url, created_at')
    .eq('id', profile.shop_id)
    .single()

  if (!shop) return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })

  // 3. Vérifier et incrémenter la limite de messages
  const limit = PLAN_LIMITS[shop.plan ?? 'decouverte'] ?? 20
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const { data: usage } = await admin
    .from('ai_chat_usage')
    .select('id, message_count')
    .eq('shop_id', shop.id)
    .eq('date', today)
    .maybeSingle()

  const currentCount = usage?.message_count ?? 0

  if (currentCount >= limit) {
    const upsellMessage = shop.plan === 'business'
      ? `Tu as atteint ta limite de ${limit} messages aujourd'hui. Passe au plan Pro pour un accès illimité à l'assistant. Ta limite se renouvelle demain à minuit.`
      : `Tu as atteint ta limite de ${limit} messages aujourd'hui. Passe au plan Business ou Pro pour continuer à utiliser l'assistant sans interruption. Ta limite se renouvelle demain à minuit.`

    return NextResponse.json({ error: 'LIMIT_REACHED', message: upsellMessage }, { status: 429 })
  }

  // Incrémenter le compteur (upsert)
  await admin
    .from('ai_chat_usage')
    .upsert(
      { shop_id: shop.id, date: today, message_count: currentCount + 1, updated_at: new Date().toISOString() },
      { onConflict: 'shop_id,date' }
    )

  // 4. Récupérer les messages du body
  const body = await req.json() as { messages: { role: string; content: string }[] }
  const { messages } = body

  if (!messages?.length) {
    return NextResponse.json({ error: 'Messages manquants' }, { status: 400 })
  }

  // 5. Construire le system prompt et les tools
  const systemPrompt = buildSystemPrompt(shop)
  const tools = buildAiTools(shop.id)

  // 6. Appel Claude avec streaming
  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: systemPrompt,
    messages: messages as Parameters<typeof streamText>[0]['messages'],
    tools,
    maxSteps: 5, // max tool calls enchaînés
    temperature: 0.3, // Réponses cohérentes, moins créatives
  })

  return result.toDataStreamResponse()
}
```

---

## 8. Composants frontend

### Structure des fichiers

```
src/components/ai/
  ChatWidget.tsx       — Bouton flottant + panel chat complet
  ChatMessage.tsx      — Rendu d'un message (markdown, streaming)
  ChatLimitBanner.tsx  — Bannière quand la limite est atteinte
```

### `ChatWidget.tsx` — comportement attendu

**Bouton flottant :**
- Position : `fixed bottom-6 right-6 z-50`
- Apparence : cercle de la couleur primaire (`var(--color-primary)`) avec icône de bulle de chat (Lucide `MessageCircle`)
- Badge de notification optionnel (pour future fonctionnalité — laisser le slot prévu)
- Click → ouvre le panel

**Panel chat :**
- Largeur : `w-80 sm:w-96`
- Hauteur : `h-[500px] max-h-[80vh]`
- Position : `fixed bottom-20 right-6 z-50`
- Animation d'ouverture : slide-up + fade-in
- Header : logo TEKKIShop + "Assistant TEKKIShop" + bouton fermer
- Zone de messages : scroll auto vers le bas sur nouveau message
- Message d'accueil initial (avant toute interaction) : _"Bonjour 👋 Je suis l'assistant de **{shopName}**. Posez-moi vos questions sur TEKKIShop ou votre boutique !"_
- Input : texte + bouton envoyer, désactivé pendant le streaming
- Footer : compteur de messages restants pour les plans Découverte et Business ("_18 messages restants aujourd'hui_")

**Historique :** uniquement en mémoire React (`useState`). Pas de persistance entre les sessions — chaque ouverture repart d'une conversation vierge avec juste le message d'accueil.

### `ChatMessage.tsx` — rendu

- Messages utilisateur : alignés à droite, fond couleur primaire, texte blanc
- Messages assistant : alignés à gauche, fond gris clair
- Rendu Markdown pour les réponses de l'assistant (listes, gras, étapes numérotées)
- Indicateur de streaming : trois points animés pendant que Claude génère
- Ne pas afficher les tool calls à l'utilisateur — ils sont silencieux

### `ChatLimitBanner.tsx`

Affiché dans le panel quand la limite est atteinte :
- Fond orange doux
- Message d'upsell selon le plan
- Bouton "Voir les plans" → `/dashboard/billing`

---

## 9. Gestion des limites et erreurs

### Erreurs à gérer côté frontend

| Code | Cause | Action frontend |
|---|---|---|
| `429 LIMIT_REACHED` | Limite journalière atteinte | Afficher `ChatLimitBanner` |
| `401` | Session expirée | Afficher "Session expirée, rechargez la page" |
| `500` | Erreur serveur | Afficher "Une erreur est survenue. Réessayez." |
| Timeout réseau | Connexion lente | Afficher "Vérifiez votre connexion et réessayez." |

### Affichage du compteur restant

- Charger le compte actuel lors de l'ouverture du panel : `GET /api/ai/chat/usage`
- Mettre à jour localement après chaque envoi
- Ne pas afficher le compteur pour le plan Pro

---

## 10. Contraintes de sécurité

- **Le `shop_id` n'est jamais envoyé par le client.** Il est toujours résolu côté serveur depuis la session Supabase.
- **Tous les tools utilisent `createAdminClient()`** filtré sur `shop_id` pour bypasser le RLS — mais le `shop_id` vient uniquement de la session serveur, donc aucun risque de cross-tenant.
- **Aucun tool d'écriture.** Si un futur développeur ajoute un tool, il doit être en lecture seule.
- **Pas de données de paiement sensibles** dans les tools (pas de numéros de carte, pas de détail des transactions Bictorys au-delà des montants agrégés).
- **Rate limiting côté serveur** (table `ai_chat_usage`) — ne pas se fier uniquement au frontend.
- **L'historique de conversation n'est pas persisté** — pas de risque de fuite d'informations entre sessions.

---

## 11. UX et design

### Principes

- **Mobile-first :** la majorité des marchands utilisent leur téléphone
- **Accessible sans connexion rapide :** streaming progressif, pas de spinner bloquant
- **Pas de jargon :** les réponses doivent être compréhensibles par quelqu'un qui n'a jamais créé de site
- **Respect du design system existant :** utiliser `var(--color-primary)`, les mêmes border-radius et fonts que le reste du dashboard

### Ce que le widget ne doit PAS faire

- S'ouvrir automatiquement (trop intrusif)
- Envoyer des messages en plusieurs bulles séparées (le streaming doit remplir une seule bulle progressivement)
- Afficher les tool calls en cours à l'utilisateur ("Je cherche vos données...") — les tool calls sont invisibles
- Utiliser des emojis excessifs dans les réponses

### Message d'accueil recommandé selon le contexte

Le widget peut détecter sur quelle page du dashboard l'utilisateur se trouve et adapter le message d'accueil :

```typescript
const WELCOME_MESSAGES: Record<string, string> = {
  '/dashboard':           'Bonjour 👋 Comment puis-je vous aider avec votre boutique aujourd\'hui ?',
  '/dashboard/products':  'Vous gérez vos produits ? Je peux vous aider à optimiser votre catalogue.',
  '/dashboard/orders':    'Vous avez des questions sur vos commandes ? Je suis là pour vous aider.',
  '/dashboard/revenues':  'Des questions sur vos revenus ou reversements ? Posez-moi vos questions.',
  '/dashboard/settings':  'Besoin d\'aide pour configurer votre boutique ? Je vous guide.',
}
```

---

## 12. Liste des fichiers à créer

### Backend

```
src/app/api/ai/chat/route.ts          — Endpoint streaming principal
src/app/api/ai/chat/usage/route.ts    — GET : compteur de messages restants du jour
src/lib/ai/tools.ts                   — Définition des 6 tools Supabase (lecture seule)
src/lib/ai/system-prompt.ts           — Assemblage du system prompt (statique + dynamique)
```

### Frontend

```
src/components/ai/ChatWidget.tsx      — Bouton flottant + panel complet
src/components/ai/ChatMessage.tsx     — Rendu d'un message avec Markdown
src/components/ai/ChatLimitBanner.tsx — Bannière upsell quand limite atteinte
```

### Base de données

```sql
-- Migration SQL à appliquer dans Supabase
CREATE TABLE ai_chat_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, date)
);

ALTER TABLE ai_chat_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_ai_usage"
  ON ai_chat_usage FOR SELECT
  USING (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );
-- Note : les inserts/updates se font via createAdminClient() (service role)
```

### Intégration dans le layout dashboard

Ajouter `<ChatWidget />` dans `src/app/dashboard/layout.tsx` pour que le widget soit présent sur toutes les pages du dashboard.

### Dépendances à installer

```bash
npm install ai @ai-sdk/anthropic react-markdown
```

Vérifier si `ai` et `@ai-sdk/anthropic` sont déjà dans `package.json` avant d'installer.

---

## 13. Checklist avant livraison

### Fonctionnel

- [ ] Le bouton flottant apparaît sur toutes les pages du dashboard
- [ ] Le panel s'ouvre et se ferme correctement
- [ ] Le message d'accueil affiche le nom de la boutique
- [ ] L'utilisateur peut envoyer un message et recevoir une réponse en streaming
- [ ] Les tool calls fonctionnent (l'agent accède aux vraies données de la boutique)
- [ ] La limite de 20 messages est respectée pour le plan Découverte
- [ ] La limite de 50 messages est respectée pour le plan Business
- [ ] Le plan Pro n'a aucune limite
- [ ] Le message d'upsell s'affiche correctement quand la limite est atteinte
- [ ] Le compteur de messages restants est visible pour Découverte et Business

### Sécurité

- [ ] Le `shop_id` n'est jamais envoyé par le client
- [ ] Un utilisateur ne peut pas voir les données d'une autre boutique
- [ ] Les tools sont tous en lecture seule
- [ ] La limite est vérifiée côté serveur (pas uniquement côté client)

### UX

- [ ] Le widget est responsive (mobile et desktop)
- [ ] Le streaming fonctionne sans freeze UI
- [ ] Les réponses Markdown s'affichent correctement (listes, gras)
- [ ] Le scroll se fait automatiquement vers le dernier message
- [ ] L'input est désactivé pendant le streaming
- [ ] Le widget respecte le design system du dashboard (couleur primaire, fonts)

### Performance

- [ ] Aucune requête Supabase au chargement du dashboard (le widget ne charge que quand il est ouvert)
- [ ] Les tool calls sont parallélisés si plusieurs sont nécessaires (`maxSteps: 5`)
- [ ] Timeout de 30s sur les requêtes Claude (pas de spinner infini)
