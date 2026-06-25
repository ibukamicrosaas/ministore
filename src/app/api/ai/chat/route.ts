import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildAiTools, stepCountIs } from '@/lib/ai/tools'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import type { ModelMessage } from 'ai'

// Limite de messages par plan et par jour calendaire (UTC)
const PLAN_LIMITS: Record<string, number> = {
  trial:      20,
  decouverte: 20,
  business:   50,
  pro:        Infinity,
}

export const maxDuration = 30

export async function POST(req: NextRequest) {
  // 1. Vérification de l'authentification
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // 2. Récupérer le profil et la boutique depuis la session serveur
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
    .select('id, name, plan, country, is_active, slug, created_at')
    .eq('id', profile.shop_id)
    .single()

  if (!shop) {
    return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
  }

  // 3. Vérifier la limite de messages (côté serveur — source de vérité)
  const limit = PLAN_LIMITS[shop.plan ?? 'trial'] ?? 20
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC

  if (limit !== Infinity) {
    const { data: usage } = await admin
      .from('ai_chat_usage' as never)
      .select('message_count')
      .eq('shop_id', shop.id)
      .eq('date', today)
      .maybeSingle() as { data: { message_count: number } | null }

    const currentCount = usage?.message_count ?? 0

    if (currentCount >= limit) {
      const upsellMessage =
        shop.plan === 'business'
          ? `Tu as atteint ta limite de ${limit} messages aujourd'hui. Passe au plan Pro pour un accès illimité à l'assistant. Ta limite se renouvelle demain à minuit.`
          : `Tu as atteint ta limite de ${limit} messages aujourd'hui. Passe au plan Business ou Pro pour continuer à utiliser l'assistant sans interruption. Ta limite se renouvelle demain à minuit.`

      return NextResponse.json(
        { error: 'LIMIT_REACHED', message: upsellMessage },
        { status: 429 }
      )
    }

    // Incrémenter le compteur (upsert atomique)
    await admin.from('ai_chat_usage' as never).upsert(
      {
        shop_id: shop.id,
        date: today,
        message_count: currentCount + 1,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: 'shop_id,date' }
    )
  }

  // 4. Parser et valider les messages du body
  let messages: ModelMessage[]
  try {
    const body = await req.json() as { messages?: unknown }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'Messages manquants' }, { status: 400 })
    }
    // MED-5 : limiter à 20 derniers messages, tronquer le contenu à 2000 chars
    const raw = (body.messages as ModelMessage[]).slice(-20)
    messages = raw.map(msg => {
      if (typeof (msg as any).content === 'string') {
        return { ...msg, content: (msg as any).content.slice(0, 2000) }
      }
      return msg
    })
  } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 })
  }

  // 5. Construire le system prompt et les tools
  const systemPrompt = buildSystemPrompt(shop)
  const tools = buildAiTools(shop.id)

  // 6. Appel Claude avec streaming — tool calls traités silencieusement côté serveur
  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: systemPrompt,
    messages,
    tools,
    stopWhen: stepCountIs(5),
    temperature: 0.3,
  })

  return result.toTextStreamResponse()
}
