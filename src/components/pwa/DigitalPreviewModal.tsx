'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface DigitalPreviewModalProps {
  text: string
  coverUrl: string | null
  productName: string
}

export function DigitalPreviewModal({ text, coverUrl, productName }: DigitalPreviewModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-50"
      >
        <BookOpen className="h-4 w-4" />
        Lire un extrait
      </button>

      <Modal open={open} onOpenChange={setOpen} title="Extrait" description={productName}>
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={productName}
            className="mb-4 max-h-64 w-full rounded-xl object-contain bg-gray-50"
          />
        )}
        <p className="whitespace-pre-line break-words text-sm leading-relaxed text-gray-700">{text}</p>
      </Modal>
    </>
  )
}
