'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

export function CopyProductLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
      <span className="flex-1 truncate font-mono text-xs text-gray-500">{url}</span>
      <button
        type="button"
        onClick={handleCopy}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
          copied
            ? 'bg-green-500 text-white'
            : 'bg-white border border-gray-200 text-gray-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
        }`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? 'Copié !' : 'Copier'}
      </button>
    </div>
  )
}
