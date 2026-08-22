'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react'
import toast from 'react-hot-toast'

type ImportResult = {
  imported: number
  skipped:  number
  errors:   string[]
}

export function CsvImportButton() {
  const router           = useRouter()
  const inputRef         = useRef<HTMLInputElement>(null)
  const [open, setOpen]  = useState(false)
  const [file, setFile]  = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [pending, start] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setResult(null)
  }

  function handleClose() {
    setOpen(false)
    setFile(null)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleImport() {
    if (!file) return
    start(async () => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/products/import-csv', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de l\'import.')
        return
      }

      setResult(data as ImportResult)
      if ((data as ImportResult).imported > 0) {
        toast.success(`${(data as ImportResult).imported} produit(s) importé(s) !`)
        router.refresh()
      }
    })
  }

  function downloadTemplate() {
    const csv = 'nom,prix,description,categorie,stock\nT-shirt blanc,5000,100% coton lavable,Vêtements,50\nSac en cuir,25000,,Accessoires,\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'modele-produits.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <Upload className="h-4 w-4" />
        Importer CSV
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">Importer des produits</h2>
                <p className="text-xs text-gray-500 mt-0.5">CSV avec colonnes : nom, prix, description, categorie, stock</p>
              </div>
              <button onClick={handleClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Télécharger le modèle */}
            <button
              onClick={downloadTemplate}
              className="mb-4 flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700 font-medium"
            >
              <Download className="h-4 w-4" />
              Télécharger le modèle CSV
            </button>

            {/* Zone de dépôt */}
            {!result && (
              <div
                onClick={() => inputRef.current?.click()}
                className="mb-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 cursor-pointer hover:border-sky-300 hover:bg-sky-50 transition-colors"
              >
                {file ? (
                  <>
                    <FileText className="h-8 w-8 text-sky-500" />
                    <p className="text-sm font-medium text-gray-800">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} Ko</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500">Clique pour choisir un fichier CSV</p>
                    <p className="text-xs text-gray-400">Max 200 lignes · 2 Mo</p>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Résultat */}
            {result && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-semibold">{result.imported} produit(s) importé(s)</span>
                </div>
                {result.skipped > 0 && (
                  <div className="flex items-start gap-2 text-amber-700">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p>{result.skipped} ligne(s) ignorée(s)</p>
                      {result.errors.slice(0, 3).map((e, i) => (
                        <p key={i} className="text-amber-600 mt-0.5">{e}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {result ? 'Fermer' : 'Annuler'}
              </button>
              {!result && (
                <button
                  onClick={handleImport}
                  disabled={!file || pending}
                  className="flex-1 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {pending ? 'Import en cours…' : 'Importer'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
