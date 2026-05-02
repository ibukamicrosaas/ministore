'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

interface Props {
  monthStart: string
  monthEnd: string
}

export function ExportButton({ monthStart, monthEnd }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(`/api/export/bookings?from=${monthStart}&to=${monthEnd}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reservations-${monthStart.slice(0, 7)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Erreur lors de l\'export.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      <Download className="h-3.5 w-3.5" />
      {loading ? 'Export…' : 'CSV'}
    </button>
  )
}
