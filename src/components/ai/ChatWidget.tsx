'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { X, Send, MessageCircle } from 'lucide-react'
import { ChatMessage, type Message } from './ChatMessage'
import { ChatLimitBanner } from './ChatLimitBanner'

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface UsageState {
  used: number
  limit: number | null
  remaining: number | null
  plan: string
}

const WELCOME_MESSAGES: Record<string, string> = {
  '/dashboard':          "Bonjour 👋 Comment puis-je vous aider avec votre boutique aujourd'hui ?",
  '/dashboard/products': 'Vous gérez vos produits ? Je peux vous aider à optimiser votre catalogue.',
  '/dashboard/orders':   'Vous avez des questions sur vos commandes ? Je suis là pour vous aider.',
  '/dashboard/revenues': 'Des questions sur vos revenus ou reversements ? Posez-moi vos questions.',
  '/dashboard/settings': "Besoin d'aide pour configurer votre boutique ? Je vous guide.",
}

const QUICK_SUGGESTIONS: Record<string, string[]> = {
  '/dashboard': [
    "Quelles sont mes ventes d'aujourd'hui ?",
    "Montre-moi mes commandes en attente",
    "Quel est mon chiffre d'affaires cette semaine ?",
    "Donne-moi des conseils pour booster mes ventes",
  ],
  '/dashboard/orders': [
    "Combien de commandes sont en attente ?",
    "Quelles commandes dois-je livrer aujourd'hui ?",
    "Montre-moi les commandes des 7 derniers jours",
  ],
  '/dashboard/products': [
    "Quels sont mes produits les plus vendus ?",
    "Est-ce que j'ai des produits inactifs ?",
    "Comment améliorer mes fiches produits ?",
  ],
  '/dashboard/revenues': [
    "Quel est mon solde disponible ?",
    "Combien ai-je gagné ce mois-ci ?",
    "Explique-moi comment fonctionne la commission",
  ],
  '/dashboard/settings': [
    "Comment configurer mes modes de paiement ?",
    "Comment personnaliser l'apparence de ma boutique ?",
    "Aide-moi à compléter ma configuration",
  ],
}

const DEFAULT_SUGGESTIONS = [
  "Quelles sont mes ventes du jour ?",
  "Montre-moi mes commandes récentes",
  "Comment améliorer ma boutique ?",
]

function getWelcomeMessage(pathname: string): string {
  return (
    WELCOME_MESSAGES[pathname] ??
    "Bonjour 👋 Je suis l'assistant TEKKIShop. Posez-moi vos questions sur votre boutique !"
  )
}

function getSuggestions(pathname: string): string[] {
  return QUICK_SUGGESTIONS[pathname] ?? DEFAULT_SUGGESTIONS
}

interface ChatWidgetProps {
  shopName: string
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  /** Message à envoyer automatiquement à l'ouverture (ex : plan d'acquisition
   *  préparé depuis le tableau de bord) — consommé une seule fois. */
  initialPrompt?: string | null
  onInitialPromptConsumed?: () => void
}

