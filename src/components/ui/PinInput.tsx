'use client'

import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react'

interface Props {
  name: string
  length?: number
  onChange?: (value: string) => void
}

export function PinInput({ name, length = 6, onChange }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''))
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const value = digits.join('')

  const update = (next: string[]) => {
    setDigits(next)
    onChange?.(next.join(''))
  }

  const handleChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    update(next)
    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]
        next[index] = ''
        update(next)
      } else if (index > 0) {
        inputs.current[index - 1]?.focus()
        const next = [...digits]
        next[index - 1] = ''
        update(next)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    const next = [...digits]
    pasted.split('').forEach((d, i) => { next[i] = d })
    update(next)
    const lastFilled = Math.min(pasted.length, length - 1)
    inputs.current[lastFilled]?.focus()
  }

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <div className="flex gap-2 justify-center">
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={el => { inputs.current[i] = el }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={digits[i]}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={e => e.target.select()}
            className="h-12 w-10 rounded-xl border-2 border-gray-200 bg-gray-50 text-center text-lg font-bold text-gray-900 outline-none transition-all focus:border-[#E85D04] focus:bg-white"
          />
        ))}
      </div>
    </>
  )
}
