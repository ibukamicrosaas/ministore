'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
  className?: string
}

/**
 * Variante bas-d'écran de Modal.tsx (même primitive Radix Dialog, même
 * gestion clavier/focus/overlay) — pour un panneau qui glisse depuis le bas
 * plutôt qu'une fenêtre centrée. Introduit pour la feuille "Plus" de la
 * navigation mobile (SPEC-refonte-dashboard-marchand.md, Lot 2).
 */
export function BottomSheet({ open, onOpenChange, title, children, className }: BottomSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={clsx(
            'fixed bottom-0 left-0 right-0 z-40 max-h-[80vh] overflow-y-auto',
            'rounded-t-2xl bg-white shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            className
          )}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-200" />
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <Dialog.Title className={clsx('text-sm font-semibold text-gray-900', !title && 'sr-only')}>
              {title ?? 'Menu'}
            </Dialog.Title>
            <Dialog.Close
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