export function ChatWidget({ shopName, isOpen, onOpen, onClose, initialPrompt, onInitialPromptConsumed }: ChatWidgetProps) {
  const pathname = usePathname()
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId] = useState<string>(() => generateSessionId())
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [usage, setUsage] = useState<UsageState | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (!isOpen) return

    if (messages.length === 0 && !initialPrompt) {
      setMessages([{ role: 'assistant', content: getWelcomeMessage(pathname) }])
    }

    fetch('/api/ai/chat/usage')
      .then((r) => r.json())
      .then((data: UsageState) => {
        setUsage(data)
        if (data.remaining !== null && data.remaining <= 0) setLimitReached(true)
      })
      .catch(() => null)
  }, [isOpen, pathname, initialPrompt]) // messages volontairement exclu

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  const handleClose = () => {
    abortRef.current?.abort()
    onClose()
  }

  // Fonction centrale d'envoi — prend le texte directement
  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming || limitReached) return

    const userMessage: Message = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsStreaming(true)

    setUsage((prev) => {
      if (!prev || prev.remaining === null) return prev
      return { ...prev, used: prev.used + 1, remaining: Math.max(0, prev.remaining - 1) }
    })

    setMessages([...updatedMessages, { role: 'assistant', content: '' }])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:   updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          session_id: sessionId,
        }),
        signal: controller.signal,
      })

      if (response.status === 429) {
        const data = await response.json() as { message?: string }
        setLimitReached(true)
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: data.message ?? 'Limite de messages atteinte.' },
        ])
        setIsStreaming(false)
        return
      }

      if (!response.ok || !response.body) throw new Error('Erreur serveur')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: accumulated }
          return updated
        })
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Une erreur est survenue. Réessayez.',
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [isStreaming, limitReached, messages])

  useEffect(() => {
    if (!isOpen || !initialPrompt || messages.length > 0) return
    handleSend(initialPrompt)
    onInitialPromptConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialPrompt])

  const sendMessage = useCallback(() => {
    handleSend(input.trim())
  }, [handleSend, input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const showCounter = usage && usage.limit !== null && usage.remaining !== null
  // On affiche les suggestions seulement sur le message d'accueil (conversation vierge)
  const showSuggestions = messages.length === 1 && !isStreaming && !limitReached
  const suggestions = getSuggestions(pathname)

  return (
    <>
      {/* ── Bouton flottant — desktop uniquement ─────────────────────── */}
      <button
        onClick={isOpen ? onClose : onOpen}
        aria-label="Ouvrir l'assistant TEKKIShop"
        className="hidden lg:flex fixed bottom-6 right-6 z-50 h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* ── Panel de chat ────────────────────────────────────────────── */}
      {isOpen && (
        <>
          {/* Overlay mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 lg:hidden"
            onClick={handleClose}
            aria-hidden
          />

          <div
            className={[
              'fixed z-50 flex flex-col bg-white',
              'inset-0',
              'lg:inset-auto lg:bottom-24 lg:right-6 lg:w-96 lg:rounded-2xl lg:border lg:border-gray-200 lg:shadow-2xl',
              'lg:h-[500px] lg:max-h-[80vh]',
            ].join(' ')}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center gap-3 bg-[var(--color-primary)] px-4 py-3 lg:rounded-t-2xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">Assistant TEKKIShop</p>
                <p className="text-xs text-white/70 truncate">{shopName}</p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Fermer l'assistant"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Zone messages + suggestions */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  message={msg}
                  isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
                />
              ))}

              {/* Suggestions rapides */}
              {showSuggestions && (
                <div className="flex flex-col gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-sm text-gray-700 transition-all hover:border-[var(--color-primary)] hover:bg-blue-50 hover:text-[var(--color-primary)] active:scale-[0.98]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bannière limite atteinte */}
            {limitReached && usage && usage.limit !== null && (
              <ChatLimitBanner plan={usage.plan} limit={usage.limit} />
            )}

            {/* Zone de saisie */}
            <div className="shrink-0 border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={limitReached ? 'Limite atteinte' : 'Posez votre question...'}
                  disabled={isStreaming || limitReached}
                  maxLength={1000}
                  className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed lg:py-2 lg:text-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming || limitReached}
                  aria-label="Envoyer"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed lg:h-9 lg:w-9"
                >
                  <Send className="h-5 w-5 lg:h-4 lg:w-4" />
                </button>
              </div>

              {showCounter && (
                <p className="text-center text-xs text-gray-400">
                  {usage!.remaining! > 0
                    ? `${usage!.remaining} message${usage!.remaining! > 1 ? 's' : ''} restant${usage!.remaining! > 1 ? 's' : ''} aujourd'hui`
                    : 'Limite journalière atteinte'}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
