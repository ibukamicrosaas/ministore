'use client'

import { createContext, useContext } from 'react'

interface ChatAssistantContextValue {
  /** Ouvre l'assistant IA et envoie immédiatement ce message. */
  openChatWithPrompt: (prompt: string) => void
}

export const ChatAssistantContext = createContext<ChatAssistantContextValue | null>(null)

export function useChatAssistant(): ChatAssistantContextValue {
  const ctx = useContext(ChatAssistantContext)
  if (!ctx) throw new Error('useChatAssistant doit être utilisé sous DashboardShell')
  return ctx
}
