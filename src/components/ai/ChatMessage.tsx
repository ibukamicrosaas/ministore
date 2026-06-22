'use client'

import ReactMarkdown from 'react-markdown'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
          ${isUser
            ? 'bg-[var(--color-primary)] text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
          }
        `}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {isStreaming && !isUser && (
          <span className="inline-flex gap-0.5 ml-1 mt-0.5 align-middle">
            <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </span>
        )}
      </div>
    </div>
  )
}
