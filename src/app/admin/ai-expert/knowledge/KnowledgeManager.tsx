'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import {
  createKnowledgeEntry,
  updateKnowledgeEntry,
  deleteKnowledgeEntry,
} from '@/lib/actions/ai-knowledge'

interface Entry {
  id:         string
  title:      string
  content:    string
  is_active:  boolean
  sort_order: number
  created_at: string
}

interface Props {
  initialEntries: Entry[]
}

export function KnowledgeManager({ initialEntries }: Props) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [showForm, setShowForm]     = useState(false)
  const [newTitle, setNewTitle]     = useState('')
  const [newContent, setNewContent] = useState('')
  const [formError, setFormError]   = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return
    setFormError(null)
    startTransition(async () => {
      const result = await createKnowledgeEntry({ title: newTitle.trim(), content: newContent.trim() })
      if (result.error) { setFormError(result.error); return }
      setNewTitle('')
      setNewContent('')
      setShowForm(false)
      // Optimistic: reload page state via router.refresh would be cleaner but we just do a reload
      window.location.reload()
    })
  }

  async function handleToggle(entry: Entry) {
    startTransition(async () => {
      await updateKnowledgeEntry(entry.id, { is_active: !entry.is_active })
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, is_active: !e.is_active } : e))
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette entrée de la base de connaissance ?')) return
    startTransition(async () => {
      await deleteKnowledgeEntry(id)
      setEntries(prev => prev.filter(e => e.id !== id))
    })
  }

  return (
    <div className="space-y-4">
      {/* Bouton ajouter */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter une entrée
        </button>
      )}

      {/* Formulaire d'ajout */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-3"
        >
          <p className="text-sm font-semibold text-sky-900">Nouvelle entrée</p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Titre</label>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Ex : Comment fonctionne la commission ?"
              maxLength={200}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contenu</label>
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Expliquez en détail cette information pour que l'assistant puisse s'appuyer dessus..."
              rows={5}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none resize-y"
            />
          </div>
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60 transition-colors"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setNewTitle(''); setNewContent(''); setFormError(null) }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-gray-300 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste des entrées */}
      {entries.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center">
          <p className="text-sm text-gray-400">Aucune entrée pour l'instant.</p>
          <p className="text-xs text-gray-400 mt-1">Ajoutez des informations supplémentaires pour enrichir l'assistant.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => (
            <div
              key={entry.id}
              className={`rounded-xl border bg-white transition-all ${
                entry.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => handleToggle(entry)}
                  disabled={isPending}
                  className="shrink-0 text-gray-400 hover:text-sky-500 transition-colors"
                  title={entry.is_active ? 'Désactiver' : 'Activer'}
                >
                  {entry.is_active
                    ? <ToggleRight className="h-5 w-5 text-sky-500" />
                    : <ToggleLeft className="h-5 w-5" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{entry.title}</p>
                  {expandedId !== entry.id && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{entry.content}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    {expandedId === entry.id
                      ? <ChevronUp className="h-4 w-4" />
                      : <ChevronDown className="h-4 w-4" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={isPending}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expandedId === entry.id && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                  <p className="text-[11px] text-gray-400 mt-2">
                    Ajouté le {new Date(entry.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
