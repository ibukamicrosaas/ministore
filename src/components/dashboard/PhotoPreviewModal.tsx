'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

interface PhotoPreviewModalProps {
  url: string | null
  onClose: () => void
}

// Aperçu en grand, lecture seule (galerie principale ET photos de variante,
// SPEC amélioration page d'édition produit) — pas de Modal.tsx (chrome
// titre/description pensé pour des formulaires, pas pour une image en
// plein écran).
export function PhotoPreviewModal({ url, onClose }: PhotoPreviewModalProps) {
  return (
    <Dialog.Root open={!!url} onOpenChange={open => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-[60] w-[92vw] max-w-lg translate-x-[-50%] translate-y-[-50%] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <Dialog.Title className="sr-only">Aperçu de la photo</Dialog.Title>
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="w-full max-h-[80vh] rounded-2xl object-contain bg-black" />
          )}
          <Dialog.Close
            className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
